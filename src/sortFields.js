// Taken from project marc-record-js, file marcSortFields.js as this contains more and more Melinda-specific rules.

import clone from 'clone';
//import createDebugLogger from 'debug';
import {fieldHasSubfield, fieldToString} from './utils';
import {sortByTag, sortAlphabetically, fieldOrderComparator as globalFieldOrderComparator} from '@natlibfi/marc-record/dist/marcFieldSort';
import {isValidSubfield8} from './subfield8Utils';
import {fieldGetUnambiguousOccurrenceNumber, fieldGetUnambiguousTag} from './subfield6Utils';

//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:sortFields');
//const debugData = debug.extend('data');
//const debugDev = debug.extend('dev');

const BIG_BAD_NUMBER = 999999999;
export default function () {

  return {
    description: 'Sort fields using both generic and Melinda specific rules',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};

    record.fields.sort(fieldOrderComparator);

    return res;
  }

  function validate(record) {
    const res = {message: []};

    const fields = record.fields.map(f => clone(f));
    fields.sort(fieldOrderComparator);


    const relocatedFields = fields.filter((f, i) => fieldToString(f) !== fieldToString(record.fields[i]));

    if (relocatedFields.length > 0) {
      res.message.push(`${relocatedFields.length} field(s) in new places`);
    }

    res.valid = !(res.message.length >= 1);
    return res;
  }
}


const relatorTermScore = { // Here bigger is better
  // NB! This is exportable as field internal $e sorting in marc-record-validators-js uses this.
  // NB! The more abstract, the earlier it appears.
  // Note that terms with same abstraction level might also have order preferences
  // We should 1) check the order of these, and 2) add translations (support Swedish at the very least)
  // work/teos > expression/ekspressio > manifestation/manifestaatin,
  // Work https://finto.fi/mts/fi/page/m1298
  'säveltäjä': 100, 'composer': 100,
  'kirjoittaja': 100, 'author': 100,
  'libretisti': 100,
  'sarjakuvantekijä': 100, 'soitonoppaan tekijä': 100,
  'kartantekijä': 99,
  'taiteilija': 98,
  'designer': 90,
  'sanoittaja': 90,
  'käsikirjoittaja': 90,

  'kuvaaja': 89, 'valokuvaaja': 89,
  'kokoaja': 86,
  'alkuperäisidean luoja': 85,
  'teoksella kunnioitettu': 84, 'gratulaation kohde': 84,
  'julkaisija': 82,
  'tuottaja': 81,
  // expression: https://finto.fi/mts/fi/page/m153
  'sovittaja': 79, 'arranger': 79,
  'toimittaja': 78, 'editor': 78,
  'kuvittaja': 77,
  'esipuheen kirjoittaja': 76,
  'alkusanojen kirjoittaja': 75, 'loppusanojen kirjoittaja': 75,

  'esittäjä': 74,
  'johtaja': 73, // orkesterinjohtaja
  'editointi': 71, // for music, editor/toimittaja is another thing
  'kääntäjä': 70,
  'lukija': 61, 'kertoja': 61,
  // Manifestation level: https://finto.fi/mts/fi/page/m491
  'graafinen suunnittelija': 50,
  'kustantaja': 41
  // Item level: https://finto.fi/mts/fi/page/m1157
};

const relatorTermScoreBk = {
  // https://finto.fi/mts/fi/page/m34 100-81
  'libretisti': 100, 'sarjakuvantekijä': 100,
  'kirjoittaja': 99, 'author': 99, 'soitonoppaan tekijä': 99,
  'kuvaaja': 98, 'valokuvaaja': 98,
  'kokoaja': 86, 'designer': 86,
  'alkuperäisidean luoja': 85,
  'teoksella kunnioitettu': 84, 'gratulaation kohde': 84,
  'säveltäjä': 83, // if 300$e has CD etc
  'sanoittaja': 82,
  'julkaisija': 81,
  // expression: https://finto.fi/mts/fi/page/m153
  'toimittaja': 78,
  'kuvittaja': 77,
  'esipuheen kirjoittaja': 76,
  'alkusanojen kirjoittaja': 75, 'loppusanojen kirjoittaja': 75,
  'kääntäjä': 70,
  'sovittaja': 50,
  // manifestaatio
  'graafinen suunnittelija': 40,
  // kappale/item
  'sitoja': 25,
  'gratulaation kirjoittaja': 24
};

