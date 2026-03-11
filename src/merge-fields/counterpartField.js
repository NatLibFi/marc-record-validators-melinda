// For each incoming field that

import createDebugLogger from 'debug';
import {fieldHasSubfield, fieldHasNSubfields, fieldHasMultipleSubfields, fieldToString, nvdebug, removeCopyright, tagIsRepeatable} from '../utils.js';
import {cloneAndNormalizeFieldForComparison, cloneAndRemovePunctuation} from '../normalizeFieldForComparison.js';
import {normalizeControlSubfieldValue} from '../normalize-identifiers.js';

import {getMergeConstraintsForTag} from './mergeConstraints.js';
import {controlSubfieldsPermitMerge} from './controlSubfields.js';
import {mergableIndicator1, mergableIndicator2} from './mergableIndicator.js';
import {partsAgree} from '../normalizeSubfieldValueForComparison.js';
import {getSynonym, normalizeForSamenessCheck, valueCarriesMeaning} from './worldKnowledge.js';
import {provenanceSubfieldsPermitMerge} from './dataProvenance.js';

// NB! We are using internal prefix '(FIN11)' instead of global (FI-ASTERI-N) here. The latter would be better but would require some work and testing.

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:mergeField:counterpart');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

// NB! FIN11 $0 pairing is handled in this code. We might want to support others, esp. FIN13 as well.

const counterpartRegexps = { // NB! tag is from source!
  // Note that in the normal case, all source 1XX fields have been converted to 7XX fields.
  '100': /^[17]00$/u, '110': /^[17]10$/u, '111': /^[17]11$/u, '130': /^[17]30$/u,
  '260': /^26[04]$/u, '264': /^26[04]$/u,
  '700': /^[17]00$/u, '710': /^[17]10$/u, '711': /^[17]11$/u, '730': /^[17]30$/u,
  // Hacks:
  '940': /^[29]40$/u, '973': /^[79]73$/u
};

const counterpartRegexpsSingle = {
  // when base===source, never merge 1XX to 7XX, always 7XX to 1XX! Also, don't merge 264 to 260.
  '260': /^26[04]$/u,
  '700': /^[17]00$/u, '110': /^[17]10$/u, '111': /^[17]11$/u, '130': /^[17]30$/u,
  // Hacks:
  '940': /^[29]40$/u, '973': /^[79]73$/u
};


export function splitToNameAndQualifier(value) {
  if (value.match(/^.* \([^()]+\)$/u)) {
    const name = value.replace(/^(.*) \([^()]+\)$/u, '$1');
    const qualifier = value.replace(/^.* (\([^()]+\))$/u, '$1');
    return [name, qualifier];
  }
  return [value, undefined];
}

function splitToNameAndQualifierAndProcessName(name) {
  //const nameOnly = name.replace(/(?: \([^)]+\)| abp?| Kustannus| Kustannus Oy|, kustannusosakeyhtiö| oyj?| ry)$/ugi, '');
  const [qualifierlessName, qualifier] = splitToNameAndQualifier(name);

  const [prefix, basename, suffix] = stripPrefixAndSuffix(qualifierlessName);

  return {name: getBestName(basename).toLowerCase(), prefix, suffix, qualifier};

  function stripPrefixAndSuffix(companyName) {
    const [nameOnly, suffix] = extractSuffix(companyName);
    const [nameOnly2, prefix] = extractPrefix(nameOnly);
    return [prefix, nameOnly2, suffix];
  }

  function extractSuffix(name) {
    const nameOnly = name.replace(/(?: \([^)]+\)| abp?| Kustannus| Kustannus Oy|, kustannusosakeyhtiö| oyj?| ry)$/ugi, '');
    if (nameOnly === name) {
      return [name, undefined];
    }
    return [nameOnly, name.substring(nameOnly.length).replace(/^,? /u, '')];
  }

  function extractPrefix(name) {
    const nameOnly = name.replace(/^(?:Ab|Kustannusosakeyhtiö|Kustannus Oy|Oy) /ugi, '');
    if (nameOnly === name) {
      return [name, undefined];
    }
    return [nameOnly, name.substring(0, name.length - nameOnly.length - 1)]; // -1 removes final space
  }

  function getBestName(name) {
    const NAME = name.toUpperCase();

    if (NAME === 'WSOY') {
      return 'Werner Söderström osakeyhtiö';
    }
    if (NAME === 'NTAMO') {
      return 'ntamo';
    }
    return name;
  }
}

