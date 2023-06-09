/*
* punctuation.js -- try and fix a marc field punctuation
*
* Author(s): Nicholas Volk <nicholas.volk@helsinki.fi>
*
* NOTE #1: https://www.kiwi.fi/display/kumea/Loppupisteohje is implemented via another validator/fixer.(ending-punctuation)
* NOTE #2: Validator/fixer punctuation does similar stuff, but focuses on X00 fields.
* NOTE #3: As of 2023-06-05 control subfields ($0...$9) are obsolete. Don't use them in rules.
*          (They are jumped over when looking for next (non-controlfield subfield)
*/
import {validateSingleField} from './ending-punctuation';
// import createDebugLogger from 'debug';
import {fieldToString, nvdebug} from './utils';
import clone from 'clone';

// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/punctuation2');

export default function () {
  return {
    description: 'Add punctuation to data fields',
    validate, fix
  };

  function fix(record) {
    nvdebug('Add punctuation to data fields: fixer');
    const res = {message: [], fix: [], valid: true};
    record.fields.forEach(f => fieldFixPunctuation(f));
    return res;
  }

  function validate(record) {
    nvdebug('Add punctuation to data fields: validate');

    const fieldsNeedingModification = record.fields.filter(f => fieldNeedsModification(f, true));


    const values = fieldsNeedingModification.map(f => fieldToString(f));
    const newValues = fieldsNeedingModification.map(f => fieldGetFixedString(f, true));

    const messages = values.map((val, i) => `'${val}' => '${newValues[i]}'`);

    const res = {message: messages};

    res.valid = res.message.length < 1; // eslint-disable-line functional/immutable-data
    return res;
  }
}

function isControlSubfield(subfield) {
  return ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].includes(subfield.code);
}

function getNextRelevantSubfield(field, currSubfieldIndex) {
  return field.subfields.find((subfield, index) => index > currSubfieldIndex && !isControlSubfield(subfield));
}

function fieldGetFixedString(field, add = true) {
  const cloneField = clone(field);
  const operation = add ? subfieldFixPunctuation : subfieldStripPunctuation;
  cloneField.subfields.forEach((sf, i) => {
    // NB! instead of next subfield, we should actually get next *non-control-subfield*!!!
    // (In plain English: We should skip $0 - $9 at least, maybe $w as well...)
    operation(cloneField, sf, getNextRelevantSubfield(cloneField, i));
  });
  return fieldToString(cloneField);
}

function fieldNeedsModification(field, add = true) {
  if (!field.subfields) {
    return false;
  }

  const originalFieldAsString = fieldToString(field);
  const modifiedFieldAsString = fieldGetFixedString(field, add);

  return modifiedFieldAsString !== originalFieldAsString;
}

/////////////////////////////////////////////////////////////////////////////////////
// <= Above code is written for the validator logic <=                             //
// => Everything below was originally transferred from reducers' punctuation.js => //
/////////////////////////////////////////////////////////////////////////////////////


//const stripCrap = / *[-;:,+]+$/u;
const commaNeedsPuncAfter = /(?:[a-z0-9A-Z]|å|ä|ö|Å|Ä|Ö|\))$/u;
const defaultNeedsPuncAfter = /(?:[a-z0-9A-Z]|å|ä|ö|Å|Ä|Ö)$/u;
const defaultNeedsPuncAfter2 = /(?:[\]a-zA-Z0-9)]|ä|å|ö|Å|Ä|Ö)$/u;
const blocksPuncRHS = /^(?:\()/u;
const allowsPuncRHS = /^(?:[A-Za-z0-9]|å|ä|ö|Å|Ä|Ö)/u;

const dotIsProbablyPunc = /(?:[a-z0-9)]|å|ä|ö)\.$/u;
const puncIsProbablyPunc = /(?:[a-z0-9)]|å|ä|ö) ?[.,:;]$/u;
// NB! 65X: Finnish terms don't use punctuation, but international ones do. Neither one is currently (2021-11-08) coded here.

