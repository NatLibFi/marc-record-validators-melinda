import clone from 'clone';
import createDebugLogger from 'debug';
import {fieldHasSubfield, fieldToString, nvdebug} from './utils.js';


const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:translate-terms');
const defaultTags = ['648', '650', '651', '655'];

const swapLanguageCode = {'fin': 'swe', 'fi': 'sv', 'sv': 'fi', 'swe': 'fin'};
const changeAbbrHash = {'fi': 'fin', 'fin': 'fi', 'sv': 'swe', 'swe': 'sv'};

const termCache = {};

// Author(s): Nicholas Volk
export default function () {


  return {
    description: 'Translate yso (648, 650, 651) and slm (655) terms (FIN <=> SWE)',
    validate, fix
  };

  async function fix(record) {
    const newFields = await getFields(record, defaultTags, []);

    newFields.forEach(nf => nvdebug(`Add new field '${fieldToString(nf)}'`, debug));

    newFields.forEach(nf => record.insertField(nf));

    const newFieldsAsStrings = newFields.map(f => fieldToString(f));


    return {message: [], fix: newFieldsAsStrings, valid: true};
  }

  async function validate(record) {
    const newFields = await getFields(record, defaultTags, []);
    if (newFields.length === 0) {
      return {'message': [], 'valid': true};
    }
    const messages = newFields.map(f => fieldToString(f));

    return {'message': messages, 'valid': false};
  }

  async function getFields(record, tags, fieldsToAdd) {
    const [currTag, ...remainingTags] = tags;
    if (!currTag) {
      return fieldsToAdd;
    }
    const missingFields = await deriveMissingFields(record, currTag);

    const tmp = await getFields(record, remainingTags, [...fieldsToAdd, ...missingFields]);
    return tmp;
  }

  function getPairlessFinnishAndSwedishFields(record, tag) {
    const expectedLex = mapTagToLex(tag);
    if (!expectedLex) {
      return [];
    }
    const fields = record.get(tag);
    const finnishFields = fields.filter(f => isTranslatable(f, 'fin'));
    const swedishFields = fields.filter(f => isTranslatable(f, 'swe'));
    const finnishOnly = getMisses(finnishFields, swedishFields);
    const swedishOnly = getMisses(swedishFields, finnishFields);

    //console.log(` Looking at ${finnishOnly.length} + ${swedishOnly.length} fields`); // eslint-disable-line no-console
    return [...finnishOnly, ...swedishOnly].filter(f => tagAndFieldAgree(f));

    function tagAndFieldAgree(field) {
      // Check that tag and $2 value are pairable:
      const lexData = getLexiconAndLanguage(field); // $2 data
      return expectedLex === lexData.lex;
    }
  }

  async function deriveMissingFields(record, tag) {
    const pairlessFields = getPairlessFinnishAndSwedishFields(record, tag);

    // Dunno how to handle loop+promise combo in our normal coding style. Spent half a day trying... (I reckon it takes like 2 minuts to do this properly...)
    // Did a proper implementation in drop-terms.js...
    let prefLabels = [];
    for (let i=0; i < pairlessFields.length; i += 1) {
      prefLabels[i] = await getPrefLabel(pairlessFields[i]);
    }

    const missingFields = pairlessFields.map((f, i) => pairField(f, prefLabels[i]));
    return missingFields.filter(f => f);
  }

  function pairField(field, prefLabels) {
    if (!prefLabels) {
      return undefined;
    }
    //console.log(`pairField() WP 1: ${fieldToString(field)}`); // eslint-disable-line no-console
    const lexAndLang = getLexiconAndLanguage(field);
    //console.log(`pairField() WP 2: ${JSON.stringify(lexAndLang)}`); // eslint-disable-line no-console
    const twoLetterOtherLang = swapLanguageCodeBetweenLanguages(changeAbbr(lexAndLang.lang));
    const prefLabel = prefLabels.find(l => l.lang === twoLetterOtherLang);
    //console.log(`pairField() WP 4: ${JSON.stringify(prefLabel)}`); // eslint-disable-line no-console
    const sfA = {'code': 'a', 'value': prefLabel.value}; // field.subfields.field(sf => sf.code === 'a');
    const sf0 = clone(field.subfields.find(sf => sf.code === '0'));
    const sf2 = {'code': '2', 'value': `${lexAndLang.lex}/${lexAndLang.lang === 'fin' ? 'swe' : 'fin'}`}; // swap fin <=> swe
    const newField = {tag: field.tag, ind1: field.ind1, ind2: field.ind2, subfields: [sfA, sf2, sf0]};
    return newField;
  }



  async function getPrefLabel(field) {
    // Pre-requisite: tag vs $2 correlation has already been checked!
    const uri = fieldToUri(field);
    if (!uri) { // $0 is invalid or sumthing
      return undefined;
    }

    const data = await getTermData(uri);

    if (!data) { // Sanity check. Miss caused by illegal id etc.
      nvdebug(`No labels found for ${uri}`, debug);
      return undefined;
    }

    const prefLabels = data.prefLabel;

    const lexData = getLexiconAndLanguage(field); // $2 data
    const lang = changeAbbr(lexData.lang); // fi <=> fin (finto use 2 chars, we use 3-letters)
    const subfieldA = field.subfields.find(sf => sf.code === 'a');

    if (isLabel(prefLabels, subfieldA.value, lang)) {
      return prefLabels;
    }
    return undefined;
  }


  function fieldToUri(field) {
    const lex = mapTagToLex(field.tag);

    const subfield0 = field.subfields.find(sf => sf.code === '0');
    const id = subfield0.value.replace(/^[^0-9]+/u, '');
    return buildUri(lex, id);
  }

  function isTranslatable(field, lang) {
    const fieldAsString = fieldToString(field);

    // We should probably allow an optional $8 as the first subfield.
    if (!fieldAsString.match(/^... #7 (?: ‡8 [^‡]+ )*‡a [^‡]+ ‡2 [^‡]+ ‡0 [^‡]+(?: ‡9 [A-Z]+<(?:KEEP|DROP)>)*$/u)) {
      return false;
    }
    const lex = mapTagToLex(field.tag);
    const lexLang = `${lex}/${lang}`;
    if (!fieldHasSubfield(field, '2', lexLang)) {
      return false;
    }
    return fieldHasValidSubfield0(field);
  }


  function getMisses(fieldList1, fieldList2) {
    return fieldList1.filter(f => !hasSubfield0Match(f, fieldList2));
  }

  function hasSubfield0Match(field, pairFields) {
    const subfield0 = field.subfields.find(sf => sf.code === '0');
    return pairFields.some(f => f.subfields.some(sf => sf.code === '0' && sf.value === subfield0.value));
  }





  /*
  function getValidIdentifiers(record, tag, lang) {
    const lex = mapTagToLex(tag);
    const subfield2Value = `${lex}/${lang}`;
    const candFields = record.get(tag).filter(f => f.subfields.some(sf => sf.code === '2' && sf.value === subfield2Value)); // TODO: filter
    return [];
  }
    */

}

export function fieldHasValidSubfield0(field, defaultLex = undefined) {
  const lex = defaultLex || mapTagToLex(field.tag);
  return field.subfields.some(sf => isValidSubfield0(sf, lex));
}

export function isValidSubfield0(subfield, lex = '???') {
  if (subfield.code !== '0') {
    return false;
  }
  if (['yso', 'yso/fin', 'yso/swe'].includes(lex) && subfield.value.match(/^http:\/\/www\.yso\.fi\/onto\/yso\/p[0-9]+$/u)) {
    return true;
  }
  if (['slm', 'slm/fin', 'slm/swe'].includes(lex) && subfield.value.match(/^http:\/\/urn\.fi\/URN:NBN:fi:au:slm:s[0-9]+$/u)) {
    return true;
  }
  return false;
}


export function buildUri(lex, id) {
  if (['yso', 'yso/fin', 'yso/swe'].includes(lex)) {
    //return `http%3A%2F%2Fwww.yso.fi%2Fonto%2Fyso%2Fp${id}`;
    return `http://www.yso.fi/onto/yso/p${id}`;
  }
  if (['slm', 'slm/fin', 'slm/swe'].includes(lex)) {
    return `http://urn.fi/URN:NBN:fi:au:slm:s${id}`;
  }
  return undefined;
}

function mapTagToLex(tag) {
  if (tag === '655') {
    return 'slm';
  }
  return 'yso';
}

export async function getTermData(uri) {
  nvdebug(`getTermData(${uri})`);
  if (termCache[uri]) { // Don't think current implementation uses the cache any more.
    //console.log(`CACHED ${uri}`); // eslint-disable-line no-console
    return termCache[uri];
  }
  const tmp = await getTermDataFromFinto(uri);
  termCache[uri] = tmp;
  return tmp;
}

async function getTermDataFromFinto(uri) {
    const headers = {'Accept': 'application/json'};
    const uri2 = swaggerQuery(uri);
    nvdebug(`FINTO URL ${uri2}`);
    const response = await fetch(uri2, {method: 'GET', headers});
    if (!response.ok) {
      return undefined;
    }
    const json = await response.json();

    if (!json.graph) {
      return undefined;
    }
    const arr = json.graph;
    const [hit] = arr.filter(row => row.uri === uri);
    console.log(`NEW JSON: ${JSON.stringify(hit.prefLabel)}`); // eslint-disable-line no-console
    return { prefLabel: hit.prefLabel, altLabel: hit.altLabel };

    function swaggerQuery(uri) {
      // This would work for only yso, not yso-paikat etc `https://api.finto.fi/rest/v1/yso/data?format=application%2Fjson&uri=${uri}`;
      return `https://api.finto.fi/rest/v1/data?uri=${uri}&format=application%2Fjson`; // This is simpler, but contains more irrelevant data
    }

}

export function getLexiconAndLanguage(field) {
  // Assumes that field has exactly one $2
  const subfield2 = field.subfields.find(sf => sf.code === '2');
  if (subfield2) {
    if (subfield2.value === 'slm/fin') {
      return {'lex': 'slm', 'lang': 'fin'};
    }
    if (subfield2.value === 'slm/swe') {
      return {'lex': 'slm', 'lang': 'swe'};
    }
    if (subfield2.value === 'yso/fin') {
      return {'lex': 'yso', 'lang': 'fin'};
    }
    if (subfield2.value === 'yso/swe') {
      return {'lex': 'yso', 'lang': 'swe'};
    }
  }
  return {};
}



export function isLabel(labels, term, lang = undefined) {
  const twoLetterLanguageCode = lang && lang.length === 3 ? changeAbbr(lang) : lang;
  return labels.some(l => isMatch(l));

  function isMatch(label) {
    if (label.value !== term) {
      return false;
    }
    if (!twoLetterLanguageCode) { // If lanuguage code is not defined, any hit will do
      return true;
    }
    return label.lang === twoLetterLanguageCode;
  }
}


  function changeAbbr(abbr) {
    if (changeAbbrHash[abbr]) {
      return changeAbbrHash[abbr];
    }
    return abbr;
  }


  function swapLanguageCodeBetweenLanguages(code) {
    if (swapLanguageCode[code]) {
      return swapLanguageCode[code];
    }
    return code;
  }