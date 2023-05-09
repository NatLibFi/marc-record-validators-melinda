// import createDebugLogger from 'debug';
// const debug = createDebugLogger('@natlibfi/marc-record-validator-melinda/subfield6Utils');

import {add8s, fieldsGetAllSubfield8LinkingNumbers, getSubfield8LinkingNumber, isValidSubfield8} from './subfield8Utils';
import {fieldHasSubfield, fieldToString, fieldsToString, nvdebug, subfieldToString} from './utils';

// NB! Subfield 6 is non-repeatable and it should always comes first!
// NB! Index size should always be 2 (preceding 0 required for 01..09) However, support for 100+ was added on 2023-02-27.
// NB! Index value '00' are left as they are (is not paired/indexed/whatever.
const sf6Regexp = /^[0-9][0-9][0-9]-(?:[0-9][0-9]|[1-9][0-9]+)(?:[^0-9].*)?$/u;

export function isValidSubfield6(subfield) {
  if (subfield.code !== '6') {
    return false;
  }
  return subfield.value.match(sf6Regexp);
}

function subfield6GetTag(subfield) {
  if (isValidSubfield6(subfield)) {
    return subfield.value.substring(0, 3);
  }
  return undefined;
}

export function subfield6GetOccurrenceNumber(subfield) {
  if (isValidSubfield6(subfield)) {
    // Skip "TAG-" prefix. 2023-02-20: removed 2-digit requirement from here...
    return subfield.value.substring(4).replace(/\D.*$/u, '');
  }
  return undefined;
}

export function subfield6GetOccurrenceNumberAsInteger(subfield) {
  const index = subfield6GetOccurrenceNumber(subfield);
  if (index === undefined || index === '00') {
    return 0;
  }
  const result = parseInt(index, 10);
  //nvdebug(`SF6: ${subfield.value} => ${index} => ${result}`, debug);
  return result;
}

export function subfield6ResetOccurrenceNumber(subfield, occurrenceNumber) {
  if (!isValidSubfield6(subfield)) {
    return;
  }
  const occurrenceNumberAsString = typeof occurrenceNumber === 'number' ? intToOccurrenceNumberString(occurrenceNumber) : occurrenceNumber;

  const newValue = subfield.value.substring(0, 4) + occurrenceNumberAsString + subfield6GetTail(subfield); // eslint-disable-line functional/immutable-data
  //nvdebug(`Set subfield $6 value from ${subfieldToString(subfield)} to ${newValue}`);
  subfield.value = newValue; // eslint-disable-line functional/immutable-data
}


function subfield6GetTail(subfield) {
  if (isValidSubfield6(subfield)) {
    // Skip "TAG-" prefix. 2023-02-20: removed 2-digit requirement from here...
    return subfield.value.replace(/^\d+-\d+/u, '');
  }
  return '';
}

export function subfield6HasWantedTagAndOccurrenceNumber(subfield, tagAndOccurrenceNumber) {
  if (subfield.code !== '6') {
    return false;
  }
  // We could also use generic code and go getTag()+'-'+getIndex() instead of regexp...
  const key = subfield.value.replace(/^([0-9][0-9][0-9]-[0-9][0-9]+).*$/u, '$1'); // eslint-disable-line prefer-named-capture-group
  nvdebug(` Compare '${key}' vs '${tagAndOccurrenceNumber}'`);
  return key === tagAndOccurrenceNumber;
}

// <= SUBFIELD, FIELD =>

export function fieldGetUnambiguousTag(field) {
  const tags = field.subfields.filter(sf => subfield6GetTag(sf));
  if (tags.length === 1) {
    nvdebug(`   GOT ${tags.length} tag(s): ${subfieldToString(tags[0])}`);
    return subfield6GetTag(tags[0]);
  }
  return undefined;
}

export function fieldGetUnambiguousOccurrenceNumber(field) {
  const occurrenceNumbers = field.subfields.filter(sf => subfield6GetOccurrenceNumber(sf));
  if (occurrenceNumbers.length === 1) {
    return subfield6GetOccurrenceNumber(occurrenceNumbers[0]);
  }
  return undefined;
}