const relatorTermScoreMu = {
  'säveltäjä': 100,
  'sanoittaja': 99,
  'soitonoppaan tekijä': 98,
  'alkuperäisidean luoja': 85,
  'teoksella kunnioitettu': 81,
  // expression: https://finto.fi/mts/fi/page/m153
  'sovittaja': 79,
  'johtaja': 78,
  'esittäjä': 77,
  'lukija': 76,
  'miksaaja': 75,
  // manifestaatio
  'esittäjä (manifestaatio)': 69,

  'graafinen suunnittelija': 50,
  'valmistaja': 41,
  'jakaja': 40
  // kappale/item

};

const relatorTermScoreVm = { // Visual Material
  // Work
  'ohjaaja': 100,
  'kirjoittaja': 99, 'author': 99, // Here we assume that film/whatever is based on author's book
  'käsikirjoittaja': 98, 'designer': 98,
  'kuvaaja': 89,
  'säveltäjä': 86, // Volatile. John Williams?
  'alkuperäisidean luoja': 85,
  'julkaisija': 82,
  'tuottaja': 81,
  // Expression
  'leikkaaja': 80,
  'sovittaja': 79,
  'johtaja': 78,
  'esittäjä': 77,
  'lukija': 76,
  'miksaaja': 75,
  'kääntäjä': 70,
  // Manifestation
  'kaivertaja': 60,
  'graafinen suunnittelija': 59,
  'kustantaja': 42,
  'elokuvan jakelija': 41, 'jakaja': 41

  // Item
};

function normalizeValue(value) {
  // Removing last punc char is good enough for our purposes.
  // We don't handle abbreviations here etc.
  // Brackets should not happen either, should they?
  return value.replace(/[.,]$/u, '');
}

function scoreRelatorTermBk(normalizedValue) {
  if (normalizedValue in relatorTermScoreBk) {
    return relatorTermScoreBk[normalizedValue];
  }
  return 0;
}

function scoreRelatorTermMu(normalizedValue) {
  if (normalizedValue in relatorTermScoreMu) {
    return relatorTermScoreMu[normalizedValue];
  }
  return 0;
}

function scoreRelatorTermVm(normalizedValue) {
  if (normalizedValue in relatorTermScoreVm) {
    return relatorTermScoreVm[normalizedValue];
  }
  return 0;
}

export function scoreRelatorTerm(value, typeOfMaterial = undefined) {
  // NB! We are currently using type of material only for sorting relator terms, not 7XX fields!!!
  const normalizedValue = normalizeValue(value);
  if (typeOfMaterial === 'BK') { // Books
    return scoreRelatorTermBk(normalizedValue);
  }
  if (typeOfMaterial === 'MU') { // Music (NB: audio books should be BK in this context!)
    return scoreRelatorTermMu(normalizedValue);
  }
  if (typeOfMaterial === 'VM') { // video material
    return scoreRelatorTermVm(normalizedValue);
  }
  if (normalizedValue in relatorTermScore) {
    return relatorTermScore[normalizedValue];
  }
  return 0;
}

export function fieldOrderComparator(fieldA, fieldB) {

  //const sorterFunctions = [sortByTag, sortByIndexTerms, sortAlphabetically, sortByRelatorTerm, sortByOccurrenceNumber, preferFenniKeep, sortByFieldLinkAndSequenceNumber];

  const sorterFunctions = [sortByTag, sortByIndexTerms, sortAlphabetically, sortByRelatorTerm, sortBySubfield6, preferFenniKeep, sortByFieldLinkAndSequenceNumber];
  //const sorterFunctions = [sortByIndexTerms, sortByRelatorTerm, sortByOccurrenceNumber, preferFenniKeep, sortByFieldLinkAndSequenceNumber];

  return globalFieldOrderComparator(fieldA, fieldB, sorterFunctions);
}

