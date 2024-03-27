import clone from 'clone';
import {fieldToString} from './utils';
// Fix language codes in 008/35-37 and 041 (does not sync them)
//
// Author(s): Nicholas Volk

//import createDebugLogger from 'debug';
//import {fieldToString, nvdebug} from './utils';

const description = 'Fix language codes';

export default function () {

  return {description, validate, fix};

  function fix(record) {
    //nvdebug(`FIX ME`);
    const res = {message: [], fix: [], valid: true};

    const [field008] = record.get('008');
    if (!field008) {
      return res;
    }

    fixLanguageField008(field008);

    const f041 = record.get('041');
    f041.forEach(f => fixField041(f));

    return res;
  }


  function validate(record) {
    const res = {message: [], valid: true};

    validateField008(record, res);

    const f041 = record.get('041');
    f041.forEach(f => validateField041(f, res));

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validateField008(record, res) {
    const [field008] = record.get('008');

    if (!field008) {
      return;
    }

    const originalLanguage = getLanguageFromField008(field008);
    const modifiedLanguage = deprecatedLanguageToCurrentLanguage(originalLanguage);
    if (originalLanguage === modifiedLanguage) {
      return;
    }

    res.message.push(`Modify 008/35-37: '${originalLanguage}' => '${modifiedLanguage}'`); // eslint-disable-line functional/immutable-data
    res.valid = false; // eslint-disable-line functional/immutable-data
  }


  function isRelevantField041SubfieldCode(subfield) {
    return 'abdefghijkmnpqrt'.includes(subfield.code);
  }


  function validateField041(field, res) {

    const clonedField = clone(field);
    fixField041(clonedField);

    const originalString = fieldToString(field);
    const modifiedString = fieldToString(clonedField);

    if (originalString === modifiedString) {
      return;
    }
    const msg = `${originalString} => ${modifiedString}`;
    res.message.push(msg); // eslint-disable-line functional/immutable-data

  }


  function fixLanguageField008(field008) {
    const originalLanguage = getLanguageFromField008(field008);
    const modifiedLanguage = deprecatedLanguageToCurrentLanguage(originalLanguage);
    if (originalLanguage !== modifiedLanguage && modifiedLanguage.length === 3) {
      field008.value = `${field008.value.substring(0, 35)}${modifiedLanguage}${field008.value.substring(38)}`; // eslint-disable-line functional/immutable-data
      return;
    }
  }

  function fixField041(field) {
    if (field.subfields.some(sf => sf.code === '2')) {
      return;
    }

    field.subfields.forEach(sf => fixField041Subfield(sf));

    function fixField041Subfield(subfield) {
      if (!isRelevantField041SubfieldCode(subfield)) {
        return;
      }
      subfield.value = deprecatedLanguageToCurrentLanguage(subfield.value); // eslint-disable-line functional/immutable-data
    }
  }

  function getLanguageFromField008(field) {
    return field.value.substring(35, 38); // return 008/35-37
  }

  function deprecatedLanguageToCurrentLanguage(language) {
    if (language === 'nno' || language === 'nob') { // Nynorsk ja bokmål
      return 'nor'; // Norwegian
    }
    return language;
  }

}
