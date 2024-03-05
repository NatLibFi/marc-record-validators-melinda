//import createDebugLogger from 'debug';
import {fieldToString, getCatalogingLanguage, nvdebug} from './utils';
import {getFormOfItem, map336CodeToTerm} from './utils33X';

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

  function guessMissingBForMap(record, formOfItem) {
    // Is braille and is not a model:
    if (formOfItem === 'f' && record.fields.some(f => f.tag === '007' && f.value[0] === 'a' && f.value[1] !== 'q')) {
      return 'crt'; // Cartographic tactile image
    }
    const [field008] = record.get('008');
    if (field008 && field008.value[25] === 'd') { // globe
      return 'crf'; // map 3D form
    }
    return 'cri'; // default cartographic image
  }

  function guessMissingB(record) {
    const typeOfRecord = record.getTypeOfRecord();

    if (typeOfRecord === 'i') {
      return 'spw';
    }
    if (typeOfRecord === 'j') {
      return 'prm'; // performed music
    }

    const formOfItem = getFormOfItem(record);

    if (typeOfRecord === 'e' || typeOfRecord === 'f') {
      return guessMissingBForMap(record, formOfItem);
    }

    if (typeOfRecord === 'k') {
      if (formOfItem === 'f') {
        return 'tci';
      }
      return 'sti';
    }

    if (typeOfRecord === 'c' || typeOfRecord === 'd') {
      if (formOfItem === 'f') {
        return 'tcm'; // tactile notated music
      }
      return 'ntm'; // notated music
    }


    const bibliographicalLevel = record.getBibliograpicLevel();
    const isBis = ['b', 'i', 's'].includes(bibliographicalLevel); // Bloody h-missing typo...

    //const f245h = getTitleMedium(record);

    console.info(`TYPE: ${typeOfRecord}, BIS:${bibliographicalLevel}=${isBis ? 'true' : 'false'}, FoI:${formOfItem}`); // eslint-disable-line no-console

    if (typeOfRecord === 'a' || typeOfRecord === 't') {
      if (!isBis) {
        if (formOfItem === 'f') {
          return 'tct'; // tactile text
        }
        return 'txt'; // Default BK format is text
      }
    }


    if (typeOfRecord === 'g') {
      if (record.fields.some(f => f.tag === '007' && f.value[0] === 'g')) {
        return 'sti'; // still image
      }
      if (record.fields.some(f => f.tag === '007' && ['m', 'v', 'c'].includes(f.value[0]))) {
        return 'tdi'; // 2d moving pic
      }
    }

    return undefined;
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

