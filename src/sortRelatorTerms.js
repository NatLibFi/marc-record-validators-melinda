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

const WORST_WORK = 81;


export default function () {

  return {
    description: 'Sort adjacent $e subfields in field [1678][01]0',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};
    const typeOfMaterial = recordToTypeOfMaterial(record);

    record.fields.forEach(field => {
      sortAdjacentESubfields(field, typeOfMaterial);
    });

    return res;
  }

  function validate(record) {
    const res = {message: []};

    const typeOfMaterial = recordToTypeOfMaterial(record);

    record.fields.forEach(field => {
      const clonedField = clone(field);
      sortAdjacentESubfields(clonedField, typeOfMaterial);
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


function recordToTypeOfMaterial(record) {
  if (!record.leader) {
    return undefined;
  }

  if (record.leader.charAt(6) === 'i') { // Audio books should follow rules of a book, I guess...
    return 'BK';
  }

  return record.getTypeOfMaterial();
}

function getRelatorTermSubfieldCode(field) {
  if (['111', '611', '711', '811'].includes(field.tag)) {
    return 'j';
  }
  return 'e';
}

function swapESubfields(field, typeOfMaterial = undefined) {
  if (!field.subfields) {
    return;
  }

  const subfieldCode = getRelatorTermSubfieldCode(field);

  const loopAgain = field.subfields.some((sf, index) => {
    // NB! we should fix 'e' to 'e' or 'j'....
    if (index === 0 || sf.code !== subfieldCode) {
      return false;
    }
    const currScore = scoreRelatorTerm(sf.value, typeOfMaterial);

    const prevSubfield = field.subfields[index - 1];
    if (currScore === 0 || prevSubfield.code !== subfieldCode) {
      return false;
    }
    const prevScore = scoreRelatorTerm(prevSubfield.value, typeOfMaterial);
    //console.log(`PREV: ${prevScore}, CURR: ${currScore}`); // eslint-disable-line no-console

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

export function sortAdjacentESubfields(field, typeOfMaterial = undefined) {
  if (!field.subfields) {
    return field;
  }
  swapESubfields(field, typeOfMaterial);

  return field;
}

