/*
* punctuation.js -- try and fix a marc field punctuation
*
* Author(s): Nicholas Volk <nicholas.volk@helsinki.fi>
*
* NOTE #1: https://www.kiwi.fi/display/kumea/Loppupisteohje is implemented via another validator/fixer (ending-punctuation).
*          This file has some support but it's now yet thorough. (And mmight never be.)
* NOTE #2: Validator/fixer punctuation does similar stuff, but focuses on X00 fields.
* NOTE #3: As of 2023-06-05 control subfields ($0...$9) are obsolete. Don't use them in rules.
*          (They are jumped over when looking for next (non-controlfield subfield)
*/
import {validateSingleField} from './ending-punctuation';
import {fieldGetUnambiguousTag} from './subfield6Utils';
//import createDebugLogger from 'debug';
import {fieldToString, nvdebug} from './utils';
import clone from 'clone';

//const debug = createDebugLogger('debug/punctuation2');

const descriptionString = 'Remove invalid and add valid punctuation to data fields';
export default function () {
  return {
    description: descriptionString,
    validate, fix
  };

  function fix(record) {
    nvdebug(`${descriptionString}: fixer`);
    const res = {message: [], fix: [], valid: true};
    record.fields.forEach(f => fieldFixPunctuation(f));
    return res;
  }

  function validate(record) {
    nvdebug(`${descriptionString}: validate`);

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

export function fieldGetFixedString(field, add = true) {
  const cloneField = clone(field);
  const operation = add ? subfieldFixPunctuation : subfieldStripPunctuation;
  cloneField.subfields.forEach((sf, i) => {
    // NB! instead of next subfield, we should actually get next *non-control-subfield*!!!
    // (In plain English: We should skip $0 - $9 at least, maybe $w as well...)
    operation(cloneField, sf, getNextRelevantSubfield(cloneField, i));
  });
  return fieldToString(cloneField);
}

export function fieldNeedsModification(field, add = true) {
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
const needsPuncAfterAlphanumeric = /(?:[a-z0-9A-Z]|å|ä|ö|Å|Ä|Ö)$/u;
const defaultNeedsPuncAfter2 = /(?:[\]a-zA-Z0-9)]|ä|å|ö|Å|Ä|Ö)$/u;
const doesNotEndInPunc = /[^!?.:;,]$/u; // non-punc for pre-240/700/XXX $, note that '.' comes if preceded by ')'
const blocksPuncRHS = /^(?:\()/u;
const allowsPuncRHS = /^(?:[A-Za-z0-9]|å|ä|ö|Å|Ä|Ö)/u;

const dotIsProbablyPunc = /(?:[a-z0-9)]|å|ä|ö|(?:[A-Za-z0-9]|Å|Ä|Ö)(?:[A-Z]|Å|Ä|Ö))\.$/u;
const puncIsProbablyPunc = /(?:[a-z0-9)]|å|ä|ö) ?[.,:;]$/u;
// NB! 65X: Finnish terms don't use punctuation, but international ones do. Neither one is currently (2021-11-08) coded here.

// Will unfortunately trigger "Sukunimi, Th." type:
const removeColons = {'code': 'abcdefghijklmnopqrstuvwxyz', 'remove': / *[;:]$/u};
const removeX00Comma = {'code': 'abcdenqt', 'followedBy': 'abcdenqtv#', 'context': /.,$/u, 'remove': /,$/u};
const cleanRHS = {'code': 'abcd', 'followedBy': 'bcde', 'context': /(?:(?:[a-z0-9]|å|ä|ö)\.|,)$/u, 'contextRHS': blocksPuncRHS, 'remove': /[.,]$/u};
const cleanX00dCommaOrDot = {'code': 'd', 'followedBy': 'et#', 'context': /[0-9]-[,.]$/u, 'remove': /[,.]$/u};
const cleanX00aDot = {'code': 'abcde', 'followedBy': 'cdegj', 'context': dotIsProbablyPunc, 'remove': /\.$/u};
const cleanCorruption = {'code': 'abcdefghijklmnopqrstuvwxyz', 'remove': / \.$/u};
// These $e dot removals are tricky: before removing the comma, we should know that it ain't an abbreviation such as "esitt."...
const cleanX00eDot = {'code': 'e', 'followedBy': 'egj#', 'context': /(?:[ai]ja|jä)[.,]$/u, 'remove': /\.$/u};
const removeCommaBeforeLanguageSubfieldL = {'followedBy': 'l', 'remove': /,$/u};
const removeCommaBeforeTitleSubfieldT = {'followedBy': 't', 'remove': /,$/u};

