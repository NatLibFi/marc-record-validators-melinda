//import createDebugLogger from 'debug';
import {fieldToString} from './utils';

//const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge-reducers/reducers/sanitize-vocabulary-source-codes);


// Author(s): Nicholas Volk
export default function () {

  return {
    description: 'Validator for sanitizing vocabulary source codes in subfield $2 (MRA-532)',
    validate, fix
  };

  function fix(record) {
    const fixedFields = getFieldsWithCrappySubfieldCode(record, true);
    const remainingBadFields = getFieldsWithCrappySubfieldCode(record, false);

    const remainingBadFieldsAsStrings = remainingBadFields.map(f => fieldToString(f));

    if (fixedFields.length > 0 || remainingBadFields.length === 0) {
      // We are content
      const fixedFieldsAsStrings = fixedFields.map(f => fieldToString(f));

      return {message: remainingBadFieldsAsStrings, fix: fixedFieldsAsStrings, valid: true};
    }

    return {message: remainingBadFieldsAsStrings, fix: [], valid: false};

  }

  function validate(record) {
    const badFields = getFieldsWithCrappySubfieldCode(record, false);
    if (badFields.length === 0) {
      return {'message': [], 'valid': true};
    }
    const messages = badFields.map(f => fieldToString(f));

    return {'message': messages, 'valid': false};
  }

}

// 'mts' is here as per specs. However, I think it should be 'mts/fin' or 'mts/swe'
const legalSubfieldCode = ['allars', 'mts', 'mts/fin', 'mts/swe', 'slm/fin', 'slm/swe', 'ysa', 'yso/fin', 'yso/swe'];


function stringFixVocabularySourceCode(value) {
  // Try to remove spaces, change '//' to '/' and remove final '.' and '/':
  const tmp = value.replace(/ /ug, '').replace(/\/+/ug, '/').replace(/[./]$/gu, '');
  if (legalSubfieldCode.includes(tmp)) {
    return tmp;
  }
  return value;
}


function isCrappySubfield2(subfield, fix) {
  if (subfield.code !== '2' || legalSubfieldCode.includes(subfield.value)) {
    return false;
  }
  // If fixer modifies string, it's crap:
  const fixedVersion = stringFixVocabularySourceCode(subfield.value);
  if (fixedVersion !== subfield.value) {
    if (fix) {
      subfield.value = fixedVersion; // eslint-disable-line functional/immutable-data
      return true;
    }

    return true;
  }
  // As we can't fix this here, apply this yso-rule only when validating!
  if (!fix && subfield.value.indexOf('yso/') === 0) {
    return !['yso/eng', 'yso/fin', 'yso/swe'].includes(subfield.value);
  }
  if (!fix && subfield.value.indexOf('slm/') === 0) {
    return !['slm/fin', 'slm/swe'].includes(subfield.value);
  }
  if (!fix && subfield.value.indexOf('mts/') === 0) {
    return !['mts/fin', 'mts/swe'].includes(subfield.value);
  }
  return false;
}

function fieldHasCrappySubfield2(field, fix) {
  if (!field.tag.match(/^(?:6..|257|370|38.)$/u)) {
    return false;
  }
  return field.subfields.some(sf => isCrappySubfield2(sf, fix));
}

function getFieldsWithCrappySubfieldCode(record, fix) {
  return record.get(/^6..$/u).filter(f => fieldHasCrappySubfield2(f, fix));
}

