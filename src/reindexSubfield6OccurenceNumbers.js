import createDebugLogger from 'debug';
import {fieldHasSubfield, intToOccurrenceNumberString, isValidSubfield6, nvdebug, recordGetMaxSubfield6OccurrenceNumber,
  resetSubfield6OccurrenceNumber, subfield6GetOccurrenceNumber, subfield6GetOccurrenceNumberAsInteger} from './subfield6Utils';

// Relocated from melinda-marc-record-merge-reducers (and renamed)

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:reindexSubfield6OccurrenceNumbers');

export default function () {
  return {
    description: 'Reindex occurrence numbers in $6 subfield so that they start from 01 and end in NN',
    validate, fix
  };

  function fix(record) {
    nvdebug('Fix SF6 occurrence numbers');
    const res = {message: [], fix: [], valid: true};
    //message.fix = []; // eslint-disable-line functional/immutable-data

    // This can not really fail...
    recordResetSubfield6OccurrenceNumbers(record);

    // message.valid = !(message.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validate(record) {
    const res = {message: []};

    nvdebug('Validate SF6 occurrence number multiuses');
    if (recordHasSharedOccurrenceNumbers(record)) { // eslint-disable-line functional/no-conditional-statement
      res.message.push(`Multi-use occurrence number(s) detected`); // eslint-disable-line functional/immutable-data
    }

    // Check max, and check number of different indexes
    nvdebug('Validate SF6 occurrence number (max vs n instances)', debug);
    const max = recordGetMaxSubfield6OccurrenceNumber(record);
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


function recordHasSharedOccurrenceNumbers(record) {
  const fieldsContainingSubfield6 = record.fields.filter(field => field.tag !== '880' && fieldHasSubfield(field, '6'));
  return fieldsContainingSubfield6.some(field => fieldHasSharedOccurrenceNumber(field, fieldsContainingSubfield6));
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
    //nvdebug(`fieldResetSubfield6(${fieldToString(field)})`);
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
    //nvdebug(`subfieldReset6(${subfieldToString(subfield)}): ${newIndex}`);
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