const X00RemoveDotAfterBracket = {'code': 'cq', 'context': /\)\.$/u, 'remove': /\.$/u};
// 390, 800, 810, 830...
const cleanPuncBeforeLanguage = {'code': 'atvxyz', 'followedBy': 'l', 'context': puncIsProbablyPunc, 'remove': / *[.,:;]$/u};

const addX00aComma = {'add': ',', 'code': 'abcqej', 'followedBy': 'cdeg', 'context': doesNotEndInPunc, 'contextRHS': allowsPuncRHS};
const addX00dComma = {'name': 'X00$d ending in "-" does not get comma', 'add': ',', 'code': 'd', 'followedBy': 'cdeg', 'context': /[^-,.!]$/u, 'contextRHS': allowsPuncRHS};
const addX00aComma2 = {'add': ',', 'code': 'abcdej', 'followedBy': 'cdeg', 'context': /(?:[A-Z]|Å|Ä|Ö)\.$/u, 'contextRHS': allowsPuncRHS};
const addX00Dot = {'add': '.', 'code': 'abcdetv', 'followedBy': '#fklptu', 'context': needsPuncAfterAlphanumeric};


const addX10iColon = {'name': 'Punctuate relationship information', 'code': 'i', 'context': defaultNeedsPuncAfter2};
const addX10bDot = {'name': 'Add X10 pre-$b dot', 'add': '.', 'code': 'ab', 'followedBy': 'b', 'context': needsPuncAfterAlphanumeric};
const addX10eComma = {'add': ',', 'code': 'abe', 'followedBy': 'e', 'context': defaultNeedsPuncAfter2};
const addX10Dot = {'name': 'Add X10 final dot', 'add': '.', 'code': 'abet', 'followedBy': 'tu#', 'context': needsPuncAfterAlphanumeric};
const addColonToRelationshipInformation = {'name': 'Add \':\' to 7X0 $i relationship info', 'add': ':', 'code': 'i', 'context': defaultNeedsPuncAfter2};

const addDotBeforeLanguageSubfieldL = {'name': 'Add dot before $l', 'add': '.', 'code': 'abepst', 'followedBy': 'l', 'context': doesNotEndInPunc};

// 490:
const addSemicolonBeforeVolumeDesignation = {'name': 'Add " ;" before $v', 'add': ' ;', 'code': 'atxyz', 'followedBy': 'v', 'context': /[^;]$/u};

const NONE = 0;
const ADD = 2;
const REMOVE = 1;
const REMOVE_AND_ADD = 3;

// Crappy punctuation consists of various crap that is somewhat common.
// We strip crap for merge decisions. We are not trying to actively remove crap here.

const removeCrapFromAllEntryFields = [removeCommaBeforeLanguageSubfieldL, removeCommaBeforeTitleSubfieldT];

const removeX00Whatever = [removeX00Comma, cleanX00aDot, cleanX00eDot, cleanCorruption, cleanX00dCommaOrDot, cleanRHS, X00RemoveDotAfterBracket, removeColons, cleanPuncBeforeLanguage, ...removeCrapFromAllEntryFields];
const removeX10Whatever = [removeX00Comma, cleanX00aDot, cleanX00eDot, cleanCorruption, removeColons, cleanPuncBeforeLanguage, ...removeCrapFromAllEntryFields];
const removeX11Whatever = removeCrapFromAllEntryFields;
const removeX30Whatever = removeCrapFromAllEntryFields;

