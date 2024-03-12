//import createDebugLogger from 'debug';
import {fieldHasSubfield, fieldToString, getCatalogingLanguage, nvdebug} from './utils';
import {getFormOfItem, map338CodeToTerm} from './utils33X';

// Based mostly on USEMARCON-RDA. However, many things have been rethought, modernized etc.
const description = 'Add missing 338 field(s)';

export default function () {

  return {
    description, validate, fix
  };

  function fix(record) {
    nvdebug(`FIX ${description}...`);
    const newField = getMissing338(record);
    const res = {message: [], fix: [], valid: true};

    if (newField) {
      record.insertField(newField);
      return res;
    }

    return res;
  }

  function validate(record) {
    nvdebug(`VALIDATE ${description}...`);
    const newField = getMissing338(record);
    if (!newField) {
      return {message: [], valid: true};
    }
    const msg = `${description}: '${fieldToString(newField)}'`;
    return {message: [msg], valid: false};
  }


  function isUnmediatedVolume(record) {
    const typeOfRecord = record.getTypeOfRecord();
    if (!['a', 'c', 'e', 't'].includes(typeOfRecord)) {
      return false;
    }
    const fields337 = record.get('337');
    if (!fields337 || !fields337.some(f => fieldHasSubfield(f, 'b', 'n'))) {
      return false;
    }

    const fields336 = record.get('336');

    if (fields336 && fields336.some(f => f.subfields.some(sf => sf.code === 'b' && ['txt', 'cri'].includes(sf.value)))) {
      return true;
    }
    // Add 300$a value-based guesses?
    return false;
  }

  function formOfItemToField338(record) {
    const formOfItem = getFormOfItem(record);
    if (formOfItem === 'a') {
      if (record.get('300').some(f => f.subfields.some(sf => sf.code === 'a' && sf.value.match(/mikrofilmikela/iu)))) {
        return 'hd';
      }
      return 'hj'; // mikrofilmirulla
    }
    if (formOfItem === 'b') { // mikrokortti
      return 'he';
    }
    return undefined;
  }

  function guessMissing338B(record) {
    const guessBasedOnFormOfItem = formOfItemToField338(record);
    if (guessBasedOnFormOfItem) {
      return guessBasedOnFormOfItem;
    }

    if (isUnmediatedVolume(record)) {
      return 'nc';
    }

    return undefined;
  }

  function getMissing338(record) {
    // This will return only a single value. Multivalues must be handled before this...
    if (record.fields.some(f => ['338', '773', '973'].includes(f.tag))) {
      return undefined;
    }

    const b = guessMissing338B(record);

    if (!b) {
      return undefined;
    }

    const catLang = getCatalogingLanguage(record);
    const catLang2 = catLang ? catLang : 'fin';
    const a = map338CodeToTerm(b, catLang2);
    const a2 = a ? a : 'z'; // unspecified

    const data = {tag: '338', ind1: ' ', ind2: ' ', subfields: [
      {code: 'a', value: a2},
      {code: 'b', value: b},
      {code: '2', value: 'rdacarrier'}
    ]};

    return data;
  }
}

