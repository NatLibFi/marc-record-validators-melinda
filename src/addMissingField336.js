//import createDebugLogger from 'debug';
import {fieldToString, getCatalogingLanguage, nvdebug} from './utils.js';
import {getFormOfItem, map336CodeToTerm} from './field33XUtils.js';

const description = 'Add missing 336 field(s)';

// const multimediaRegexp = /multimedia/ui;

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
      if (['d', 'e'].includes(typeOfComputerFile)) { // d: N=400, e: N=50
        return ['txt'];
      }
      if (typeOfComputerFile === 'g') { // Videogame (N=10000+)
        // 2D moving image/tdi is an educated guess. Might be wrong for 3D games and Infocom-style text-based games.
        // Ref.: https://www.kiwi.fi/pages/viewpage.action?pageId=115966063#PelienRDAohje-Pelienjaottelu:videopelitjafyysisetpelit
        return ['tdi', 'cop'];
      }
      if (['b', 'f'].includes(typeOfComputerFile)) { // b: N=176, f: N=2
        return ['cop'];
      }
      if (['a', 'c'].includes(typeOfComputerFile)) { // c: N=152, a: N=36
        return ['cod'];
      }
      if (typeOfComputerFile === 'h') { // h: N=44
        return ['snd'];
      }
    }

    // ADD 256/300/516/XXX-based educated guesses here
    const guess = guessUsingFileFields();
    if (guess) {
      return guess;
    }
    function guessUsingFileFields() {
      const characteristics = record.get('(256|516)').map(f => fieldToString(f));
      if (characteristics.some(str => str.match(/(?:ohjelma)/gui))) {
        return ['cop'];
      }
      if (characteristics.some(str => str.match(/(?:daisy)/gui))) {
        return ['spw', 'txt']; // The convention is to put just 'spw' but this is technically correct
      }
      if (characteristics.some(str => str.match(/(?:äänikirja)/gui))) {
        return ['spw']; // This should be ['spw', 'txt'] but who am I to change conventions...
      }
      if (characteristics.some(str => str.match(/(?:book|e-bok|e-diss|e-avhand|kirja|e-thesis|tekstitiedosto|tidskrift|verkkoartikkeli|verkkokirja|verkkolehti)/gui))) {
        return ['txt'];
      }
      if (characteristics.some(str => str.match(/(?:peli)/gui))) {
        return ['tdi', 'cop'];
      }
      if (characteristics.some(str => str.match(/(?:data|tietokanta)/gui))) {
        return ['cod'];
      }
      if (characteristics.some(str => str.match(/(?:verkkoaineisto.*[0-9]\] s|PDF)/gui)) || characteristics.some(str => str.match(/\b(?:text|tekstiä?)\b/gui))) {
        return ['txt'];
      }
      if (characteristics.some(str => str.match(/(?:elokuva|liikkuva kuva)/gui))) {
        return ['tdi'];
      }
      if (characteristics.some(str => str.match(/(?:kartta)/gui))) {
        return ['cri']; // cri or crd, close enough anyhow, I guess
      }
      if (characteristics.some(str => str.match(/\b(?:kuvi?a)\b/gui))) {
        return ['tdi'];
      }

      return undefined;
    }


    if (['i', 'j', 'm'].includes(typeOfComputerFile)) { // (i: N=4800, m: N=566, j: N=111 )
      // Can we use field 300/516/256 to improve guess?
      return ['xxx'];
    }
    return ['zzz']; // unspecified
  }

  /*
  function deriveLanguageMaterials336sFrom007(record) {
    const categoryOfMaterial = [ // 007/00
      {category: 'a', rdacontent: 'cri'}, // cartographic image <- looks like a MP that has been classified as BK... One more reason to comment these..
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
  */

  function guessMissingBsForBookAndContinuingResource(record, formOfItem) {


    // This is from very old crap from usemarcon-cyrillux, but me not like it at all!
    /*
    const f245h = getTitleMedium(record);
    if (f245h && !multimediaRegexp.test(f245h)) {
      const result = deriveLanguageMaterials336sFrom007(record); // Base result on 007/00...
      if (result) {
        return result;
      }
    }
    */

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
    // Is braille and is not a model (we have 0). Changed the original usemarcon rule 007/01!=q to 007/01=q
    if (formOfItem === 'f' && record.fields.some(f => f.tag === '007' && f.value[0] === 'a' && f.value[1] === 'q')) {
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
        return ['tci']; // tactile image
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
      if (record.fields.some(f => f.tag === '007' && ['m', 'v', 'c'].includes(f.value[0]))) { // 'c' is a bit iffy, but I'll tune it only if it makes an error...
        return ['tdi']; // 2d moving pic
      }
    }

    if (typeOfRecord === 'm') { // electronic
      return guessMissingBsForComputerFile(record);
    }

    if (typeOfRecord === 'a' || typeOfRecord === 't') {
      return guessMissingBsForBookAndContinuingResource(record, formOfItem);
    }

    // Note that 245$h should trigger LDR/06:a or t =>o change at some earlier point (outside the scope of this module)
    if (typeOfRecord === 'o' || typeOfRecord === 'p') { // o: Kit p: Mixed
      if (['d', 'r'].includes(formOfItem)) { // d=isoteksti, r=eye-readable print
        return ['txt'];
      }
      // Not much I can guess from 300 etc
      return ['xxx']; // other
    }
    if (typeOfRecord === 'r') { // three-dimensional form
      return ['tdf'];
    }
    return ['zzz']; // unspecified
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

