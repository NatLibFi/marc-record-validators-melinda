// import createDebugLogger from 'debug';
// const debug = createDebugLogger('@natlibfi/marc-record-validator-melinda/ending-punctuation');

// NB! Subfield 6 is non-repeatable and it should always comes first!
// NB! Index size should always be 2 (preceding 0 required for 01..09) However, support for 100+ was added on 2023-02-27.
// NB! Index value '00' are left as they are (is not paired/indexed/whatever.
const sf6Regexp = /^[0-9][0-9][0-9]-(?:[0-9][0-9]|[1-9][0-9]+)(?:[^0-9].*)?$/u;

export function nvdebug(message, func = undefined) {
  if (func) { // eslint-disable-line functional/no-conditional-statement
    func(message);
  }
  console.info(message); // eslint-disable-line no-console
  console.log(message); // eslint-disable-line no-console
}


export function isValidSubfield6(subfield) {
  if (subfield.code !== '6') {
    return false;
  }
  return subfield.value.match(sf6Regexp);
}

export function fieldHasValidSubfield6AndIsNoAnAlternateGraphicRepresentation(field) {
  // AlternateGraphicRepresentation is same as "field.tag === '880'""
  if (!field.subfields || field.tag === '880') {
    return false;
  }
  const sf6s = field.subfields.filter(sf => sf.code === '6' && sf.value.match(sf6Regexp));
  return sf6s.length === 1;
}

export function subfield6GetIndex(subfield) {
  if (isValidSubfield6(subfield)) {
    // Skip "TAG-" prefix. 2023-02-20: removed 2-digit requirement from here...
    return subfield.value.substring(4).replace(/\D.*$/u, '');
  }
  return undefined;
}

export function subfield6GetIndexAsInteger(subfield) {
  const index = subfield6GetIndex(subfield);
  if (index === undefined || index === '00') {
    return 0;
  }
  const result = parseInt(index, 10);
  //nvdebug(`SF6: ${subfield.value} => ${index} => ${result}`, debug);
  return result;
}

function subfield6GetTail(subfield) {
  if (isValidSubfield6(subfield)) {
    // Skip "TAG-" prefix. 2023-02-20: removed 2-digit requirement from here...
    return subfield.value.replace(/^\d+-\d+/u, '');
  }
  return '';
}

export function resetSubfield6OccurenceNumber(subfield, occurenceNumber) {
  if (!isValidSubfield6(subfield)) {
    return;
  }
  const occurenceNumberAsString = typeof occurenceNumber === 'number' ? intToOccurenceNumberString(occurenceNumber) : occurenceNumber;

  const newValue = subfield.value.substring(0, 4) + occurenceNumberAsString + subfield6GetTail(subfield); // eslint-disable-line functional/immutable-data
  //nvdebug(`Set subfield $6 value from ${subfieldToString(subfield)} to ${newValue}`);
  subfield.value = newValue; // eslint-disable-line functional/immutable-data
}

export function intToOccurenceNumberString(i) {
  return i < 10 ? `0${i}` : `${i}`;
}

export function recordGetMaxSubfield6Index(record) {
  // Should we cache the value here?
  const vals = record.fields.map((field) => fieldSubfield6Index(field));
  return Math.max(...vals);

  function fieldSubfield6Index(field) {
    //nvdebug(`Checking subfields $6 from ${JSON.stringify(field)}`);
    const sf6s = field.subfields ? field.subfields.filter(subfield => isValidSubfield6(subfield)) : [];
    if (sf6s.length === 0) {
      return 0;
    }
    // There should always be one, but here we check every subfield.
    //nvdebug(`Got ${field.subfields} $6-subfield(s) from ${JSON.stringify(field)}`, debug);
    const vals = sf6s.map(sf => subfield6GetIndexAsInteger(sf));
    return Math.max(...vals);
  }
}


/*
function fieldHasValidSubfield6(field) {
  return field.subfields && field.subfields.some(sf => isValidSubfield6(sf));
}

export function subfieldGetIndex6(subfield) {
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
export function subfieldGetIndex(subfield) {
  if (!isValidSubfield6(subfield)) {
    return undefined;
  }
  return subfield.value.substring(4, 6);
}
*/

/*
export function fieldGetIndex6(field) {
  if (!field.subfields) {
    return undefined;
  }
  // Subfield $6 should always be the 1st subfield... (not implemented)
  // There should be only one $6, so find is ok.
  const sf6 = field.subfields.find(subfield => isValidSubfield6(subfield));
  if (sf6 === undefined) {
    return undefined;
  }
  return subfieldGetIndex6(sf6);
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

export function isSubfield6Pair(field, otherField) {
  // No need to log this:
  if (!fieldHasValidSubfield6(field) || !fieldHasValidSubfield6(otherField)) {
    return false;
  }

  if (!tagsArePairable6(field.tag, otherField.tag)) {
    //nvdebug(` FAILED. REASON: TAGS NOT PAIRABLE!`);
    return false;
  }

  nvdebug(`LOOK for $6-pair:\n ${fieldToString(field)}\n ${fieldToString(otherField)}`, debug);

  const fieldIndex = fieldGetIndex6(field);
  if (fieldIndex === undefined || fieldIndex === '00') {
    nvdebug(` FAILED. REASON: NO INDEX FOUND`);
    return false;
  }

  const otherFieldIndex = fieldGetIndex6(otherField);

  if (fieldIndex !== otherFieldIndex) {
    nvdebug(` FAILURE: INDEXES: ${fieldIndex} vs ${otherFieldIndex}`);
    return false;
  }

  if (fieldGetTag6(field) !== otherField.tag || field.tag !== fieldGetTag6(otherField)) {
    nvdebug(` FAILURE: TAG vs $6 TAG`);
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

export function fieldGetSubfield6Pair(field, record) {
  const pairedFields = record.fields.filter(otherField => isSubfield6Pair(field, otherField));
  if (pairedFields.length !== 1) {
    return undefined;
  }
  nvdebug(`fieldGetSubfield6Pair(): ${fieldToString(field)} => ${fieldToString(pairedFields[0])}`);
  return pairedFields[0];
}


export function pairAndStringify6(field, record) {
  const pair6 = fieldGetSubfield6Pair(field, record);
  if (!pair6) {
    return fieldToNormalizedString(field);
  }
  return fieldsToNormalizedString([field, pair6]);
}


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


export function getFieldsWithSubfield6Index(record, index) {
  return record.fields.filter(field => fieldHasIndex(field, index));

  function fieldHasIndex(field, index) {
    if (!field.subfields) {
      return false;
    }
    return field.subfields.find(sf => isValidSubfield6(sf) && subfieldGetIndex6(sf) === index);
  }
}
*/
