//import createDebugLogger from 'debug';
import {fieldHasSubfield, fieldToString, getCatalogingLanguage, nvdebug} from './utils';
import {getFormOfItem, map338CodeToTerm} from './field33XUtils';

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
    if (newField) {
      return {message: [], valid: true};
    }
    const msg = `${description}: '${fieldToString(newField)}'`;
    return {message: [msg], valid: false};
  }


  function trimExtent(value) {
    return value.replace(/\([^)]*\)/gu, '').replace(/\[[^\]*]\]/gu, '').replace(/[0-9]/gu, '').replace(/^ +/gu, '').replace(/[ :;+]+$/gu, '').replace(/  +/gu, ' ');
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


  function extentToAudioCarrierType(record) {
    const extent = extractExtent(record); // trimmed 300$a
    if (!extent) {
      return undefined;
    }
    nvdebug(`AUDIO EXTENT: '${extent}`);
    if (extent.match(/^(?:audio discs?|[^ ]*ljudskiva|[^ ]*ljudskivor|LP-levy|LP-levyä|LP-skiva|LP-skivor|[^ ]*äänilevy)$/iu)) {
      return 'sd';
    }
    // Boldly assuming here that any cassette is audio
    if (extent.match(/^(?:audiocasettes?|C-kas[^ ]*|DAT-as[^ ]*|kasettia?|kassett|kassetter|ljudkassett|ljudkassetter|äänikasettia?)$/ui)) {
      return 'ss';
    }

    const typeOfRecord = record.getTypeOfRecord();
    if (['i', 'j'].includes(typeOfRecord) || record.fields.some(f => f.tag === '007' && f.value[0] === 's')) {
      if (extent.match(/^[^ ]*(?:levyä?|skiva|skivor)$/ui)) {
        return 'sd';
      }
      if (extent.match(/^[^ ]*(?:cassettes?|kasettia?|kassett|kassetter)$/ui)) {
        return 'ss';
      }
    }

    return undefined;
  }

  function extentToComputerCarrierType(record, formOfItem = '?') {
    const extent = extractExtent(record); // trimmed 300$a
    if (extent) {
      // What about USB etc?!?
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

  function extentToMicroformCarrierType(record) {
    const extent = extractExtent(record); // trimmed 300$a
    if (!extent) {
      return undefined;
    }
    // No instances in Melinda map to 'ha', 'hb', 'hc'

    if (extent.match(/^(?:filmikorttia?|microfiches?|mikrokorttia?)$/ui)) {
      // May be 'hg' as well? ("mikrokortti" vs "mikrokortti (läpinäkymätön)")
      if (getFormOfItem(record) === 'c') {
        return 'hg'; // Mikrokortti (läpinäkymätön)
      }
      return 'he';
    }

    if (extent.match(/^(?:microfilm rolls?|mikrofilmirullaa?(?: kelalla)?|mikrofilmsrullar|mikrofilmsrulle)$/ui)) {
      return 'hj';
    }


    return undefined;
  }

  // extentToMicroscopicCarrierType not really needed

  function extentToProjectedImageCarrierType(record) {
    const extent = extractExtent(record); // trimmed 300$a
    if (!extent) {
      return undefined;
    }
    if (extent.match(/^(?:diaa?|diabild|diabilder|slides?)$/ui)) {
      return 'gs';
    }
    if (extent.match(/^(?:overhead transparencies|overhead transparency|piirtoheitinkalvoa?|transparang|transparanger)$/ui)) {
      return 'gt';
    }
    if (extent.match(/^(?:film rolls?|filmirullaa?|filmrullar|filmrulle)$/ui)) {
      return 'mo';
    }
    return undefined;
  }

  // StereographicCarrierType not needed

  function extentToUnmediatedCarrierType(record) {
    const extent = extractExtent(record); // trimmed 300$a
    if (!extent) {
      return undefined;
    }

    return undefined;
  }

  function extentToVideoCarrierType(record) {
    const extent = extractExtent(record); // trimmed 300$a
    if (!extent) {
      return undefined;
    }
    // DVD-videoskivor etc
    if (extent.match(/^[^ ]*(?:videodiscs?|videolevyä?|videoskiva|videoskivor)$/ui)) {
      return 'vd';
    }
    if (extent.match(/^(?:videocassettes?|videokassett|videokassetter|videokasettia?)$/ui) || extent.match(/^(?:VHS)/ui)) {
      return 'vf';
    }
    return undefined;
  }

  function extentToCarrierType(record) {
    nvdebug(`EXTENT2CARRIERTYPE`);
    return extentToAudioCarrierType(record) ||
      extentToComputerCarrierType(record) ||
      extentToMicroformCarrierType(record) ||
      // Microscopic carriers don't really exist in our data
      extentToProjectedImageCarrierType(record) ||
      // Stereographic carriers don't really exist in our data
      extentToUnmediatedCarrierType(record) ||
      extentToVideoCarrierType(record);
  }

  function getComputerCarrierType(record) {
    const formOfItem = getFormOfItem(record);

    if (formOfItem === 'o') { // Online resource
      return 'cr';
    }

    const typeOfRecord = record.getTypeOfRecord();

    if (typeOfRecord !== 'm') {
      if (!['o', 'q', 's'].includes(formOfItem)) { // (Actually 'o' was already handled.) Probably not a computer carrier type
        return undefined;
      }
    }

    /* After re-reading, this seems illegal
    if (typeOfRecord === 'm') {
      const f007 = record.get('007');
      if (f007.length === 1) {
        // ca: none, cb: 10 or so, probably errors (typically USB)
        if (f007[0].value[0] === 'c' && f007[0].value[1] === 'o') {
          return 'cd';
        }
      }
    }
    */

    // Check fields 300$a (extent), 256$a (computer file characteristics), 516$a (type of computer file or data note), and possible 245$h (medium)
    const formOfItem2 = typeOfRecord === 'm' && formOfItem === '|' ? 's' : formOfItem; // handle '|'
    const cand = extentToComputerCarrierType(record, formOfItem2);
    if (cand) {
      return cand;
    }

    return undefined;
  }

  function getMicroformCarrierType(record) {
    const f007 = record.get('007');
    if (f007.length === 1 && f007[0].value[0] === 'h') {
      const materialDesignation = f007[0].value.charAt(1);
      // 007/00-01 does not seem exactly trustworthy, but can't blame us for crappy metadata...
      if (['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'j'].includes(materialDesignation)) {
        return `h${materialDesignation}`;
      }
    }

    const formOfItem = getFormOfItem(record);
    const cand = extentToMicroformCarrierType(record, formOfItem);
    if (cand) {
      return cand;
    }

    return undefined;
  }

  function isUnmediatedVolume(record) { // Volume/Nide
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
      // The only notable exception found in Melinda's tag=300 fields:
      if (record.get('300').some(f => f.subfields.some(sf => sf.code === 'a' && sf.value.match(/mikrofilmikela/iu)))) {
        return 'hd';
      }
      // Empically observed default in Melinda:
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
      return 'cr'; // already handled elsewhere, but keep this here as well
    }
    // 'q' local electronic stuff, use 300 et al to guess. Implemented elsewhere.
    // 'r' painojäljenne, arkki vs nide?
    // 's' electronic (might be local or online). Implemented elsewhere.
    return undefined;
  }

  function audioToField338(record) {
    nvdebug('AUDIO-TO-338');
    const typeOfRecord = record.getTypeOfRecord(record);
    if (typeOfRecord !== 'i' && typeOfRecord !== 'j') {
      return undefined;
    }
    const f007 = record.get('007');
    if (f007.length === 1 && f007[0].value[0] === 's') {
      const materialDesignation = f007[0].value.charAt(1);
      if (['d', 'e', 's', 't'].includes(materialDesignation)) {
        return `s${materialDesignation}`;
      }
      // 007/00-01 sr implies online resource, but we'll probably figure it out anyways
    }

    const extentToCode = extentToAudioCarrierType(record); // field 300
    if (extentToCode) {
      return extentToCode;
    }

    return undefined;
  }

  function projectedToField338(record) {
    const typeOfRecord = record.getTypeOfRecord(record);
    if (typeOfRecord !== 'g') { // must be "projected"
      return undefined;
    }

    const f007 = record.get('007');
    if (f007.length === 1) {
      if (f007[0].value[0] === 'g') {
        const materialDesignation = f007[0].value.charAt(1);
        if (['c', 'd', 'f', 's', 't'].includes(materialDesignation)) {
          return `g${materialDesignation}`;
        }
        if (materialDesignation === 'o') {
          return 'gf';
        }
      }
      if (f007[0].value[0] === 'v') {
        const materialDesignation = f007[0].value.charAt(1);
        if (['c', 'd', 'f', 'r'].includes(materialDesignation)) {
          return `v${materialDesignation}`;
        }
      }
    }

    const extentToCode = extentToVideoCarrierType(record) || extentToProjectedImageCarrierType(record); // field 300
    if (extentToCode) {
      return extentToCode;
    }

    return undefined;
  }

  function objectToField338(record) {
    const typeOfRecord = record.getTypeOfRecord(record);
    if (typeOfRecord === 'r') {
      // The only subdivision might be card/no. Marginal, so I'm not checking that now.
      return 'nr';
    }

    return undefined;
  }

  function educatedGuessIsOnlineResource(record) {
    const fields856 = record.get('856');

    if (fields856.some(f => f.ind1 === '4' && f.ind2 === '0')) {
      return 'cr';
    }

    return undefined;
  }

  function checkQualifyingInformation(record) {
    const identifierFields = record.get('(?:015|020|024|028)').filter(f => f.subfields.some(sf => sf.code === 'q'));
    if (identifierFields.some(f => f.subfields.some(sf => sf.code === 'q' && sf.value.match(/\b(?:hard-?cover|kierre|nid|sid|kovakant|pehmekant|pärmar)/iu)))) {
      return 'nc';
    }
    return undefined;
  }

  function educatedGuessToCarrierType(record) {


    return checkQualifyingInformation(record) || educatedGuessIsOnlineResource(record) || finalFallback();


    function finalFallback() {
      const [f337] = record.get('337');
      if (f337) {
        if (f337.subfields.some(sf => sf.code === 'b' && sf.value === 'n')) { // unmediated
          // As we are a library, most of the stuff are books
          return 'nc';
        }
      }
      return undefined;
    }


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
    return getComputerCarrierType(record) || // LDR/06=m (and 007 and 300)
      objectToField338(record) || // LDR/06=r
      audioToField338(record) || // LDR/06=i/j (and 007 and 300)
      projectedToField338(record) || // ...
      formOfItemToField338(record) || // 'a' 'b', 'c', 'o'
      getMicroformCarrierType(record) ||
      isUnmediatedVolume(record) ||
      extentToCarrierType(record) || // fallback: field 300-based guess
      educatedGuessToCarrierType(record); // 337$b='n' (käytettävissä ilman laitetta) -> nc

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

    const b = guessMissing338B(record) || 'zu';

    const catLang = getCatalogingLanguage(record) || 'fin';
    const a = map338CodeToTerm(b, catLang);
    const a2 = a ? a : 'z'; // unspecified

    const data = {tag: '338', ind1: ' ', ind2: ' ', subfields: [
      {code: 'a', value: a2},
      {code: 'b', value: b},
      {code: '2', value: 'rdacarrier'}
    ]};

    return data;
  }
}

