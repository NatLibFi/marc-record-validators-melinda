// import createDebugLogger from 'debug';
// const debug = createDebugLogger('@natlibfi/marc-record-validator-melinda/subfield8Utils');

import {fieldToString, nvdebug} from './utils';

const sf8Regexp = /^([1-9][0-9]*)(?:\.[0-9]+)?(?:\\[acprux])?$/u; // eslint-disable-line prefer-named-capture-group

export function isValidSubfield8(subfield) {
  if (subfield.code !== '8') {
    return false;
  }

  //nvdebug(`   IS VALID $8? '${subfieldToString(subfield)}'`);
  const match = subfield.value.match(sf8Regexp);
  //nvdebug(`   IS VALID $8? '${subfieldToString(subfield)}' vs ${match.length}}`);
  return match && match.length > 0;
}

function getSubfield8Value(subfield) {
  if (!isValidSubfield8(subfield)) {
    return undefined;
  }
  return subfield.value;
}

export function getSubfield8LinkingNumber(subfield) {
  const value = getSubfield8Value(subfield);
  if (value === undefined) {
    return 0;
  }
  return parseInt(value, 10);
}


export function fieldHasLinkingNumber(field, linkingNumber) {
  if (!field.subfields) {
    return false;
  }
  return field.subfields.some(sf => getSubfield8LinkingNumber(sf) === linkingNumber);
}

export function recordGetFieldsWithSubfield8LinkingNumber(record, linkingNumber) {
  if (linkingNumber < 1) {
    return;
  }
  return record.fields.filter(field => fieldHasLinkingNumber(field, linkingNumber));
}


export function fieldsGetAllSubfield8LinkingNumbers(fields) {
  /* eslint-disable */
  let subfield8LinkingNumbers = [];
  fields.forEach(field => {
    if (!field.subfields) {
      return;
    }
    field.subfields.forEach(sf => {
      const linkingNumber = getSubfield8LinkingNumber(sf);
      if (linkingNumber > 0 && !subfield8LinkingNumbers.includes(linkingNumber)) {
        nvdebug(` LINK8: Add subfield \$8 ${linkingNumber} to seen values list`);
        subfield8LinkingNumbers.push(linkingNumber);
      }
    });
  });

  return subfield8LinkingNumbers;
  /* eslint-enable */

}

export function recordGetAllSubfield8LinkingNumbers(record) {
  return fieldsGetAllSubfield8LinkingNumbers(record.fields);
}


export function add8s(fields, record) {
  const linkingNumbers = fieldsGetAllSubfield8LinkingNumbers(fields);
  if (linkingNumbers.length === 0) {
    return fields;
  }

  nvdebug(`Linking number(s): ${linkingNumbers.join(', ')}`);
  linkingNumbers.forEach(number => collectLinkingNumberFields(number));

  fields.forEach(f => nvdebug(`AFTER ADDING 8s: '${fieldToString(f)}'`));

  return fields;

  function collectLinkingNumberFields(linkingNumber) {
    // Remove existing hits (to avoid field repetition):
    fields = fields.filter(f => !fieldHasLinkingNumber(f, linkingNumber)); // eslint-disable-line functional/immutable-data, no-param-reassign
    // Add them and their "sisters" back:
    const addableFields = record.fields.filter(f => fieldHasLinkingNumber(f, linkingNumber));
    addableFields.forEach(f => nvdebug(`(RE-?)ADD ${fieldToString(f)}`));
    fields = fields.concat(addableFields); // eslint-disable-line functional/immutable-data, no-param-reassign

  }
}

export function fieldHasValidSubfield8(field) {
  return field.subfields && field.subfields.some(sf => isValidSubfield8(sf));
}