function sortByIndexTerms(fieldA, fieldB) { // eslint-disable-line complexity, max-statements

  const indexTermFields = ['600', '610', '611', '630', '648', '650', '651', '652', '653', '654', '655', '656', '657', '658', '659', '662'];

  function scoreInd2(val) {
    const ind2Score = {'0': 0, '1': 1, '2': 2, '3': 3, '4': 8, '5': 5, '6': 6, '7': 7};

    if (val in ind2Score) {
      return ind2Score[val];
    }
    return 9;
  }

  // ATM this is not needed.
  // You may need this, if you change compare function order in sorterFunctions
  // istanbul ignore next
  if (fieldA.tag !== fieldB.tag) {
    return 0;
  }

  if (!indexTermFields.includes(fieldA.tag)) {
    return 0;
  }

  // Puts ind2=4 last
  if (scoreInd2(fieldA.ind2) > scoreInd2(fieldB.ind2)) {
    return 1;
  }
  if (scoreInd2(fieldA.ind2) < scoreInd2(fieldB.ind2)) {
    return -1;
  }

  function scoreDictionary(dictionary) {
    const dictionarySortIndex = {
      'yso/fin': 0,
      'yso/swe': 1,
      'yso/eng': 2,
      'slm/fin': 0.1,
      'slm/swe': 1.1,
      'kauno/fin': 2.1,
      'kauno/swe': 2.2,
      'kaunokki': 4,
      'bella': 5
    };

    if (dictionary in dictionarySortIndex) {
      return dictionarySortIndex[dictionary];
    }
    return BIG_BAD_NUMBER;
  }

  const dictionaryA = selectFirstValue(fieldA, '2');
  const dictionaryB = selectFirstValue(fieldB, '2');

  const dictScoreA = scoreDictionary(dictionaryA);
  const dictScoreB = scoreDictionary(dictionaryB);
  // Use priority order for listed dictionaries:
  if (dictScoreA > dictScoreB) {
    return 1;
  }
  if (dictScoreA < dictScoreB) {
    return -1;
  }
  // Unlisted dictionaries: sort $2 value alphabetically:
  //if (dictScoreA === BIG_BAD_NUMBER) {
  if (dictionaryA > dictionaryB) {
    return 1;
  }
  if (dictionaryA < dictionaryB) {
    return -1;
  }
  //}
  return 0;
}


function preferKeep(fieldA, fieldB, keepOwner = 'FENNI') {
  const hasKeepA = fieldHasSubfield(fieldA, '9', `${keepOwner}<KEEP>`);
  const hasKeepB = fieldHasSubfield(fieldB, '9', `${keepOwner}<KEEP>`);

  if (hasKeepA && !hasKeepB) {
    return -1;
  }
  if (!hasKeepA && hasKeepB) {
    return 1;
  }

  return 0;
}


function preferFenniKeep(fieldA, fieldB) {
  const fenniPreference = preferKeep(fieldA, fieldB, 'FENNI');
  if (fenniPreference !== 0) {
    return fenniPreference;
  }
  const violaPreference = preferKeep(fieldA, fieldB, 'VIOLA');
  if (violaPreference !== 0) {
    return violaPreference;
  }
  return preferKeep(fieldA, fieldB, 'FIKKA');
}

