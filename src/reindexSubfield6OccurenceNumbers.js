import createDebugLogger from 'debug';
import {intToOccurenceNumberString, isValidSubfield6, nvdebug, recordGetMaxSubfield6Index,
  resetSubfield6OccurenceNumber, subfield6GetIndex, subfield6GetIndexAsInteger} from './subfield6Utils';

// Relocated from melinda-marc-record-merge-reducers (and renamed)

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:reindexSubfield6OccurenceNumbers');

export default function () {
  return {
    description: 'Reindex occurence numbers in $6 subfield so that they start from 01 and end in NN',
    validate, fix
  };

  function fix(record) {
    nvdebug('Fix SF6 occurence numbers');
    const res = {message: [], fix: [], valid: true};
    //message.fix = []; // eslint-disable-line functional/immutable-data

    // This can not really fail...
    recordResetSubfield6OccurenceNumbers(record);

    // message.valid = !(message.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validate(record) {
    // Check max, and check number of different indexes
    nvdebug('Validate SF6 occurence numbers', debug);
    const max = recordGetMaxSubfield6Index(record);
    const size = recordGetNumberOfUniqueSubfield6OccurenceNumbers(record);

    const res = {message: []};
    if (max !== size) { // eslint-disable-line functional/no-conditional-statement
      res.message = [`Gaps detected in occurence numbers: found ${size}, seen max ${max}`]; // eslint-disable-line functional/immutable-data
    }
    res.valid = res.message.length < 1; // eslint-disable-line functional/immutable-data
    return res;
  }
}


function recordGetNumberOfUniqueSubfield6OccurenceNumbers(record) {
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
    const i = subfield6GetIndexAsInteger(subfield);
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

export function recordResetSubfield6OccurenceNumbers(record) { // Remove gaps
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
    const currIndex = subfield6GetIndex(subfield);
    if (currIndex === undefined || currIndex === '00') {
      return;
    }

    const newIndex = mapCurrIndexToNewIndex(currIndex);
    //nvdebug(`subfieldReset6(${subfieldToString(subfield)}): ${newIndex}`);
    resetSubfield6OccurenceNumber(subfield, newIndex);
  }

  function mapCurrIndexToNewIndex(currIndex) {
    if(currIndex in oldtoNewCache) {
      return oldtoNewCache[currIndex];
    }
    const newIndex = intToOccurenceNumberString(currentInt);
    oldtoNewCache[currIndex] = newIndex;
    currentInt++;
    return newIndex;
  }

  /* eslint-enable */

}
