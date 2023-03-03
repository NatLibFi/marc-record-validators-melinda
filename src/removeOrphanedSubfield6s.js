import createDebugLogger from 'debug';
import {fieldHasSubfield, fieldToString, isValidSubfield6, nvdebug, resetSubfield6OccurenceNumber, subfield6GetOccurenceNumber, subfieldToString} from './subfield6Utils';

// Relocated from melinda-marc-record-merge-reducers (and renamed)

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:reindexSubfield6OccurenceNumbers');

export default function () {
  return {
    description: 'Remove occurence-number-orphaned $6 subfields. In field 880, occurence number becomes 00',
    validate, fix
  };

  function fix(record) {
    nvdebug('Fix SF6 orphaned occurence numbers');
    const res = {message: [], fix: [], valid: true};
    //message.fix = []; // eslint-disable-line functional/immutable-data

    // This can not really fail...
    recordFixSubfield6OccurenceNumbers(record);

    //message.valid = !(message.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validate(record) {
    // Check max, and check number of different indexes
    nvdebug('Validate SF6 orphaned occurence numbers', debug);
    const fieldsContainingSubfield6 = record.fields.filter(field => fieldHasSubfield(field, '6'));

    const orphanedFields = getOrphanedFields(fieldsContainingSubfield6);

    const res = {message: []};

    if (orphanedFields.length > 0) { // eslint-disable-line functional/no-conditional-statement
      res.message = [`${orphanedFields.length} orphaned occurence number field(s) detected`]; // eslint-disable-line functional/immutable-data
    }
    res.valid = res.message.length < 1; // eslint-disable-line functional/immutable-data
    return res;
  }
}

export function recordFixSubfield6OccurenceNumbers(record) {
  const fieldsContainingSubfield6 = record.fields.filter(field => fieldHasSubfield(field, '6'));
  const orphanedFields = getOrphanedFields(fieldsContainingSubfield6);

  orphanedFields.forEach(field => fieldFixOrphanedSubfields(field));

  function fieldFixOrphanedSubfields(field) {
    // Field 880: orphaned $6 subfields: occurence number is changed to '00':
    if (field.tag === '880') {
      field.subfields.forEach(sf => field880FixOrphanedSubfield(sf));
      return;
    }
    // Non-880 fields get their orphaned $6s removed:
    const remainingSubfields = field.subfields.filter(sf => !isOrphanedSubfield(sf, field.tag, fieldsContainingSubfield6));
    if (remainingSubfields.length === 0) {
      record.removeField(field);
      return;
    }
    field.subfields = remainingSubfields; // eslint-disable-line functional/immutable-data
  }

  function field880FixOrphanedSubfield(subfield) {
    if (!isOrphanedSubfield(subfield, '880', fieldsContainingSubfield6)) {
      return;
    }
    // convert occurence number to 00
    resetSubfield6OccurenceNumber(subfield, '00');
  }
}


function hasWantedTagAndOccurenceNumber(subfield, tagAndOccurenceNumber) {
  if (subfield.code !== '6') {
    return false;
  }
  // We could also use generic code and go getTag()+'-'+getIndex() instead of regexp...
  const key = subfield.value.replace(/^([0-9][0-9][0-9]-[0-9][0-9]+).*$/u, '$1'); // eslint-disable-line prefer-named-capture-group
  nvdebug(` Compare '${key}' vs '${tagAndOccurenceNumber}'`);
  return key === tagAndOccurenceNumber;
}


function findPairForSubfield6OccurenceNumber(subfield6, myTag, candPairFields) {
  // We keep the crap!
  if (!isValidSubfield6(subfield6)) {
    return undefined;
  }
  nvdebug(`LOOKING FOR PAIR: ${myTag} ${subfieldToString(subfield6)}`);
  candPairFields.forEach(field => fieldToString(field));

  // Only valid $6 value that fails to map to another field is iffy...
  const referredTag = subfield6.value.substring(0, 3);

  const occurenceNumber = subfield6GetOccurenceNumber(subfield6);
  if (occurenceNumber === '00') {
    return undefined;
  }
  const tagAndOccurenceNumber = `${myTag}-${occurenceNumber}`;
  nvdebug(`Try to find occurence number ${tagAndOccurenceNumber} in field ${referredTag}...`);
  //const relevantFields = fields.filter(field => field.tag === referredTag && field.subfields.some(sf => subfield6GetOccurenceNumber(sf) === occurenceNumber));
  const relevantFields = candPairFields.filter(field => field.tag === referredTag && field.subfields.some(sf => hasWantedTagAndOccurenceNumber(sf, tagAndOccurenceNumber)));
  if (relevantFields.length === 0) {
    return undefined;
  }
  // This should always return just one (not sanity checking this for now):
  return relevantFields[0];
}

function isOrphanedSubfield(subfield, tag, pairCandidateFields) {
  if (!isValidSubfield6(subfield) || subfield6GetOccurenceNumber(subfield) === '00') {
    return false;
  }
  return !findPairForSubfield6OccurenceNumber(subfield, tag, pairCandidateFields);
}


function isOrphanedField(field, candidatePairFields) {
  return field.subfields.some(sf => isOrphanedSubfield(sf, field.tag, candidatePairFields));
}

function getOrphanedFields(relevantFields) {
  return relevantFields.filter(field => isOrphanedField(field, relevantFields));
}
