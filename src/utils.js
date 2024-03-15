export function isElectronicMaterial(record) {
  const f337s = record.get('337');

  return f337s.length > 0 && f337s.some(f => fieldHasSubfield(f, 'b', 'c') && fieldHasSubfield(f, '2', 'rdamedia'));
}

export function nvdebug(message, func = undefined) {
  if (func) { // eslint-disable-line functional/no-conditional-statements
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

function normalizeIndicatorValue(val) {
  if (val === ' ') {
    return '#';
  }
  return val;
}

export function fieldToString(f) {
  if ('subfields' in f) {
    return `${f.tag} ${normalizeIndicatorValue(f.ind1)}${normalizeIndicatorValue(f.ind2)}${formatSubfields(f)}`;
  }
  return `${f.tag}    ${f.value}`;

  function formatSubfields(field) {
    return field.subfields.map(sf => ` ${subfieldToString(sf)}`).join('');
  }
}

export function fieldsToString(fields) {
  return fields.map(f => fieldToString(f)).join('\t__SEPARATOR__\t');
}

export function nvdebugFieldArray(fields, prefix = '  ', func = undefined) {
  fields.forEach(field => nvdebug(`${prefix}${fieldToString(field)}`, func));
}

export function isControlSubfieldCode(subfieldCode) {
  if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'w'].includes(subfieldCode)) {
    return true;
  }
  return false;
}

export function getCatalogingLanguage(record, defaultCatalogingLanguage = undefined) {
  const [field040] = record.get(/^040$/u);
  if (!field040) {
    return defaultCatalogingLanguage;
  }
  const [b] = field040.subfields.filter(sf => sf.code === 'b');
  if (!b) {
    return defaultCatalogingLanguage;
  }
  return b.value;
}


export function uniqArray(arr) {
  return arr.filter((val, i) => arr.indexOf(val) === i);
}
