//import createDebugLogger from 'debug';
import {fieldToString, getCatalogingLanguage, nvdebug} from './utils.js';
import {getFormOfItem, map337CodeToTerm} from './field33XUtils.js';

const description = 'Add missing 337 field(s)';

// Based on https://github.com/NatLibFi/USEMARCON-Cyrillux/blob/master/008-23-337a.tbl . Extended!
const mappings337B = [
  {formOfItem: ' ', rdacontent: 'n'}, // unmediated - käytettävissä ilman laitetta
  {formOfItem: '|', rdacontent: 'n'},
  {formOfItem: 'a', rdacontent: 'h'}, // microform
  {formOfItem: 'b', rdacontent: 'h'},
  {formOfItem: 'c', rdacontent: 'h'},
  {formOfItem: 'd', rdacontent: 'n'},
  {formOfItem: 'e', rdacontent: 'n'},
  {formOfItem: 'f', rdacontent: 'n'},
  {formOfItem: 'o', rdacontent: 'c'}, // computer
  {formOfItem: 'q', rdacontent: 'c'},
  {formOfItem: 'r', rdacontent: 'n'},
  {formOfItem: 's', rdacontent: 'c'}
];

export default function () {

  return {
    description, validate, fix
  };

  function fix(record) {
    nvdebug(`FIX ${description}...`);
    const newField = getMissing337(record);
    const res = {message: [], fix: [], valid: true};
    if (newField) {
      record.insertField(newField);
      return res;
    }

    return res;
  }

  function validate(record) {
    nvdebug(`VALIDATE ${description}....`);
    const newField = getMissing337(record);
    if (!newField) {
      return {message: [], valid: true};
    }
    const msg = `${description}: '${fieldToString(newField)}'`;
    return {message: [msg], valid: false};
  }

  function guessObjectsMissing337B(record) {
    const [field008] = record.get('008');
    if (field008 && field008.value[33] === 'p') {
      return 'p'; // microscopic
    }
    return 'n'; // unmediated
  }

  function guessMissing337B(record) {
    const typeOfRecord = record.getTypeOfRecord();

    if (typeOfRecord === 'm') { // LDR/06=m/computer file
      return 'c'; // computer
    }
    if (typeOfRecord === 'o' || typeOfRecord === 'p') {
      return 'x'; // other
    }
    if (typeOfRecord === 'r') { // object
      return guessObjectsMissing337B(record);
    }
    const fields007 = record.get('007');

    // TO DO: type a/t + 245$h (not multimedia): use 007/00 based expection

    // 007/00 implies that 337$b=c (computer)
    if (typeOfRecord === 'g' || typeOfRecord === 'i' || typeOfRecord === 'j') {
      if (fields007.some(f => f.value[0] === 'c')) { // c=computer
        // i and j: should we check 007/05 (audio)=a as well?
        return 'c';
      }
    }

    if (typeOfRecord === 'g') {
      if (fields007.some(f => f.value[0] === 'g')) { // g=projected
        return 'g';
      }
      if (fields007.some(f => f.value[0] === 'm' || f.value[0] === 'v')) { // m=movie, v=videorecording (cyrillux maps videorecording to 'c'/computer, fix it there?)
        return 'v';
      }
    }

    if (typeOfRecord === 'i' || typeOfRecord === 'j') {
      // Ye olde stuff: 245$h might contain value 'Äänite', which returns 'a'.
      // NB! Cyrillux returns 'c'/com a bit more aggressively for j (music)
      return 's'; // audio
    }

    return mapFormOfItemToField337B(getFormOfItem(record));
  }

  function getMissing337(record) {
    const [f337] = record.get('337');
    if (f337) {
      // nvdebug(fieldToString(f337));
      return undefined;
    }

    const b = guessMissing337B(record) || 'z';

    const catLang = getCatalogingLanguage(record);
    const catLang2 = catLang ? catLang : 'fin';
    const a = map337CodeToTerm(b, catLang2);

    const data = {tag: '337', ind1: ' ', ind2: ' ', subfields: [
      {code: 'a', value: a},
      {code: 'b', value: b},
      {code: '2', value: 'rdamedia'}
    ]};

    return data;
  }
}

function mapFormOfItemToField337B(formOfItem) {
  nvdebug(`mapping ${formOfItem} to 337$b`);

  const [result] = mappings337B.filter(row => row.formOfItem === formOfItem);
  if (result) {
    return result.rdacontent;
  }
  return 'z'; // undefined; // How about 'z'/unspecified. Currently done
}
