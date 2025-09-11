//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldToString} from './utils.js';
// Author(s): Nicholas Volk
// NB! CR 008/24 vs 008/25-27 is not supported yet!

export default function () {

  return {
    description: 'Justify left and sort character groups within 008/18-24',
    validate, fix
  };

  function fix(record) {
    const typeOfMaterial = record.getTypeOfMaterial();
    record.fields.forEach(field => {
      justifyAndSortField008CharacterGroups(field, typeOfMaterial);
    });
    // Fix always succeeds (even when it really does not):
    const res = {message: [], fix: [], valid: true};
    return res;
  }

  function validate(record) {
    const res = {message: []};

    const typeOfMaterial = record.getTypeOfMaterial();

    record.fields?.forEach(field => {
      validateField(field, res, typeOfMaterial);
    });

    res.valid = !(res.message.length >= 1);
    return res;
  }

  function validateField(field, res, typeOfMaterial) {
    if (field.tag !== '008') { // Optimize code a bit...
      return;
    }
    const orig = fieldToString(field);

    const normalizedField = justifyAndSortField008CharacterGroups(clone(field), typeOfMaterial);
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`TODO: '${orig}' => '${mod}'`);
      return;
    }
    return;
  }
}

// Should we add legal values?
const characterGroups = [
  {type: 'BK', start: 18, end: 21, sort: true, name: 'illustrations'},
  {type: 'BK', start: 24, end: 27, sort: true, name: 'nature of contents'}, // English doc does not explicitly mention alphabetical sorting... Finnish does.
  {type: 'CR', start: 25, end: 27, sort: true, name: 'nature of contents'}, // NB! 24 vs 25-27 logic needs to be implemented separately
  {type: 'MP', start: 18, end: 21, sort: false, name: 'relief'}, // Order of importance!
  {type: 'MP', start: 33, end: 34, sort: false, name: 'special format of characteristics'}, // Order of importance!
  {type: 'MU', start: 24, end: 29, sort: true, name: 'accompanying material'},
  {type: 'MU', start: 30, end: 31, sort: true, name: 'literary text for sound recordings'}
];

const BIG_BAD_VALUE = 999999999;

function processCharacterGroup(field, group) {
  const originalContent = field.value.substring(group.start, group.end + 1);
  const content = removeDuplicateValues(fixBlanks(originalContent));
  //console.info(`008/${group.start}-${group.end}: '${originalContent}'`); // eslint-disable-line no-console
  const charArray = content.split('');

  charArray.sort(function(a, b) {
    return scoreChar(a) - scoreChar(b);
  });

  const newContent = charArray.join('');
  if (originalContent === newContent) {
    return;
  }

  //console.info(`'${fieldToString(field)}' =>`); // eslint-disable-line no-console

  field.value = `${field.value.substring(0, group.start)}${newContent}${field.value.substring(group.end + 1)}`;
  //console.info(`'${fieldToString(field)}'`); // eslint-disable-line no-console

  function fixBlanks(str) {
    if (str.includes('|') && str.match(/[^ |]/u)) {
      return str.replaceAll('|', ' ');
    }
    return str;
  }

  function scoreChar(c) {
    if (c === '|' || c === ' ') {
      return BIG_BAD_VALUE; // Max value, these should code last
    }
    if (!group.sort) { // more meaningful comes first: keep the original order
      return 1;
    }
    const asciiCode = c.charCodeAt(0);
    // a-z get values 1-26:
    if (asciiCode >= 97 && asciiCode <= 122) {
      return asciiCode - 96;
    }
    // 0-9 get values 100-109
    if (asciiCode >= 48 && asciiCode <= 57) {
      return asciiCode + 52;
    }
    // Others (=crap) return something between '9' and BIG BAD VALUE
    return asciiCode + 200;
  }
}

export function justifyAndSortField008CharacterGroups(field, typeOfMaterial) {
  if (field.tag !== '008' || field.subfields) {
    return field;
  }

  //console.info(typeOfMaterial); // eslint-disable-line no-console

  const relevantCharacterGroups = characterGroups.filter(gr => gr.type === typeOfMaterial);

  relevantCharacterGroups.forEach(group => processCharacterGroup(field, group));

  //justifyField008CharacterGroups(field, typeOfMaterial); // Oops: also sorts...

  // NB! add value # and | normalizations
  //fixBlanks(field, typeOfMaterial);

  return field;
}

function removeDuplicateValues(str) {
  const arr = str.split('');
  // Take only the first instance of a proper value-carrying character
  const reducedStr = arr.filter((c, i) => c === ' ' || c === '|' || arr.indexOf(c) === i).join('');
  //console.info(`I: '${str}'`); // eslint-disable-line no-console
  //console.info(`M: '${reducedStr}'`); // eslint-disable-line no-console
  const output = `${reducedStr}${' '.repeat(str.length - reducedStr.length)}`; // Had some weird trouble with str.padEnd(n)
  //console.info(`M: '${output}'`); // eslint-disable-line no-console
  return output;
}
