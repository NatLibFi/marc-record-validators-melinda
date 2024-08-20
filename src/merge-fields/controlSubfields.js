import {MarcRecord} from '@natlibfi/marc-record';
import createDebugLogger from 'debug';
import {fieldHasSubfield, fieldToString, nvdebug, nvdebugSubfieldArray, subfieldIsRepeatable, subfieldsAreIdentical} from '../utils.js';

//import {normalizeControlSubfieldValue} from './normalizeIdentifier';
import {normalizeControlSubfieldValue} from '../normalize-identifiers';

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:merge-fields:controlSubfields');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

function subfieldsAreEqual(field1, field2, subfieldCode) {
  // Check OK if neither one has given subfield.
  // Check fails if one field has given subfield and the other one does not
  if (!fieldHasSubfield(field1, subfieldCode)) {
    return !fieldHasSubfield(field2, subfieldCode);
  }
  if (!fieldHasSubfield(field2, subfieldCode)) {
    return false;
  }
  // Compare $3 subfields. If everything matches, OK, else FAIL:
  const sfSet1 = field1.subfields.filter(subfield => subfield.code === subfieldCode);
  const sfSet2 = field2.subfields.filter(subfield => subfield.code === subfieldCode);
  return MarcRecord.isEqual(sfSet1, sfSet2);
}

function subfieldsAreEmpty(field1, field2, subfieldCode) {
  if (!fieldHasSubfield(field1, subfieldCode) && !fieldHasSubfield(field2, subfieldCode)) {
    return true;
  }
  return false;
}


function sixlessIsSubset(fieldWith6, fieldWithout6) {
  // Remove $0 and $1, and then check that remaining $6-less field is a subset of the one with $6.
  // No need to check indicators.
  // NB! We could use punctuation-stripping here.
  const subset = fieldWithout6.subfields.filter(subfield => !['0', '1'].includes(subfield.code));
  return subset.every(sf => fieldWith6.subfields.some(sf2 => subfieldsAreIdentical(sf, sf2)));
  //return MarcRecord.isEqual(strippedField1, strippedField2);
}

function controlSubfield6PermitsMerge(field1, field2) {
  if (subfieldsAreEmpty(field1, field2, '6')) {
    return true;
  }

  // Handle cases where one has a $6 and the other has not:
  // Should this accept $0 (FI-ASTERI-N) vs none?
  if (!fieldHasSubfield(field1, '6') && fieldHasSubfield(field2, '6') && sixlessIsSubset(field2, field1)) {
    return true;
  }
  if (!fieldHasSubfield(field2, '6') && fieldHasSubfield(field1, '6') && sixlessIsSubset(field1, field2)) {
    return true;
  }

  // There are at least two (plus) fields involved (Field XXX (one) and field 880 (one plus).
  // Thus this generic solution can't handle them. Postprocess step removes some chains instead!
  debugDev(`  controlSubfield6PermitsMerge() fails always on generic part (feature).`);
  return false;
}

function controlSubfield5PermitsMerge(field1, field2) {
  // field1.$5 XOR field2.$5 means false, NEITHER and BOTH mean true, regardless of value
  if (!fieldHasSubfield(field1, '5')) {
    if (!fieldHasSubfield(field2, '5')) {
      return true; // If neither one has $5, it's ok to merge
    }
    // If $5 contents are same, merge can be perfomed:
    const fives1 = field1.subfields.filter(sf => sf.code === '5');
    const fives2 = field2.subfields.filter(sf => sf.code === '5');
    if (fives1.every(sf1 => fives2.some(sf2 => sf1.value === sf2.value)) && fives2.every(sf2 => fives1.some(sf1 => sf1.value === sf2.value))) {
      return true;
    }
    return false;
  }
  if (!fieldHasSubfield(field2, '5')) {
    return false;
  }
  return true;
}

