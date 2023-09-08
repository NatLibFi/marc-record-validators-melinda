//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldToString} from './utils';

// Author(s): Nicholas Volk
export default function () {

  return {
    // Fixes MELINDA-8740
    description: 'Normalize qualifying information (020$q, 015$q, 024$q, 028$q)',
    validate, fix
  };

  function fix(record) {
    record.fields.forEach(field => {
      normalizeQualifyingInformationField(field);
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

    const normalizedField = clone(field);
    normalizeQualifyingInformationField(normalizedField);
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`'TODO: ${orig}' => '${mod}'`); // eslint-disable-line functional/immutable-data
      return;
    }
    return;
  }
}


function normalizeQualifyingInformationField(field) {
  if (!['015', '020', '024', '028'].includes(field.tag) || !field.subfields) {
    return;
  }

  field.subfields.forEach(sf => fixSubfield(sf));
  return;

  function fixSubfield(sf) {
    if (sf.code !== 'q') {
      return;
    }
    sf.value = normalizeValue(sf.value); // eslint-disable-line functional/immutable-data
  }

  function normalizeValue(val) {
    if (val.match(/^(?:hft|häftad)[.,]*$/iu)) {
      return 'mjuka pärmar';
    }

    if (val.match(/^inb(?:\.|unden)[.,]*$/iu)) {
      return 'hårda pärmar';
    }

    if (val.match(/^nid(?:\.|ottu)[.,]*$/iu)) {
      return 'pehmeäkantinen';
    }
    if (val.match(/^sid(?:\.|ottu)[.,]*$/iu)) {
      return 'kovakantinen';
    }
    return val;
  }
}
