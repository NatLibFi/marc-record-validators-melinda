import clone from 'clone';
import {fieldToString, isContentSubfieldCode, nvdebug} from './utils.js';

import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:normaliza-dashes');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');


// Author(s): Nicholas Volk
export default function () {

  return {
    description: 'Normalize various dashes to "-"',
    validate, fix
  };

  function fix(record) {
    nvdebug(`FIX ME`, debugDev);
    record.fields.forEach(field => {
      fixDashes(field);
    });

    const res = {message: [], fix: [], valid: true};
    return res;
  }

  function validate(record) {
    const res = {message: []};

    nvdebug(`VALIDATE ME`, debugDev);
    record.fields?.forEach(field => {
      validateField(field, res);
    });

    res.valid = !(res.message.length >= 1);
    return res;
  }

  function validateField(field, res) {
    const orig = fieldToString(field);
    nvdebug(` VALIDATE FIELD '${orig}'`, debugDev);

    const normalizedField = fixDashes(clone(field));
    const mod = fieldToString(normalizedField);
    if (orig === mod) { // Fail as the input is "broken"/"crap"/sumthing
      return;
    }
    res.message.push(`'TODO: ${orig}' => '${mod}'`);
    return;
  }
}


function fixDashes(field) {
  if (!field.subfields) {
    return field;
  }

  nvdebug(`Dashing ${fieldToString(field)}`, debugDev);

  field.subfields.forEach(sf => subfieldFixDashes(sf));

  return field;

  function subfieldFixDashes(subfield) {
    if (!isContentSubfieldCode(subfield.code, field.tag)) {
      return;
    }
    // Normalize dashes U+2010 ... U+2015 to '-':
    subfield.value = subfield.value.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/ug, '-');
  }

}
