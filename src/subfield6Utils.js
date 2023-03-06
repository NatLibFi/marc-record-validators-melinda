// import createDebugLogger from 'debug';
// const debug = createDebugLogger('@natlibfi/marc-record-validator-melinda/ending-punctuation');

// NB! Subfield 6 is non-repeatable and it should always comes first!
// NB! Index size should always be 2 (preceding 0 required for 01..09) However, support for 100+ was added on 2023-02-27.
// NB! Index value '00' are left as they are (is not paired/indexed/whatever.
const sf6Regexp = /^[0-9][0-9][0-9]-(?:[0-9][0-9]|[1-9][0-9]+)(?:[^0-9].*)?$/u;

// generic utils that could/should be relocated:

export function nvdebug(message, func = undefined) {
  if (func) { // eslint-disable-line functional/no-conditional-statement
    func(message);
  }
  //console.info(message); // eslint-disable-line no-console
}

export function fieldHasSubfield(field, subfieldCode, subfieldValue = null) {
  if (!field.subfields) {
    return false;
  }
  if (subfieldValue === null) {
    return field.subfields.some(sf => sf.code === subfieldCode);
  }
  return field.subfields.some(sf => sf.code === subfieldCode && subfieldValue === sf.value);
}

export function subfieldToString(sf) {
  return `‡${sf.code} ${sf.value}`;
}
export function fieldToString(f) {
  if ('subfields' in f) {
    return `${f.tag} ${f.ind1}${f.ind2}${formatSubfields(f)}`;
  }
  return `${f.tag}    ${f.value}`;

  function formatSubfields(field) {
    return field.subfields.map(sf => ` ${subfieldToString(sf)}`).join('');
  }
}


// SF $6 specific utils:


export function isValidSubfield6(subfield) {
  if (subfield.code !== '6') {
    return false;
  }
  return subfield.value.match(sf6Regexp);
}

export function subfield6GetTag(subfield) {
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

export function resetSubfield6OccurrenceNumber(subfield, occurrenceNumber) {
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

// <= SUBFIELD, FIELD =>

/*
export function fieldHasValidSubfield6AndIsNotAnAlternateGraphicRepresentation(field) {
  // AlternateGraphicRepresentation is same as "field.tag === '880'""
  if (!field.subfields || field.tag === '880') {
    return false;
  }
  const sf6s = field.subfields.filter(sf => sf.code === '6' && sf.value.match(sf6Regexp));
  return sf6s.length === 1;
}
*/

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
  return field.subfields && field.subfields.some(subfield6GetOccurrenceNumber) === occurrenceNumber;
}

export function resetFieldOccurrenceNumber(field, newOccurrenceNumber, oldOccurrenceNumber = undefined) {
  field.subfields.forEach(subfield => innerReset(subfield));

  function innerReset(subfield) {
    // (Optional) Check that this is really the occurrence number we wan't to reseot
    if (oldOccurrenceNumber !== undefined) {
      const currOccurrenceNumber = subfield6GetOccurrenceNumber(subfield);
      if (currOccurrenceNumber !== oldOccurrenceNumber) {
        return;
      }
    }
    resetSubfield6OccurrenceNumber(subfield, newOccurrenceNumber);
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


export function recordGetMaxSubfield6OccurrenceNumberAsInteger(record) {
  // Should we cache the value here?
  const vals = record.fields.map((field) => fieldGetMaxSubfield6OccurrenceNumberAsInteger(field));
  return Math.max(...vals);
}

export function hasWantedTagAndOccurrenceNumber(subfield, tagAndOccurrenceNumber) {
  if (subfield.code !== '6') {
    return false;
  }
  // We could also use generic code and go getTag()+'-'+getIndex() instead of regexp...
  const key = subfield.value.replace(/^([0-9][0-9][0-9]-[0-9][0-9]+).*$/u, '$1'); // eslint-disable-line prefer-named-capture-group
  nvdebug(` Compare '${key}' vs '${tagAndOccurrenceNumber}'`);
  return key === tagAndOccurrenceNumber;
}


export function fieldHasWantedTagAndOccurrenceNumber(field, tagAndOccurrenceNumber) {
  return field.subfields && field.subfields.some(sf => hasWantedTagAndOccurrenceNumber(sf, tagAndOccurrenceNumber));
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


function fieldHasValidSubfield6(field) {
  return field.subfields && field.subfields.some(sf => isValidSubfield6(sf));
}


/*

export function subfieldGetOccurrenceNumber6(subfield) {
  if (isValidSubfield6(subfield)) {
    // Skip "TAG-" prefix. 2023-02-20: removed 2-digit requirement from here...
    return subfield.value.substring(4).replace(/\D.*$/u, '');
  }
  return undefined;
}

function subfieldGetTag6(subfield) {
  if (isValidSubfield6(subfield)) {
    return subfield.value.substring(0, 3);
  }
  return undefined;
}


export function resetSubfield6Tag(subfield, tag) {
  if (!isValidSubfield6(subfield)) {
    return;
  }
  // NB! mainly for 1XX<->7XX transfers
  const newValue = `${tag}-${subfield.value.substring(4)}`;
  nvdebug(`Set subfield $6 value from ${subfieldToString(subfield)} to ${newValue}`);
  subfield.value = newValue; // eslint-disable-line functional/immutable-data
}


*/


/*
export function fieldGetOccurrenceNumber6(field) {
  if (!field.subfields) {
    return undefined;
  }
  // Subfield $6 should always be the 1st subfield... (not implemented)
  // There should be only one $6, so find is ok.
  const sf6 = field.subfields.find(subfield => isValidSubfield6(subfield));
  if (sf6 === undefined) {
    return undefined;
  }
  return subfieldGetOccurrenceNumber6(sf6);
}

function fieldGetTag6(field) {
  if (!field.subfields) {
    return undefined;
  }
  // Subfield $6 should always be the 1st subfield... (not implemented)
  // There should be only one $6, so find is ok.
  const sf6 = field.subfields.find(subfield => isValidSubfield6(subfield));
  if (sf6 === undefined) {
    return undefined;
  }
  return subfieldGetTag6(sf6);
}

*/

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

/*
export function fieldToNormalizedString(field, currIndex = 0) {
  function subfieldToNormalizedString(sf) {
    if (isValidSubfield6(sf)) {
      // Replace index with XX:
      return `‡${sf.code} ${sf.value.substring(0, 3)}-XX${getSubfield6Tail(sf)}`;
    }
    if (isValidSubfield8(sf)) {
      const index8 = getSubfield8Index(sf);
      if (currIndex === 0 || currIndex === index8) {
        // For $8 we should only XX the index we are looking at...
        const normVal = sf.value.replace(/^[0-9]+/u, 'XX');
        return `‡${sf.code} ${normVal}`;
      }
      return ''; // Other $8 subfields are meaningless in this context
    }
    return `‡${sf.code} ${sf.value}`;
  }

  if ('subfields' in field) {
    return `${field.tag} ${field.ind1}${field.ind2}${formatAndNormalizeSubfields(field)}`;
  }
  return `${field.tag}    ${field.value}`;

  function formatAndNormalizeSubfields(field) {
    return field.subfields.map(sf => `${subfieldToNormalizedString(sf)}`).join('');
  }
}

export function fieldsToNormalizedString(fields, index = 0) {
  const strings = fields.map(field => fieldToNormalizedString(field, index));
  strings.sort(); // eslint-disable-line functional/immutable-data
  return strings.join('\t__SEPARATOR__\t');
}


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
