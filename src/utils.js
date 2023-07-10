export function isElectronicMaterial(record) {
  const f337s = record.get('337');

  return f337s.some(field => {
    const mediaTypeIsC = field.subfields.some(sub => sub.code === 'b' && sub.value === 'c');
    const sourceIsRdamedia = field.subfields.some(sub => sub.code === '2' && sub.value === 'rdamedia');
    return mediaTypeIsC && sourceIsRdamedia;
  });
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
