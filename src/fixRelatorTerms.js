import clone from 'clone';
import {fieldFixPunctuation} from './punctuation2';
import {fieldToString, getCatalogingLanguage, nvdebug, subfieldToString} from './utils';
import createDebugLogger from 'debug';

// Currently mainly translates X00$e values, so that we don't have "$a Name, $e kirjoittaja, $e författare.".
// Later on we could try and handle $4 stuff here as well.


const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:fixRelatorterms');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

export default function () {
  return {
    description: 'Fix $e subfields in field [1678][01]0 and 720',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};

    const language = getCatalogingLanguage(record);

    record.fields.forEach(field => {
      fieldFixRelatorTerms(field, language, language);
    });

    return res;
  }

  function validate(record) {
    const res = {message: []};

    const language = getCatalogingLanguage(record);

    record.fields.forEach(field => {
      const clonedField = clone(field);
      // Rather hackily/abnormally use language as both fromLanguage and toLanguage.
      // fromLanguage is used to expand "esitt." => "esittäjä".
      // toLanguage is used by translations (fixes "författere" to "kirjoittaja", if 040$b is "fin")
      fieldFixRelatorTerms(field, language, language);
      const clonedFieldAsString = fieldToString(clonedField);
      const fieldAsString = fieldToString(field);
      if (fieldAsString !== clonedFieldAsString) {
        res.message.push(`${fieldAsString} => ${clonedFieldAsString}`);
      }
    });

    res.valid = !(res.message.length >= 1);
    return res;
  }
}


/*
export default () => (base, source) => {
  recordTranslateRelatorTerms(base);
  recordTranslateRelatorTerms(source);
  recordHandleRelatorTermAbbreviations(base);
  recordHandleRelatorTermAbbreviations(source);
  const result = {base, source};
  return result;
};
*/


// Partial source: https://marc21.kansalliskirjasto.fi/funktiot_koodit.htm
// https://wiki.helsinki.fi/display/MARC21svenska/Funktions-+och+relationskoder+-+alfabetiskt+efter+funktion
// New, better source: https://id.kb.se/find?q=relator&_sort=_sortKeyByLang.en


// NB! How to handle German sex-based Verfasser/Verfasserin pairs?
const relatorTerms = [
  {'code': 'arr', 'eng': 'arranger', 'fin': 'sovittaja', 'swe': 'arrangör av musikalisk komposition'},
  {'code': 'art', 'eng': 'artist', 'fin': 'taiteilija', 'swe': 'konstnär'},
  {'code': 'aui', 'eng': 'author of introduction', 'fin': 'esipuheen tekijä'},
  {'code': 'aut', 'eng': 'author', 'fin': 'kirjoittaja', 'swe': 'författare'},
  {'code': 'cmp', 'eng': 'composer', 'fin': 'säveltäjä', 'swe': 'kompositör'},
  {'code': 'drt', 'eng': 'director', 'fin': 'ohjaaja', 'swe': 'regissör'},
  {'code': 'edt', 'eng': 'editor', 'fin': 'toimittaja', 'swe': 'redaktör'},
  {'code': 'ill', 'eng': 'illustrator', 'fin': 'kuvittaja', 'swe': 'illustratör'},
  {'code': 'lyr', 'eng': 'lyricist', 'fin': 'sanoittaja', 'swe': 'sångtext'},
  {'code': 'nrt', 'eng': 'narrator', 'fin': 'kertoja', 'swe': 'berättare'}, // berättare/inläsare
  {'code': 'pbl', 'eng': 'publisher', 'fin': 'julkaisija', 'swe': 'utgivare'},
  {'code': 'pht', 'eng': 'photographer', 'fin': 'valokuvaaja', 'swe': 'fotograf'},
  {'code': 'prf', 'eng': 'performer', 'fin': 'esittäjä', 'swe': 'framförande'},
  {'code': 'pro', 'eng': 'producer', 'fin': 'tuottaja', 'swe': 'producent'},
  {'code': 'trl', 'eng': 'translator', 'fin': 'kääntäjä', 'swe': 'översättare'},
  {'code': '__FAKE_VALUE1__', 'fin': 'sarjakuvantekijä', 'swe': 'serieskapare'}
];

/*
function recordNormalizeRelatorTerms(record, defaultLanguageCode = undef) {
  const languageCode = defaultLanguageCode ? defaultLanguageCode : getCatalogingLanguage(record);
  if  (!languageCode || ['eng', 'fin', 'swe'].includes(languageCode)) {
    return;
  }

}
*/


const finnishAbbreviations = {
  'esitt.': 'esittäjä',
  'käänt.': 'kääntäjä',
  'näytt.': 'näyttelijä',
  'san.': 'sanoittaja',
  'sov.': 'sovittaja',
  'säv.': 'säveltäjä',
  'toim.': 'toimittaja',
  // Quick and dirty implementation of https://github.com/NatLibFi/USEMARCON-BOOKWHERE-RDA/blob/master/bw_rda_kyril.rul#L651
  // As per M.I./Slavica
  'худож.': 'kuvittaja',
  'пер.': 'kääntäjä',
  'сост.': 'toimittaja', // might also be 'kokoaja'
  'ред.': 'toimittaja'
};