export function fieldHasOccurrenceNumber(field, occurrenceNumber) {
  //nvdebug(`${occurrenceNumber} vs ${fieldToString(field)}`);
  return field.subfields && field.subfields.some(sf => subfield6GetOccurrenceNumber(sf) === occurrenceNumber);
}

export function fieldResetOccurrenceNumber(field, newOccurrenceNumber, oldOccurrenceNumber = undefined) {
  field.subfields.forEach(subfield => innerReset(subfield));

  function innerReset(subfield) {
    // (Optional) Check that this is really the occurrence number we wan't to reseot
    if (oldOccurrenceNumber !== undefined) {
      const currOccurrenceNumber = subfield6GetOccurrenceNumber(subfield);
      if (currOccurrenceNumber !== oldOccurrenceNumber) {
        return;
      }
    }
    subfield6ResetOccurrenceNumber(subfield, newOccurrenceNumber);
  }
}

export function intToOccurrenceNumberString(i) {
  return i < 10 ? `0${i}` : `${i}`;
}

function fieldGetMaxSubfield6OccurrenceNumberAsInteger(field) {
  //nvdebug(`Checking subfields $6 from ${JSON.stringify(field)}`);
  const sf6s = field.subfields ? field.subfields.filter(subfield => isValidSubfield6(subfield)) : [];
  if (sf6s.length === 0) {
    return 0;
  }
  // There should always be one, but here we check every subfield.
  //nvdebug(`Got ${field.subfields} $6-subfield(s) from ${JSON.stringify(field)}`, debug);
  const vals = sf6s.map(sf => subfield6GetOccurrenceNumberAsInteger(sf));
  return Math.max(...vals);
}


export function fieldHasWantedTagAndOccurrenceNumber(field, tagAndOccurrenceNumber) {
  return field.subfields && field.subfields.some(sf => subfield6HasWantedTagAndOccurrenceNumber(sf, tagAndOccurrenceNumber));
}


/*
export function getFieldsWithGivenOccurrenceNumberSubfield6(record, occurrenceNumberAsString) {
  const record.fields.filter(field => field

  function fieldHasIndex(field, index) {
    if (!field.subfields) {
      return false;
    }
    return field.subfields.find(sf => isValidSubfield6(sf) && subfieldGetOccurrenceNumber6(sf) === index);
  }
}
*/


export function fieldHasValidSubfield6(field) {
  return field.subfields && field.subfields.some(sf => isValidSubfield6(sf));
}


function isSubfield6Pair(field, otherField) {
  // No need to log this:
  //nvdebug(`LOOK for $6-pair:\n ${fieldToString(field)}\n ${fieldToString(otherField)}`);
  if (!fieldHasValidSubfield6(field) || !fieldHasValidSubfield6(otherField)) {
    return false;
  }

  if (!tagsArePairable6(field.tag, otherField.tag)) {
    //nvdebug(` FAILED. REASON: TAGS NOT PAIRABLE!`);
    return false;
  }


  const fieldIndex = fieldGetUnambiguousOccurrenceNumber(field);
  if (fieldIndex === undefined || fieldIndex === '00') {
    //nvdebug(` FAILED. REASON: NO INDEX FOUND`);
    return false;
  }

  const otherFieldIndex = fieldGetUnambiguousOccurrenceNumber(otherField);


  if (fieldIndex !== otherFieldIndex) {
    //nvdebug(` FAILURE: INDEXES: ${fieldIndex} vs ${otherFieldIndex}`);
    return false;
  }

  if (fieldGetUnambiguousTag(field) !== otherField.tag || field.tag !== fieldGetUnambiguousTag(otherField)) {
    //nvdebug(` FAILURE: TAG vs $6 TAG`);
    return false;
  }
  return true;

  function tagsArePairable6(tag1, tag2) {
    // How to do XOR operation in one line? Well, this is probably more readable...
    if (tag1 === '880' && tag2 === '880') {
      return false;
    }
    if (tag1 !== '880' && tag2 !== '880') {
      return false;
    }
    return true;
  }
}


