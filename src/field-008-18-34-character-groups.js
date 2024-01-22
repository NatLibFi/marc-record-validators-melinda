//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldToString} from './utils';

// Author(s): Nicholas Volk
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

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
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
      res.message.push(`TODO: '${orig}' => '${mod}'`); // eslint-disable-line functional/immutable-data
      return;
    }
    return;
  }
}

// Should we add legal values?
const characterGroups = [
  {type: 'BK', start: 18, end: 21, name: 'illustrations'},
  {type: 'BK', start: 24, end: 27, name: 'nature of contents'},
  {type: 'CR', start: 25, end: 27, name: 'nature of contents'},
  {type: 'MP', start: 18, end: 21, name: 'relief'},
  {type: 'MP', start: 33, end: 34, name: 'special format of characteristics'},
  {type: 'MU', start: 24, end: 29, name: 'accompanying material'},
  {type: 'MU', start: 30, end: 31, name: 'literary text for sound recordings'}
];

const BIG_BAD_VALUE = 999999999;

function justifyField008CharacterGroups(field, typeOfMaterial) {
  const relevantCharacterGroups = characterGroups.filter(gr => gr.type === typeOfMaterial);

  relevantCharacterGroups.forEach(group => justifySubstring(group));

  function scoreChar(c) {
    if (c === '|' || c === ' ') {
      return BIG_BAD_VALUE; // Max value, these should code last
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

  function justifySubstring(group) {
    const content = field.value.substring(group.start, group.end + 1);
    const charArray = content.split('');
    charArray.sort(function(a, b) { // eslint-disable-line functional/immutable-data, prefer-arrow-callback
      return scoreChar(a) - scoreChar(b);
    });
    const newContent = charArray.join('');
    if (content === newContent) {
      return;
    }
    //console.info(`${fieldToString(field)} =>`); // eslint-disable-line no-console

    field.value = `${field.value.substring(0, group.start)}${newContent}${field.value.substring(group.end + 1)}`; // eslint-disable-line functional/immutable-data
    //console.info(`${fieldToString(field)}`); // eslint-disable-line no-console
  }

}

export function justifyAndSortField008CharacterGroups(field, typeOfMaterial) {
  if (field.tag !== '008' || field.subfields) {
    return field;
  }

  justifyField008CharacterGroups(field, typeOfMaterial); // Oops: also sorts...

  // NB! add value # and | normalizations

  return field;
}

