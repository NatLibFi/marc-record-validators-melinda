// import createDebugLogger from 'debug';
// const debug = createDebugLogger('@natlibfi/marc-record-validator-melinda/ending-punctuation');

const sf8Regexp = /^([1-9][0-9]*)(?:\.[0-9]+)?(?:\\[acprux])?$/u; // eslint-disable-line prefer-named-capture-group

export function isValidSubfield8(subfield) {
  if (subfield.code !== '8') {
    return false;
  }
  const match = subfield.value.match(sf8Regexp);
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
  function relevant4GFWS8I(field) {
    if (!field.subfields) {
      return false;
    }
    return field.subfields.some(sf => linkingNumber > 0 && getSubfield8LinkingNumber(sf) === linkingNumber);
  }
  return record.fields.filter(field => relevant4GFWS8I(field));

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
      if (linkingNumber > 0 && !subfield8LinkingNumbers.includes(linkingNumber)) {
        //nvdebug(`Add subfield \$8 ${linkingNumber} to seen values list`, debug);
        subfield8LinkingNumbers.push(index);
      }
    });
  });

  return subfield8LinkingNumbers;
  /* eslint-enable */
}