// Will unfortunately trigger "Sukunimi, Th." type:
const removeColons = {'code': 'abcdefghijklmnopqrstuvwxyz', 'remove': / *[;:]$/u};
const removeX00Comma = {'code': 'abcqde', 'followedBy': 'abcqde#', 'context': /.,$/u, 'remove': /,$/u};
const cleanRHS = {'code': 'abcd', 'followedBy': 'bcde', 'context': /(?:(?:[a-z0-9]|å|ä|ö)\.|,)$/u, 'contextRHS': blocksPuncRHS, 'remove': /[.,]$/u};
const cleanX00dCommaOrDot = {'code': 'd', 'followedBy': 'et#', 'context': /[0-9]-[,.]$/u, 'remove': /[,.]$/u};
const cleanX00aDot = {'code': 'abcde', 'followedBy': 'cdegj', 'context': dotIsProbablyPunc, 'remove': /\.$/u};
const cleanCorruption = {'code': 'abcdefghijklmnopqrstuvwxyz', 'remove': / \.$/u};
// These $e dot removals are tricky: before removing the comma, we should know that it ain't an abbreviation such as "esitt."...
const cleanX00eDot = {'code': 'e', 'followedBy': 'egj#', 'context': /(?:[ai]ja|jä)[.,]$/u, 'remove': /\.$/u};

const X00RemoveDotAfterBracket = {'code': 'cq', 'context': /\)\.$/u, 'remove': /\.$/u};
// 390, 800, 810, 830...
const cleanPuncBeforeLanguage = {'code': 'atvxyz', 'followedBy': 'l', 'context': puncIsProbablyPunc, 'remove': / *[.,:;]$/u};


const addX00aComma = {'add': ',', 'code': 'abcqdej', 'followedBy': 'cdeg', 'context': commaNeedsPuncAfter, 'contextRHS': allowsPuncRHS};
const addX00aComma2 = {'add': ',', 'code': 'abcdej', 'followedBy': 'cdeg', 'context': /(?:[A-Z]|Å|Ä|Ö)\.$/u, 'contextRHS': allowsPuncRHS};
const addX00aDot = {'add': '.', 'code': 'abcde', 'followedBy': '#tu', 'context': defaultNeedsPuncAfter};

const addX10bDot = {'name': 'Add X10 pre-$b dot', 'add': '.', 'code': 'ab', 'followedBy': 'b', 'context': defaultNeedsPuncAfter};
const addX10eComma = {'add': ',', 'code': 'abe', 'followedBy': 'e', 'context': defaultNeedsPuncAfter};
const addX10Dot = {'name': 'Add X10 final dot', 'add': '.', 'code': 'abe', 'followedBy': '#', 'context': defaultNeedsPuncAfter};
const addLanguageComma = {'name': 'Add comma before 810$l', 'add': ',', 'code': 'tv', 'followedBy': 'l', 'context': defaultNeedsPuncAfter2};
const addColonToRelationshipInformation = {'name': 'Add \':\' to 7X0 $i relationship info', 'add': ':', 'code': 'i', 'context': /[a-z)åäö]$/u};

// 490:
const addSemicolonBeforeVolumeDesignation = {'name': 'Add " ;" before $v', 'add': ' ;', 'code': 'atxy', 'followedBy': 'v', 'context': /[^;]$/u};

const NONE = 0;
const ADD = 2;
const REMOVE = 1;
const REMOVE_AND_ADD = 3;

// Crappy punctuation consists of various crap that is somewhat common.
// We strip crap for merge decisions. We are not trying to actively remove crap here.

const removeX00Whatever = [removeX00Comma, cleanX00aDot, cleanX00eDot, cleanCorruption, cleanX00dCommaOrDot, cleanRHS, X00RemoveDotAfterBracket, removeColons, cleanPuncBeforeLanguage];
const removeX10Whatever = [removeX00Comma, cleanX00aDot, cleanX00eDot, cleanCorruption, removeColons, cleanPuncBeforeLanguage];

