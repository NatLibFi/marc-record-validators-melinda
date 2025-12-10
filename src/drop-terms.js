// Author(s): Nicholas Volk

import clone from 'clone';
import createDebugLogger from 'debug';
import {fieldToString, nvdebug} from './utils.js';
import {getLexiconAndLanguage, getTermData, isLabel, isValidSubfield0} from './translate-terms.js';

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
  'keep invalid url': false, // If not true, removes illegal subfield $0. The whole field removal is later decided by 'keep 0-less'
  'keep invalid label': false, // label ($a) is neither pref Label nor altLabel => remove whole field
  'remove altLabel': false,
  'remove 0-less': true
};

export default function (config = defaultConfig) {

  return {
    description: 'Drop yso and slm terms that do not match their identifiers. Use for incoming records only! Not for records already in Melinda!',
    validate, fix
  };

  async function fix(record, validateMode = false) {
    const clonedFields = record.fields.map(f => clone(f));

    const results = await processFields(clonedFields);

    const removables = results.map((f, i) => !f ? record.fields[i] : undefined).filter(f => f);
    const modMessages = results.map((f, i) => getMod(f, i)).filter(f => f);
    const removalMessages = removables.map(f => `Remove '${fieldToString(f)}'`);
    const allMessages = [...modMessages, ...removalMessages];

    if (validateMode) {
      if (allMessages.length === 0) {
        return {'message': [], 'valid': true};
      }
      return {'message': allMessages, 'valid': false};
    }

    removables.forEach(f => record.removeField(f));

    return {message: [], fix: allMessages, valid: true};

    function getMod(field, index) {
      if (!field) {
        return undefined;
      }
      const before = fieldToString(record.fields[index]);
      const after = fieldToString(results[index]);
      if (before !== after) {
        if (!validateMode) {
          record.fields[index] = field;
        }
        return `Modify '${before}' => '${after}'`;
      }
      return undefined;
    }
  }

  function isPotentialField(f) {
    if (!config || !config.constraints) {
      return false;
    }
    return config.constraints.some(c => c.tag === f.tag && f.subfields?.some(sf => sf.code === '2' && sf.value === c.lex));
  }

  async function validate(record) {
    return fix(record, true);
  }


  async function processFields(fields, results = []) {
    const [currField, ...remainingFields] = fields;
    if (!currField) {
      return results;
    }

    if (!isPotentialField(currField)) { // Not interested in this field
      return processFields(remainingFields, [...results, currField]);
    }

    removeSyntacticallyIllegalSubfield0s(currField); // iff config wants them to be removed...

    const removable = await isRemovableField(currField);

    return processFields(remainingFields, [...results, removable ? undefined : currField]);
  }

  function removeSyntacticallyIllegalSubfield0s(field) {
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
    // nvdebug(`FOO===== ${fieldToString(field)}`);


    // $0-less field:
    if (!field.subfields.some(sf => sf.code === '0')) {
      return config['remove 0-less'];
    }

    const subfield0 = field.subfields.find(sf => sf.code === '0');
    const data = await getTermData(subfield0.value);
    // NB! No data might be a BUG! This might delete all incoming terms if Finto is down... (we should distinguish between a miss and a failure)
    // However, if we use this validator only for incoming records, it's fine enough.

    if (data) {
      const subfieldA = field.subfields.find(sf => sf.code === 'a');
      if (subfieldA) {
        const lexData = getLexiconAndLanguage(field);

        // $a is the pref label. All is fine!
        if (isLabel(data.prefLabel, subfieldA.value, lexData.lang)) {
          debug(`altLabel found: ${subfieldA.value}`);
          return false;
        }
        if (isLabel(data.altLabel, subfieldA.value, lexData.lang)) {
          debug(`altLabel found: ${subfieldA.value}`);
          // Oddly enough this could remove altLabel but keep totally invalid labels...
          return config['remove altLabel'];
        }
        debug(`a-2-0 mismatch: ${fieldToString(field)}`);
      }
    }


    if (config['keep invalid label']) {
      // We keep the label $a. However, we can get rid of $0 if we want to (semantic reasons)
      if (!config['keep invalid url']) {
        nvdebug(`=============== 0-removal`);
        field.subfields = field.subfields.filter(sf => sf.code !== '0');
      }
      return false;
    }
    return true;

  }


}

