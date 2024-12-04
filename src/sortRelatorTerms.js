// Validator/fixer for sorting $e relator term subfields
//
// Author(s): Nicholas Volk

import clone from 'clone';
//import createDebugLogger from 'debug';
import {fieldToString} from './utils';
import {fieldFixPunctuation} from './punctuation2';
import {scoreRelatorTerm} from './sortFields';
//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:sortRelatorTerms');
//const debugData = debug.extend('data');

const WORST_WORK = 98;


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