const cleanCrappyPunctuationRules = {
  '100': removeX00Whatever,
  '110': removeX10Whatever,
  '600': removeX00Whatever,
  '610': removeX10Whatever,
  '700': removeX00Whatever,
  '710': removeX10Whatever,
  '800': removeX00Whatever,
  '810': removeX10Whatever,
  '245': [{'code': 'ab', 'followedBy': '!c', 'remove': / \/$/u}],
  '300': [
    {'code': 'a', 'followedBy': '!b', 'remove': / *:$/u},
    {'code': 'a', 'followedBy': 'b', 'remove': /:$/u, 'context': /[^ ]:$/u},
    {'code': 'ab', 'followedBy': '!c', 'remove': / *;$/u},
    {'code': 'ab', 'followedBy': 'c', 'remove': /;$/u, 'context': /[^ ];$/u},
    {'code': 'abc', 'followedBy': '!e', 'remove': / *\+$/u},
    {'code': 'abc', 'followedBy': '!e', 'remove': / *\+$/u, 'context': /[^ ]\+$/u}

  ],
  '490': [{'code': 'a', 'followedBy': 'xy', 'remove': / ;$/u}],
  '773': [{'code': 'abdghiklmnopqrstuwxyz', 'followedBy': 'abdghiklmnopqrstuwxyz', 'remove': /\. -$/u}]

};

const cleanLegalX00Comma = {'code': 'abcde', 'followedBy': 'cdegj', 'context': /.,$/u, 'remove': /,$/u};
// Accept upper case letters in X00$b, since they are probably Roman numerals.
const cleanLegalX00bDot = {'code': 'b', 'followedBy': 't#', context: /^[IVXLCDM]+\.$/u, 'remove': /\.$/u};
const cleanLegalX00Dot = {'code': 'abcdetvl', 'followedBy': 'tu#', 'context': /(?:[a-z0-9)]|å|ä|ö)\.$/u, 'remove': /\.$/u};
const cleanLanguageComma = {'name': 'language comma', 'code': 'tv', 'followedBy': 'l', 'context': /.,$/u, 'remove': /,$/u};


const legalX00punc = [cleanLegalX00Comma, cleanLegalX00bDot, cleanLegalX00Dot, cleanLanguageComma];

const cleanLegalX10Comma = {'name': 'X10comma', 'code': 'abe', 'followedBy': 'e', 'context': /.,$/u, 'remove': /,$/u};
const cleanLegalX10Dot = {'name': 'X10dot', 'code': 'ab', 'followedBy': 'b#', 'context': /.\.$/u, 'remove': /\.$/u};

const legalX10punc = [cleanLegalX10Comma, cleanLegalX10Dot, cleanX00eDot, cleanLanguageComma];

const cleanValidPunctuationRules = {
  '100': legalX00punc,
  '110': legalX10punc,
  '600': legalX00punc,
  '610': legalX10punc,
  '700': legalX00punc,
  '710': legalX10punc,
  '800': legalX00punc,
  '810': legalX10punc,
  '245': [
    {'name': 'A:B', 'code': 'a', 'followedBy': 'b', 'remove': / [:;=]$/u},
    {'name': 'AB:K', 'code': 'ab', 'followedBy': 'k', 'remove': / :$/u},
    {'name': 'ABK:F', 'code': 'abk', 'followedBy': 'f', 'remove': /,$/u},
    {'name': 'ABFNP:C', 'code': 'abfnp', 'followedBy': 'c', 'remove': / \/$/u},
    {'name': 'ABN:N', 'code': 'abn', 'followedBy': 'n', 'remove': /\.$/u},
    {'name': 'ABNP:#', 'code': 'abnp', 'followedBy': '#', 'remove': /\.$/u},
    {'name': 'N:P', 'code': 'n', 'followedBy': 'p', 'remove': /,$/u}

  ],
  '260': [
    {'code': 'a', 'followedBy': 'b', 'remove': / :$/u},
    {'code': 'b', 'followedBy': 'c', 'remove': /,$/u},
    {'code': 'c', 'followedBy': '#', 'remove': /\.$/u},
    {'code': 'd', 'followedBy': 'e', 'remove': / :$/u},
    {'code': 'e', 'followedBy': 'f', 'remove': /,$/u},
    {'code': 'f', 'followedBy': '#', 'remove': /\.$/u} // Probably ')' but shouldit be removed?
  ],
  '264': [
    {'code': 'a', 'followedBy': 'b', 'remove': / :$/u},
    {'code': 'b', 'followedBy': 'c', 'remove': /,$/u},
    {'code': 'c', 'followedBy': '#', 'remove': /\.$/u}
  ],
  '300': [
    // NB! Remove crap as well, thus the '*' in / *:$/
    {'code': 'a', 'followedBy': 'b', 'remove': / :$/u},
    {'code': 'ab', 'followedBy': 'c', 'remove': / ;$/u},
    {'code': 'abc', 'followedBy': 'e', 'remove': / \+$/u}
  ],
  '490': [
    {'code': 'axy', 'followedBy': 'xy', 'remove': /,$/u},
    {'code': 'axy', 'followedBy': 'v', 'remove': / *;$/u}
  ],
  '534': [{'code': 'p', 'followedBy': 'c', 'remove': /:$/u}],
  // Experimental, MET366-ish (end punc in internationally valid, but we don't use it here in Finland):
  '648': [{'code': 'a', 'content': /^[0-9]+\.$/u, 'ind2': ['4'], 'remove': /\.$/u}]

};

