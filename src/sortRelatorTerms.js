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
      sortAdjacentRelatorTerms(field, typeOfMaterial);
    });

    return res;
  }

  function validate(record) {
    const res = {message: []};

    const typeOfMaterial = recordToTypeOfMaterial(record);

    record.fields.forEach(field => {
      const clonedField = clone(field);
      sortAdjacentRelatorTerms(clonedField, typeOfMaterial);
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

export function tagToRelatorTermSubfieldCode(tag) {
  if (['100', '110', '600', '610', '700', '710', '720', '751', '752', '800', '810'].includes(tag)) {
    return 'e';
  }
  if (['111', '611', '711', '811'].includes(tag)) {
    return 'j';
  }
  return '?'; // No need to complain. Nothing is found.
}

function isRelatorTermTag(tag) {
  // NV: 111/711, 751 and 752 are very rare
  return ['e', 'j'].includes(tagToRelatorTermSubfieldCode(tag));
}

function swapRelatorTermSubfields(field, typeOfMaterial = undefined) {
  if (!field.subfields) {
    return;
  }

  const subfieldCode = tagToRelatorTermSubfieldCode(field.tag);

  console.log(`Processing ${fieldToString(field)}`); // eslint-disable-line no-console

  const swapPosition = field.subfields.findIndex((subfield, index) => isSwappable(subfield, index));

  if (swapPosition > 0) {
    swapRelatorTermPair(swapPosition);
    swapRelatorTermSubfields(field, typeOfMaterial); // uh, evil recursion...
    return;
  }

  console.log(`END ${fieldToString(field)}`); // eslint-disable-line no-console

  function swapRelatorTermPair(index) {
    console.log(` SWAP`); // eslint-disable-line no-console

    // Swap:
    const tmp = field.subfields[index - 1];
    field.subfields[index - 1] = field.subfields[index]; // eslint-disable-line functional/immutable-data
    field.subfields[index] = tmp; // eslint-disable-line functional/immutable-data
    fieldFixPunctuation(field);
    return true;
  }

  function isSwappable(sf, index) {
    // NB! we should fix 'e' to 'e' or 'j'....
    if (index === 0 || sf.code !== subfieldCode) {
      return false;
    }
    const currScore = scoreRelatorTerm(sf.value, typeOfMaterial);
    if (currScore === 0) {
      return false;
    }
    const prevSubfield = field.subfields[index - 1];
    if (prevSubfield.code !== subfieldCode) {
      return false;
    }
    const prevScore = scoreRelatorTerm(prevSubfield.value, typeOfMaterial);
    console.log(`PREV: ${prevSubfield.value}/${prevScore}, CURR: ${sf.value}/${currScore}`); // eslint-disable-line no-console
    // If this subfield maps to a Work, then subfields can be swapped, even if we don't have a score for the prev subfield!
    if (prevScore === 0 && currScore < WORST_WORK) {
      return false;
    }
    return currScore > prevScore;
  }

}

export function sortAdjacentRelatorTerms(field, typeOfMaterial = undefined) {
  if (!field.subfields || !isRelatorTermTag(field.tag)) {
    return field;
  }
  swapRelatorTermSubfields(field, typeOfMaterial);

  return field;
}

