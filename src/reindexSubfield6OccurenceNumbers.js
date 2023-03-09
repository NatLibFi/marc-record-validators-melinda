import createDebugLogger from 'debug';
import {fieldHasSubfield, fieldToString, nvdebug} from './utils';
import {fieldGetOccurrenceNumberPairs, fieldGetUnambiguousOccurrenceNumber, intToOccurrenceNumberString, isValidSubfield6,
  recordGetMaxSubfield6OccurrenceNumberAsInteger, resetFieldOccurrenceNumber,
  resetSubfield6OccurrenceNumber, subfield6GetOccurrenceNumber, subfield6GetOccurrenceNumberAsInteger} from './subfield6Utils';

// Relocated from melinda-marc-record-merge-reducers (and renamed)

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:reindexSubfield6OccurrenceNumbers');


// NB! This validator/fixer has two functionalities:
// 1) normal reindexing of occurrence numbers
// 2) disambiguation (when possible) of unambiguous occurrence numbers

export default function () {
  return {
    description: 'Reindex occurrence numbers in $6 subfield so that they start from 01 and end in NN',
    validate, fix
  };

  function fix(record) {
    nvdebug('Fix SF6 occurrence numbers', debug);
    const res = {message: [], fix: [], valid: true};
    //message.fix = []; // eslint-disable-line functional/immutable-data

    // This can not really fail...

    recordDisambiguateSharedSubfield6OccurrenceNumbers(record);
    recordResetSubfield6OccurrenceNumbers(record);

    // message.valid = !(message.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validate(record) {
    const res = {message: []};

    nvdebug('Validate SF6 occurrence number multiuses', debug);
    if (recordGetSharedOccurrenceNumbers(record).length) { // eslint-disable-line functional/no-conditional-statement
      res.message.push(`Multi-use of occurrence number(s) detected`); // eslint-disable-line functional/immutable-data
    }

    // Check max, and check number of different indexes
    nvdebug('Validate SF6 occurrence number (max vs n instances)', debug);
    const max = recordGetMaxSubfield6OccurrenceNumberAsInteger(record);
    const size = recordGetNumberOfUniqueSubfield6OccurrenceNumbers(record);


    if (max !== size) { // eslint-disable-line functional/no-conditional-statement
      res.message.push(`Gaps detected in occurrence numbers: found ${size}, seen max ${max}`); // eslint-disable-line functional/immutable-data
    }
    res.valid = res.message.length < 1; // eslint-disable-line functional/immutable-data
    return res;
  }
}

function getPotentialSharedOccurrenceNumberFields(occurrenceNumber, fields) {
  return fields.filter(f => f.tag !== '880' && f.subfields.some(sf => subfield6GetOccurrenceNumber(sf) === occurrenceNumber));
}

function subfieldHasSharedOccurrenceNumber(subfield, candFields) {
  const occurrenceNumber = subfield6GetOccurrenceNumber(subfield);
  if (!occurrenceNumber || occurrenceNumber === '00') {
    return false;
  }
  const relevantFields = getPotentialSharedOccurrenceNumberFields(occurrenceNumber, candFields);
  // record.fields.filter(f => f.tag !== '880' && fieldHasOccurrenceNumber(f, occurrenceNumber));
  return relevantFields.length > 1;
}

function fieldHasSharedOccurrenceNumber(field, candFields) {
  if (!field.subfields || field.tag === '880') { // Should not happen
    return false;
  }

  // What if there are multiple $6s in a given field? Should not be, but...
  return field.subfields.some(subfield => subfieldHasSharedOccurrenceNumber(subfield, candFields));

}

function recordGetSharedOccurrenceNumbers(record) {
  const fieldsContainingSubfield6 = record.fields.filter(field => field.tag !== '880' && fieldHasSubfield(field, '6'));
  // fieldsContainingSubfield6.some(field => fieldHasSharedOccurrenceNumber(field, fieldsContainingSubfield6)))
  return fieldsContainingSubfield6.filter(field => fieldHasSharedOccurrenceNumber(field, fieldsContainingSubfield6));
}

