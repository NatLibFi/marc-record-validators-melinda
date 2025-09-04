//import createDebugLogger from 'debug';
import clone from 'clone';
import XRegExp from 'xregexp';
import * as iso9 from '@natlibfi/iso9-1995';
import * as sfs4900 from '@natlibfi/sfs-4900';
import {fieldHasSubfield, fieldToString, fieldsToString, isControlSubfieldCode, nvdebug} from './utils.js';
import {fieldGetMaxSubfield6OccurrenceNumberAsInteger, fieldGetOccurrenceNumberPairs, fieldGetUnambiguousOccurrenceNumber, intToOccurrenceNumberString, recordGetMaxSubfield6OccurrenceNumberAsInteger, resetSubfield6Tag} from './subfield6Utils.js';
import {default as sortFields} from './sortFields.js';
import {default as reindexSubfield6OccurenceNumbers} from './reindexSubfield6OccurenceNumbers.js';
import {fieldStripPunctuation} from './punctuation2.js';
import {getLanguageCode} from './addMissingField041.js';

const iso9Trans = 'ISO9 <TRANS>';
const cyrillicTrans = 'CYRILLIC <TRANS>';
const sfs4900Trans = 'SFS4900 <TRANS>';

export default function (config = {}) {
  // console.log(`CONFIG=${JSON.stringify(config)}`); // eslint-disable-line no-console

  return {
    description: 'Cyrillux functionality: convert original field to latinitsa (ISO-9) and add 880s for original cyrillic and latinitsa (SFS-4900)',
    validate, fix
  };

  function preprocessConfig() {
    config.retainCyrillic = typeof config.retainCyrillic === 'undefined' ? true : config.retainCyrillic;
    config.doISO9Transliteration = typeof config.doISO9Transliteration === 'undefined' ? true : config.doISO9Transliteration;
    config.doSFS4900Transliteration = typeof config.doSFS4900Transliteration === 'undefined' ? true : config.doSFS4900Transliteration;
    config.preferSFS4900 = setPreference();

    function setPreference() {
      if (!config.doSFS4900Transliteration) {
        return false;
      }
      if (!config.doISO9Transliteration && config.doSFS4900Transliteration) {
        return true;
      }
      if (typeof config.preferSFS4900 === 'undefined') {
        return false;
      }
      return config.preferSFS4900;
    }
  }

  function fix(record) {
    // console.log(`FIX has CONFIG=${JSON.stringify(config)}`); // eslint-disable-line no-console
    // Fix always succeeds
    const res = {message: [], fix: [], valid: true};

    preprocessConfig();

    const nBefore = record.fields.length;

    record.fields = processFields(record.fields);

    if (nBefore < record.fields.length) {
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

    preprocessConfig();

    record.fields?.forEach(field => {
      validateField(field, res, record);
    });

    res.valid = !(res.message.length >= 1);
    return res;
  }

  function validateField(field, res, record) {
    const orig = fieldToString(field);

    const normalizedFields = processField(clone(field), record);
    const mod = fieldsToString(normalizedFields).replace(/\t__SEPARATOR__\t/ug, ', ').replace(/ (‡6 [0-9][0-9][0-9])-[0-9][0-9]+/gu, ' $1-NN');
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`CHANGE: ${orig} => ${mod}`);
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
    return field.subfields && field.subfields.some(sf => subfieldRequiresTransliteration(sf));
  }

  function subfieldRequiresTransliteration(subfield) {
    if (isControlSubfieldCode(subfield.code)) {
      return false;
    }
    return containsCyrillicCharacters(subfield.value);
  }

  function tagCanBeTransliterated(tag) {
    return !['336', '337', '338', '880'].includes(tag);
  }

  function fieldCanBeTransliterated(field) {
    // Skip certain tags ('880' is the actual skip-me beef here, but we have seen other no-nos as well).
    // Discussion: We should probably also skip others like 05X-08X, 648, 650, 651, and 655, but this needs thinking...
    // Also I'd like to convert do CYRILLIC->ISO-9 in field 300 (and others?) without 880 mappings... (<- not implemented)

    // nvdebug(`fieldCanBeTransliterated('${fieldToString(field)}') in...`);
    if (!tagCanBeTransliterated(field.tag)) {
      return false;
    }

    if (!config.doISO9Transliteration && !config.doSFS4900Transliteration) {
      return false;
    }

    // Skip control fields:
    if (!field.subfields) {
      return false;
    }
    // When doing MELINDA-10330-ish, we noticed that $6 should not prevent translittaration per se, so this restriction is no longer applied!

    if (field.subfields.some(sf => sf.code === '9' && sf.value.includes('<TRANS>'))) {
      return false;
    }

    return fieldContainsCyrillicCharacters(field); // We have something to translitterate:
  }


  function mapSubfieldToIso9(subfield) {
    if (!subfieldRequiresTransliteration(subfield)) {
      return {code: subfield.code, value: subfield.value}; // just clone
    }
    const value = iso9.convertToLatin(subfield.value);

    return {code: subfield.code, value};
  }

  function mapSubfieldToSfs4900(subfield, lang = 'rus') {
    const inputLang = lang === 'ukr' ? 'ukr' : 'rus'; // Support 'ukr' and 'rus', default to 'rus'
    const value = subfieldRequiresTransliteration(subfield) ? sfs4900.convertToLatin(subfield.value, inputLang).result : subfield.value;
    //console.log(`VAL: ${subfield.value} => ${value} using ${lang}`); // eslint-disable-line no-console
    return {code: subfield.code, value};
  }

  function mapField(field, occurrenceNumber, iso9 = true, lang = 'rus') {
    const subfield6 = deriveSubfield6('880', field.subfields, occurrenceNumber);
    const transliterationText = iso9 ? iso9Trans : sfs4900Trans;

    const subfield9 = fieldHasSubfield(field, '9', transliterationText) ? [] : [{code: '9', value: transliterationText}]; // Add only if needed
    const transliterationFunc = iso9 ? mapSubfieldToIso9 : mapSubfieldToSfs4900;

    // NB! iso9 won't use lang
    const subfields = field.subfields.filter(sf => sf.code !== '6').map(sf => transliterationFunc(sf, lang));

    const newField = {tag: field.tag, ind1: field.ind1, ind2: field.ind2, subfields: [subfield6, ...subfields, ...subfield9]};

    // Transliteration goes to the original field:
    if (!iso9 && config.preferSFS4900) {
      return newField;
    }
    if (iso9 && !config.preferSFS4900) {
      return newField;
    }
    // Translitetation goes to field 880:

    //const subfield6 = newField.subfields.find(sf => sf.code === '6');
    newField.tag = '880';
    resetSubfield6Tag(subfield6, field.tag);
    return newField;

  }

  function mapFieldToIso9(field, occurrenceNumber) {
    if (!config.doISO9Transliteration) {
      return undefined;
    }
    // Just converts the field to ISO-9 latinitsa, does not create any field-880s, so don't bother with $6 or $9 either
    if (!config.retainCyrillic && !config.preferSFS4900) {
      const subfields = field.subfields.map(sf => mapSubfieldToIso9(sf));
      return {tag: field.tag, ind1: field.ind1, ind2: field.ind2, subfields};
    }

    return mapField(field, occurrenceNumber, true, 'rus');

  }

  function mapFieldToSfs4900(field, occurrenceNumber, lang = 'rus') {
    if (!config.doSFS4900Transliteration) {
      return undefined;
    }
    // Just converts the field to SFS-4900 latinitsa, does not create any field-880s, so don't bother with $6 or $9 either
    if (!config.retainCyrillic && config.preferSFS4900) {
      const subfields = field.subfields.map(sf => mapSubfieldToSfs4900(sf, lang));
      return {tag: field.tag, ind1: field.ind1, ind2: field.ind2, subfields};
    }

    return mapField(field, occurrenceNumber, false, lang);
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
    if (!config.retainCyrillic) {
      return undefined;
    }
    nvdebug(`Derive CYR 880 from ${fieldToString(field)}`);
    const newSubfield6 = deriveSubfield6(field.tag, field.subfields, occurrenceNumber);
    const newSubfield9 = fieldHasSubfield(field, '9', cyrillicTrans) ? [] : [{code: '9', value: cyrillicTrans}];
    const subfields = [
      newSubfield6,
      ...field.subfields.filter(sf => sf.code !== '6').map(sf => clone(sf)),
      ...newSubfield9
    ];

    const newField = {tag: '880', ind1: field.ind1, ind2: field.ind2, subfields};
    nvdebug(`   New CYR 880      ${fieldToString(newField)}`);
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

  function retainCyrillic(existingPairedFields) {
    // Should we move cyrillic content from a normali field to a 880?
    if (!config.retainCyrillic) {
      return false;
    }
    // Fail if we already have a paired 880 $9 <CYRILLIC> TRANS
    return !existingPairedFields.some(f => fieldHasSubfield(f, '9', cyrillicTrans));
  }

  function needsSfs4900Transliteration(existingPairedFields) {
    if (!config.doSFS4900Transliteration) {
      return false;
    }
    return !existingPairedFields.some(f => fieldHasSubfield(f, '9', sfs4900Trans));
  }

  function sfs4900PairCanBeTransliterated(field, record) {
    // MELINDA-10330: we already have public library data: (unmarked) SFS-4900 in FIELD and (unmarked) Cyrillic in 880
    if (!field.subfields || !tagCanBeTransliterated(field.tag) || !config.doISO9Transliteration || !config.retainCyrillic || !config.doSFS4900Transliteration) {
      return false;
    }

    // Original field: $9 ISO9 <TRANS> is the only legal <TRANS>
    if (fieldContainsCyrillicCharacters(field) || field.subfields.some(sf => sf.code === '9' && sf.value.includes('<TRANS>') && sf.value !== iso9Trans)) {
      return false;
    }

    const existingPairedFields = fieldGetOccurrenceNumberPairs(field, record.get('880'));
    if (existingPairedFields.length !== 1) {
      return false;
    }

    // Paired field: $9 CYRILLIC <TRANS> is the only legal <TRANS>
    const [pairedField] = existingPairedFields;
    nvdebug(`LOOKING FOR SFS4900 PAIR: ${fieldToString(field)}`);
    nvdebug(`     HAVING PAIRED FIELD: ${fieldToString(pairedField)}`);
    if (!fieldContainsCyrillicCharacters(pairedField)) {
      return false;
    }
    if (pairedField.subfields.some(sf => sf.code === '9' && sf.value.includes('<TRANS>') && sf.value !== cyrillicTrans)) {
      return false;
    }

    // Actually check that original field and and sfs-4900-fied cyrillic field are equal (after punctuation clean-up),
    // and thus it's a real case of MELINDA-10330 ISO9 adding:
    const occurrenceNumberAsString = fieldGetUnambiguousOccurrenceNumber(field);
    const languageCode = getLanguageCode(record);
    const field2 = fieldToString(createFieldForSfs4900Comparison(mapFieldToSfs4900(pairedField, occurrenceNumberAsString, languageCode), field.tag));
    const field1 = fieldToString(createFieldForSfs4900Comparison(field, field.tag));
    nvdebug(`COMPARE CONTENTS:\n  '${field1}' vs\n  '${field2}': ${field1 === field2 ? 'OK' : 'FAIL'}`);
    return field1 === field2;
  }

  function createFieldForSfs4900Comparison(field, tag) {
    const clonedField = clone(field);
    clonedField.tag = tag;
    clonedField.subfields = clonedField.subfields.filter(sf => sf.code !== '9' || sf.value !== sfs4900Trans);
    return fieldStripPunctuation(clonedField);
  }

  function transliterateSfs4900Pair(field, record) {
    // Handle MELINDA-10330: Field is already in SFS-4900 and the only paired field is in Cyrillic!
    if (!config.doISO9Transliteration) {
      return [];
    }
    const [pairedField] = fieldGetOccurrenceNumberPairs(field, record.get('880'));

    const occurrenceNumberAsString = fieldGetUnambiguousOccurrenceNumber(field);
    const languageCode = getLanguageCode(record);

    const tmpField = {'tag': field.tag, 'ind1': field.ind1, 'ind2': field.ind2, 'subfields': pairedField.subfields};

    const newMainField = config.doISO9Transliteration ? mapFieldToIso9(tmpField, occurrenceNumberAsString) : undefined; // Cyrillic => ISO-9
    const newCyrillicField = config.retainCyrillic ? mapFieldToCyrillicField880(tmpField, occurrenceNumberAsString) : undefined; // CYRILLIC
    const newSFS4900Field = config.doSFS4900Transliteration ? mapFieldToSfs4900(field, occurrenceNumberAsString, languageCode) : undefined; // SFS-4900

    // Trigger the drop of original counterpart $6 :
    pairedField.cyrilluxSkip = 1;

    return [newMainField, newCyrillicField, newSFS4900Field].filter(f => f);
  }


  function processField(originalField, record, maxCreatedOccurrenceNumber = 0) {
    if (!fieldCanBeTransliterated(originalField)) {
      if (sfs4900PairCanBeTransliterated(originalField, record)) { // MELINDA-10330
        return transliterateSfs4900Pair(originalField, record);
      }
      if (originalField.cyrilluxSkip) { // MELINDA-10330 hack to remove 880 fields that were replaced/sort-of processed with their counterpair.
        return [];
      }
      return [originalField];
    }

    // nvdebug(`PROCESSING: ${fieldToString(originalField)}`);

    const newOccurrenceNumberAsInt = getNewOccurrenceNumber(originalField, record, maxCreatedOccurrenceNumber);
    const newOccurrenceNumberAsString = intToOccurrenceNumberString(newOccurrenceNumberAsInt);
    const languageCode = getLanguageCode(record);

    // nvdebug(`NEW OCCURRENCE NUMBER: '${newOccurrenceNumberAsString}'`);

    const existingPairedFields = fieldGetOccurrenceNumberPairs(originalField, record.get('880'));

    // nvdebug(`NUMBER OF PAIRED 880 FIELDS: ${existingPairedFields.length}`);

    const newMainField = mapFieldToIso9(originalField, newOccurrenceNumberAsString); // ISO-9
    const newCyrillicField = retainCyrillic(existingPairedFields) ? mapFieldToCyrillicField880(originalField, newOccurrenceNumberAsString) : undefined; // CYRILLIC
    const newSFS4900Field = needsSfs4900Transliteration(existingPairedFields) ? mapFieldToSfs4900(originalField, newOccurrenceNumberAsString, languageCode) : undefined; /// SFS-4900

    return [newMainField, newCyrillicField, newSFS4900Field].filter(f => f);
  }
}