function subfieldSevenToOneOccurrenceNumber(subfield) {
  if (subfield.code !== '6' || subfield.value.substring(0, 1) !== '7') {
    return;
  }
  subfield.value = `1${subfield.value.substring(1)}`; // eslint-disable-line functional/immutable-data
}

export function fieldSevenToOneOccurrenceNumber(field) {
  if (field.tag !== '880') {
    return;
  }
  field.subfields.forEach(sf => subfieldSevenToOneOccurrenceNumber(sf));
}


export function fieldGetOccurrenceNumberPairs(field, candFields) {
  // NB! TAG!=880 returns 880 fields, TAG==880 returns non-880 field
  //nvdebug(`  Trying to finds pair for ${fieldToString(field)} in ${candFields.length} fields`);
  const pairs = candFields.filter(otherField => isSubfield6Pair(field, otherField));
  if (pairs.length === 0) {
    nvdebug(`NO PAIRS FOUND FOR '${fieldToString(field)}'`);
    return pairs;
  }
  nvdebug(`${pairs.length} PAIR(S) FOUND FOR '${fieldToString(field)}'`);
  pairs.forEach(pairedField => nvdebug(`  '${fieldToString(pairedField)}'`));
  return pairs;
}

export function fieldGetOccurrenceNumbers(field) {
  /* eslint-disable */
  let occurrenceNumbers = [];
  field.subfields?.forEach(sf => subfieldExtractOccurrenceNumber(sf));

  function subfieldExtractOccurrenceNumber(sf) {
    if (!isValidSubfield6(sf)) {
      return;
    }
    const occurrenceNumber = subfield6GetOccurrenceNumber(sf);
    if (occurrenceNumber === '00' || occurrenceNumbers.includes(occurrenceNumber)) {
      return;
    }
    occurrenceNumbers.push(occurrenceNumber);
  }
  /* eslint-enable */
  return occurrenceNumbers;
}

export function fieldsGetOccurrenceNumbers(fields) {
  /* eslint-disable */
  let occurrenceNumbers = [];

  fields.forEach(f => fieldProcessOccurrenceNumbers(f));

  function fieldProcessOccurrenceNumbers(f) {
    const newOccurrenceNumbers = fieldGetOccurrenceNumbers(f);
    newOccurrenceNumbers.forEach(occurrenceNumber => {
      if (!occurrenceNumbers.includes(occurrenceNumber)) {
        occurrenceNumbers.push(occurrenceNumber);
      }

    });
  }
  /* eslint-enable */
  return occurrenceNumbers;
}

/*
export function fieldGetSubfield6Pair(field, record) {
  const pairedFields = record.fields.filter(otherField => isSubfield6Pair(field, otherField));
  if (pairedFields.length !== 1) {
    return undefined;
  }
  // NB! It is theoretically possible to have multiple pairable 880 fields (one for each encoding)
  nvdebug(`fieldGetSubfield6Pair(): ${fieldToString(field)} => ${fieldToString(pairedFields[0])}`);
  return pairedFields[0];
}
*/

/*
export function pairAndStringify6(field, record) {
  const pair6 = fieldGetSubfield6Pair(field, record);
  if (!pair6) {
    return fieldToNormalizedString(field);
  }
  return fieldsToNormalizedString([field, pair6]);
}
*/

// Frequencly list for $6 subfields in 1XX/7XX fields:
// 231115 100
// 183832 700
//  28773 710
//   2047 711
//    661 110
//    341 111
//    284 130
//     63 730
// Thus there's a real risk of ending up with, say, identical 100 vs 700 chains.
// Semi-hackily support 1XX/7XX-version: 7XX can be deleted if corresponding 1XX exists:

export function is7XX(tag) {
  return ['700', '710', '711', '730'].includes(tag);
}


function normalizeEntryTag(tag) {
  if (tag.match(/^[17](?:00|10|11|30)$/u)) {
    return `X${tag.substring(1)}`;
  }
  return tag;
}

function subfieldToNormalizedString(sf, tag, targetLinkingNumber = 0, normalizeOccurrenceNumber = false, normalizeEntryTagBoolean = false) {
  // targetLinkingNumber refers to $8.
  // normalizeEntryTagBoolean refers to 1XX/7XX tag values in subfield $6 value.
  if (isValidSubfield6(sf)) { // && targetLinkingNumber === 0) {
    // 1XX/7XX (entry tag) normalization:
    const tag2 = normalizeEntryTagBoolean ? normalizeEntryTag(tag) : tag;

    const occurrenceNumber = normalizeOccurrenceNumber ? 'XX' : subfield6GetOccurrenceNumber(sf);
    // If we are normalizing a $8 chain, don't normalize $6 occurrence number!
    // Replace $6 occurrence number with XX:
    return ` ‡${sf.code} ${tag2}-${occurrenceNumber}${subfield6GetTail(sf)}`;
  }

  if (isValidSubfield8(sf)) {
    const currLinkingNumber = getSubfield8LinkingNumber(sf); //getSubfield8Index(sf);
    if (targetLinkingNumber > 0 && currLinkingNumber === targetLinkingNumber) {
      // For $8 we should only XX the index we are looking at...
      const normVal = sf.value.replace(/^[0-9]+/u, 'XX');
      return ` ‡${sf.code} ${normVal}`;
    }
    return ''; // Other $8 subfields are meaningless in this context
  }
  return ` ${subfieldToString(sf)}`; // `‡${sf.code} ${sf.value}`;
}

export function fieldToNormalizedString(field, targetLinkingNumber = 0, normalizeOccurrenceNumber = false, normalizeEntryTagBoolean = false) {
  if ('subfields' in field) {
    const tag2 = normalizeEntryTagBoolean ? normalizeEntryTag(field.tag) : field.tag;
    return `${tag2} ${field.ind1}${field.ind2}${formatAndNormalizeSubfields(field)}`;
  }
  return `${field.tag}    ${field.value}`;

  function formatAndNormalizeSubfields(field) {
    return field.subfields.map(sf => subfieldToNormalizedString(sf, field.tag, targetLinkingNumber, normalizeOccurrenceNumber, normalizeEntryTagBoolean)).join('');
  }

}


function guessTargetLinkingNumber(fields, defaultTargetLinkingNumber) {
  if (defaultTargetLinkingNumber !== 0) {
    return defaultTargetLinkingNumber;
  }
  const linkingNumbers = fieldsGetAllSubfield8LinkingNumbers(fields);
  return linkingNumbers.length === 1 ? linkingNumbers[0] : 0; // eslint-disable-line no-param-reassign
}

export function fieldsToNormalizedString(fields, defaultTargetLinkingNumber = 0, normalizeOccurrenceNumber = false, normalizeEntryTag = false) {
  const targetLinkingNumber = guessTargetLinkingNumber(fields, defaultTargetLinkingNumber);

  nvdebug(`fieldsToNormalizedString: OCC: ${normalizeOccurrenceNumber}`);
  const strings = fields.map(field => fieldToNormalizedString(field, targetLinkingNumber, normalizeOccurrenceNumber, normalizeEntryTag));
  strings.sort(); // eslint-disable-line functional/immutable-data
  return strings.join('\t__SEPARATOR__\t');
}