// addColonToRelationshipInformation only applies to 700/710 but as others don't have $i, it's fine
const addX00 = [addX00aComma, addX00aComma2, addX00aDot, addLanguageComma, addSemicolonBeforeVolumeDesignation, addColonToRelationshipInformation];
const addX10 = [addX10bDot, addX10eComma, addX10Dot, addLanguageComma, addSemicolonBeforeVolumeDesignation, addColonToRelationshipInformation];
const addPairedPunctuationRules = {
  '100': addX00,
  '110': addX10,
  '245': [
    // Blah! Also "$a = $b" and "$a ; $b" can be valid... But ' :' is better than nothing, I guess...
    {'code': 'a', 'followedBy': 'b', 'add': ' :', 'context': defaultNeedsPuncAfter},
    {'code': 'abk', 'followedBy': 'f', 'add': ',', 'context': defaultNeedsPuncAfter},
    {'code': 'abfnp', 'followedBy': 'c', 'add': ' /', 'context': defaultNeedsPuncAfter}
  ],
  '260': [
    {'code': 'a', 'followedBy': 'b', 'add': ' :', 'context': defaultNeedsPuncAfter2},
    {'code': 'b', 'followedBy': 'c', 'add': ',', 'context': defaultNeedsPuncAfter2},
    {'code': 'abc', 'followedBy': 'a', 'add': ' ;', 'context': defaultNeedsPuncAfter2},
    {'code': 'e', 'followedBy': 'f', 'add': ' :', 'context': defaultNeedsPuncAfter2},
    {'code': 'f', 'followedBy': 'g', 'add': ',', 'context': defaultNeedsPuncAfter2}
  ],
  '264': [
    {'code': 'a', 'followedBy': 'b', 'add': ' :', 'context': defaultNeedsPuncAfter2},
    {'code': 'b', 'followedBy': 'c', 'add': ',', 'context': defaultNeedsPuncAfter2},
    // NB! The $c rule messes dotless exception "264 #4 $c p1983" up
    // We'll need to add a hacky postprocessor for this? Add 'hasInd1': '0123' etc?
    {'code': 'c', 'followedBy': '#', 'add': '.', 'context': defaultNeedsPuncAfter2}
  ],
  '300': [
    {'code': 'a', 'followedBy': 'b', 'add': ' :', 'context': defaultNeedsPuncAfter2},
    {'code': 'ab', 'followedBy': 'c', 'add': ' ;', 'context': defaultNeedsPuncAfter2},
    {'code': 'abc', 'followedBy': 'e', 'add': ' +', 'context': defaultNeedsPuncAfter2}
  ],
  '490': [
    {'code': 'axy', 'followedBy': 'xy', 'add': ',', 'context': defaultNeedsPuncAfter},
    addSemicolonBeforeVolumeDesignation
    //{'code': 'axy', 'followedBy': 'v', 'add': ' ;', 'context': defaultNeedsPuncAfter}
  ],
  '506': [{'code': 'a', 'followedBy': '#', 'add': '.', 'context': defaultNeedsPuncAfter2}],
  '534': [{'code': 'p', 'followedBy': 'c', 'add': ':', 'context': defaultNeedsPuncAfter2}],
  '600': addX00,
  '610': addX10,
  '700': addX00,
  '710': addX10,
  '800': addX00,
  '810': addX10,
  '830': [
    {'code': 'axy', 'followedBy': 'xy', 'add': ',', 'context': defaultNeedsPuncAfter},
    addSemicolonBeforeVolumeDesignation
    //{'code': 'axy', 'followedBy': 'v', 'add': ' ;', 'context': defaultNeedsPuncAfter}
  ]

};


