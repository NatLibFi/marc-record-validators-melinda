//import createDebugLogger from 'debug';
import {fieldToString} from './utils';
import clone from 'clone';

//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/sanitize-vocabulary-source-codes);

// Author(s): Nicholas Volk, Joni Ollila
export default function () {

  return {
    description: 'Validator for sanitizing vocabulary source codes in subfield $2 (MRA-532)',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};
    const relevantFields = getRelevantFields(record);
    relevantFields.forEach(f => fieldSanitizeVocabularySourceCode(f));
    return res;
  }

  function validate(record) {
    const res = {message: []};
    const relevantFields = getRelevantFields(record);

    relevantFields.forEach(field => validateField(field, res));

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function getRelevantFields(record) {
    return record.fields.filter(f => f.subfields && f.tag.match(/^(?:6..|257|370|38.)$/u));
  }

  function validateField(field, res) {
    const orig = fieldToString(field);

    const normalizedField = fieldSanitizeVocabularySourceCode(clone(field));
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`FIXABLE: '${orig}' => '${mod}'`); // eslint-disable-line functional/immutable-data
      return;
    }
    // Handle illegal values here
    if (fieldHasUnfixableVocabularySourceCode(field)) {
      res.message.push(`CAN'T BE FIXED AUTOMATICALLY: '${orig}'`); // eslint-disable-line functional/immutable-data
      return;
    }
    return;
  }


  function fieldSanitizeVocabularySourceCode(field) {
    field.subfields.forEach(sf => subfieldSanitizeVocabularySourceCode(sf));
    return field;
  }

  function subfieldSanitizeVocabularySourceCode(subfield) {
    if (subfield.code !== '2') {
      return;
    }
    subfield.value = stringFixVocabularySourceCode(subfield.value); // eslint-disable-line functional/immutable-data
  }

}

// Note that language suffix is optional
const legalSubfieldCode = ['allars', 'kauno', 'kauno/fin', 'kauno/swe', 'mts', 'mts/fin', 'mts/swe', 'slm', 'slm/fin', 'slm/swe', 'ysa', 'yso', 'yso/eng', 'yso/fin', 'yso/sme', 'yso/swe'];

function stringFixVocabularySourceCode(value) {
  // Try to remove spaces, change '//' to '/' and remove final '.' and '/':
  const tmp = value.replace(/ /ug, '')
    .replace(/\/+/ug, '/')
    .replace(/(.)[./]$/gu, '$1') // eslint-disable-line prefer-named-capture-group
    .replace(/^yso-(?:aika|paikat)\//u, 'yso/'); // IMP-HELMET crap. Also, they still have a '.' at the end of $a...

  // NB! Use the modified value ONLY if the result (tmp variable) is a legal subfield code...
  if (legalSubfieldCode.includes(tmp)) {
    return tmp;
  }

  return value;
}

function fieldHasUnfixableVocabularySourceCode(field) {
  return field.subfields.some(sf => subfieldHasUnfixableVocabularySourceCode(sf));
}

function subfieldHasUnfixableVocabularySourceCode(subfield) {
  // As we can't fix this here, apply this yso-rule only when validating!
  if (subfield.value.indexOf('yso/') === 0) {
    return !['yso/eng', 'yso/fin', 'yso/sme', 'yso/swe'].includes(subfield.value);
  }

  if (subfield.value.indexOf('slm/') === 0) {
    return !['slm/fin', 'slm/swe'].includes(subfield.value);
  }

  if (subfield.value.indexOf('mts/') === 0) {
    return !['mts/fin', 'mts/swe'].includes(subfield.value);
  }

  if (subfield.value.indexOf('kauno/') === 0) {
    return !['kauno/fin', 'kauno/swe'].includes(subfield.value);
  }

  return false;
}