const remove490And830Whatever = [{'code': 'axyzv', 'followedBy': 'axyzv', 'remove': /(?: *;| *=|,)$/u}];

const linkingEntryWhatever = [{'code': 'abdghiklmnopqrstuwxyz', 'followedBy': 'abdghiklmnopqrstuwxyz', 'remove': /\. -$/u}];


// '!' means negation, thus '!b' means any other subfield but 'b'.
// 'followedBy': '#' means that current subfield is the last subfield.
// NB! Note that control subfields are ignored in punctuation rules.
// NB #2! Control field ignorance causes issues with field 257: https://wiki.helsinki.fi/display/rdasovellusohje/Loppupisteohje
//        Might need to work on that at some point. NOT a top priority though.
// NB #3! Final punctuation creation is/should be handled by endind-punctuation.js validator!

const crappy24X = [
  {'code': 'abnp', 'followedBy': '!c', 'remove': / \/$/u},
  {'code': 'abn', 'followedBy': 'c', 'remove': /\.$/u, 'context': dotIsProbablyPunc},
  {'code': 'abc', 'followedBy': '#', 'remove': /\.$/u, 'context': dotIsProbablyPunc},
  {'code': 'abfghinp', 'followedBy': '#', 'remove': /\.$/u, 'context': dotIsProbablyPunc},
  {'code': 'n', 'followedBy': 'p', 'remove': /\.$/u, 'context': dotIsProbablyPunc}, // MELINDA-8817
  {'code': 'p', 'followedBy': 'pc', 'remove': /\.$/u, 'context': dotIsProbablyPunc}, // MELINDA-8817
  removeCommaBeforeLanguageSubfieldL
];


const cleanCrappyPunctuationRules = {
  '100': removeX00Whatever,
  '110': removeX10Whatever,
  '111': removeX11Whatever,
  '130': removeX30Whatever,
  '240': crappy24X,
  '245': crappy24X,
  '246': crappy24X,
  '300': [
    {'code': 'a', 'followedBy': '!b', 'remove': / *:$/u},
    {'code': 'a', 'followedBy': 'b', 'remove': /:$/u, 'context': /[^ ]:$/u},
    {'code': 'ab', 'followedBy': '!c', 'remove': / *;$/u},
    {'code': 'ab', 'followedBy': 'c', 'remove': /;$/u, 'context': /[^ ];$/u},
    {'code': 'abc', 'followedBy': '!e', 'remove': / *\+$/u} // Removes both valid (with one space) and invalid (spaceless et al) puncs

  ],

  '490': remove490And830Whatever,
  '600': removeX00Whatever,
  '610': removeX10Whatever,
  '611': removeX11Whatever,
  '630': removeX30Whatever,
  '700': removeX00Whatever,
  '710': removeX10Whatever,
  '711': removeX11Whatever,
  '730': removeX30Whatever,
  '773': linkingEntryWhatever,
  '774': linkingEntryWhatever,
  '776': linkingEntryWhatever,
  '800': removeX00Whatever,
  '810': removeX10Whatever,
  '830': remove490And830Whatever,
  '946': crappy24X
};

const cleanLegalX00Comma = {'code': 'abcde', 'followedBy': 'cdegj', 'context': /.,$/u, 'remove': /,$/u};
// Accept upper case letters in X00$b, since they are probably Roman numerals.
const cleanLegalX00bDot = {'code': 'b', 'followedBy': 't#', context: /^[IVXLCDM]+\.$/u, 'remove': /\.$/u};
const cleanLegalX00iColon = {'code': 'i', 'followedBy': 'a', 'remove': / *:$/u}; // NB! context is not needed
const cleanLegalX00Dot = {'code': 'abcdetvl', 'followedBy': 'tu#', 'context': /(?:[a-z0-9)]|å|ä|ö)\.$/u, 'remove': /\.$/u};
const cleanDotBeforeLanguageSubfieldL = {'name': 'pre-language-$l dot', 'followedBy': 'l', 'context': /.\.$/u, 'remove': /\.$/u};

