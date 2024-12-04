// Merge author/agent fields
//
// Rationale: Same author can appear in one 1XX and multiple 7XX fields having only different $e subfields.
// These fields can be merged (and $e-subfields can then be sorted)...
//
// Author(s): Nicholas Volk


import clone from 'clone';
import {fieldFixPunctuation, fieldStripPunctuation} from './punctuation2';
import {fieldToString, nvdebug} from './utils';
import {sortAdjacentSubfields} from './sortSubfields';
import {sortAdjacentRelatorTerms} from './sortRelatorTerms';
//import createDebugLogger from 'debug';
/*
//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:mergeRelatorTermFields');
//const debugData = debug.extend('data');
*/

export default function () {

  return {
    description: 'Merge author fields that only differ in $e relator terms',
    validate, fix
  };

  function fix(record) {
    const msg = mergeRelatorTermFields(record, true);
    const res = {message: msg, fix: msg, valid: true};
    return res;
  }

  function validate(record) {
    const msg = mergeRelatorTermFields(record, false);
    const res = {message: msg};

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }
}

function createNormalizedClone(field) {
  const clonedField = clone(field);
  // Normalize
  fieldStripPunctuation(clonedField);
  return clonedField;
}

function createNormalizedCloneWithoutRelatorTerms(field) {
  const clonedField = createNormalizedClone(field);
  // Remove relator terms $e subfi:
  clonedField.subfields = clonedField.subfields.filter(sf => sf.code !== 'e'); // eslint-disable-line functional/immutable-data
  return clonedField;
}

function fieldToRelatorTermSubfieldCode(field) {
  if (['100', '110', '700', '710', '720', '751', '752'].includes(field.tag)) {
    return 'e';
  }
  if (field.tag === '111' || field.tag === '711') {
    return 'j';
  }
  return '?'; // No need to complain. Nothing is found.
}

function getRelatorTermStrings(relatorTermSubfieldCode, field) {
  return field.subfields.filter(sf => sf.code === relatorTermSubfieldCode).map(sf => sf.value);

}

function extractAddableRelatorTerms(fromField, toField) {
  const relatorTermSubfieldCode = fieldToRelatorTermSubfieldCode(fromField);
  const normalizedFromFieldRelatorTerms = getRelatorTermStrings(relatorTermSubfieldCode, fromField);
  if (normalizedFromFieldRelatorTerms.length === 0) {
    return [];
  }
  // Remove values that already exist:
  const normalizedToFieldRelatorTerms = getRelatorTermStrings(relatorTermSubfieldCode, toField);
  return normalizedFromFieldRelatorTerms.filter(str => !normalizedToFieldRelatorTerms.includes(str));
}


function copyRelatorSubfields(fromField, toField) {
  const relatorTermSubfieldCode = fieldToRelatorTermSubfieldCode(fromField);
  const newRelatorTerms = extractAddableRelatorTerms(fromField, toField);

  newRelatorTerms.forEach(term => toField.subfields.push({code: relatorTermSubfieldCode, value: term})); // eslint-disable-line functional/immutable-data

}

function mergeRelatorTermFields(record, fix = false) {
  /* eslint-disable */
  // NV: 111/711, 751 and 752 where so rare that I did not add them here
  let fields = record.get('(?:[17][01]0|720)'); 
  let result = [];
  const comparisonFieldsAsString = fields.map(f => fieldToString(createNormalizedCloneWithoutRelatorTerms(f)));

  nvdebug(`mergeRelatorTermFields(): ${fields.length} cand field(s) found`);
  for(let i=0; i < fields.length-1; i++) {
    let currField = fields[i];
    if (currField.deleted) {
      continue;
    }
    nvdebug(`RT: Trying to pair ${comparisonFieldsAsString[i]}/${i}`);
    for (let j=i+1; j < fields.length; j++) {
      nvdebug(` Compare with ${comparisonFieldsAsString[j]}/${j}`);
      let mergableField = fields[j];
      // Skip 1/7 from 1XX/7XX for similarity check:
      if ( comparisonFieldsAsString[i].substring(1) !== comparisonFieldsAsString[j].substring(1)) {
        nvdebug("  NOT PAIR");
        continue;
      }
      if (mergableField.deleted) {
        nvdebug("  DELETED");
        continue;
      }
      const str = `MERGE RELATOR TERM FIELD: ${fieldToString(mergableField)}`;
      nvdebug(str);

      if(!result.includes(str)) {
        result.push(str)
      }

      if (fix) {
        mergableField.deleted = 1;
        copyRelatorSubfields(mergableField, currField);
        fieldFixPunctuation(currField);
        sortAdjacentSubfields(currField); // Put the added $e subfield to proper places.
        sortAdjacentRelatorTerms(currField); // Sort $e subfields with each other
        fieldFixPunctuation(currField);

      }
    }
  }

  if(!fix) {
    fields.forEach(f => delete f.deleted);
  }

  record.fields = record.fields.filter(f => !f.deleted);
  /* eslint-enable */
  return result;
}
