// Validator/fixer for sorting $e relator term subfields
//
// Author(s): Nicholas Volk

import clone from 'clone';
//import createDebugLogger from 'debug';
import {fieldToString} from './utils';
import {fieldFixPunctuation} from './punctuation2';
//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:sortRelatorTerms');
//const debugData = debug.extend('data');

const WORST_WORK = 99;

const relatorTermValues = { // The higher, the better
  // More abstract, the earlier it appears.
  // Note that terms with same abstraction level might also have order preferences
  // work/teos > expression/ekspressio > manifestation/manifestaatio > item/kappale
  'säveltäjä': 100,
  'kirjoittaja': 99, // Viola wants composer/säveltäjä on top (highly unlikely to ever appear together, but...)
  'sanoittaja': 90,
  // ekspressio
  'sovittaja': 80,
  'toimittaja': 80,
  'editointi': 70,
  'kääntäjä': 70,
  // item/kappale
  'esittäjä': 60,
  'johtaja': 50
};

function scoreRelatorTerm(term) {
  const normalizedTerm = normalizeValue(term);
  if (normalizedTerm in relatorTermValues) {
    return relatorTermValues[normalizedTerm];
  }
  return 0;
}

export default function () {

  return {
    description: 'Sort adjacent $e subfields in field [1678][01]0',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};

    record.fields.forEach(field => {
      sortAdjacentESubfields(field);
    });

    return res;
  }

  function validate(record) {
    const res = {message: []};

    record.fields.forEach(field => {
      const clonedField = clone(field);
      sortAdjacentESubfields(clonedField);
      const clonedFieldAsString = fieldToString(clonedField);
      const fieldAsString = fieldToString(field);
      if (fieldAsString !== clonedFieldAsString) { // eslint-disable-line functional/no-conditional-statements
        res.message.push(`${fieldAsString} => ${clonedFieldAsString}`); // eslint-disable-line functional/immutable-data
      }
    });

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }
}


function normalizeValue(value) {
  // Removing last punc char is good enough for our purposes.
  // We don't handle abbreviations here etc.
  // Brackets should not happen either, should they?
  return value.replace(/[.,]$/u, '');
}


function swapESubfields(field) {
  if (!field.subfields) {
    return;
  }

  const loopAgain = field.subfields.some((sf, index) => {
    if (index === 0 || sf.code !== 'e') {
      return false;
    }
    const currScore = scoreRelatorTerm(sf.value);

    const prevSubfield = field.subfields[index - 1];
    if (currScore === 0 || prevSubfield.code !== 'e') {
      return false;
    }
    const prevScore = scoreRelatorTerm(prevSubfield.value);


    // If this subfield maps to a Work, then subfields can be swapped, even if we don't have a score for the prev subfield!
    if (prevScore === 0 && currScore < WORST_WORK) {
      return false;
    }

    if (currScore > prevScore) {
      // Swap:
      const tmp = field.subfields[index - 1];
      field.subfields[index - 1] = sf; // eslint-disable-line functional/immutable-data
      field.subfields[index] = tmp; // eslint-disable-line functional/immutable-data
      fieldFixPunctuation(field);
      return true;
    }

    return false;

  });

  if (loopAgain) {
    swapESubfields(field); // uh, evil recursion...
    return;
  }

  return;

}

export function sortAdjacentESubfields(field) {
  if (!field.subfields) {
    return field;
  }
  swapESubfields(field);

  return field;
}

