//import createDebugLogger from 'debug';
import {fieldToString, getCatalogingLanguage, nvdebug} from './utils';
import {getFormOfItem, getTitleMedium, map336CodeToTerm} from './utils33X';

const description = 'Add missing 336 field(s)';

const multimediaRegexp = /multimedia/ui;

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

  function guessMissingBForComputerFile(record) {
    const [field008] = record.get('008');
    const typeOfComputerFile = field008 && field008.value ? field008.value[26] : undefined;

    if (typeOfComputerFile) {
      if (['d', 'e'].includes(typeOfComputerFile)) {
        return 'txt';
      }
      if (['b', 'f', 'g'].includes(typeOfComputerFile)) {
        return 'cop';
      }
      if (['a', 'c'].includes(typeOfComputerFile)) {
        return 'cod';
      }
      if (typeOfComputerFile === 'h') {
        return 'snd';
      }
      if (['i', 'j', 'm'].includes(typeOfComputerFile)) {
        return 'xxx';
      }
    }
    return 'zzz'; // unspecified
  }

  function deriveLanguageMaterials336From007(record) {
    const categoryOfMaterial = [ // 007/00
      {category: 'a', rdacontent: 'cri'}, // cartographic image
      {category: 'c', rdacontent: 'txt'},
      {category: 'g', rdacontent: 'sti'},
      {vategory: 'h', rdacontent: 'txt'},
      {category: 'k', rdacontent: 'sti'},
      {category: 'v', rdacontent: 'tdi'}
    ];

    // What if there are multiple 007 fields?
    const [f007] = record.fields.get('007');
    if (f007) {
      const row = categoryOfMaterial.filter(row => row.category === f007[0]);
      if (row) {
        return row.rdacontent;
      }
    }
    return undefined;
  }

  function guessMissingBForBookAndContinuingResource(record, formOfItem) {

    const f245h = getTitleMedium(record);
    if (f245h && !multimediaRegexp.test(f245h)) {
      const result = deriveLanguageMaterials336From007(record); // Base result on 007/00. Aped from usemarcon-cyrillux. I don't like this at all... Shouldn't we check $h value as well...
      if (result) {
        return result;
      }
    }

    //const bibliographicalLevel = record.getBibliograpicLevel(); // Bloody h-drop typo...
    //const isBis = ['b', 'i', 's'].includes(bibliographicalLevel);
    //if (!isBis) {
    if (formOfItem === 'f') {
      return 'tct'; // tactile text
    }
    return 'txt'; // Default BK format is text
  }

  function guessMissingBForMap(record) {
    const formOfItem = getFormOfItem(record);
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

  function guessMissing336B(record) {
    const typeOfRecord = record.getTypeOfRecord();

    if (typeOfRecord === 'i') {
      return 'spw';
    }
    if (typeOfRecord === 'j') {
      return 'prm'; // performed music
    }

    if (typeOfRecord === 'e' || typeOfRecord === 'f') {
      return guessMissingBForMap(record);
    }

    const formOfItem = getFormOfItem(record);

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

    if (typeOfRecord === 'g') {
      if (record.fields.some(f => f.tag === '007' && f.value[0] === 'g')) {
        return 'sti'; // still image
      }
      if (record.fields.some(f => f.tag === '007' && ['m', 'v', 'c'].includes(f.value[0]))) {
        return 'tdi'; // 2d moving pic
      }
    }

    if (typeOfRecord === 'm') { // electronic
      return guessMissingBForComputerFile(record);
    }

    if (typeOfRecord === 'a' || typeOfRecord === 't') {
      return guessMissingBForBookAndContinuingResource(record, formOfItem);
    }

    // Note that 245$h should trigger LDR/06:a or t =>o change at some earlier point (outside this module)
    if (typeOfRecord === 'o' || typeOfRecord === 'p') { // o: Kit p: Mixed
      // We could guess multiple values from 300?
      return 'xxx';
    }

    if (typeOfRecord === 'r') { // three-dimensional form
      return 'tdf';
    }
    return undefined;
  }

  function getMissing336(record) {
    const [f336] = record.get('336');
    if (f336) {
      // nvdebug(fieldToString(f336));
      return undefined;
    }

    const b = guessMissing336B(record);

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

