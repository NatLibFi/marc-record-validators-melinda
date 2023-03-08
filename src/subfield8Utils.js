// import createDebugLogger from 'debug';
// const debug = createDebugLogger('@natlibfi/marc-record-validator-melinda/ending-punctuation');

import {nvdebug, subfieldToString} from './utils';

const sf8Regexp = /^([1-9][0-9]*)(?:\.[0-9]+)?(?:\\[acprux])?$/u; // eslint-disable-line prefer-named-capture-group

export function isValidSubfield8(subfield) {
  if (subfield.code !== '8') {
    return false;
  }

  nvdebug(`   IS VALID $8? '${subfieldToString(subfield)}'`);
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


export function recordGetFieldsWithSubfield8LinkingNumber(record, linkingNumber) {
  if (linkingNumber < 1) {
    return;
  }
  return record.fields.filter(field => relevant4GFWS8I(field));

  function relevant4GFWS8I(field) {
    if (!field.subfields) {
      return false;
    }
    return field.subfields.some(sf => getSubfield8LinkingNumber(sf) === linkingNumber);
  }
}


export function recordGetAllSubfield8LinkingNumbers(record) {
  /* eslint-disable */
  let subfield8LinkingNumbers = [];
  record.fields.forEach(field => {
    if (!field.subfields) {
      return;
    }
    field.subfields.forEach(sf => {
      const linkingNumber = getSubfield8LinkingNumber(sf);
      nvdebug(`WP50: ${linkingNumber} vs '${subfieldToString(sf)}`);
      if (linkingNumber > 0 && !subfield8LinkingNumbers.includes(linkingNumber)) {
        nvdebug(` LINK8: Add subfield \$8 ${linkingNumber} to seen values list`);
        subfield8LinkingNumbers.push(linkingNumber);
      }
    });
  });

  return subfield8LinkingNumbers;
  /* eslint-enable */
}