function ruleAppliesToSubfieldCode(targetSubfieldCodes, currSubfieldCode) {
  const negation = targetSubfieldCodes.includes('!');
  if (negation) {
    return !targetSubfieldCodes.includes(currSubfieldCode);
  }
  return targetSubfieldCodes.includes(currSubfieldCode);
}


function ruleAppliesToField(rule, field) {
  if ('ind1' in rule && field.ind1.includes(rule.ind1)) {
    return false;
  }

  if ('ind2' in rule && field.ind2.includes(rule.ind2)) {
    return false;
  }

  // If we want to check, say, $2, it should be implemented here!

  return true;
}


function ruleAppliesToCurrentSubfield(rule, subfield) {
  if (!ruleAppliesToSubfieldCode(rule.code, subfield.code)) {
    return false;
  }
  if ('context' in rule && !subfield.value.match(rule.context)) { // njsscan-ignore: regex_injection_dos
    return false;
  }
  return true;
}

function ruleAppliesToNextSubfield(rule, nextSubfield) {
  if (!('followedBy' in rule)) { // Return true, if we are not interested in the next subfield
    return true;
  }
  // The '#' existence check applies only to the RHS field. LHS always exists.
  if (!nextSubfield) {
    const negation = rule.followedBy.includes('!');
    if (negation) {
      return !rule.followedBy.includes('#');
    }
    return rule.followedBy.includes('#');
  }

  if (!ruleAppliesToSubfieldCode(rule.followedBy, nextSubfield.code)) {
    return false;
  }
  if ('contextRHS' in rule && !nextSubfield.value.match(rule.contextRHS)) { // njsscan-ignore: regex_injection_dos
    return false;
  }
  return true;
}

function checkRule(rule, field, subfield1, subfield2) {
  if (!ruleAppliesToField(rule, field)) {
    nvdebug(`FAIL ON WHOLE FIELD: '${fieldToString(field)}`);
    return false;
  }
  //const name = rule.name || 'UNNAMED';
  if (!ruleAppliesToCurrentSubfield(rule, subfield1)) {
    //nvdebug(`${name}: FAIL ON LHS SUBFIELD: '$${subfield1.code} ${subfield1.value}', SF=${rule.code}`, debug);
    return false;
  }

  // NB! This is not a perfect solution. We might have $e$0$e where $e$0 punctuation should actually be based on $e$e rules
  if (!ruleAppliesToNextSubfield(rule, subfield2)) {
    //const msg = subfield2 ? `${name}: FAIL ON RHS SUBFIELD '${subfield2.code}' not in [${rule.followedBy}]` : `${name}: FAIL ON RHS FIELD`;
    //nvdebug(msg, debug);
    return false;
  }

  //nvdebug(`${name}: ACCEPT ${rule.code}/${subfield1.code}, SF2=${rule.followedBy}/${subfield2 ? subfield2.code : '#'}`, debug);
  return true;
}

