//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldToString} from './utils.js';

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

    res.valid = !(res.message.length >= 1);
    return res;
  }

  function validateField(field, res) {
    const orig = fieldToString(field);

    const normalizedField = fix505(clone(field));
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`'TODO: ${orig}' => '${mod}'`);
      return;
    }
    return;
  }
}


function field505FixSubfieldA(field) {
  const a = field.subfields.filter(sf => sf.code === 'a');

  a.forEach(sf => fixSubfieldA(sf));

  function fixSubfieldA(a) {
    a.value = a.value.replace(/ ; /ug, ' -- ');
  }
}

function field505FixSubfieldTRG(field) {
  // Modify subfield if next subfield is $t:
  const subfieldsThatWillBeModified = field.subfields.filter((sf, i) => i + 1 < field.subfields.length && field.subfields[i + 1].code === 't');

  subfieldsThatWillBeModified.forEach(sf => fixSubfieldThatPrecedesT(sf));

  function fixSubfieldThatPrecedesT(sf) {
    if (!sf.value) {
      return;
    }
    sf.value = sf.value.replace(/ ;$/u, ' --');
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
