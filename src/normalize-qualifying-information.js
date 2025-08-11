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

    res.valid = !(res.message.length >= 1);
    return res;
  }

  function validateField(field, res) {
    const orig = fieldToString(field);

    const normalizedField = clone(field);
    normalizeQualifyingInformationField(normalizedField);
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`'TODO: ${orig}' => '${mod}'`);
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
    sf.value = normalizeValue(sf.value);
  }

  function normalizeValue(val) {
    // Should we do English as well: "coil bound" and "comb-bound" => "spiral-bound" (as per MTS)?

    if (val.match(/^(?:hft|häftad)[.,]*$/iu)) { // MELINDA-8740
      return 'mjuka pärmar';
    }

    if (val.match(/^inb(?:\.|unden)[.,]*$/iu)) { // MELINDA-8740
      return 'hårda pärmar';
    }

    if (val === 'rengaskirja') { // https://www.kiwi.fi/display/melinda/Talonmies+tiedottaa+16.12.2021
      return 'kierreselkä';
    }

    if (val === 'ringpärm') { // https://www.kiwi.fi/display/melinda/Talonmies+tiedottaa+16.12.2021
      return 'spiralrygg';
    }

    if (val.match(/^nid(?:\.|ottu)[.,]*$/iu)) { // MELINDA-8740
      return 'pehmeäkantinen';
    }

    if (val.match(/^sid(?:\.|ottu)[.,]*$/iu)) { // MELINDA-8740
      return 'kovakantinen';
    }
    return val;
  }
}
