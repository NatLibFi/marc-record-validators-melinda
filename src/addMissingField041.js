//import createDebugLogger from 'debug';
import {fieldToString, nvdebug} from './utils';

const description = 'Add missing 041 field based on 008/35-37';

// const multimediaRegexp = /multimedia/ui;

export default function () {

  return {
    description, validate, fix
  };

  function getLanguageCode(record) {
    const [f008] = record.get('008');
    if (f008 && f008.value.length === 40) {
      return f008.value.substring(35, 38);
    }
    return '|||';
  }

  function isRealLanguageCode(languageCode = '|||') {
    nvdebug(`Language code 008/35-37: ${languageCode}`);
    if (!languageCode.match(/^[a-z]{3}$/u) || ['mul', 'und', 'zxx'].includes(languageCode)) {
      return false;
    }
    // Assume that value is valid:
    return true;
  }

  function determineSubfieldCode(record) {
    const typeOfRecord = record.getTypeOfRecord(record);
    if (typeOfRecord === 'i' || typeOfRecord === 'j') {
      return 'd';
    }
    return 'a';
  }

  function generateContent(record) {
    const languageCodeFields = record.get('041');
    if (languageCodeFields.length > 0) {
      return null;
    }
    const languageCode = getLanguageCode(record);
    if (!isRealLanguageCode(languageCode)) {
      return null;
    }
    const subfieldCode = determineSubfieldCode(record);
    // NB! Usemarcon-bookwhere had IND1=0...
    return {tag: '041', ind1: ' ', ind2: ' ', subfields: [{code: subfieldCode, value: languageCode}]};
  }

  function fix(record) {
    nvdebug(`FIX ${description}...`);
    const data = generateContent(record);
    const res = {message: [], fix: [], valid: true};
    if (data) {
      record.insertField(data);
      return res;
    }
    return res;
  }

  function validate(record) {
    nvdebug(`VALIDATE ${description}...`);
    const data = generateContent(record);
    if (!data) {
      return {message: [], valid: true};
    }
    const msg = `${description}: '${fieldToString(data)}'`;
    return {message: [msg], valid: false};
  }
}