const legalEntryField = [cleanDotBeforeLanguageSubfieldL];

const legalX00punc = [cleanLegalX00Comma, cleanLegalX00iColon, cleanLegalX00bDot, cleanLegalX00Dot, ...legalEntryField];

const cleanLegalX10Comma = {'name': 'X10comma', 'code': 'abe', 'followedBy': 'e', 'context': /.,$/u, 'remove': /,$/u};
const cleanLegalX10Dot = {'name': 'X10dot', 'code': 'abt', 'followedBy': 'bst#', 'context': /.\.$/u, 'remove': /\.$/u};

const legalX10punc = [cleanLegalX10Comma, cleanLegalX10Dot, cleanX00eDot, ...legalEntryField];

const cleanLegalSeriesTitle = [ // 490 and 830
  {'code': 'a', 'followedBy': 'a', 'remove': / =$/u},
  {'code': 'axyz', 'followedBy': 'xyz', 'remove': /,$/u, 'context': /.,$/u},
  {'code': 'axyz', 'followedBy': 'v', 'remove': / *;$/u}
];

const clean24X = [
  {'name': 'I:A', 'code': 'i', 'followedBy': 'a', 'remove': / *:$/u},
  {'name': 'A:B', 'code': 'a', 'followedBy': 'b', 'remove': / [:;=]$/u},
  {'name': 'AB:K', 'code': 'ab', 'followedBy': 'k', 'remove': / :$/u},
  {'name': 'ABK:F', 'code': 'abk', 'followedBy': 'f', 'remove': /,$/u},
  {'name': 'ABFNP:C', 'code': 'abfnp', 'followedBy': 'c', 'remove': / \/$/u},
  {'name': 'ABN:N', 'code': 'abn', 'followedBy': 'n', 'remove': /\.$/u},
  {'name': 'ABNP:#', 'code': 'abnp', 'followedBy': '#', 'remove': /\.$/u},
  {'name': 'N:P', 'code': 'n', 'followedBy': 'p', 'remove': /,$/u},
  cleanDotBeforeLanguageSubfieldL
];

