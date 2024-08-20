import createDebugLogger from 'debug';
import {cloneAndNormalizeFieldForComparison} from '../normalizeFieldForComparison.js';
import {normalizeAs, normalizeControlSubfieldValue} from '../normalize-identifiers';
import {fieldHasSubfield, fieldToString, isControlSubfieldCode, nvdebug, subfieldIsRepeatable, subfieldToString} from '../utils.js';
import {mergeSubfield} from './mergeSubfield.js';
import {sortAdjacentSubfields} from '../sortSubfields'; //'./sortSubfields.js';

import {valueCarriesMeaning} from './worldKnowledge.js';
import {resetSubfield6Tag} from '../subfield6Utils.js';

const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge-reducers:mergeOrAddSubfield');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

function catalogingSourceModifyingAgencyCandIsOriginalCatalogingSourceAgencyInTargetField(targetField, candSubfieldData) {
  if (targetField.tag !== '040' || candSubfieldData.code !== 'd') {
    return false;
  }
  nvdebug(`${fieldToString(targetField)} vs $d ${candSubfieldData.originalValue}}`, debugDev);
  // Add hard-coded exceptions here
  if (targetField.subfields.some(sf => sf.code === 'a' && sf.value === candSubfieldData.originalValue)) {
    nvdebug('040‡d matched 040‡a', debugDev);
    return true;
  }
  return false;
}

function ennakkotietoInSubfieldG(candSubfieldData) {
  if (candSubfieldData.code === 'g' && ['ENNAKKOTIETO.', 'ENNAKKOTIETO'].includes(candSubfieldData.originalValue)) {
    // Skip just ‡g subfield or the whole field?
    // We decided to skip just this subfield. We want at least $0 and maybe even more from ennakkotieto.
    debugDev('Skip ‡g ENNAKKOTIETO.');
    return true;
  }
  return false;
}


function mergeOrAddSubfieldNotRequiredSpecialCases(targetField, candSubfieldData) {

  // Don't bring WHATEVER<KEEP> from source 7XX to base 1XX.
  // Exceptionally we can merge <KEEP>ed 7XX with un-<KEEP>ed 1XX as 1XX should not use <KEEP>s.
  if (targetField.tag.charAt(0) === '1' && candSubfieldData.tag.charAt(0) === '7' && candSubfieldData.code === '9' && candSubfieldData.originalValue.match(/<KEEP>/u)) {
    return true;
  }

  // Don't add 264$b 'Kustannuspaikka tuntematon' etc
  if (!valueCarriesMeaning(targetField.tag, candSubfieldData.code, candSubfieldData.normalizedValue)) {
    return true;
  }


  // Don't add $0 subfields that mean the same even if they look different:
  const alephIdentifierType = normalizeAs(targetField.tag, candSubfieldData.code);
  if (alephIdentifierType !== undefined) {
    const normalizedSubfieldValue = normalizeControlSubfieldValue(candSubfieldData.originalValue, alephIdentifierType);
    if (targetField.subfields.some(sf => normalizeControlSubfieldValue(sf.value) === normalizedSubfieldValue && sf.code === candSubfieldData.code)) {
      return true;
    }
  }
  return false;
}


function skipNormalizedComparison(tag, subfieldCode, subfieldValue) {
  if (tag === '020' && subfieldCode === 'a') {
    return true;
  }
  // Hackish: we want 'ntamo' to win 'Ntamo'...
  // If there are other similar excepting put them into an array.
  if (['110', '610', '710', '810'].includes(tag) && subfieldCode === 'a' && subfieldValue.substring(0, 5) === 'ntamo') {
    return true;
  }
  return false;
}

function mergeOrAddSubfieldNotRequired(targetField, candSubfieldData) {
  if (catalogingSourceModifyingAgencyCandIsOriginalCatalogingSourceAgencyInTargetField(targetField, candSubfieldData) || ennakkotietoInSubfieldG(candSubfieldData)) {
    return true;
  }

  if (mergeOrAddSubfieldNotRequiredSpecialCases(targetField, candSubfieldData)) {
    return true;
  }

  const relevantTargetSubfields = targetField.subfields.filter(sf => sf.code === candSubfieldData.code);
  // Target field does not have this subfield yet:
  if (relevantTargetSubfields.length === 0) {
    return false;
  }
  nvdebug(`     Look for identical subfields in '${fieldToString(targetField)}' using`, debugDev);
  nvdebug(`      ORIG.    ‡${candSubfieldData.code} ${candSubfieldData.originalValue}`, debugDev);
  nvdebug(`      NO-PUNC  ‡${candSubfieldData.code} ${candSubfieldData.punctuationlessValue}`, debugDev);
  if (relevantTargetSubfields.some(sf => sf.code === candSubfieldData.code && sf.value === candSubfieldData.originalValue)) {
    return true;
  }
  if (relevantTargetSubfields.some(sf => sf.code === candSubfieldData.code && sf.value === candSubfieldData.punctuationlessValue)) {
    return true;
  }

  if (!skipNormalizedComparison(targetField.tag, candSubfieldData.code, candSubfieldData.originalValue)) {
    const normalizedTargetField = cloneAndNormalizeFieldForComparison(targetField);
    nvdebug(`     Look for identical normalized subfields in '${fieldToString(normalizedTargetField)}'`, debugDev);
    nvdebug(`      NO-PUNC ‡${candSubfieldData.code} ${candSubfieldData.normalizedValue})`, debugDev);

    if (normalizedTargetField.subfields.some(sf => sf.code === candSubfieldData.code && sf.value === candSubfieldData.normalizedValue)) {
      // Subfield with identical normalized value exists. Do nothing.
      // Not ideal 382‡n subfields, I guess... Nor 505‡trg repetitions... These need to be fixed...
      return true;
    }
  }

  return false; // (note that this is a double negation: not required is false)
}