function recordDisambiguateSharedSubfield6OccurrenceNumbers(record) {
  const sharedOccurrenceNumberFields = recordGetSharedOccurrenceNumbers(record);
  if (sharedOccurrenceNumberFields.length < 2) {
    return;
  }
  nvdebug(`Disambiguate occurrence numbers (N=${sharedOccurrenceNumberFields.length}) in...`, debug);
  sharedOccurrenceNumberFields.forEach(field => disambiguateOccurrenceNumber(field));

  function disambiguateable(field) {
    if (field.tag === '880') { // Not needed, already filtered...
      return false;
    }
    const occurrenceNumber = fieldGetUnambiguousOccurrenceNumber(field);
    nvdebug(` Trying to disambiguate ${occurrenceNumber} in '${fieldToString(field)}`);
    if (occurrenceNumber === undefined) {
      return false;
    }
    const allRelevantFields = getPotentialSharedOccurrenceNumberFields(occurrenceNumber, sharedOccurrenceNumberFields);
    if (allRelevantFields.length < 2) {
      nvdebug(` Currently only ${allRelevantFields.length} field(s) use occurrence number ${occurrenceNumber}. No action required.`);
      return false;
    }
    nvdebug(` Currently ${allRelevantFields.length} field(s) use occurrence number ${occurrenceNumber}. ACTION REQUIRED!`);
    const relevantFieldsWithCurrFieldTag = allRelevantFields.filter(candField => field.tag === candField.tag);

    if (relevantFieldsWithCurrFieldTag.length !== 1) {
      nvdebug(` Number of them using tag ${field.tag} is ${relevantFieldsWithCurrFieldTag.length}. Can not disambiguate!`);
      return false;
    }

    return true;
  }

  function disambiguateOccurrenceNumber(field) {
    if (!disambiguateable(field)) {
      return;
    }
    // Reset field:
    const occurrenceNumber = fieldGetUnambiguousOccurrenceNumber(field);
    const newOccurrenceNumberAsInt = recordGetMaxSubfield6OccurrenceNumberAsInteger(record) + 1;
    const newOccurrenceNumber = intToOccurrenceNumberString(newOccurrenceNumberAsInt);
    const pairedFields = fieldGetOccurrenceNumberPairs(field, record.fields);

    nvdebug(` Reindex '${fieldToString(field)}' occurrence number and it's ${pairedFields.length} pair(s) using '${newOccurrenceNumber}'`, debug);

    resetFieldOccurrenceNumber(field, newOccurrenceNumber, occurrenceNumber);
    pairedFields.forEach(pairedField => resetFieldOccurrenceNumber(pairedField, newOccurrenceNumber, occurrenceNumber));

  }


}
function recordGetNumberOfUniqueSubfield6OccurrenceNumbers(record) {
  // Calculates the number of used different occurrence numbers
  /* eslint-disable */
  let indexArray = [];
  record.fields.forEach(field => gatherFieldData(field));

  function gatherFieldData(field) {
    if (!field.subfields) {
      return;
    }
    field.subfields.forEach(subfield => gatherSubfieldData(subfield));
  }

  function gatherSubfieldData(subfield) {
    if (!isValidSubfield6(subfield)) {
      return;
    }
    const i = subfield6GetOccurrenceNumberAsInteger(subfield);
    if (i === 0) {
      return
    }
    indexArray[i] = 1;
  }
  let n = 0;
  indexArray.forEach(elem => n+= elem); 
  /* eslint-enable */
  return n;
}

export function recordResetSubfield6OccurrenceNumbers(record) { // Remove gaps
  /* eslint-disable */
  let currentInt = 1;
  let oldtoNewCache = {};

  record.fields.forEach(field => fieldResetSubfield6(field));

  function fieldResetSubfield6(field) {
    nvdebug(`fieldResetSubfield6(${fieldToString(field)}), CURR:${currentInt}`, debug);
    if (!field.subfields) {
      return;
    }
    field.subfields.forEach(subfield => subfieldReset6(subfield));
  }

  function subfieldReset6(subfield) {
    if (!isValidSubfield6(subfield)) {
      return;
    }
    const currIndex = subfield6GetOccurrenceNumber(subfield);
    if (currIndex === undefined || currIndex === '00') {
      return;
    }

    const newIndex = mapCurrIndexToNewIndex(currIndex);
    //nvdebug(`subfieldReset6(${subfieldToString(subfield)}): ${newIndex}`, debug);
    resetSubfield6OccurrenceNumber(subfield, newIndex);
  }

  function mapCurrIndexToNewIndex(currIndex) {
    if(currIndex in oldtoNewCache) {
      return oldtoNewCache[currIndex];
    }
    const newIndex = intToOccurrenceNumberString(currentInt);
    oldtoNewCache[currIndex] = newIndex;
    currentInt++;
    return newIndex;
  }

  /* eslint-enable */

}