const cleanValidPunctuationRules = {
  '100': legalX00punc,
  '110': legalX10punc,
  '111': legalEntryField,
  '130': legalEntryField,
  '240': clean24X,
  '243': clean24X,
  '245': clean24X,
  '246': clean24X,
  '260': [
    {'code': 'abc', 'followedBy': 'a', 'remove': / ;$/u},
    {'code': 'a', 'followedBy': 'b', 'remove': / :$/u},
    {'code': 'b', 'followedBy': 'c', 'remove': /,$/u},
    {'code': 'c', 'followedBy': '#', 'remove': /\.$/u},
    {'code': 'd', 'followedBy': 'e', 'remove': / :$/u},
    {'code': 'e', 'followedBy': 'f', 'remove': /,$/u},
    {'code': 'f', 'followedBy': '#', 'remove': /\.$/u} // Probably ')' but should it be removed?
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
  '490': cleanLegalSeriesTitle,
  '534': [{'code': 'p', 'followedBy': 'c', 'remove': /:$/u}],
  '600': legalX00punc,
  '610': legalX10punc,
  '611': legalEntryField,
  '630': legalEntryField,
  // Experimental, MET366-ish (end punc in internationally valid, but we don't use it here in Finland):
  '648': [{'code': 'a', 'content': /^[0-9]+\.$/u, 'ind2': ['4'], 'remove': /\.$/u}],
  '700': legalX00punc,
  '710': legalX10punc,
  '711': legalEntryField,
  '730': legalEntryField,
  '800': legalX00punc,
  '810': legalX10punc,
  '811': legalEntryField,
  '830': [...legalEntryField, ...cleanLegalSeriesTitle],
  '946': clean24X
};


// Overgeneralizes a bit: eg. addColonToRelationshipInformation only applies to 700/710 but as others don't have $i, it's fine.
const addToAllEntryFields = [addDotBeforeLanguageSubfieldL, addSemicolonBeforeVolumeDesignation, addColonToRelationshipInformation];


const addX00 = [addX00aComma, addX00aComma2, addX00Dot, addX00dComma, ...addToAllEntryFields];
const addX10 = [addX10iColon, addX10bDot, addX10eComma, addX10Dot, ...addToAllEntryFields];
const addX11 = [...addToAllEntryFields];
const addX30 = [...addToAllEntryFields];

const add24X = [
  {'code': 'i', 'followedBy': 'a', 'add': ':', 'context': needsPuncAfterAlphanumeric},
  {'code': 'a', 'followedBy': 'b', 'add': ' :', 'context': needsPuncAfterAlphanumeric},
  {'code': 'abk', 'followedBy': 'f', 'add': ',', 'context': needsPuncAfterAlphanumeric},
  {'code': 'abfnp', 'followedBy': 'c', 'add': ' /', 'context': needsPuncAfterAlphanumeric},
  addDotBeforeLanguageSubfieldL
];

const add245 = [
  ...add24X,
  // Blah! Also "$a = $b" and "$a ; $b" can be valid... But ' :' is better than nothing, I guess...
  {'code': 'ab', 'followedBy': 'n', 'add': '.', 'context': needsPuncAfterAlphanumeric},
  {'code': 'n', 'followedBy': 'p', 'add': ',', 'context': defaultNeedsPuncAfter2},
  {'code': 'abc', 'followedBy': '#', 'add': '.', 'context': needsPuncAfterAlphanumeric} // Stepping on "punctuation validator's" toes
];

const addSeriesTitle = [ // 490 and 830
  {'code': 'a', 'followedBy': 'a', 'add': ' =', 'context': defaultNeedsPuncAfter2},
  {'code': 'axyz', 'followedBy': 'xy', 'add': ',', 'context': defaultNeedsPuncAfter2},
  addSemicolonBeforeVolumeDesignation //  eg. 490$axyz-$v
];

const addPairedPunctuationRules = {
  '100': addX00,
  '110': addX10,
  '111': addX11,
  '130': addX30,
  '240': add24X,
  '243': add24X,
  '245': add245,
  '246': add24X,
  '260': [
    {'code': 'a', 'followedBy': 'b', 'add': ' :', 'context': defaultNeedsPuncAfter2},
    {'code': 'ab', 'followedBy': 'c', 'add': ',', 'context': defaultNeedsPuncAfter2},
    {'code': 'abc', 'followedBy': 'a', 'add': ' ;', 'context': defaultNeedsPuncAfter2},
    {'code': 'e', 'followedBy': 'f', 'add': ' :', 'context': defaultNeedsPuncAfter2},
    {'code': 'f', 'followedBy': 'g', 'add': ',', 'context': defaultNeedsPuncAfter2}
  ],
  '264': [
    {'code': 'a', 'followedBy': 'b', 'add': ' :', 'context': defaultNeedsPuncAfter2},
    {'code': 'b', 'followedBy': 'c', 'add': ',', 'context': defaultNeedsPuncAfter2},
    // NB! The $c rule messes dotless exception "264 #4 $c p1983" up
    // We'll need to add a hacky postprocessor for this? Add 'hasInd1': '0123' etc?
    {'code': 'c', 'followedBy': '#', 'add': '.', 'context': needsPuncAfterAlphanumeric, 'ind2': ['0', '1', '2', '3']}
  ],
  '300': [
    {'code': 'a', 'followedBy': 'b', 'add': ' :', 'context': defaultNeedsPuncAfter2},
    {'code': 'ab', 'followedBy': 'c', 'add': ' ;', 'context': defaultNeedsPuncAfter2},
    {'code': 'abc', 'followedBy': 'e', 'add': ' +', 'context': defaultNeedsPuncAfter2}
  ],
  '490': addSeriesTitle,
  '506': [{'code': 'a', 'followedBy': '#', 'add': '.', 'context': defaultNeedsPuncAfter2}],
  '534': [{'code': 'p', 'followedBy': 'c', 'add': ':', 'context': defaultNeedsPuncAfter2}],
  '600': addX00,
  '610': addX10,
  '611': addX11,
  '630': addX30,
  '700': addX00,
  '710': addX10,
  '711': addX11,
  '730': addX30,
  '800': addX00,
  '810': addX10,
  '811': addX11,
  '830': [...addX30, ...addSeriesTitle],
  '946': [{'code': 'i', 'followedBy': 'a', 'add': ':', 'context': defaultNeedsPuncAfter2}]
};

/*
function debugRule(rule) {
  //nvdebug('');
  nvdebug(`NAME ${rule.name ? rule.name : '<unnamed>'}`);
  nvdebug(`SUBFIELD CODE '${rule.code}' FOLLOWED BY SUBFIELD CODE '${rule.followedBy}'`);
  if ('add' in rule) { // eslint-disable-line functional/no-conditional-statements
    nvdebug(`ADD '${rule.add}'`);
  }
  if ('remove' in rule) { // eslint-disable-line functional/no-conditional-statements
    nvdebug(`REMOVE '${rule.remove}'`);
  }
  if ('context' in rule) { // eslint-disable-line functional/no-conditional-statements
    nvdebug(`CONTEXT '${rule.context.toString()}'`);
  }
  //nvdebug('');
}
*/

function ruleAppliesToSubfieldCode(targetSubfieldCodes, currSubfieldCode) {
  if (!targetSubfieldCodes) { // We are not interested in what subfield precedes 240$l, ',' is removed anyway
    return true;
  }
  const negation = targetSubfieldCodes.includes('!');
  if (negation) {
    return !targetSubfieldCodes.includes(currSubfieldCode);
  }
  return targetSubfieldCodes.includes(currSubfieldCode);
}


function ruleAppliesToField(rule, field) {
  if ('ind1' in rule && !rule.ind1.includes(field.ind1)) {
    return false;
  }

  if ('ind2' in rule && !rule.ind2.includes(field.ind2)) {
    return false;
  }

  // If we want to check, say, $2, it should be implemented here!

  return true;
}


function ruleAppliesToCurrentSubfield(rule, subfield) {
  //nvdebug(`  Apply rule on LHS?`);
  if (!ruleAppliesToSubfieldCode(rule.code, subfield.code)) {
    //nvdebug(`  Reject rule!`);
    return false;
  }
  if ('context' in rule) {
    //nvdebug(`  Check '${subfield.value}' versus '${rule.context.toString()}'`);
    if (!subfield.value.match(rule.context)) { // njsscan-ignore: regex_injection_dos
      //nvdebug(`  Reject rule!`);
      return false;
    }
  }
  //nvdebug(`  Apply rule!`);
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
    //nvdebug(`FAIL ON WHOLE FIELD: '${fieldToString(field)}`);
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

  //nvdebug(`${rule.name ? rule.name : '<unnamed>'}: ACCEPT ${rule.code} (${subfield1.code}), SF2=${rule.followedBy} (${subfield2 ? subfield2.code : '#'})`, debug);
  return true;
}


function applyPunctuationRules(field, subfield1, subfield2, ruleArray = null, operation = NONE) {
  if (operation === NONE || ruleArray === null) { // !fieldIsApplicable(field, ruleArray)) {
    return;
  }
  const tag2 = field.tag === '880' ? fieldGetUnambiguousTag(field) : field.tag;
  if (!tag2) {
    return;
  }
  if (!(`${tag2}` in ruleArray)) {
    return;
  }

  //nvdebug(`PUNCTUATE ${field.tag}/${tag2} '${subfieldToString(subfield1)}' XXX '${subfield2 ? subfieldToString(subfield2) : '#'} }`);

  //nvdebug(`OP=${operation} ${tag2}: '${subfield1.code}: ${subfield1.value}' ??? '${subfield2 ? subfield2.code : '#'}'`);
  const candRules = ruleArray[tag2];
  candRules.forEach(rule => {
    //debugRule(rule);
    //nvdebug(' WP1');
    if (!checkRule(rule, field, subfield1, subfield2)) {
      return;
    }
    //nvdebug(' WP2');

    //const originalValue = subfield1.value;
    if (rule.remove && [REMOVE, REMOVE_AND_ADD].includes(operation) && subfield1.value.match(rule.remove)) { // eslint-disable-line functional/no-conditional-statements
      //nvdebug(`    PUNC REMOVAL TO BE PERFORMED FOR $${subfield1.code} '${subfield1.value}'`, debug);
      subfield1.value = subfield1.value.replace(rule.remove, ''); // eslint-disable-line functional/immutable-data
      //nvdebug(`    PUNC REMOVAL PERFORMED FOR '${subfield1.value}'`);
    }
    if (rule.add && [ADD, REMOVE_AND_ADD].includes(operation)) { // eslint-disable-line functional/no-conditional-statements
      subfield1.value += rule.add; // eslint-disable-line functional/immutable-data
      //nvdebug(`    ADDED '${rule.add}' TO FORM '${subfield1.value}'`);
    }

    /*
    if (subfield1.value !== originalValue) { // eslint-disable-line functional/no-conditional-statements
      nvdebug(` PROCESS PUNC: '‡${subfield1.code} ${originalValue}' => '‡${subfield1.code} ${subfield1.value}'`, debug); // eslint-disable-line functional/immutable-data
    }
    */
  });
}

function subfieldFixPunctuation(field, subfield1, subfield2) {
  applyPunctuationRules(field, subfield1, subfield2, cleanCrappyPunctuationRules, REMOVE);
  applyPunctuationRules(field, subfield1, subfield2, addPairedPunctuationRules, ADD);
}

function subfieldStripPunctuation(field, subfield1, subfield2) {
  //nvdebug(`FSP1: '${subfield1.value}'`);
  applyPunctuationRules(field, subfield1, subfield2, cleanValidPunctuationRules, REMOVE);
  //nvdebug(`FSP2: '${subfield1.value}'`);
  applyPunctuationRules(field, subfield1, subfield2, cleanCrappyPunctuationRules, REMOVE);
  //nvdebug(`FSP3: '${subfield1.value}'`);

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
  //nvdebug(`################### fieldFixPunctuation() TEST ${fieldToString(field)}`);

  field.subfields.forEach((sf, i) => {
    // NB! instead of next subfield, we should actually get next *non-control-subfield*!!!
    // (In plain English: We should skip $0 - $9 at least, maybe $w as well...)
    // We'll need some magic for field 257 here, do we? (Also Finnish lexicons vs global lexicons in 65X fields)
    subfieldFixPunctuation(field, sf, getNextRelevantSubfield(field, i));
  });

  // Use shared code for final punctuation (sadly this does not fix intermediate punc):
  if (field.useExternalEndPunctuation) { // eslint-disable-line functional/no-conditional-statements
    // addFinalPunctuation(field); // local version. use shared code instead.
    validateSingleField(field, false, true); // NB! Don't use field.tag as second argument! It's a string, not an int. 3rd arg must be true (=fix)
  }
  return field;
}