function addSubfield(targetField, candSubfield) {
  nvdebug(` Added subfield '${subfieldToString(candSubfield)}' to field`, debugDev);
  // Add subfield to the end of all subfields. NB! Implement a separate function that does this + subfield reordering somehow...
  targetField.subfields.push(candSubfield); // eslint-disable-line functional/immutable-data

  targetField.merged = 1; // eslint-disable-line functional/immutable-data

  setPunctuationFlag(targetField, candSubfield);
  sortAdjacentSubfields(targetField);

}

function setPunctuationFlag(field, addedSubfield) {
  if (isControlSubfieldCode(addedSubfield.code)) { // These are never punctuation related
    return;
  }
  field.useExternalEndPunctuation = 1; // eslint-disable-line functional/immutable-data
}


function resetPaired880(candFieldPair880, targetField, punctlessCandSubfield) {
  // No relevant:
  if (punctlessCandSubfield.code !== '6') {
    return;
  }
  if (targetField.tag === '880') {
    return;
  }
  // NB! $6 comes first:
  if (candFieldPair880 === undefined || !candFieldPair880.subfields || candFieldPair880.subfields[0].code !== '6') {
    return;

  }
  nvdebug(`880 contents: ${fieldToString(candFieldPair880)}`, debugDev);
  resetSubfield6Tag(candFieldPair880.subfields[0], targetField.tag);
}

export function mergeOrAddSubfield(targetField, candSubfieldData, candFieldPairs880 = []) {

  const candSubfieldAsString = `${candSubfieldData.code} ${candSubfieldData.originalValue}`;

  nvdebug(`   Q: mergeOrAddSubfield '${candSubfieldAsString}'\n      with field '${fieldToString(targetField)}'?`, debugDev);
  if (mergeOrAddSubfieldNotRequired(targetField, candSubfieldData)) {
    nvdebug(`    A: No. No need to merge nor to add the subfield '${candSubfieldAsString}'`, debugDev);
    return;
  }

  const candSubfield = {'code': candSubfieldData.code, 'value': candSubfieldData.punctuationlessValue};

  // Currently only for X00$d 1984- => 1984-2000 type of changes, where source version is better that what base has.
  // It all other cases the original subfield is kept.
  const original = fieldToString(targetField);

  if (mergeSubfield(targetField, candSubfield)) { // We might need the normalizedCandSubfield later on
    mergeSubfieldPostprocessor();
    return;
  }

  // Subfield codes missing from the original record can be added by default:
  if (addSubfieldWithPreviouslyUnseenSubfieldCode()) {
    return;
  }

  // melindaCustomMergeFields.json tells us whether the subfield is repeatable or not:
  if (subfieldIsRepeatable(targetField.tag, candSubfield.code)) {
    // We don't want to add multiple, say, 260$c
    if (['260', '264'].includes(targetField.tag)) {
      nvdebug(`    A: Exceptionally skip repeatable existing subfield '${subfieldToString(candSubfield)}'`, debugDev);
      return;
    }
    nvdebug(`    A: Yes. Add repeatable subfield '${subfieldToString(candSubfield)}'`, debugDev);
    targetField.merged = 1; // eslint-disable-line functional/immutable-data
    setPunctuationFlag(targetField, candSubfield);
    addSubfield(targetField, candSubfield);
    return;
  }

  nvdebug(`    A: No. Non-repeatable subfield '${subfieldToString(candSubfield)}'`, debugDev);
  return;

  function mergeSubfieldPostprocessor() {
    if (original !== fieldToString(targetField)) {
      nvdebug(`    A: Merge. Subfield '${candSubfieldAsString}' replaces the original subfield.`, debugDev);
      targetField.merged = 1; // eslint-disable-line functional/immutable-data
      setPunctuationFlag(targetField, candSubfield);
      return;
    }
    nvdebug(`      A: No. Field ${original} already had the same or a synonymous or a better merge candidate than our subfield '${candSubfieldAsString}'.`, debugDev);
    return;
  }

  function addSubfieldWithPreviouslyUnseenSubfieldCode() {
    if (!fieldHasSubfield(targetField, candSubfield.code)) {
      nvdebug(`    A: Yes. Add previously unseen subfield '${subfieldToString(candSubfield)}'`, debugDev);
      targetField.merged = 1; // eslint-disable-line functional/immutable-data
      setPunctuationFlag(targetField, candSubfield);
      candFieldPairs880.forEach(pair => resetPaired880(pair, targetField, candSubfield));
      addSubfield(targetField, candSubfield);
      return true;
    }
    return false;
  }
}