export function canContainOptionalQualifier(tag, subfieldCode) {
  // We have made 300$a NON-repeatable (against specs), as we never want them to be repeated (probably near-duplicates)
  if (tag === '300' && subfieldCode === 'a') {
    return true;
  }
  // 776$i is actually not needed for counterpart stuff (since it's repeatable), but it is needed in merge subfield stage.
  if (tag === '776' && subfieldCode === 'i') {
    return true;
  }
  return false;
}

function withAndWithoutQualifierAgree(value1, value2, tag, subfieldCode) {
  // Split value to name and qualifier parts. Names must be equal, and qualifiers must be equal, iff both values contain them.
  if (!canContainOptionalQualifier(tag, subfieldCode)) {
    return false;
  }

  const [name1, qualifier1] = splitToNameAndQualifier(value1);
  const [name2, qualifier2] = splitToNameAndQualifier(value2);

  //nvdebug(`CN1: '${name1}', '${qualifier1}'`, debugDev);
  //nvdebug(`CN2: '${name2}', '${qualifier2}'`, debugDev);

  if (name1.toLowerCase() !== name2.toLowerCase()) {
    return false;
  }

  // If either value does not have a qualifier, they are considered equals:
  if (qualifier1 === undefined || qualifier2 === undefined || qualifier1.toLowerCase() === qualifier2.toLowerCase()) {
    return true;
  }

  return false;
}

function corporateNamesAgree(value1, value2, tag, subfieldCode) {
  if (subfieldCode !== 'a' || !['110', '610', '710', '810'].includes(tag)) {
    return false;
  }
  const nameData1 = splitToNameAndQualifierAndProcessName(value1);
  const nameData2 = splitToNameAndQualifierAndProcessName(value2);

  nvdebug(`CN1: '${nameData1.name}', '${nameData1.qualifier}'`, debugDev);
  nvdebug(`CN2: '${nameData2.name}', '${nameData2.qualifier}'`, debugDev);

  if (nameData1.name !== nameData2.name) {
    return false;
  }

  if (nameData1.qualifier && nameData2.qualifier && nameData1.qualifier !== nameData2.qualifier) {
    return false;
  }
  // Currently all prefixes and suffixes are publisher information, so there's no point comparing them any further...

  return true;
}

