// Taken from project marc-record-js, file marcSortFields.js as this contains more and more Melinda-specific rules.

import clone from 'clone';
import createDebugLogger from 'debug';
import {fieldHasSubfield, fieldToString} from './utils';
import {isValidSubfield8} from './subfield8Utils';
import {isValidSubfield6, subfield6GetOccurrenceNumber} from './subfield6Utils';


const BIG_BAD_NUMBER = 999.99;

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:sortFields');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

export default function () {

  return {
    description: 'Sort fields',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};

    record.fields.sort(fieldOrderComparator); // eslint-disable-line functional/immutable-data

    return res;
  }

  function validate(record) {
    const res = {message: []};

    const fields = record.fields.map(f => clone(f));
    fields.sort(fieldOrderComparator); // eslint-disable-line functional/immutable-data


    const relocatedFields = fields.filter((f, i) => fieldToString(f) !== fieldToString(record.fields[i]));

    if (relocatedFields.length > 0) { // eslint-disable-line functional/no-conditional-statements
      res.message.push(`${relocatedFields.length} field(s) in new places`); // eslint-disable-line functional/immutable-data
    }

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }
}


const relatorTermScore = { // Here bigger is better
  // The list should be similar to the one for field internal $e sorting in marc-record-validators-js
  // validator  osrtRelatorTerms.js. Validators should use this list eventually...
  // More abstract, the earlier it appears.
  // Note that terms with same abstraction level might also have order preferences
  // We should 1) check the order of these, and 2) add translations (support Swedish at the very least)
  // work/teos > expression/ekspressio > manifestation/manifestaatio
  'säveltäjä': 100, 'composer': 100,
  'kirjoittaja': 99, 'author': 100,
  'sarjakuvantekijä': 99,
  'taiteilija': 98,
  'sanoittaja': 90,
  'käsikirjoittaja': 90,
  // expression:
  'toimittaja': 80, 'editor': 80,
  'sovittaja': 80, 'arranger': 80,
  'kuvittaja': 75,
  'editointi': 71, // for music, editor/toimittaja is another thing
  'kääntäjä': 70,
  'lukija': 61,
  // Manifestation level
  'esittäjä': 60,
  'johtaja': 50, // orkesterinjohtaja
  'kustantaja': 41,
  'julkaisija': 40

};

export function scoreRelatorTerm(value) { // sortRelatorTerms.js validator should call this on future version
  const normValue = value.replace(/[.,]+$/u, '');
  if (normValue in relatorTermScore) {
    return relatorTermScore[normValue];
  }
  return 0;
}

export function fieldOrderComparator(fieldA, fieldB) {

  const sorterFunctions = [sortByTag, sortByIndexTerms, sortAlphabetically, sortByRelatorTerm, sortByOccurrenceNumber, preferFenniKeep, sortByFieldLinkAndSequenceNumber];

  for (const sortFn of sorterFunctions) { // eslint-disable-line functional/no-loop-statements
    const result = sortFn(fieldA, fieldB);
    debugDev(`${sortFn.name}: '${fieldToString(fieldA)}' vs '${fieldToString(fieldB)}': ${result}`);
    if (result !== 0) {
      return result;
    }
  }

  return 0;

  function sortByTag(fieldA, fieldB) {

    function getSortIndex(tag) {
      const sortIndex = {
        LDR: '000',
        STA: '001.1', // STA comes now after 001. However 003+001 form a combo, so I'm not sure...
        SID: '999.1',
        LOW: '999.2',
        CAT: '999.3',
        HLI: '999.4'
      };

      if (tag in sortIndex) { // <- this allows weights for numeric values as well (not that we use them yet)
        return sortIndex[tag];
      }
      if (isNaN(tag)) {
        return '999.9';
      }
      return tag;
    }

    const orderA = getSortIndex(fieldA.tag);
    const orderB = getSortIndex(fieldB.tag);

    if (orderA > orderB) {
      return 1;
    }
    if (orderA < orderB) {
      return -1;
    }

    return 0;
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

    /* Puts ind2=4 last */
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
    // Should this be done to 6XX and 8XX fields as well? Does $t affect sorting?
    if (!['700', '710', '711', '730'].includes(fieldA.tag)) {
      return 0;
    }


    function fieldGetMaxRelatorTermScore(field) {
      if (!field.subfields) {
        return 0;
      }
      const e = field.subfields.filter(sf => sf.code === 'e');
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

  function sortByOccurrenceNumber(fieldA, fieldB) { // Sort by subfield $6

    function fieldGetOccurrenceNumber(field) { // should this function be exported? (based on validator sortRelatorFields.js)
      if (!field.subfields) {
        return 0;
      }
      const subfield6 = field.subfields.find(sf => isValidSubfield6(sf));
      if (subfield6 === undefined) {
        return 0;
      }
      return parseInt(subfield6GetOccurrenceNumber(subfield6), 10);
    }

    if (fieldA.tag !== '880') {
      return 0;
    }
    const scoreA = fieldGetOccurrenceNumber(fieldA);
    const scoreB = fieldGetOccurrenceNumber(fieldB);

    //debugDev(`A: '${fieldToString(fieldA)}: ${scoreA}`);
    //debugDev(`B: '${fieldToString(fieldB)}: ${scoreB}`);

    if (scoreA === scoreB) {
      return 0;
    }
    if (scoreB === 0) {
      return -1;
    }
    if (scoreA === 0) {
      return 1;
    }
    if (scoreA > scoreB) { // smaller is better
      return 1;
    }
    return -1;
  }

  function sortAlphabetically(fieldA, fieldB) {
    const tagToSortingSubfields = {
      // '028': ['b', 'a']?
      'LOW': ['a'],
      'SID': ['c']
    };

    function scoreSubfieldsAlphabetically(setOfSubfields) {
      if (setOfSubfields.length === 0) {
        return 0;
      }
      const [subfieldCode, ...remainingSubfieldCodes] = setOfSubfields;
      const valA = selectFirstValue(fieldA, subfieldCode);
      const valB = selectFirstValue(fieldB, subfieldCode);
      //debugDev(`CHECKING SUBFIELD '${subfieldCode}'`);
      if (!valA) {
        if (!valB) {
          return scoreSubfieldsAlphabetically(remainingSubfieldCodes);
        }
        return -1;
      }
      if (!valB) {
        return 1;
      }
      //debugDev(`CHECKING SUBFIELD '${subfieldCode}': '${valA}' vs '${valB}'`);

      if (valA < valB) {
        return -1;
      }
      if (valB < valA) {
        return 1;
      }
      return scoreSubfieldsAlphabetically(remainingSubfieldCodes);
    }

    if (fieldA.tag === fieldB.tag) {
      if (!(fieldA.tag in tagToSortingSubfields)) {
        return 0;
      }

      const subfieldsToCheck = tagToSortingSubfields[fieldA.tag];

      //debugDev(`CHECKING ${subfieldsToCheck.join(', ')}`);
      const result = scoreSubfieldsAlphabetically(subfieldsToCheck);
      //debugDev(`RESULT ${result}`);
      return result;
    }
    return 0;
  }

  //-----------------------------------------------------------------------------


  function selectFirstValue(field, subcode) {
    return field.subfields
      .filter(subfield => subcode === subfield.code)
      .map(subfield => subfield.value)
      .slice(0, 1);
  }
}