function controlSubfield9PermitsMerge(baseField, sourceField) {
  const baseFieldSubfields9 = baseField.subfields.filter(sf => sf.code === '9');
  const sourceFieldSubfields9 = sourceField.subfields.filter(sf => sf.code === '9');

  //nvdebug('CHECK $9', debugDev);
  // There are no $9s. Skip:
  if (baseFieldSubfields9.length === 0 && sourceFieldSubfields9.length === 0) {
    //nvdebug(` No subfield $9 detected`, debugDev);
    return true;
  }

  if (keepOrDropPreventsMerge()) {
    nvdebug(` Subfield $9 KEEPs and DROPs disallow merge`, debugDev);
    return false;
  }

  if (transPreventsMerge()) {
    nvdebug(` Subfield $9 <TRANS> mismatch disallows merge`, debugDev);
    return false;
  }

  //nvdebug('CHECK $9 OK', debugDev);

  return true;

  function subfieldHasKeepOrDrop(subfield) {
    // nvdebug(`Has <KEEP>? ${subfieldToString(subfield)}`, debugDev);
    return subfield.code === '9' && (/(?:<KEEP>|<DROP>)/u).test(subfield.value);
  }

  function subfieldHasTrans(subfield) {
    return subfield.code === '9' && (/<TRANS>/u).test(subfield.value);
  }

  function transPreventsMerge() {
    const trans1 = baseFieldSubfields9.filter(sf => subfieldHasTrans(sf));
    const trans2 = sourceFieldSubfields9.filter(sf => subfieldHasTrans(sf));
    if (trans1.length > 0 && trans2.length > 0) {
      if (!MarcRecord.isEqual(trans1, trans2)) {
        return true;
      }
    }
    return false;
  }

  function retainSubfieldForKeepComparison(subfield) {
    // Don't compare <KEEP>, <DROP> nor <TRANS> here (<TRANS> has it's own check)
    if (subfieldHasKeepOrDrop(subfield) || subfieldHasTrans(subfield)) {
      return false;
    }

    if (['0', '1'].includes(subfield.code)) {
      return false;
    }
    if (['100', '600', '700', '800'].includes(baseField.tag)) {
      // Despite $9 KEEP/DROP, we are interested in merging $d years (better than two separate fields)
      if (['d'].includes(subfield.code)) {
        return false;
      }
    }


    return true;
  }

  function acceptKeeplessSourceSubfield(sourceSubfield, tag, subfieldCode, subfieldValue) {
    if (sourceSubfield.code !== subfieldCode) {
      return false;
    }
    // In this context, there's no need to check the value of a non-repeatable subfield.
    // If value is different, pairing will fail when comparing the subfield itself.
    // This allows us to tolerate little differences in punctuation: different punctuation does not get copied to base,
    // so they don't alter base and and thus redundant when comparing.
    if (!subfieldIsRepeatable(tag, subfieldCode)) {
      return true;
    }
    return sourceSubfield.value === subfieldValue;
  }

  function keepOrDropPreventsMerge() {
    const keepOrDrop1 = baseFieldSubfields9.filter(sf => subfieldHasKeepOrDrop(sf));
    const keepOrDrop2 = sourceFieldSubfields9.filter(sf => subfieldHasKeepOrDrop(sf));

    if (keepOrDrop1.length === 0 && keepOrDrop2.length === 0) {
      return false;
    }

    if (baseField.tag.charAt(0) === '1' && !keepOrDrop2.some(sf => (/<DROP>/u).test(sf.value))) {
      return false;
    }

    const sf9lessField1 = baseField.subfields.filter(subfield => retainSubfieldForKeepComparison(subfield));
    const sf9lessField2 = sourceField.subfields.filter(subfield => retainSubfieldForKeepComparison(subfield));

    nvdebugSubfieldArray(baseField.subfields, 'FIELD   ', debugDev);
    nvdebugSubfieldArray(sf9lessField1, 'FILTER  ', debugDev);

    nvdebugSubfieldArray(sourceField.subfields, 'FIELD2  ', debugDev);
    nvdebugSubfieldArray(sf9lessField2, 'FILTER2 ', debugDev);

    // Keepless field can be a subset field with <KEEP>/<DROP>! Note that punctuation still causes remnants to fail.
    if (keepOrDrop1.length === 0) {
      return !sf9lessField1.every(sf => sf9lessField2.some(sf2 => subfieldsAreIdentical(sf, sf2)));
    }
    // However, to alleviate the above-mentioned punctuation problem, we can check keep/drop-less *source* subfields
    if (keepOrDrop2.length === 0) {
      const unhandledSubfield = sf9lessField2.find(sf2 => !sf9lessField1.some(sf => acceptKeeplessSourceSubfield(sf2, baseField.tag, sf.code, sf.value)));
      if (unhandledSubfield) {
        //nvdebug(`Failed to pair ${subfieldToString(unhandledSubfield)}`, debugDev);
        return true;
      }
      //return !sf9lessField2.every(sf2 => sf9lessField1.some(sf => subfieldsAreIdentical(sf, sf2)));
      return false;
    }

    //nvdebugSubfieldArray(sf9lessField2, 'SOURCE(?)', debugDev);
    //nvdebugSubfieldArray(sf9lessField1, 'BASE(?)  ', debugDev);

    // $9 <KEEP> or <DROP> detected on both fields.
    // Non-keeps and non-drops must be equal, otherwise fail:
    if (MarcRecord.isEqual(sf9lessField1, sf9lessField2)) {
      return false;
    }
    // Prevent:
    return true;
  }
}

