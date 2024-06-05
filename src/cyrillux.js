//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldToString, fieldsToString, isControlSubfieldCode} from './utils';
import * as iso9 from 'iso9_1995';
import { intToOccurrenceNumberString, recordGetMaxSubfield6OccurrenceNumberAsInteger } from './subfield6Utils';

export default function(config) {

  /*
  const exampleConfig = {
    doISO9Transliteration: true,
    doSFS4900Transliteration: true
  };
  */

  return {
    description: 'Cyrillux functionality: detect cyrillic fields, convert field to 880 and convert original content to ISO-9 latinitsa',
    validate, fix
  };

  function preprocessConfig() {
    config.doISO9Transliteration = typeof(config.doISO9Transliteration) === 'undefined' ? true : config.doISO9Transliteration;
    config.doSFS4900Transliteration = typeof(config.doSFS4900Transliteration) === 'undefined' ? true : config.doSFS4900Transliteration;
  }

  function configIsValid() {
    return config.doISO9Transliteration || config.doSFS4900Transliteration;
  }



  function fix(record) {
    // Fix always succeeds
    const res = {message: [], fix: [], valid: true};

    preprocessConfig(config);
    if (!configIsValid(config)) { // Nothing goes to 880
      return res;
    }
    record.fields.forEach(field => {
      processField(field, record);
    });

    return res;
  }

  function validate(record) {
    const res = {message: [], valid: true};

    preprocessConfig(config);
    if (!configIsValid(config)) { // Nothing goes to 880
      return res;
    }

    record.fields?.forEach(field => {
      validateField(field, res, record);
    });

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validateField(field, res, record) {
    const orig = fieldToString(field);

    const normalizedFields = processField(clone(field), record);
    const mod = fieldsToString(normalizedFields);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`'TODO: ${orig}' => '${mod}`); // eslint-disable-line functional/immutable-data
      return;
    }
    return;
  }

  function isCyrillicCharacter(char) {
    return XRegExp('[\\p{Cyrillic}]').test(char);
  }

  function containsCyrillicCharacters(str) { // from melinda-ui-cyrillux
    if (!str) {
      return false;
    }
    return str.split('').some(isCyrillicCharacter);
  }

  function fieldContainsCyrillicCharacters(field) { // based on melinda-ui-cyrillux
    return field.subfields && field.subfields.some(sf => subfieldShouldTranslateToIso9(sf));
  }

  function subfieldShouldTranslateToIso9(subfield) {
    if (isControlSubfieldCode(subfield.code)) {
      return false;
    }
    return containsCyrillicCharacters(subfield.value);
  }

  function fieldShouldTranslitetateToIso9(field) {
    // Skip certain tags ('880' is the actual skip-me beef here, but we have seen other no-nos as well)
    if (['336', '337', '338', '880']) {
      return false;
    }
    // Skip control fields and fields that already have a translitteration
    if (!field.subfields || field.subfield.some(sf => sf.code === '6')) {
      return false;
    }
    return fieldContainsCyrillicCharacters(field);
  }

  function convertSubfieldToIso9(subfield) {
    // NEW! We want to skip some subfields:
    if (!fieldShouldTranslitetateToIso9(subfield)) {
      return;
    }
    subfield.value = iso9.convertToLatin(subfield.value);
  }

  function convertFieldToIso9(field, occurrenceNumber) {
    const subfield6 = { code: '6', value: `880-${occurrenceNumber}`};
    const subfield9 = { code: '9', value: 'ISO9 <TRANS>'};

    field.subfields.forEach(sf => convertSubfieldToIso9(sf));
    field.subfields = [subfield6, ...field.subfields, subfield9];
  }

  function convertFieldToCyrillicField880(field, occurrenceNumber) {
    const subfields = [
      {code: '6', value: `${field.tag}-${occurrenceNumber}`},
      ...field.subfields,
      {code: '9', value: 'CYRILLIC <TRANS>'}
    ];

    field.subfields = subfields; // eslint-disable-line immutable-data
    field.tag = '880'; // eslint-disable-line immutable-data
  }

  function convertFieldToSfs4900Field880(field, occurrenceNumber) {
    field.subfields.forEach(sf => convertSubfieldToSfs4900(sf));

    const subfields = [
      {code: '6', value: `${field.tag}-${occurrenceNumber}`},
      ...field.subfields,
      {code: '9', value: 'CYRILLIC <TRANS>'}
    ];

    field.subfields = subfields; // eslint-disable-line immutable-data
    field.tag = '880'; // eslint-disable-line immutable-data
  }



  function processField(originalField, record) {
    if (!fieldShouldTranslitetateToIso9(originalField)) {
      return [originalField];
    }
    const newOccurrenceNumberAsInt = recordGetMaxSubfield6OccurrenceNumberAsInteger(record) + 1;
    const newOccurrenceNumberAsString = intToOccurrenceNumberString(newOccurrenceNumberAsInt);

    const newMainField = convertFieldToIso9(clone(originalField), newOccurrenceNumberAsString); // ISO-9
    const newCyrillicField = config.doISO9Transliteration ? convertFieldToCyrillicField880(clone(originalField), newOccurrenceNumberAsString) : null; // CYRILLIC
    const newSFS4900Field =  config.doSFS4900Transliteration ? convertFieldToSfs4900Field880(clone(originalField), newOccurrenceNumberAsString) : null; /// SFS-4900

    return [newMainField, newCyrillicField, newSFS4900Field].filter(f => f);
  }
}