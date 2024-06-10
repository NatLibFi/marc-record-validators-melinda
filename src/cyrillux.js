//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldToString, fieldsToString, isControlSubfieldCode} from './utils';
import * as iso9 from 'iso9_1995';
import {intToOccurrenceNumberString, recordGetMaxSubfield6OccurrenceNumberAsInteger} from './subfield6Utils';

import XRegExp from 'xregexp';
import * as sfs4900 from 'sfs4900';
import {default as sortFields} from './sortFields';
import {default as reindexSubfield6OccurenceNumbers} from './reindexSubfield6OccurenceNumbers';

export default function (config = {}) {

  return {
    description: 'Cyrillux functionality: convert original field to latinitsa (ISO-9) and add 880s for original cyrillic and latinitsa (SFS-4900)',
    validate, fix
  };

  function preprocessConfig() {
    config.doISO9Transliteration = typeof config.doISO9Transliteration === 'undefined' ? true : config.doISO9Transliteration; // eslint-disable-line functional/immutable-data
    config.doSFS4900Transliteration = typeof config.doSFS4900Transliteration === 'undefined' ? true : config.doSFS4900Transliteration; // eslint-disable-line functional/immutable-data
  }

  function fix(record) {
    // Fix always succeeds
    const res = {message: [], fix: [], valid: true};

    preprocessConfig(config);

    const nBefore = record.fields.length;

    record.fields = processFields(record.fields); // eslint-disable-line functional/immutable-data

    if (nBefore < record.fields.length) { // eslint-disable-line functional/no-conditional-statements
      reindexSubfield6OccurenceNumbers().fix(record);
      sortFields().fix(record);
    }

    function processFields(input, output = []) {
      const [currField, ...remainingInput] = input;
      if (!currField) {
        return output;
      }

      const fakeRecord = {fields: output};
      const createdMax = recordGetMaxSubfield6OccurrenceNumberAsInteger(fakeRecord);
      const result = processField(currField, record, createdMax);

      return processFields(remainingInput, [...output, ...result]);
    }

    return res;
  }

  function validate(record) {
    const res = {message: [], valid: true};

    preprocessConfig(config);

    record.fields?.forEach(field => {
      validateField(field, res, record);
    });

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validateField(field, res, record) {
    const orig = fieldToString(field);

    const normalizedFields = processField(clone(field), record);
    const mod = fieldsToString(normalizedFields).replace(/\t__SEPARATOR__\t/ug, ', ').replace(/ (‡6 [0-9][0-9][0-9])-[0-9][0-9]+/gu, ' $1-NN'); // eslint-disable-line prefer-named-capture-group
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`CHANGE: ${orig} => ${mod}`); // eslint-disable-line functional/immutable-data
      return;
    }
    return;
  }

  function isCyrillicCharacter(char) {
    return XRegExp('[\\p{Cyrillic}]').test(char); // eslint-disable-line new-cap
  }

  function containsCyrillicCharacters(str) { // from melinda-ui-cyrillux
    if (!str) {
      return false;
    }
    return str.split('').some(isCyrillicCharacter);
  }

  function fieldContainsCyrillicCharacters(field) { // based on melinda-ui-cyrillux
    return field.subfields && field.subfields.some(sf => subfieldShouldTransliterateToIso9(sf));
  }

  function subfieldShouldTransliterateToIso9(subfield) {
    if (isControlSubfieldCode(subfield.code)) {
      return false;
    }
    return containsCyrillicCharacters(subfield.value);
  }

  function fieldShouldTransliterateToIso9(field) {
    // Skip certain tags ('880' is the actual skip-me beef here, but we have seen other no-nos as well)
    if (['336', '337', '338', '880'].includes(field.tag)) {
      return false;
    }
    // Skip control fields and fields that already have a translitteration
    if (!field.subfields || field.subfields.some(sf => sf.code === '6')) {
      return false;
    }
    return fieldContainsCyrillicCharacters(field);
  }

  function mapSubfieldToIso9(subfield) {
    const value = subfieldShouldTransliterateToIso9(subfield) ? iso9.convertToLatin(subfield.value) : subfield.value;
    return {code: subfield.code, value};
  }

  function mapSubfieldToSfs4900(subfield) {
    const value = subfieldShouldTransliterateToIso9(subfield) ? sfs4900.convertToLatin(subfield.value).result : subfield.value;
    return {code: subfield.code, value};
  }


  function mapFieldToIso9(field, occurrenceNumber) {
    const subfield6 = {code: '6', value: `880-${occurrenceNumber}`};
    const subfield9 = {code: '9', value: 'ISO9 <TRANS>'};

    const subfields = field.subfields.map(sf => mapSubfieldToIso9(sf));

    if (!config.doISO9Transliteration && !config.doSFS4900Transliteration) {
      // Just converts the field to ISO-9 latinitsa, does not create any field-880s, so don't bother with $6 or $9 either
      return {tag: field.tag, ind1: field.ind1, ind2: field.ind2, subfields};
    }

    return {tag: field.tag, ind1: field.ind1, ind2: field.ind2, subfields: [subfield6, ...subfields, subfield9]};
  }

  function mapFieldToCyrillicField880(field, occurrenceNumber) {
    const subfields = [
      {code: '6', value: `${field.tag}-${occurrenceNumber}`},
      ...field.subfields.map(sf => clone(sf)),
      {code: '9', value: 'CYRILLIC <TRANS>'}
    ];

    return {tag: '880', ind1: field.ind1, ind2: field.ind2, subfields};
  }

  function mapFieldToSfs4900Field880(field, occurrenceNumber) {

    const subfields = [
      {code: '6', value: `${field.tag}-${occurrenceNumber}`},
      ...field.subfields.map(sf => mapSubfieldToSfs4900(sf)),
      {code: '9', value: 'SFS4900 <TRANS>'}
    ];

    return {tag: '880', ind1: field.ind1, ind2: field.ind2, subfields};
  }

  function processField(originalField, record, maxCreatedOccurrenceNumber = 0) {
    if (!fieldShouldTransliterateToIso9(originalField)) {
      return [originalField];
    }
    const newOccurrenceNumberAsInt = maxCreatedOccurrenceNumber ? maxCreatedOccurrenceNumber + 1 : recordGetMaxSubfield6OccurrenceNumberAsInteger(record) + 1;
    const newOccurrenceNumberAsString = intToOccurrenceNumberString(newOccurrenceNumberAsInt);

    const newMainField = mapFieldToIso9(originalField, newOccurrenceNumberAsString); // ISO-9
    const newCyrillicField = config.doISO9Transliteration ? mapFieldToCyrillicField880(originalField, newOccurrenceNumberAsString) : undefined; // CYRILLIC
    const newSFS4900Field = config.doSFS4900Transliteration ? mapFieldToSfs4900Field880(originalField, newOccurrenceNumberAsString) : undefined; /// SFS-4900

    return [newMainField, newCyrillicField, newSFS4900Field].filter(f => f);
  }
}