function getPrefix(value) {
  const normalizedValue = normalizeControlSubfieldValue(value);

  if (normalizedValue.match(/^\([^)]+\)[0-9]+$/u)) {
    return normalizedValue.substr(0, normalizedValue.indexOf(')') + 1);
  }

  if (value.match(/^https?:\/\//u)) {
    return normalizedValue.substr(0, normalizedValue.lastIndexOf('/') + 1);
  }

  return '';
}

function isMatchAfterNormalization(currSubfield, otherField) {
  // NB! Add implement isni normalizations (to normalize.js) and apply here:
  const normalizedCurrSubfieldValue = normalizeControlSubfieldValue(currSubfield.value);
  const prefix = getPrefix(normalizedCurrSubfieldValue);

  //debug(`FFS-PREFIX '${prefix}'`);
  // Look for same prefix + different identifier
  const hits = otherField.subfields.filter(sf2 => sf2.code === currSubfield.code && normalizeControlSubfieldValue(sf2.value).indexOf(prefix) === 0);
  if (hits.length === 0 || // <-- Nothing found, so it can't be a mismatch
      // Every opposing subfields match:
      hits.every(sf2 => normalizedCurrSubfieldValue === normalizeControlSubfieldValue(sf2.value))) {
    debugDev(`Subfield ‡${currSubfield.code} check OK: No opposing ${prefix} prefixes found.`);
    return true;
  }

  debugDev(`Subfield ‡${currSubfield.code} check FAILED: ‡${currSubfield.code} '${currSubfield.value}' vs ‡${currSubfield.code} '${hits[0].value}'.`);
  return false;
}

function controlSubfieldContainingIdentifierPermitsMerge(field1, field2, subfieldCode) {
  if (!fieldHasSubfield(field1, subfieldCode, null) || !fieldHasSubfield(field2, subfieldCode, null)) {
    return true;
  }

  const result = field1.subfields.every(subfield => {
    if (subfield.code !== subfieldCode) {
      return true;
    }

    debugDev(`Compare ‡${subfieldCode} '${subfield.value}' with '${fieldToString(field2)}'.`);
    if (fieldHasSubfield(field2, field1.code, field1.value)) {
      return true;
    }

    return isMatchAfterNormalization(subfield, field2, subfieldCode);
  });

  if (!result) {
    debugDev(`Control subfield '${subfieldCode}' check failed.`);
    return false;
  }
  return true;
}

const controlSubfieldsContainingIdentifier = ['w', '0', '1', '2']; // 2 ain't identifier, but the logic can be applied here as well

export function controlSubfieldsPermitMerge(baseField, sourceField) {
  // Check $w, $0, $1, $2 (which isn't an identifier per se, but the sama logic can be applied)
  if (!controlSubfieldsContainingIdentifier.every(subfieldCode => controlSubfieldContainingIdentifierPermitsMerge(baseField, sourceField, subfieldCode))) {
    //debug(' control subfields with identifiers failed');
    return false;
  }

  if (!subfieldsAreEqual(baseField, sourceField, '3')) {
    //debug(' similar control subfield fails');
    return false;
  }

  if (!controlSubfield5PermitsMerge(baseField, sourceField) || !controlSubfield6PermitsMerge(baseField, sourceField) || !controlSubfield9PermitsMerge(baseField, sourceField)) {
    return false;
  }
  // We fully prevent merging $8 subfields here, as they affect multiple fields! Also these would get screwed:
  // 38211 |8 3\u |a kuoro |2 seko
  // 38211 |8 6\u |a kuoro |2 seko |9 VIOLA<DROP>
  // Thus only copy works with $8...
  if (!subfieldsAreEmpty(baseField, sourceField, '8')) {
    // We could alleviate this a bit esp. for non-repeatable fields.
    // At least, if the source has '8' and otherwise the two fields are identical...
    const subsetOfSourceField = {
      'tag': sourceField.tag,
      'ind1': sourceField.ind1,
      'ind2': sourceField.ind2, subfields: sourceField.subfields.filter(sf => sf.code !== '8')
    };
    if (fieldToString(baseField) === fieldToString(subsetOfSourceField)) {
      return true;
    }
    //debug(' csf8 failed');
    return false;
  }

  return true;
}