function applyPunctuationRules(field, subfield1, subfield2, ruleArray = null, operation = NONE) {

  /*
  if (ruleArray === null || operation === NONE) {
    debug(`applyPunctuation(): No rules to apply!`);
    return;
  }
*/
  if (!(`${field.tag}` in ruleArray) || ruleArray === null || operation === NONE) {

    /*
    if (!['020', '650'].includes(tag) || !isControlSubfieldCode(subfield1.code)) { // eslint-disable-line functional/no-conditional-statements
      nvdebug(`No punctuation rules found for ${tag} (looking for: ‡${subfield1.code})`, debug);

    }
    */
    return;
  }

  //nvdebug(`OP=${operation} ${tag}: '${subfield1.code}: ${subfield1.value}' ??? '${subfield2 ? subfield2.code : '#'}'`, debug);
  const activeRules = ruleArray[field.tag].filter(rule => checkRule(rule, field, subfield1, subfield2));

  activeRules.forEach(rule => {
    const originalValue = subfield1.value;
    if (rule.remove && [REMOVE, REMOVE_AND_ADD].includes(operation) && subfield1.value.match(rule.remove)) { // eslint-disable-line functional/no-conditional-statements
      //nvdebug(`    PUNC REMOVAL TO BE PERFORMED FOR $${subfield1.code} '${subfield1.value}'`, debug);
      subfield1.value = subfield1.value.replace(rule.remove, ''); // eslint-disable-line functional/immutable-data
      //nvdebug(`    PUNC REMOVAL PERFORMED FOR '${subfield1.value}'`, debug);
    }
    if (rule.add && [ADD, REMOVE_AND_ADD].includes(operation)) { // eslint-disable-line functional/no-conditional-statements
      subfield1.value += rule.add; // eslint-disable-line functional/immutable-data
      //nvdebug(`    ADDED '${rule.add}' TO '${subfield1.value}'`, debug);
    }
    if (subfield1.value !== originalValue) { // eslint-disable-line functional/no-conditional-statements
      //nvdebug(` PROCESS PUNC: '‡${subfield1.code} ${originalValue}' => '‡${subfield1.code} ${subfield1.value}'`, debug); // eslint-disable-line functional/immutable-data
    }
  });
}

function subfieldFixPunctuation(field, subfield1, subfield2) {
  applyPunctuationRules(field, subfield1, subfield2, cleanCrappyPunctuationRules, REMOVE);
  applyPunctuationRules(field, subfield1, subfield2, addPairedPunctuationRules, ADD);
}

function subfieldStripPunctuation(field, subfield1, subfield2) {
  nvdebug(`FSP1: '${subfield1.value}'`);
  applyPunctuationRules(field, subfield1, subfield2, cleanValidPunctuationRules, REMOVE);
  nvdebug(`FSP2: '${subfield1.value}'`);
  applyPunctuationRules(field, subfield1, subfield2, cleanCrappyPunctuationRules, REMOVE);
  nvdebug(`FSP3: '${subfield1.value}'`);

}

export function fieldStripPunctuation(field) {
  if (!field.subfields) {
    return field;
  }

  field.subfields.forEach((sf, i) => {
    // NB! instead of next subfield, we should actually get next *non-control-subfield*!!!
    // (In plain English: We should skip $0 - $9 at least, maybe $w as well...)
    subfieldStripPunctuation(field, sf, getNextRelevantSubfield(field, i));

  });
  return field;
}

export function fieldFixPunctuation(field) {
  if (!field.subfields) {
    return field;
  }
  nvdebug(`################### fieldFixPunctuation() TEST ${fieldToString(field)}`);

  field.subfields.forEach((sf, i) => {
    // NB! instead of next subfield, we should actually get next *non-control-subfield*!!!
    // (In plain English: We should skip $0 - $9 at least, maybe $w as well...)
    subfieldFixPunctuation(field, sf, getNextRelevantSubfield(field, i));
  });

  // Use shared code for final punctuation (sadly this does not fix intermediate punc):
  if (field.useExternalEndPunctuation) { // eslint-disable-line functional/no-conditional-statements
    // addFinalPunctuation(field); // local version. use shared code instead.
    validateSingleField(field, false, true); // NB! Don't use field.tag as second argument! It's a string, not an int. 3rd arg must be true (=fix)
  }
  return field;
}
