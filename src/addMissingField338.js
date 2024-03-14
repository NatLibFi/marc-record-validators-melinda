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


  function trimExtent(value) {
    return value.replace(/\([^)]*\)/gu, '').replace(/[0-9]/gu, '').replace(/^ +/gu, '').replace(/ +$/gu, '').replace(/  +/gu, ' ');
  }

  function extractExtent(record) {
    const [f300] = record.get('300');
    if (!f300) {
      return undefined;
    }
    const [a] = f300.subfields.filter(sf => sf.code === 'a');
    if (!a) {
      return undefined;
    }
    return trimExtent(a.value);
  }

  function extentToComputerCarrierType(record, formOfItem = '?') {
    const extent = extractExtent(record); // trimmed 300$a
    if (extent) {
      if (extent.match(/^(?:computer chip cartridge|datorminnesmodul|piirikotelo)$/ui)) {
        return 'cb'; // eg. Nintendo Switch games?
      }
      if (extent.match(/^(?:CD-ROM[^ ]*|levyke|levykettä)$/ui)) {
        return 'cd';
      }
      // Might be a video as well, thus the formOfItem check:
      if (['q', 's'].includes(formOfItem) && extent.match(/^(?:CD-levy|optinen levy|optisk skiva|optiska skivor|optista levyä)$/ui)) {
        return 'cd';
      }
      if (extent.match(/^(?:computer card|datorkort|minneskort|muistikortti)[^ ]*$/u)) { // Melinda only muistikortti
        return 'ck';
      }
      if (extent.match(/^(?:online resource|onlineresurs|verkkoaineisto)$/ui)) {
        return 'cr';
      }
    }

    return undefined;
  }

  function getComputerCarrierType(record) {
    const formOfItem = getFormOfItem(record);

    if (formOfItem === 'o') { // Online resource
      return 'cr';
    }

    const typeOfRecord = record.getTypeOfRecord();

    if (typeOfRecord !== 'm' && !['o', 'q', 's'].includes(formOfItem)) { // (Actually 'o' was already handled.) Probably not a computer carrier type
      return undefined;
    }

    if (typeOfRecord === 'm') {
      const f007 = record.get('007').filter(f => f.value[0] === 'c');
      if (f007.length === 1) {
        // ca: none, cb: 10 or so, probably errors (typically USB)
        if (f007.value[1] === 'o') {
          return 'cd';
        }
      }
    }


    // Check fields 300$a (extent), 256$a (computer file characteristics), 516$a (type of computer file or data note), and possible 245$h (medium)
    const formOfItem2 = typeOfRecord === 'm' && formOfItem === '|' ? 's' : formOfItem; // handle '|'
    const cand = extentToComputerCarrierType(record, formOfItem2);
    if (cand) {
      return cand;
    }


    return undefined;
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
      return 'nc'; // HANDLE ARKKI! ETC...
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
    if (formOfItem === 'c') { // Deviates from usemarcon-bookwhere-rda. Fix it? Check data?
      return 'hg'; // Mikrokortti (läpinäkymätön). We have none in Melinda it seems... Add test?
    }
    // 'd' isoteksti
    // 'e' sanomalehti (for CR only)
    // 'f' pistekirjoitus
    if (formOfItem === 'o') { // online resource
      return 'cr'; // add test!
    }
    // if (formOfItem === 'q') { // local electronic stuff, use 300 et al to guess
    // 'r' painojäljenne, arkki vs nide?
    // if (formOfItem === 's') { // electronic, either 'o' or 'q'... Can share some code

    //if (formOfItem === 'q') {
    // 300 USB should map to muistikortti/ck. Small sample implies that there are lots of errors in our data.
    //}
    return undefined;
  }

  function typeOfRecordToField338(record) {
    const typeOfRecord = record.getTypeOfRecord(record);
    if (typeOfRecord === 'r') {
      // The only subdivision might be card/no. Marginal, so I'm not checking that now.
      return 'nr';
    }

    return undefined;
  }

  function guessMissing338B(record) {
    // Data sources (which should be trusted most?)
    // LDR/06
    // 007
    // 008/form of item
    // 300
    // 256
    // 516
    // 245$h...
    // First use form of item?
    return getComputerCarrierType(record) || typeOfRecordToField338(record) || formOfItemToField338(record) || isUnmediatedVolume(record);

    /*
    const firstFunction = guessFunctions.find(f => f(record));
    if (firstFunction) {
      return firstFunction(record);
    }

    return undefined;
    */
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