function subfieldHandleRelatorTermAbbreviation(subfield, language) {
  if (subfield.code !== 'e') {
    return;
  }
  nvdebug(`Relator cand subfield: '${subfieldToString(subfield)}', lang: ${language ? language : 'NULL'}`, debugDev);
  if (!language || language === 'mul') {
    subfieldHandleRelatorTermAbbreviation(subfield, 'fin');
    // Maybe later add Swedish here...
    return;
  }
  const value = subfield.value.replace(/,$/u, '');
  const punc = value === subfield.value ? '' : ',';

  const lcValue = value.toLowerCase(); // Check Å, Ä, Ö...

  // NB: Policy: if no language or multi-language: apply all rules! (Not much overlap I hope...)
  if (!language || language === 'fin' || language === 'mul') {
    nvdebug(`Relator try Finnish for '${lcValue}}'...`, debugDev);
    if (lcValue in finnishAbbreviations) {
      const hit = `${finnishAbbreviations[lcValue]}${punc}`;
      nvdebug(`Relator hit: ${hit}`, debugDev);
      // NB! 'esitt.' => 'esittäjä'
      subfield.value = hit;
      return;
    }
  }
}


function isRelatorField(field) {
  // Tag list might be incomplete!
  return field.tag.match(/^(?:100|110|600|610|700|710|720|800|810)$/u);
}

function fieldHandleRelatorTermAbbreviations(field, language) {
  if (!isRelatorField(field)) {
    return;
  }

  const originalValue = fieldToString(field);
  field.subfields.forEach(sf => subfieldHandleRelatorTermAbbreviation(sf, language)); // eslint-disable-line array-callback-return
  const modifiedValue = fieldToString(field);
  if (modifiedValue === originalValue) {
    return;
  }
  // Changes have happened... Try to punctuate.
  // (NB! We need punctuation as a module, if we are to make abbr expansion a marc-record-validators-melinda validator/fixer)
  fieldFixPunctuation(field);
}

function termIsInGivenLanguage(term, language) {
  return relatorTerms.some(row => language in row && row[language] === term);
}

function anyToLanguage(originalTerm) {
  // Sometimes there's no 040$b or 040$b and, say, 040$b and 700$e value don't correlate
  if (termIsInGivenLanguage(originalTerm, 'fin')) {
    return 'fin';
  }
  if (termIsInGivenLanguage(originalTerm, 'swe')) {
    return 'swe';
  }
  if (termIsInGivenLanguage(originalTerm, 'eng')) {
    return 'eng';
  }
  return null;
}

function translateRelatorTerm(originalTerm, defaultFromLanguage, toLanguage) {

  // originalTerm is supposed to be normal version (abbrs have been expanded), possibly with punctuation
  const term = originalTerm.replace(/[,.]$/u, '');
  nvdebug(`Try to translate '${term}' from ${defaultFromLanguage} to ${toLanguage}`, debugDev);

  // Kind of hacky... If term is in toLanguage, do nothing. defaultFromLanguage (040$b) isn't that reliable.
  if (termIsInGivenLanguage(term, toLanguage)) {
    return originalTerm;
  }
  // defaultFomLanguage (typically 040$b) isn't that reliable:
  const fromLanguage = defaultFromLanguage === null || !termIsInGivenLanguage(term, defaultFromLanguage) ? anyToLanguage(term) : defaultFromLanguage;

  const [candRow] = relatorTerms.filter(row => fromLanguage in row && toLanguage in row && row[fromLanguage] === term);
  if (candRow) {
    const punc = term === originalTerm ? '' : originalTerm.slice(-1);
    const translation = `${candRow[toLanguage]}${punc}`;
    nvdebug(`Translate relator term: ${originalTerm} => ${translation}`, debugDev);
    return translation;
  }
  return originalTerm;
}

function subfieldTranslateRelatorTerm(subfield, fromLanguage, toLanguage) {
  if (subfield.code !== 'e') {
    return;
  }
  subfield.value = translateRelatorTerm(subfield.value, fromLanguage, toLanguage);
}

export function fieldFixRelatorTerms(field, fromLanguage, toLanguage) {
  // fromLanguage can not be relied upon.
  if (!isRelatorField(field)/* || fromLanguage === toLanguage*/) {
    return;
  }
  fieldHandleRelatorTermAbbreviations(field, fromLanguage);

  field.subfields.forEach(sf => subfieldTranslateRelatorTerm(sf, fromLanguage, toLanguage)); // eslint-disable-line array-callback-return
}


export function recordFixRelatorTerms(record, defaultToLanguage = null, defaultFromLanguage = null) { // WAS: translateRecord()
  const fromLanguage = defaultFromLanguage ? defaultFromLanguage : getCatalogingLanguage(record);
  const toLanguage = defaultToLanguage ? defaultToLanguage : getCatalogingLanguage(record);

  record.fields.forEach(field => translateField(field, fromLanguage, toLanguage)); // eslint-disable-line array-callback-return

  function translateField(field, from, to) {
    fieldFixRelatorTerms(field, from, to);
  }
}


