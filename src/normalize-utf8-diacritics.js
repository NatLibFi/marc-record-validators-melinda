//import createDebugLogger from 'debug';
import clone from 'clone';
import {convert as nongenericNormalization} from './unicode-decomposition';

// Note that https://github.com/NatLibFi/marc-record-validators-melinda/blob/master/src/unicode-decomposition.js contains
// similar functionalities. It's less generic and lacks diacritic removal but has it advantages as well.

//const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge-reducers/reducers/normalize-utf-diacritics');

// See also https://github.com/NatLibFi/marc-record-validators-melinda/blob/master/src/unicode-decomposition.js .
// It uses a list of convertable characters whilst this uses a generic stuff as well.
// It handles various '.' and '©' type normalizations as well.
// NB! This version has minor bug/feature issue regarding fixComposition()

// Author(s): Nicholas Volk
export default function () {

  return {
    description: 'Generic normalization of latin UTF-8 diacritics. Precompose Finnish å, ä and ö. Decompose others.',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};
    //message.fix = []; // eslint-disable-line functional/immutable-data

    // Actual parsing of all fields
    /*
    if (!record.fields) {
      return false;
    }
    */

    record.fields.forEach(field => {
      fieldFixComposition(field);
      //validateField(field, true, message);
    });

    // message.valid = !(message.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validate(record) {
    const res = {message: []};

    // Actual parsing of all fields
    /*
    if (!record.fields) {
      return false;
    }
    */

    record.fields.forEach(field => {
      validateField(field, res);
    });

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validateField(field, res) {
    if (!field.subfields) {
      return;
    }
    const orig = fieldToString(field);

    const normalizedField = fieldFixComposition(clone(field));
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`'${orig}' requires normalization`); // eslint-disable-line functional/immutable-data
      return;
    }
    return;
  }

  function fieldToString(f) {
    return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;

    function formatSubfields(field) {
      //return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
      return field.subfields.map(sf => `${sf.code}${sf.value}`).join('‡');
    }
  }
}


// Traditionally these six are precomposed and all the rest decomposed
function precomposeFinnishLetters(value = '') {
  return value.
    replace(/å/gu, 'å').
    replace(/ä/gu, 'ä').
    replace(/ö/gu, 'ö').
    replace(/Å/gu, 'Å').
    replace(/Ä/gu, 'Ä').
    replace(/Ö/gu, 'Ö');
}

function fixComposition(value = '') {
  // Target: Diacritics use Melinda internal notation.
  // General solution: Decompose everything and then compose 'å', 'ä', 'ö', 'Å', 'Ä' and 'Ö'.
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize
  // Bug/Feature: the generic normalize() function also normalizes non-latin encodings as well, is this ok?
  // Exception: Input contains non-Latin script letters: don't decompose (see field 880 tests):
  if (value.match(/[^\p{Script=Latin}\p{Script=Common}\p{Script=Inherited}]/u)) {
    // Problem with this approach: mixed language content (eg. cyrillic + latin) won't get normalized.
    // Hack/Damage control: we might add decomposition rules for most common diacritis here (eg. ü, é...).
    // OR we could split input to words and handle them separately?
    // NB! Hack not implemented yet. The main source of problematic case would probably be greek characters
    // within texts, that are written with latin alphabet.
    //return precomposeFinnishLetters(value);
    return nongenericNormalization(value);
  }
  return precomposeFinnishLetters(String(value).normalize('NFD'));
}


export function fieldFixComposition(field) {
  if (!field.subfields) {
    return field;
  }
  //const originalValue = fieldToString(field);
  //nvdebug(`fFC: '${originalValue}'`, debug);
  field.subfields.forEach((subfield, index) => {
    field.subfields[index].value = fixComposition(subfield.value); // eslint-disable-line functional/immutable-data
  });
  //const newValue = fieldToString(field);
  //if (originalValue !== newValue) { // eslint-disable-line functional/no-conditional-statements
  //  debug(`FIXCOMP: '${originalValue}' => '${newValue}'`);
  //}
  return field;
}

/*
export function fieldRemoveDecomposedDiacritics(field) {
  // Raison d'être/motivation: "Sirén" and diacriticless "Siren" might refer to a same surname, so this normalization
  // allows us to compare authors and avoid duplicate fields.
  field.subfields.forEach((sf) => {
    sf.value = removeDecomposedDiacritics(sf.value); // eslint-disable-line functional/immutable-data
  });

  function removeDecomposedDiacritics(value = '') {
    // NB #1: Does nothing to precomposed letters. String.normalize('NFD') can handle them.
    // NB #2: Finnish letters 'å', 'ä', 'ö', 'Å', Ä', and 'Ö' should be handled (=precomposed) before calling this.
    // NB #3: Calling our very own fixComposition() before this function handles both #1 and #2.
    return String(value).replace(/\p{Diacritic}/gu, '');
  }
}
*/

