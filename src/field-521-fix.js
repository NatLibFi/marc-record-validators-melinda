//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldToString} from './utils';

// Author(s): Nicholas Volk
export default function () {

  return {
    description: 'Various fixes for field 521',
    validate, fix
  };

  function fix(record) {
    record.fields.forEach(field => {
      fix521(field);
    });
    // Fix always succeeds (even when it really does not):
    const res = {message: [], fix: [], valid: true};
    return res;
  }

  function validate(record) {
    const res = {message: []};

    // Actual parsing of all fields
    /*
    if (!record.fields) {
      return false;
    }
    */

    record.fields?.forEach(field => {
      validateField(field, res);
    });

    res.valid = !(res.message.length >= 1);
    return res;
  }

  function validateField(field, res) {
    const orig = fieldToString(field);

    const normalizedField = fix521(clone(field));
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`'TODO: ${orig}' => '${mod}'`);
      return;
    }
    return;
  }
}

function fixSubfieldA(a) {
  a.value = a.value.
    // MET-332:
    replace(/^(Ikäsuositus) ([0-9])/u, '$1: $2');
}

function fixSubfieldAInternalPunctuation(field) {
  const a = field.subfields.filter(sf => sf.code === 'a');

  a.forEach(sf => fixSubfieldA(sf)); // eslint-disable-line array-callback-return
}

function getIndicator1(field) {
  const [a] = field.subfields.filter(sf => sf.code === 'a');
  if (a) {
    if (a.value.match(/^Ikäsuositus/u)) {
      return '1';
    }
  }
  return undefined;
}

function fixIndicator1(field) {
  const value = getIndicator1(field);
  if (value) {
    field.ind1 = value;
    return;
  }

}

function fix521(field) {
  if (field.tag !== '521' || !field.subfields) {
    return field;
  }
  fixIndicator1(field);
  fixSubfieldAInternalPunctuation(field);
  return field;
}

