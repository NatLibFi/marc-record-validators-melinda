//import createDebugLogger from 'debug';
import {fieldToString} from './utils';
import clone from 'clone';

//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/sanitize-vocabulary-source-codes);

// Author(s): Nicholas Volk, Joni Ollila
export default function () {

  return {
    description: 'Validator for updating mismatching f007 based on f300 (DVD/Bluray) (MRA-613)',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};
    record.fields.forEach(f => fixField(f, record)); // eslint-disable-line array-callback-return
    return res;
  }

  function validate(record) {
    const res = {message: []};

    record.fields.forEach(field => {
      validateField(field, res, record);
    });

    res.valid = !(res.message.length >= 1);
    return res;
  }

  function validateField(field, res, record) {
    if (field.tag !== '007') {
      return;
    }
    const orig = fieldToString(field);

    const normalizedField = fixField(clone(field), record);
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`FIXABLE: '${orig}' => '${mod}'`);
      return;
    }

    /*
    if (fieldHasUnfixableStuff(field)) {
      res.message.push(`CAN'T BE FIXED AUTOMATICALLY: '${orig}'`);
      return;
    }
    */
    return;
  }

  function fieldIsBluray007(field) {
    if (field.tag !== '007') {
      return false;
    }
    return field.value.match(/^v...s/u);
  }

  function fieldIsDvd007(field) {
    if (field.tag !== '007') {
      return false;
    }
    return field.value.match(/^v...v/u);
  }

  function fieldIsBluray300(field) {
    if (field.tag !== '300') {
      return false;
    }
    return field.subfields.some(subfield => subfield.value.match(/(?:Blu.?ray|BD)/ui));
  }

  function fieldIsDvd300(field) {
    if (field.tag !== '300') {
      return false;
    }
    return field.subfields.some(subfield => subfield.value.match(/DVD/ui));
  }

  function recordHasBluray300(record) {
    return record.fields.some(f => fieldIsBluray300(f));
  }

  function recordHasDvd300(record) {
    return record.fields.some(f => fieldIsDvd300(f));
  }

  function convert007BlurayToDvd(field) {
    if (!fieldIsBluray007(field)) {
      return;
    }
    //field.value = field.value.substring(0, 4) + 's' + field.value.substring(5);
    //field.value = field.value.replace(/^(?:v...)s/u, `${1}v`); // eslint-disable-line functional/immutable-data, no-template-curly-in-string
    field.value = `${field.value.substring(0, 4)}v${field.value.substring(5)}`;
  }

  function convert007DvdToBluray(field) {
    if (!fieldIsDvd007(field)) {
      return;
    }
    //field.value = field.value.replace(/^(?:v...)v/u, `${1}s`);
    field.value = `${field.value.substring(0, 4)}s${field.value.substring(5)}`;
  }

  function fixField(field, record) {
    if (field.tag !== '007') {
      return field;
    }

    if (fieldIsDvd007(field) && recordHasBluray300(record) && !recordHasDvd300(record)) {
      // FIX 007: DVD -> Blu-ray
      convert007DvdToBluray(field);
      return field;
    }

    if (fieldIsBluray007(field) && recordHasDvd300(record) && !recordHasBluray300(record)) {
      // FIX 007: Blu-Ray -> DVD
      convert007BlurayToDvd(field);
      return field;
    }

    return field;
  }

}
