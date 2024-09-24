//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldHasSubfield, fieldToString, fieldsToString, isControlSubfieldCode, nvdebug} from './utils';
import * as iso9 from 'iso9_1995';
import {fieldGetMaxSubfield6OccurrenceNumberAsInteger, fieldGetOccurrenceNumberPairs, intToOccurrenceNumberString, recordGetMaxSubfield6OccurrenceNumberAsInteger, resetSubfield6Tag} from './subfield6Utils';

import XRegExp from 'xregexp';
import * as sfs4900 from 'sfs4900';
import {default as sortFields} from './sortFields';
import {default as reindexSubfield6OccurenceNumbers} from './reindexSubfield6OccurenceNumbers';

const iso9Trans = 'ISO9 <TRANS>';
const cyrillicTrans = 'CYRILLIC <TRANS>';
const sfs4900Trans = 'SFS4900 <TRANS>';

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

  function fieldCanBeTransliterated(field) {
    // Skip certain tags ('880' is the actual skip-me beef here, but we have seen other no-nos as well).
    // Discussion: We should probably also skip others like 05X-08X, 648, 650, 651, and 655, but this needs thinking...
    // Also I'd like to co CYRILLIC->ISO-9 for field 300 (and others?) without 880 mappings...
    if (['336', '337', '338', '880'].includes(field.tag)) {
      return false;
    }
    // Skip control fields:
    if (!field.subfields) {
      return false;
    }
    // MELINDA-10330: $6 should not prevent translittaration per se, so this restriction is no longer applied!

    if (field.subfields.some(sf => sf.code === '9' && sf.value.includes('<TRANS>'))) {
      return false;
    }

    return fieldContainsCyrillicCharacters(field); // We have something to translitterate:
  }


  function mapSubfieldToIso9(subfield) {
    if (!subfieldShouldTransliterateToIso9(subfield)) {
      return {code: subfield.code, value: subfield.code}; // just clone
    }
    const value = iso9.convertToLatin(subfield.value);

    return {code: subfield.code, value};
  }

  function mapSubfieldToSfs4900(subfield) {
    const value = subfieldShouldTransliterateToIso9(subfield) ? sfs4900.convertToLatin(subfield.value).result : subfield.value;
    return {code: subfield.code, value};
  }


  function mapFieldToIso9(field, occurrenceNumber) {
    // This is the original non-880 field, that will be converted from Cyrillic to ISO

    // Just converts the field to ISO-9 latinitsa, does not create any field-880s, so don't bother with $6 or $9 either
    if (!config.doISO9Transliteration && !config.doSFS4900Transliteration) {
      const subfields = field.subfields.map(sf => mapSubfieldToIso9(sf));
      return {tag: field.tag, ind1: field.ind1, ind2: field.ind2, subfields};
    }

    const subfield6 = deriveSubfield6('880', field.subfields, occurrenceNumber);
    const subfield9 = fieldHasSubfield(field, '9', iso9Trans) ? [] : [{code: '9', value: iso9Trans}];

    const subfields = field.subfields.filter(sf => sf.code !== '6').map(sf => mapSubfieldToIso9(sf));

    return {tag: field.tag, ind1: field.ind1, ind2: field.ind2, subfields: [subfield6, ...subfields, ...subfield9]};
  }

  function deriveSubfield6(tag, subfields, occurrenceNumber) {
    const initialSubfield = {code: '6', value: `${tag}-${occurrenceNumber}`};
    if (tag === '880') { // If *tag in subfield $6* is 880, field is not 880 :D
      return initialSubfield;
    }
    // Try to use existing subfield
    const [subfield6] = subfields.filter(sf => sf.code === '6').map(sf => clone(sf));
    if (subfield6) {
      resetSubfield6Tag(subfield6, tag); // Should we update occurrence number?
      return subfield6;
    }

    return initialSubfield;
  }

  function mapFieldToCyrillicField880(field, occurrenceNumber) {
    nvdebug(`Derive CYR 880 from ${fieldToString(field)}`);
    const newSubfield6 = deriveSubfield6(field.tag, field.subfields, occurrenceNumber);
    const newSubfield9 = fieldHasSubfield(field, '9', cyrillicTrans) ? [] : [{code: '9', value: cyrillicTrans}];
    const subfields = [
      newSubfield6,
      ...field.subfields.filter(sf => sf.code !== '6').map(sf => clone(sf)),
      ...newSubfield9
    ];

    const newField = {tag: '880', ind1: field.ind1, ind2: field.ind2, subfields};
    nvdebug(`       CYR 880      ${fieldToString(newField)}`);
    return newField;
  }

  function mapFieldToSfs4900Field880(field, occurrenceNumber) {
    nvdebug(`Derive SFS 880 from ${fieldToString(field)}`);
    const newSubfield6 = deriveSubfield6(field.tag, field.subfields, occurrenceNumber);
    const newSubfield9 = fieldHasSubfield(field, '9', sfs4900Trans) ? [] : [{code: '9', value: sfs4900Trans}];
    const subfields = [
      newSubfield6,
      ...field.subfields.filter(sf => sf.code !== '6').map(sf => mapSubfieldToSfs4900(sf)),
      ...newSubfield9
    ];

    const newField = {tag: '880', ind1: field.ind1, ind2: field.ind2, subfields};
    nvdebug(`       SFS 880      ${fieldToString(newField)}`);
    return newField;
  }

  function getNewOccurrenceNumber(originalField, record, maxCreatedOccurrenceNumber = 0) {
    const occurrenceNumber = fieldGetMaxSubfield6OccurrenceNumberAsInteger(originalField);
    // Return existing occurrence number:
    if (occurrenceNumber > 0) {
      return occurrenceNumber;
    }
    if (maxCreatedOccurrenceNumber) {
      return maxCreatedOccurrenceNumber + 1;
    }
    return recordGetMaxSubfield6OccurrenceNumberAsInteger(record) + 1;
  }

  function needsIso9Transliteration(existingPairedFields) {
    if (!config.doISO9Transliteration) {
      return false;
    }
    // Actually normal field is always converted to ISO-9, and this function checks where we move original cyrillic field to 880.
    // Thus we look for field 880$9 "CYRILLIC <TRANS>" here, and not "ISO9 <TRANS>"!
    return !existingPairedFields.some(f => fieldHasSubfield(f, '9', cyrillicTrans));
  }

  function needsSfs4900Transliteration(existingPairedFields) {
    if (!config.doSFS4900Transliteration) {
      return false;
    }
    return !existingPairedFields.some(f => fieldHasSubfield(f, '9', sfs4900Trans));
  }

  function processField(originalField, record, maxCreatedOccurrenceNumber = 0) {
    if (!fieldCanBeTransliterated(originalField)) {
      return [originalField];
    }

    nvdebug(`PROCESSING: ${fieldToString(originalField)}`);

    const newOccurrenceNumberAsInt = getNewOccurrenceNumber(originalField, record, maxCreatedOccurrenceNumber);
    const newOccurrenceNumberAsString = intToOccurrenceNumberString(newOccurrenceNumberAsInt);

    nvdebug(`NEW OCCURRENCE NUMBER: '${newOccurrenceNumberAsString}'`);

    const existingPairedFields = fieldGetOccurrenceNumberPairs(originalField, record.get('880'));

    nvdebug(`NUMBER OF PAIRED 880 FIELDS: ${existingPairedFields.length}`);

    const newMainField = mapFieldToIso9(originalField, newOccurrenceNumberAsString); // ISO-9
    const newCyrillicField = needsIso9Transliteration(existingPairedFields) ? mapFieldToCyrillicField880(originalField, newOccurrenceNumberAsString) : undefined; // CYRILLIC
    const newSFS4900Field = needsSfs4900Transliteration(existingPairedFields) ? mapFieldToSfs4900Field880(originalField, newOccurrenceNumberAsString) : undefined; /// SFS-4900

    return [newMainField, newCyrillicField, newSFS4900Field].filter(f => f);
  }
}
