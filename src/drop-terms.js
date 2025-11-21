// Author(s): Nicholas Volk

import createDebugLogger from 'debug';
import {fieldToString, nvdebug} from './utils.js';
import {fieldHasValidSubfield0, getLexiconAndLanguage, getTermData, isLabel, isValidSubfield0} from './translate-terms.js';

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:drop-terms');

const defaultConfig = {
  'constraints': [
    {'tag': '648', 'lex': 'yso/fin'},
    {'tag': '648', 'lex': 'yso/swe'},
    {'tag': '650', 'lex': 'yso/fin'},
    {'tag': '650', 'lex': 'yso/swe'},
    {'tag': '651', 'lex': 'yso/fin'},
    {'tag': '651', 'lex': 'yso/swe'},
    {'tag': '655', 'lex': 'slm/fin'},
    {'tag': '655', 'lex': 'slm/swe'}
  ],
  'keep invalid url': false, // Removes illegal subfield $0. The whole field removal is later decided by 'keep 0-less'
  'keep invalid label': false, // label ($a) is neither pref Label nor altLabel => remove whole field
  'keep altLabel': true,
  'remove 0-less': true
};

export default function (config = defaultConfig) {

  return {
    description: 'Drop yso and slm terms that do not match. Use for incoming records only! Not for records already in Melinda!',
    validate, fix
  };

  async function fix(record, validateMode = false) {
    const relevantFields = getPotentialFields(record);
    const removableFields = await getRemovableFields(relevantFields);

    removableFields.forEach(f => nvdebug(`Remove field '${fieldToString(f)}'`, debug));

    const removableFieldsAsStrings = removableFields.map(f => fieldToString(f));

    if (validateMode) {
      if (removableFields.length === 0) {
        return {'message': [], 'valid': true};
      }
      return {'message': removableFieldsAsStrings, 'valid': false};
    }

    removableFields.forEach(f => record.removeField(f));

    return {message: [], fix: removableFieldsAsStrings, valid: true};
  }

  function getPotentialFields(record) {
    return record.fields?.filter(f => isPotentialField(f));

    function isPotentialField(f) {
      if (!config || !config.constraints) {
        return false;
      }
      return config.constraints.some(c => c.tag === f.tag && f.subfields?.some(sf => sf.code === '2' && sf.value === c.lex));
    }
  }

  async function validate(record) {
    return fix(record, true);
  }


  async function getRemovableFields(fields, results = []) {
    const [currField, ...remainingFields] = fields;
    if (!currField) {
      return results;
    }

    removeIllegalSubfield0s(currField); // iff config wants them to be removed...

    const removable = await isRemovableField(currField);
    if (removable) {
      return getRemovableFields(remainingFields, [...results, currField]);
    }
    return getRemovableFields(remainingFields, results);
  }

  function removeIllegalSubfield0s(field) {
    if (config['keep invalid url']) {
      return;
    }
    const lexData = getLexiconAndLanguage(field);
    if (!lexData.lang) { // This is an error of sorts. Should we proceed and remove $0s?
      return;
    }
    field.subfields = field.subfields.filter(sf => sf.code !== '0' || isValidSubfield0(sf, lexData.lex));

  }

  async function isRemovableField(field) {
    nvdebug(`FOO===== ${fieldToString(field)}`);


    // $0-less field:
    if (!field.subfields.some(sf => sf.code === '0')) {
      if (config['remove 0-less']) {
        nvdebug('=============== REMOVE 0-LESS');
        return true;
      }
      nvdebug('=============== KEEP 0-LESS');
      // We can't (trivially) check whether the term exists in lexicon
      return false;
    }

    // Check 0 validity
    if (!fieldHasValidSubfield0(field)) {
       nvdebug(`FIELD ${fieldToString(field)} HAS INVALID $0`);
      return true;
    }
    nvdebug(`FOO3===== ${fieldToString(field)}`);
    // Check value... KESKEN!
    const subfield0 = field.subfields.find(sf => sf.code === '0');
    nvdebug(`=============== NIKO ${subfield0.value}`);
    const data = await getTermData(subfield0.value);
    if (!data) { // BUG! This will delete incoming terms if Finto is down...
      return true;
    }
    const subfieldA= field.subfields.find(sf => sf.code === 'a');
    const lexData = getLexiconAndLanguage(field);

    if (isLabel(data.prefLabel, subfieldA.value, lexData.lang)) {
      return false;
    }

    if (isLabel(data.altLabel, subfieldA.value, lexData.lang)) {
      if (config['keep altLabel']) {
        return false;
      }
      return true; // Removes altLabel
    }

    return !config['keep invalid label'];

  }


}