function counterpartExtraNormalize(tag, subfieldCode, value) {
  // Remove trailing punctuation:
  value = value.replace(/(\S)(?:,|\.|\?|!|\. -| *:| *;| =| \/)$/u, '$1');
  // Remove brackets:
  value = value.replace(/^\(([^()]+)\)$/u, '$1'); // Remove initial '(' and final ')' if both exist.
  value = value.replace(/^\[([^[\]]+)\]$/u, '$1'); // Remove initial '[' and final ']' if both exist.
  // Mainly for field 260$c:
  if (tag === '260' && subfieldCode === 'c') {
    value = removeCopyright(value);
  }
  value = value.replace(/http:\/\//ug, 'https://'); // MET-501: http vs https
  value = getSynonym(tag, subfieldCode, value);
  value = normalizeForSamenessCheck(tag, subfieldCode, value); // Better to remove trailing punctuation before calling this...


  return value;
}

function hasCommonNominator(field1, field2, subfieldCode) {
  //nvdebug(`hasCommonNominator(${subfieldCode})? '${fieldToString(originalBaseField)}' vs '${fieldToString(originalSourceField)}'`, debugDev);

  // If base has $a and source has $b, there's no common nominator, thus fail...
  const subfields1 = field1.subfields.filter(subfield => subfield.code === subfieldCode && valueCarriesMeaning(field1.tag, subfield.code, subfield.value));
  const subfields2 = field2.subfields.filter(subfield => subfield.code === subfieldCode && valueCarriesMeaning(field2.tag, subfield.code, subfield.value));

  return subfields1.length > 0 && subfields2.length > 0;
}

function tagToRegexp(tag, internalMerge = false) {
  if (internalMerge && tag in counterpartRegexpsSingle) {
    return counterpartRegexpsSingle[tag];
  }
  if (!internalMerge && tag in counterpartRegexps) { // eg. 700 looks for tag /^[17]00$/...
    const regexp = counterpartRegexps[tag];
    //nvdebug(`regexp for ${tag} found: ${regexp}`, debugDev);
    return regexp;
  }
  //nvdebug(`WARNING: tagToRegexp(${tag}): no precompiled regexp found.`, debugDev);
  return new RegExp(`^${tag}$`, 'u');
}

function areRequiredSubfieldsPresent(field) {
  const subfieldString = getMergeConstraintsForTag(field.tag, 'required').join('');
  if (subfieldString === null) {
    return true;
  } // nothing is required
  const subfieldArray = subfieldString.split('');
  return subfieldArray.every(sfcode => {
    const result = fieldHasSubfield(field, sfcode);
    if (!result) {
      debugDev(`Required subfield ‡${sfcode} not found in '${fieldToString(field)}'!`);
      return false;
    }
    return true;
  });
}

function getUnbalancedPairedSubfieldCode(field1, field2) {
  const fullSubfieldString = getMergeConstraintsForTag(field1.tag, 'paired').join('') || '';

  if (fullSubfieldString === '') {
    return false;
  }

  // If the two fields share the FIN11 ID (WE SHOULD SUPPORT FIN13 AS WELL) there's no need to check the 'paired' constraint regarding related subfields.
  // Meaning that it this is FIN11 match we should not bother checking whether something like 100$b/c/d/q is there. (NB! Note that 'required' check is not alleviated in this way)
  // (I'm not saying that 100$b/c/d/q  are in 'paired' contraint, I'm just illustrating the issue here)
  const pairable = pairableIdentifier(field1, field2, '(FIN11)');
  const subfieldString = pairable ? removeNameRelatedSubfieldCodes(fullSubfieldString, field1.tag) : fullSubfieldString;
  nvdebug(`CHECK ${pairable ? 'PAIRABLE ' : ''}${field1.tag} PAIRS: '${fullSubfieldString}' => '${subfieldString}'`, debugDev);

  if (subfieldString === '') {
    return false;
  }
  const subfieldArray = subfieldString.split('');

  return subfieldArray.find(sfcode => fieldHasNSubfields(field1, sfcode) !== fieldHasNSubfields(field2, sfcode));
}

function syntacticallyMergablePair(baseField, sourceField, config) {
  // Indicators must typically be equal (there are exceptions such as non-filing characters though):
  nvdebug("CHECK SYNTAX", debugDev);
  if (!mergableIndicator1(baseField, sourceField, config)) {
    nvdebug(`non-mergable (reason: indicator1): ${JSON.stringify(config)}`, debugDev);
    return false;
  }

  if (!mergableIndicator2(baseField, sourceField, config)) {
    nvdebug(`non-mergable (reason: indicator2): ${JSON.stringify(config)}`, debugDev);
    return false;
  }

  if (!controlSubfieldsPermitMerge(baseField, sourceField)) {
    nvdebug('non-mergable (reason: control subfield)', debugDev);
    return false;
  }

  if (!provenanceSubfieldsPermitMerge(baseField, sourceField)) {
    nvdebug('non-mergable (reason: data provenance subfield)', debugDev);
    return false;
  }

  // NB! field1.tag and field2.tag might differ (1XX vs 7XX). Therefore required subfields might theoretically differ as well.
  // Note: Theoretically 260 $efg vs 264 with IND2=3 has already been handled by the preprocessor.
  // Thus check both:
  if (!areRequiredSubfieldsPresent(baseField) || !areRequiredSubfieldsPresent(sourceField)) {
    nvdebug('non-mergable (reason: missing subfields)', debugDev);
    return false;
  }

  // Stuff of Hacks! Eg. require that both fields either have or have not X00$t:
  const subfieldCodeThatFailsToPair = getUnbalancedPairedSubfieldCode(baseField, sourceField);
  if (subfieldCodeThatFailsToPair) {
    nvdebug(`non-mergable (reason: required subfield pair check failed for code: '${subfieldCodeThatFailsToPair}')`, debugDev);
    return false;
  }

  return true;
}

function mergablePair(baseField, sourceField, config) {
  if (!syntacticallyMergablePair(baseField, sourceField, config)) {
    nvdebug('non-mergable (reason: syntax)', debugDev);
    return false;
  }

  //debug('Test semantics...');
  if (!semanticallyMergablePair(baseField, sourceField)) {
    nvdebug('non-mergable (reason: semantics)', debugDev);
    return false;
  }

  nvdebug(`MERGABLE PAIR:\n  B: ${fieldToString(baseField)}\n  S: ${fieldToString(sourceField)}`, debugDev);
  return true;
}

function removeNameRelatedSubfieldCodes(codestring, tag) {
  // If we have $0 (FIN11) match, we are not interested in the core name subfields. Remove them from the subfield codes string.
  const removables = getNameRelatedSubfieldCodes(tag); // These are different for X00, X10 and X11...
  return removeCharsFromString(codestring, removables);

  function removeCharsFromString(string, removableCharsAsString) {
    const removableChars = removableCharsAsString.split('');
    return string.split('').filter(c => !removableChars.includes(c)).join('');
  }

  function getNameRelatedSubfieldCodes(tag) {
    if (['100', '600', '700', '800'].includes(tag)) {
      return 'abcdq';
    }
    if (['110', '610', '710', '810'].includes(tag)) {
      return 'abcdn';
    }
    if (['111', '611', '711', '811'].includes(tag)) {
      return 'acden';
    }
    return '';
  }
}

function pairableIdentifier(field1, field2, prefix) {
  const normalizedPrefix = prefix;
  nvdebug(`PREF '${prefix}' => '${normalizedPrefix}'`, debugDev);

  const prefixLength = normalizedPrefix.length;
  const identifiers1 = getIdentifiers(field1);
  if (identifiers1.length !== 1) {
    return false;
  }
  const identifiers2 = getIdentifiers(field2);
  if (identifiers2.length !== 1) {
    return false;
  }

  return identifiers1[0] === identifiers2[0];

  function getIdentifiers(field) {
    return field.subfields.filter(sf => sf.code === '0')
      .map(sf => normalizeControlSubfieldValue(sf.value))
      .filter(val => val.substring(0, prefixLength) === normalizedPrefix);
  }
}


function hasRepeatableSubfieldThatShouldBeTreatedAsNonRepeatable(field) {
  // 700$s?
  if (field.tag === '260' || field.tag === '264') {
    return ['a', 'b', 'c', 'e', 'f', 'g'].some(subfieldCode => fieldHasMultipleSubfields(field, subfieldCode));
  }
  if (field.tag === '382') {
    return ['a', 'b', 'd', 'e', 'n', 'p'].some(subfieldCode => fieldHasMultipleSubfields(field, subfieldCode));
  }
  if (field.tag === '505') {
    return ['t', 'r', 'g'].some(subfieldCode => fieldHasMultipleSubfields(field, subfieldCode));
  }

  return false;
}

function getRelevantSubfieldValues(field, subfieldCode) {
  const values = field.subfields.filter(sf => sf.code === subfieldCode).map(sf => counterpartExtraNormalize(field.tag, subfieldCode, sf.value));

  return values.filter(v => valueCarriesMeaning(field.tag, subfieldCode, v));
}

function pairableValue(tag, subfieldCode, value1, value2) {
  if (value1 === value2) {
    return true;
  }

  // This function could just return true or false.
  // I thought of preference when I wrote this, but preference implemented *here* (modularity). mergeFields.js should handle preference.
  if (withAndWithoutQualifierAgree(value1, value2, tag, subfieldCode)) {
    // 300$a "whatever" and "whatever (123 sivua)"
    return true;
  }
  if (partsAgree(value1, value2, tag, subfieldCode) || corporateNamesAgree(value1, value2, tag, subfieldCode)) {
    // Pure baseness: here we assume that base's value1 is better than source's value2.
    return true;
  }

  return false;
}

function pairableValueInArray(tag, subfieldCode, val, arr) {
  return arr.some(val2 => pairableValue(tag, subfieldCode, val, val2));
}


function tightSubfieldMatch(field1, field2, subfieldCode, mustHave = false) {
  nvdebug(`${subfieldCode} F1: ${fieldToString(field1)}`, debugDev);
  nvdebug(`${subfieldCode} F2: ${fieldToString(field2)}`, debugDev);
  const values1 = getRelevantSubfieldValues(field1, subfieldCode);
  const values2 = getRelevantSubfieldValues(field2, subfieldCode);

  if(!mustHave) {
    if (values1.length === 0 || values2.length === 0) {
      return true;
    }
  }

  if (values1.length !== values2.length) {
    return false;
  }

  nvdebug(`Compare $${subfieldCode} contents:\n  '${values1.join("'\n  '")}' vs\n  '${values2.join("'\n  '")}'`, debugDev);
  return values1.every(v => pairableValueInArray(field1.tag, subfieldCode, v, values2)) && values2.every(v => pairableValueInArray(field1.tag, subfieldCode, v, values1));
}

function looseSubfieldMatch(field1, field2, subfieldCode) {
  const values1 = getRelevantSubfieldValues(field1, subfieldCode);
  const values2 = getRelevantSubfieldValues(field2, subfieldCode);
  if (values1.length === 0 || values2.length === 0) {
    return true;
  }
  // Subsets are fine:
  if (values1.every(v => pairableValueInArray(field1.tag, subfieldCode, v, values2))) {
    return true;
  }
  if (values2.every(v => pairableValueInArray(field1.tag, subfieldCode, v, values1))) {
    return true;
  }
  return false;
}

function semanticallyMergablePair(baseField, sourceField) {
  const field1 = cloneAndNormalizeFieldForComparison(baseField);
  const field2 = cloneAndNormalizeFieldForComparison(sourceField);

  const string1 = fieldToString(field1);
  const string2 = fieldToString(field2);

  nvdebug(`IN ${baseField.tag}: pairableName():\n '${string1}' vs\n '${string2}'`, debugDev);
  if (string1 === string2) {
    return true;
  }

  const mergeConstraints = getMergeConstraintsForTag(field1.tag); // The tag doe
  if (mergeConstraints.length === 0) { // We have no constraints defined for this tag -> fail
    return false;
  }

  // Essentially these are too hard to handle with field-merge (eg. multi-505$g)
  if (hasRepeatableSubfieldThatShouldBeTreatedAsNonRepeatable(field1) || hasRepeatableSubfieldThatShouldBeTreatedAsNonRepeatable(field2)) {
    nvdebug(`Unmergable: data is too complex to be automatically safely merged`, debugDev);
    return false;
  }

  const asteriMatch = pairableIdentifier(field1, field2, '(FIN11)'); // If there's a match, there's no need to check the name (Caretaker will handle these.)
  // WE COULD REMOVE THESE FIELDS IN MERGE, SO THAT WE WON'T GET FUNNY NAMES).

  // NB! Currently we should get only one mergeContraint. However, should we support multiple merge contraints (= multiple profiles)?
  const allRequired = mergeConstraints[0].required || ''; // getMergeConstraintsForTag(field1.tag, 'required') || '';
  const reallyRequired = asteriMatch ? removeNameRelatedSubfieldCodes(allRequired, field1.tag) : allRequired;

  //nvdebug(`WP1: '${allRequired}' => ${reallyRequired}`, debugDev);
  if (!reallyRequired.split('').every(c => tightSubfieldMatch(field1, field2, c, true))) {
    return false;
  }

  const allPaired = mergeConstraints[0].paired || ''; // getMergeConstraintsForTag(field1.tag, 'paired') || '';
  const reallyPaired = asteriMatch ? removeNameRelatedSubfieldCodes(allPaired, field1.tag) : allPaired;
  //nvdebug(`WP2: '${allPaired}' => ${reallyPaired}`, debugDev);
  if (!reallyPaired.split('').every(c => tightSubfieldMatch(field1, field2, c, false))) {
    return false;
  }

  const allKeys = mergeConstraints[0].key || ''; // getMergeConstraintsForTag(field1.tag, 'key') || '';
  const relevantKeys = asteriMatch ? removeNameRelatedSubfieldCodes(allKeys, field1.tag) : allKeys
  //nvdebug(`WP3: keys='${allKeys}' => ${relevantKeys}`, debugDev);
  if (!relevantKeys.split('').every(c => looseSubfieldMatch(field1, field2, c))) {
    return false;
  }
  //nvdebug('WP4', debugDev);

  // required/paired/keys checks did not fail. Now check that did they really succeed
  if (allRequired.length > 0) { // I think we should use all here
    return true;
  }

  if (reallyPaired.length > 0 && field1.subfields.some(sf => reallyPaired.includes(sf.code))) {
    return true;
  }

  if(!tagIsRepeatable(field1.tag) || relevantKeys.length == 0) {
    return true;
  }

  // Raison d'être is long forgotten, but my educated guess about this: if 'key' is defined in merge constraints
  // for this field, then at least one of the subfield codes in 'key' must be present in both fields.
  // However, this is not necessarily right.
  if (relevantKeys.length > 0) {
    if (field1.subfields.some(sf => relevantKeys.includes(sf.code)) || field2.subfields.some(sf => relevantKeys.includes(sf.code))) { 
      return relevantKeys.split('').some(code => hasCommonNominator(field1, field2, code));
    }
  }

  nvdebug(`    name mismatch (${allKeys}):`, debugDev);
  nvdebug(`     '${fieldToString(baseField)}' vs`, debugDev);
  nvdebug(`     '${fieldToString(sourceField)}'`, debugDev);
  return false;
}

function getAlternativeNamesFrom9XX(record, field) {
  // Should we support 6XX and 8XX as well? Prolly not...
  if (!field.tag.match(/^(?:100|110|111|600|610|611|700|710|711)$/u)) {
    return [];
  }
  const tag = `9${field.tag.substring(1)}`;
  const cands = record.get(tag).filter(f => fieldHasSubfield(f, 'a') && fieldHasSubfield(f, 'y'));
  if (cands.length === 0) {
    return [];
  }
  const punctuationlessField = cloneAndRemovePunctuation(field);
  const [name] = punctuationlessField.subfields.filter(sf => sf.code === 'a').map(sf => sf.value);

  return cands.map(candField => getAltName(candField)).filter(val => val !== undefined);


  function getAltName(altField) {
    const [altA] = altField.subfields.filter(sf => sf.code === 'a').map(sf => sf.value);
    const [altY] = altField.subfields.filter(sf => sf.code === 'y').map(sf => sf.value);
    nvdebug(`Compare '${name}' vs '${altA}'/'${altY}'`, debugDev);
    if (name === altA) {
      return altY;
    }
    if (name === altY) {
      return altA;
    }
    nvdebug(` miss`, debugDev);
    return undefined;
  }

}


function mergablePairWithAltName(normCandField, normalizedField, altName, config) {
  // Replace source field $a name with alternative name and then compare:
  const [a] = normalizedField.subfields.filter(sf => sf.code === 'a');
  if (!a) {
    return false;
  }
  a.value = altName;

  return mergablePair(normCandField, normalizedField, config);
}

function getCounterpartIndex(field, counterpartCands, altNames, config) {
  const normalizedField = cloneAndNormalizeFieldForComparison(field);
  const normalizedCounterpartCands = counterpartCands.map(f => cloneAndNormalizeFieldForComparison(f));
  const index = normalizedCounterpartCands.findIndex(normCandField => mergablePair(normCandField, normalizedField, config));
  if (index > -1) {
    return index;
  }

  return normalizedCounterpartCands.findIndex(normCandField => altNames.some(altName => mergablePairWithAltName(normCandField, normalizedField, altName, config)));
}


function field264Exception(baseField, sourceRecord, sourceField, config) {
  if (baseField.tag !== '264') {
    return false;
  }

  if (sourceField.tag !== '264' || sourceRecord.get('264').length !== 1) {
    return false;
  }

  // Don't worry about semantics:
  return syntacticallyMergablePair(sourceField, baseField, config);
}

function getCounterpartCandidates(field, record) {
  const counterpartCands = record.get(tagToRegexp(field.tag, record.internalMerge));

  // MELKEHITYS-2969: copyright years should not merge with non-copyright years
  if (field.tag === '260' && isNotCopyrightYear(field)) {
    return counterpartCands.filter(candField => !isCopyrightField264(candField));
  }

  if (field.tag === '264' && isCopyrightField264(field)) { // Copyright year
    return counterpartCands.filter(candField => !isNotCopyrightYear(candField));
  }

  function isCopyrightField264(field) {
    return field.tag === '264' && field.ind2 === '4';
  }

  function isNotCopyrightYear(field) {
    if (field.tag === '264') {
      return !isCopyrightField264(field);
    }
    // Field 260: copyright year does not contain $a or $b:
    return !field.subfields.some(sf => sf.code === 'a' && sf.code === 'b');
  }

  return counterpartCands;

}

export function baseIsSource(base, source) {
  base.localTest = true;
  const result = source.localTest;
  delete base.localTest;
  return result;
}

export function getCounterpart(baseRecord, sourceRecord, field, config) {
  // First get relevant candidate fields. Note that 1XX and corresponding 7XX are considered equal, and tags 260 and 264 are lumped together.
  // (<= Note that self-merge behaves differently from two records here.)
  // Hacks: 973 can merge with 773, 940 can merge with 240 (but not the other way around)
  //nvdebug(`COUNTERPART FOR '${fieldToString(field)}'?`, debugDev);
  const counterpartCands = getCounterpartCandidates(field, baseRecord).filter(f => !f.mergeCandidate);

  if (!counterpartCands || counterpartCands.length === 0) {
    //nvdebug(`No counterpart(s) found for ${fieldToString(field)}`, debugDev);
    return null;
  }

  nvdebug(`Compare incoming '${fieldToString(field)}' with (up to) ${counterpartCands.length} existing field(s)`, debugDev);

  const normalizedField = cloneAndNormalizeFieldForComparison(field); // mainly strip punctuation here

  nvdebug(` Normalize incoming field to: '${fieldToString(normalizedField)}'`, debugDev);

  const uniqueAlternativeNames = getUniqueAlernativeNames();

  //nvdebug(` S: ${fieldToString(normalizedField)}`, debugDev);
  // Then find (the index of) the first mathing candidate field and return it.
  const index = getCounterpartIndex(normalizedField, counterpartCands, uniqueAlternativeNames, config);

  if (index > -1) {
    return counterpartCands[index];
  }

  // MET-456 exception
  if (counterpartCands.length === 1 && field264Exception(counterpartCands[0], sourceRecord, field, config)) {
    return counterpartCands[0];
  }

  return null;

  function getUniqueAlernativeNames() {
    if (baseIsSource(baseRecord, sourceRecord)) {
      return [];
    }
    // Try to look for alternative names from base and source record's 9XX fields:
    const alternativeNames = getAlternativeNamesFrom9XX(baseRecord, field).concat(getAlternativeNamesFrom9XX(sourceRecord, field));
    return alternativeNames.filter((name, i) => alternativeNames.indexOf(name) === i);
  }
}