/*

export function removeField6IfNeeded(field, record, fieldsAsString) {
  const pairField = fieldGetSubfield6Pair(field, record);
  const asString = pairField ? fieldsToNormalizedString([field, pairField]) : fieldToNormalizedString(field);
  nvdebug(`SOURCE: ${asString} -- REALITY: ${fieldToString(field)}`);
  const tmp = pairField ? fieldToString(pairField) : 'HUTI';
  nvdebug(`PAIR: ${tmp}`);
  nvdebug(`BASE:\n ${fieldsAsString.join('\n ')}`);
  if (!fieldsAsString.includes(asString)) {
    return;
  }
  nvdebug(`Duplicate $6 removal: ${fieldToString(field)}`);
  record.removeField(field);

  if (pairField === undefined) {
    return;
  }
  nvdebug(`Duplicate $6 removal (pair): ${fieldToString(pairField)}`);
  record.removeField(pairField);
}
*/

function getFirstField(record, fields) {
  const fieldsAsStrings = fields.map(field => fieldToString(field));
  //record.fields.forEach((field, i) => nvdebug(`${i}:\t${fieldToString(field)}`));
  //nvdebug(`getFirstField: ${fieldsAsStrings.join('\t')}`);
  const i = record.fields.findIndex(field => fieldsAsStrings.includes(fieldToString(field)));
  if (i > -1) {
    const field = record.fields[i];
    //nvdebug(`1st F: ${i + 1}/${record.fields.length} ${fieldToString(field)}`);
    return field;
  }
  return undefined;
}

function isRelevantSubfield6Chain(fields) {
  if (fields.length < 2) { // 1 non-880-field and 1+ 880 fields
    return false;
  }
  const non880 = fields.filter(f => f.tag !== '880');
  if (non880.length !== 1) {
    return false;
  }

  const linkingNumbers = fieldsGetAllSubfield8LinkingNumbers(fields);
  if (linkingNumbers.length !== 0) {
    return false;
  }

  return fields.every(f => fieldHasSubfield(f, '6'));
}

export function fieldIsFirstFieldInChain(field, chain, record) {
  // Interpretation of first: position of field in record (however, we might have a duplicate field. See tests...)
  const firstField = getFirstField(record, chain);
  if (firstField) {
    return fieldToString(field) === fieldToString(firstField);
  }
  return false;

}


export function getAllLinkedSubfield6Fields(field, record) {
  const fields = get6s(field, record);
  const moreFields = add8s(fields, record);

  // Currently we don't handle fields with more than one $6 and/or $8 subfield.
  if (moreFields.length > fields.length) {
    return []; // Don't fix!
  }
  return moreFields;
}

export function isFirstLinkedSubfield6Field(field, record) {
  if (!field.subfields) { // Is not a datafield
    return false;
  }
  const chain = getAllLinkedSubfield6Fields(field, record);
  if (!isRelevantSubfield6Chain(chain)) {
    nvdebug(`Rejected 6: ${fieldsToString(chain)}`);
    return false;
  }

  return fieldIsFirstFieldInChain(field, chain, record);
}

export function recordGetSubfield6ChainHeads(record) {
  return record.fields.filter(field => isFirstLinkedSubfield6Field(field, record));
}

export function recordGetMaxSubfield6OccurrenceNumberAsInteger(record) {
  // Should we cache the value here?
  const vals = record.fields.map((field) => fieldGetMaxSubfield6OccurrenceNumberAsInteger(field));
  return Math.max(...vals);
}


export function get6s(field, candidateFields) { // NB! Convert field to fields!!!
  // Get all fields with given occurence number
  const sixes = field.subfields.filter(sf => isValidSubfield6(sf));

  if (sixes.length === 0) {
    return [field];
  }
  nvdebug(`SIXES: ${sixes.length}`);
  const occurrenceNumbers = sixes.map(sf => subfield6GetOccurrenceNumber(sf)).filter(value => value !== undefined && value !== '00');
  nvdebug(occurrenceNumbers.join(' -- '));

  const relevantFields = candidateFields.filter(f => occurrenceNumbers.some(o => fieldHasOccurrenceNumber(f, o)));
  nvdebug(`${fieldToString(field)}: $6-RELFIELDS FOUND: ${relevantFields.length}...`);
  relevantFields.forEach(f => nvdebug(fieldToString(f)));
  return relevantFields;
}

