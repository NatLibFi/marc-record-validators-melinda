import createDebugLogger from 'debug';
import {fieldHasSubfield, fieldToString, nvdebug /*, subfieldToString*/ } from './utils.js';
import {fieldHasWantedTagAndOccurrenceNumber, isValidSubfield6, subfield6GetOccurrenceNumber, subfield6ResetOccurrenceNumber} from './subfield6Utils.js';

// Relocated from melinda-marc-record-merge-reducers (and renamed)

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:resolveOrphanedSubfield6s');

export default function () {
  return {
    description: 'Remove occurrence-number-orphaned $6 subfields. In field 880, occurrence number becomes 00',
    validate, fix
  };

  function fix(record) {
    nvdebug('Fix SF6 orphaned occurrence numbers');
    const res = {message: [], fix: [], valid: true};
    //message.fix = [];

    // This can not really fail...
    recordFixSubfield6OccurrenceNumbers(record);

    //message.valid = !(message.message.length >= 1);
    return res;
  }

  function validate(record) {
    // Check max, and check number of different indexes
    nvdebug('Validate SF6 orphaned occurrence numbers', debug);
    const fieldsContainingSubfield6 = record.fields.filter(field => fieldHasSubfield(field, '6'));

    const orphanedFields = getOrphanedFields(fieldsContainingSubfield6);

    const res = {message: []};

    if (orphanedFields.length > 0) {
      res.message = [`${orphanedFields.length} orphaned occurrence number field(s) detected`];
    }
    res.valid = res.message.length < 1;
    return res;
  }
}

function recordFixSubfield6OccurrenceNumbers(record) {
  const fieldsContainingSubfield6 = record.fields.filter(field => fieldHasSubfield(field, '6'));
  const orphanedFields = getOrphanedFields(fieldsContainingSubfield6);

  orphanedFields.forEach(field => fieldFixOrphanedSubfields(field));

  function fieldFixOrphanedSubfields(field) {
    // Field 880: orphaned $6 subfields: occurrence number is changed to '00':
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
    field.subfields = remainingSubfields;
  }

  function field880FixOrphanedSubfield(subfield) {
    if (!isOrphanedSubfield(subfield, '880', fieldsContainingSubfield6)) {
      return;
    }
    // convert occurrence number to 00
    subfield6ResetOccurrenceNumber(subfield, '00');
  }
}


function findPairForSubfield6OccurrenceNumber(subfield6, myTag, candPairFields) {
  // We keep the crap!
  if (!isValidSubfield6(subfield6)) {
    return undefined;
  }
  //nvdebug(`LOOKING FOR PAIR: ${myTag} ${subfieldToString(subfield6)}`);
  candPairFields.forEach(field => fieldToString(field));

  // Only valid $6 value that fails to map to another field is iffy...
  const referredTag = subfield6.value.substring(0, 3);

  const occurrenceNumber = subfield6GetOccurrenceNumber(subfield6);
  if (occurrenceNumber === '00') {
    return undefined;
  }
  const tagAndOccurrenceNumber = `${myTag}-${occurrenceNumber}`;
  //nvdebug(`Try to find occurrence number ${tagAndOccurrenceNumber} in field ${referredTag}...`);
  //const relevantFields = fields.filter(field => field.tag === referredTag && field.subfields.some(sf => subfield6GetOccurrenceNumber(sf) === occurrenceNumber));
  const relevantFields = candPairFields.filter(field => field.tag === referredTag && fieldHasWantedTagAndOccurrenceNumber(field, tagAndOccurrenceNumber));
  if (relevantFields.length === 0) {
    return undefined;
  }
  // This should always return just one (not sanity checking this for now):
  return relevantFields[0];
}

function isOrphanedSubfield(subfield, tag, pairCandidateFields) {
  if (!isValidSubfield6(subfield) || subfield6GetOccurrenceNumber(subfield) === '00') {
    return false;
  }
  return !findPairForSubfield6OccurrenceNumber(subfield, tag, pairCandidateFields);
}


function isOrphanedField(field, candidatePairFields) {
  return field.subfields.some(sf => isOrphanedSubfield(sf, field.tag, candidatePairFields));
}

function getOrphanedFields(relevantFields) {
  return relevantFields.filter(field => isOrphanedField(field, relevantFields));
}
