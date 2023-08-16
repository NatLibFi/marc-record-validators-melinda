//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldToString} from './utils';


// Author(s): Nicholas Volk
export default function () {

  return {
    description: 'Fix various subfield internal values',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};

    record.fields.forEach(field => {
      normalizeSubfieldValues(field);
    });

    // message.valid = !(message.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validate(record) {
    const res = {message: []};

    record.fields.forEach(field => {
      validateField(field, res);
    });

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validateField(field, res) {
    if (!field.subfields) {
      return;
    }
    const orig = fieldToString(field);

    const normalizedField = normalizeSubfieldValues(clone(field));
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`'${orig}' requires subfield internal mods/normalization`); // eslint-disable-line functional/immutable-data
      return;
    }
    return;
  }
}

function getNormalizedValue(subfield, field) {
  if (field.ind1 === '1' && subfield.code === 'a' && ['100', '600', '700', '800'].includes(field.tag)) {
    // Fix MRA-267/273 (partial):
    // Proof-of-concept: Handle the most common case(s). (And extend them rules later on if the need arises):
    if (field.subfields.every(sf => sf.code !== '0')) {
      return subfield.value.replace(/, ([A-Z]|Å|Ö|Ö)\.([A-Z]|Å|Ö|Ö)\.(,?)$/u, ', $1. $2.$3'); // eslint-disable-line prefer-named-capture-group
    }
  }

  if (subfield.code === 'a' && ['130', '630', '730'].includes(field.tag)) {
    // MRA-614: "(elokuva, 2000)" => "(elokuva : 2000)""
    return subfield.value.replace(/\((elokuva), (19[0-9][0-9]|20[0-2][0-9])\)/u, '($1 : $2)'); // eslint-disable-line prefer-named-capture-group
  }
  return subfield.value;
}

function normalizeSubfieldValues(field) {
  if (!field.subfields) {
    return field;
  }
  field.subfields.forEach((subfield, index) => {
    field.subfields[index].value = getNormalizedValue(subfield, field); // eslint-disable-line functional/immutable-data
  });
  return field;
}
