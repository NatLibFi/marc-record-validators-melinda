//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldToString, isControlSubfieldCode, nvdebug} from './utils';

// Author(s): Nicholas Volk
export default function () {

  return {
    description: 'Normalize various dashes to "-"',
    validate, fix
  };

  function fix(record) {
    nvdebug(`FIX ME`);
    record.fields.forEach(field => {
      fixDashes(field);
    });

    const res = {message: [], fix: [], valid: true};
    return res;
  }

  function validate(record) {
    const res = {message: []};

    nvdebug(`VALIDATE ME`);
    record.fields?.forEach(field => {
      validateField(field, res);
    });

    res.valid = !(res.message.length >= 1);
    return res;
  }

  function validateField(field, res) {
    const orig = fieldToString(field);
    nvdebug(` VALIDATE FIELD '${orig}'`);

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

  nvdebug(`Dashing ${fieldToString(field)}`);

  field.subfields.forEach(sf => subfieldFixDashes(sf));

  return field;

  function subfieldFixDashes(subfield) {
    if (isControlSubfieldCode(subfield.code)) {
      return;
    }
    // Normalize dashes U+2010 ... U+2015 to '-':
    subfield.value = subfield.value.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/ug, '-');
  }

}
