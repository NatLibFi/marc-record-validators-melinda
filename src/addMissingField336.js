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
    const newFields = getMissing336s(record);
    nvdebug(` GOT ${newFields.length}...`);
    // FFS: we actually need newFields array here! Videogame, for example, might be
    // 336 ## ‡a kaksiulotteinen liikkuva kuva ‡b tdi ‡2 rdacontent
    // 336 ## ‡a tietokoneohjelma ‡b cop ‡2 rdacontent
    const res = {message: [], fix: [], valid: true};
    if (newFields.length) {
      newFields.forEach(f => record.insertField(f));
      return res;
    }
    return res;
  }

  function validate(record) {
    nvdebug(`VALIDATE ${description}...`);
    const newFields = getMissing336s(record);
    if (newFields.length === 0) {
      return {message: [], valid: true};
    }
    const strings = newFields.map(f => fieldToString(f));
    const tmp = strings.join('\', \'');
    const msg = `${description}: '${tmp}'`;
    return {message: [msg], valid: false};
  }

  function guessMissingBsForComputerFile(record) {
    const [field008] = record.get('008');
    const typeOfComputerFile = field008 && field008.value ? field008.value[26] : undefined;

    if (typeOfComputerFile) {
      if (['d', 'e'].includes(typeOfComputerFile)) {
        return ['txt'];
      }
      if (typeOfComputerFile === 'g') { // Videogame
        // 2D moving image/tdi is an educated guess. Might be wrong for 3D games and Infocom-style text-based games.
        // Ref.: https://www.kiwi.fi/pages/viewpage.action?pageId=115966063#PelienRDAohje-Pelienjaottelu:videopelitjafyysisetpelit
        return ['tdi', 'cop'];
      }
      if (['b', 'f'].includes(typeOfComputerFile)) {
        return ['cop'];
      }
      if (['a', 'c'].includes(typeOfComputerFile)) {
        return ['cod'];
      }
      if (typeOfComputerFile === 'h') {
        return ['snd'];
      }
      if (['i', 'j', 'm'].includes(typeOfComputerFile)) {
        return ['xxx'];
      }
    }
    return ['zzz']; // unspecified
  }

  function deriveLanguageMaterials336sFrom007(record) {
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
        return [row.rdacontent];
      }
    }
    return [];
  }

  function guessMissingBsForBookAndContinuingResource(record, formOfItem) {

    const f245h = getTitleMedium(record);
    if (f245h && !multimediaRegexp.test(f245h)) {
      const result = deriveLanguageMaterials336sFrom007(record); // Base result on 007/00. Aped from usemarcon-cyrillux. I don't like this at all... Shouldn't we check $h value as well...
      if (result) {
        return result;
      }
    }

    //const bibliographicalLevel = record.getBibliograpicLevel(); // Bloody h-drop typo...
    //const isBis = ['b', 'i', 's'].includes(bibliographicalLevel);
    //if (!isBis) {
    if (formOfItem === 'f') {
      return ['tct']; // tactile text
    }
    return ['txt']; // Default BK format is text
  }

  function guessMissingBsForMap(record) {
    const formOfItem = getFormOfItem(record);
    // Is braille and is not a model:
    if (formOfItem === 'f' && record.fields.some(f => f.tag === '007' && f.value[0] === 'a' && f.value[1] !== 'q')) {
      return ['crt']; // Cartographic tactile image
    }
    const [field008] = record.get('008');
    if (field008 && field008.value[25] === 'd') { // globe (cool, but we really don't have these)
      return ['crf']; // map 3D form
    }
    return ['cri']; // default cartographic image
  }

  function guessMissing336Bs(record) {
    const typeOfRecord = record.getTypeOfRecord();

    if (typeOfRecord === 'i') {
      return ['spw'];
    }
    if (typeOfRecord === 'j') {
      return ['prm']; // performed music
    }

    if (typeOfRecord === 'e' || typeOfRecord === 'f') {
      return guessMissingBsForMap(record);
    }

    const formOfItem = getFormOfItem(record);

    if (typeOfRecord === 'k') {
      if (formOfItem === 'f') {
        return ['tci'];
      }
      return ['sti'];
    }

    if (typeOfRecord === 'c' || typeOfRecord === 'd') {
      if (formOfItem === 'f') {
        return ['tcm']; // tactile notated music
      }
      return ['ntm']; // notated music
    }

    if (typeOfRecord === 'g') {
      if (record.fields.some(f => f.tag === '007' && f.value[0] === 'g')) {
        return ['sti']; // still image
      }
      if (record.fields.some(f => f.tag === '007' && ['m', 'v', 'c'].includes(f.value[0]))) {
        return ['tdi']; // 2d moving pic
      }
    }

    if (typeOfRecord === 'm') { // electronic
      return guessMissingBsForComputerFile(record);
    }

    if (typeOfRecord === 'a' || typeOfRecord === 't') {
      return guessMissingBsForBookAndContinuingResource(record, formOfItem);
    }

    // Note that 245$h should trigger LDR/06:a or t =>o change at some earlier point (outside this module)
    if (typeOfRecord === 'o' || typeOfRecord === 'p') { // o: Kit p: Mixed
      // We could guess multiple values from 300?
      return ['xxx'];
    }

    if (typeOfRecord === 'r') { // three-dimensional form
      return ['tdf'];
    }
    return [];
  }


  function codeToField(b, catLang) {
    const a = map336CodeToTerm(b, catLang);
    const data = {tag: '336', ind1: ' ', ind2: ' ', subfields: [
      {code: 'a', value: a},
      {code: 'b', value: b},
      {code: '2', value: 'rdacontent'}
    ]};

    return data;
  }

  function getMissing336s(record) {
    const f336 = record.get('336');
    if (f336.length > 0) {
      return [];
    }

    const bees = guessMissing336Bs(record); // bees = b-subfields
    nvdebug(` WE HAVE ${bees.length} BEES: ${bees.join(', ')}`);


    return bees.map(b => codeToField(b, getCatalogingLanguage(record, 'fin')));
  }
}

