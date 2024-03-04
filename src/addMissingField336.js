//import createDebugLogger from 'debug';
import {fieldToString, getCatalogingLanguage, nvdebug} from './utils';
import {map336CodeToTerm} from './utils33X';

const description = 'Add missing 336 field(s)';

export default function () {

  return {
    description, validate, fix
  };

  function fix(record) {
    nvdebug(`FIX ${description}...`);
    const newField = getMissing336(record);
    record.insertField(newField);

    const res = {message: [], fix: [], valid: true};
    return res;
  }

  function validate(record) {
    nvdebug(`VALIDATE ${description}...`);
    const newField = getMissing336(record);
    if (!newField) {
      return {message: [], valid: true};
    }
    const msg = `${description}: '${fieldToString(newField)}'`;
    return {message: [msg], valid: false};
  }

  function guessMissingB(record) {
    const typeOfRecord = record.getTypeOfRecord();
    const bibliographicalLevel = record.getBibliograpicLevel();
    const isBis = ['b', 'i', 's'].includes(bibliographicalLevel); // Bloody h-missing typo...

    console.info(`TYPE: ${typeOfRecord}, BIS:${bibliographicalLevel}=${isBis ? 'true' : 'false'}`); // eslint-disable-line no-console

    if (typeOfRecord === 'a' || typeOfRecord === 't') {
      if (!isBis) {
        return 'txt'; // Default BK format is text
      }
    }
    return false;
  }

  function getMissing336(record) {
    const [f336] = record.get('336');
    if (f336) {
      // nvdebug(fieldToString(f336));
      return undefined;
    }

    const b = guessMissingB(record);

    if (!b) {
      return undefined;
    }

    const catLang = getCatalogingLanguage(record);
    const catLang2 = catLang ? catLang : 'fin';
    const a = map336CodeToTerm(b, catLang2);

    const data = {tag: '336', ind1: ' ', ind2: ' ', subfields: [
      {code: 'a', value: a},
      {code: 'b', value: b},
      {code: '2', value: 'rdacontent'}
    ]};

    return data;
  }
}