function sortByRelatorTerm(fieldA, fieldB) {
  //if (!['600', '610', '611', '630', '700', '710', '711', '730', '800', '810', '811', '830'].includes(fieldA.tag)) {
  if (!['700', '710', '711', '730'].includes(fieldA.tag)) {
    return 0;
  }

  function fieldGetMaxRelatorTermScore(field) {
    if (!field.subfields) {
      return -2;
    }
    // If field has $t, it's a teos-nimeke-auktoriteetti, and thus meaningless. These should follow all $t-less fields...
    if (fieldHasSubfield(field, 't')) {
      return -2;
    }
    const relatorSubfieldCode = ['611', '711', '811'].includes(field.tag) ? 'j' : 'e';
    const e = field.subfields.filter(sf => sf.code === relatorSubfieldCode);
    if (e.length === 0) { // No $e is still better than having a $t
      return -1;
    }
    const scores = e.map(sf => scoreRelatorTerm(sf.value));
    //debugDev(`RELATOR SCORE FOR '${fieldToString(field)}': ${scores.join(', ')}`);
    return Math.max(...scores);
  }

  const scoreA = fieldGetMaxRelatorTermScore(fieldA);
  const scoreB = fieldGetMaxRelatorTermScore(fieldB);

  if (scoreA < scoreB) {
    return 1;
  }
  if (scoreA > scoreB) {
    return -1;
  }
  return 0;
}


function fieldGetMinLinkAndSequenceNumber(field) {
  if (!field.subfields) {
    return BIG_BAD_NUMBER;
  }
  const relevantSubfields = field.subfields.filter(sf => isValidSubfield8(sf));
  // If val is something like "1.2\x" parseFloat() would give a syntax erro because of hex-like escape sequnce (at least on Chrome). Thus remove tail:
  const scores = relevantSubfields.map(sf => parseFloat(sf.value.replace(/\\.*$/u, '')));
  if (scores.length === 0) {
    return BIG_BAD_NUMBER;
  }
  return Math.min(...scores);
}

function sortByFieldLinkAndSequenceNumber(fieldA, fieldB) { // Sort by subfield $8 that is...
  const scoreA = fieldGetMinLinkAndSequenceNumber(fieldA);
  const scoreB = fieldGetMinLinkAndSequenceNumber(fieldB);
  //debugDev(` sf-8-A-score for '${fieldToString(fieldA)}: ${scoreA}`);
  //debugDev(` sf-8-B-score for '${fieldToString(fieldB)}: ${scoreB}`);
  if (scoreA === scoreB) {
    return 0;
  }
  if (scoreB === 0) {
    return 1;
  }
  if (scoreA === 0) {
    return -1;
  }
  if (scoreA > scoreB) { // smaller is better
    return 1;
  }
  return -1;
}


function sortBySubfield6(fieldA, fieldB) { // Sort by subfield $6, ex-sortByOccurrenceNumber...
  if (fieldA.tag !== '880' || fieldB.tag !== '880') {
    return 0;
  }

  function compareLinkingTags() {
    const tagStringA = fieldGetUnambiguousTag(fieldA);
    const tagStringB = fieldGetUnambiguousTag(fieldB);
    if (tagStringA === tagStringB || !tagStringA || !tagStringB) {
      return 0;
    }
    if (tagStringA > tagStringB) {
      return 1;
    }
    return -1;
  }

  function compareOccurrenceNumbers() {
    const stringA = fieldGetUnambiguousOccurrenceNumber(fieldA);
    const stringB = fieldGetUnambiguousOccurrenceNumber(fieldB);
    if (stringA === stringB) { // No action required here
      return 0;
    }

    // Handle expections: no occurrence number, occurrence number '00':
    if (!stringB || stringB === '00') {
      if (!stringA || stringA === '00') {
        return 0;
      }
      return -1;
    }
    if (!stringA || stringA === '00') {
      return 1;
    }

    // NB! We need compare ints as occurrence number can exceed 99 and be a three-digit value!
    const scoreA = parseInt(stringA, 10);
    const scoreB = parseInt(stringB, 10);

    if (scoreA > scoreB) { // smaller is better, thus '00' is the best
      return 1;
    }
    return -1;
  }

  const linkingTagComparisonResult = compareLinkingTags();
  if (linkingTagComparisonResult !== 0) {
    return linkingTagComparisonResult;
  }

  return compareOccurrenceNumbers();
}


function selectFirstValue(field, subcode) {
  return field.subfields
    .filter(subfield => subcode === subfield.code)
    .map(subfield => subfield.value)
    .slice(0, 1);
}

