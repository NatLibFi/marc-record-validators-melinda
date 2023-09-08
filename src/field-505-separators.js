//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldToString} from './utils';

// Author(s): Nicholas Volk
export default function () {

  return {
    description: 'Normalize " ; " separators as " -- "',
    validate, fix
  };

  function fix(record) {
    record.fields.forEach(field => {
      fix505(field);
    });

    const res = {message: [], fix: [], valid: true};
    return res;
  }

  function validate(record) {
    const res = {message: []};

    record.fields?.forEach(field => {
      validateField(field, res);
    });

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validateField(field, res) {
    const orig = fieldToString(field);

    const normalizedField = fix505(clone(field));
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`'TODO: ${orig}' => '${mod}'`); // eslint-disable-line functional/immutable-data
      return;
    }
    return;
  }
}


function field505FixSubfieldA(field) {
  const a = field.subfields.filter(sf => sf.code === 'a');

  a.forEach(sf => fixSubfieldA(sf));

  function fixSubfieldA(a) {
    a.value = a.value.replace(/ ; /ug, ' -- '); // eslint-disable-line functional/immutable-data
  }
}

function field505FixSubfieldTRG(field) {
  // Modify subfield if next subfield is $t:
  const subfieldsThatWillBeModified = field.subfields.filter((sf, i) => i + 1 < field.subfields.length && field.subfields[i + 1].code === 't');

  subfieldsThatWillBeModified.forEach(sf => fixSubfieldThatPrecedesT(sf));

  function fixSubfieldThatPrecedesT(sf) {
    sf.value = sf.value.replace(/ ;$/u, ' --'); // eslint-disable-line functional/immutable-data
  }
}

function fix505(field) {
  if (field.tag !== '505' || !field.subfields) {
    return field;
  }
  field505FixSubfieldTRG(field);
  field505FixSubfieldA(field);
  return field;
}
