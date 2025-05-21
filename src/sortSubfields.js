// Author(s): Nicholas Volk

import clone from 'clone';
import createDebugLogger from 'debug';
import {fieldToString, nvdebug} from './utils';

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:sortSubfields');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

const defaultSortOrderStringFinns = '8673abcdefghijklmnopqrstuvwxyz420159'; // NB! We Finns like $2 before $0 in 6XX...
const defaultSortOrderStringOthers = '8673abcdefghijklmnopqrstuvwxyz402159';

const defaultSortOrderFinns = defaultSortOrderStringFinns.split('');
const defaultSortOrderOthers = defaultSortOrderStringOthers.split('');


export default function (defaultTagPattern) {

  return {
    description: 'Swap adjacent subfields',
    validate, fix
  };

  function getRelevantFields(record, tagPattern) {
    const datafields = record.fields.filter(f => f.subfields);
    if (!tagPattern) {
      return datafields;
    }

    const regexp = new RegExp(tagPattern, 'u');
    return datafields.filter(f => regexp.test(f.tag));
  }

  function fix(record, tagPattern = defaultTagPattern) {
    const res = {message: [], fix: [], valid: true};

    const relevantFields = getRelevantFields(record, tagPattern);

    relevantFields.forEach(field => {
      sortAdjacentSubfields(field);
    });

    return res;
  }

  function validate(record, tagPattern = defaultTagPattern) {
    const res = {message: []};

    const relevantFields = getRelevantFields(record, tagPattern);

    relevantFields.forEach(field => {
      const clonedField = clone(field);
      sortAdjacentSubfields(clonedField);
      const clonedFieldAsString = fieldToString(clonedField);
      const fieldAsString = fieldToString(field);
      if (fieldAsString !== clonedFieldAsString) { // eslint-disable-line functional/no-conditional-statements
        res.message.push(clonedFieldAsString); // eslint-disable-line functional/immutable-data
      }
    });

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }
}


// X00, X10, X11 and X130 could also for their own sets...
// (ouch! sometimes $c comes after $d...): LoC: 100 0# ‡a Black Foot, ‡c Chief, ‡d d. 1877 ‡c (Spirit)
const sortOrderForX00 = ['6', 'i', 'a', 'b', 'c', 'q', 'd', 'e', 't', 'u', 'l', 'f', 'x', 'y', 'z', '0', '5', '9']; // skip $g. Can't remember why, though...
const sortOrderForX10 = ['6', 'i', 'a', 'b', 't', 'n', 'c', 'e', 'v', 'w', 'x', 'y', 'z', '0', '5', '9']; // somewhat iffy
const sortOrderForX11 = ['6', 'a', 'n', 'd', 'c', 'e', 'g', 'j', '0', '5', '9'];
const sortOrderFor7XX = ['8', '6', '7', 'i', 'a', 's', 't', 'b', 'c', 'd', 'm', 'h', 'k', 'o', 'x', 'z', 'g', 'q', 'w'];
const sortOrderFor246 = ['i', 'a', 'b', 'n', 'p', 'f', '5', '9']; // Used by field 946 as well

// List *only* exceptional order here. Otherwise default order is used.
const subfieldSortOrder = [
  {'tag': '017', 'sortOrder': ['i', 'a', 'b', 'd']},
  {'tag': '028', 'sortOrder': ['b', 'a', 'q']}, // National convention
  //{'tag': '031', 'sortOrder': ['a', 'b', 'c', 'm', 'e', 'd']}, // utter guesswork
  {'tag': '040', 'sortOrder': ['8', '6', 'a', 'b', 'e', 'c', 'd', 'x']},
  {'tag': '041', 'sortOrder': ['8', '6', 'a', 'd', 'j', 'p', 'h', 'e', 'g', 'm']}, // guesswork
  {'tag': '048', 'sortOrder': ['8', '6', 'b', 'a']},
  {'tag': '100', 'sortOrder': sortOrderForX00},
  {'tag': '110', 'sortOrder': sortOrderForX10},
  {'tag': '111', 'sortOrder': sortOrderForX11},
  {'tag': '130', 'sortOrder': ['a', 'n', 'p', 'k', 'l']},
  {'tag': '240', 'sortOrder': ['a', 'm', 'n', 'p', 's', 'l', '2', '0', '1', '5', '9']},
  {'tag': '245', 'sortOrder': ['6', 'a', 'b', 'n', 'p', 'k', 'f', 'c']},
  {'tag': '246', 'sortOrder': sortOrderFor246},
  {'tag': '382', 'sortOrder': ['a']},
  {'tag': '385', 'sortOrder': ['8', 'm', 'n', 'a', '2', '0']},
  {'tag': '386', 'sortOrder': ['8', 'm', 'n', 'a']},
  {'tag': '490', 'sortOrder': ['a', 'x', 'y', 'v', 'l']},
  {'tag': '505', 'sortOrder': ['a']},
  {'tag': '526', 'sortOrder': ['i', 'a', 'b', 'x', 'z']},
  {'tag': '540', 'sortOrder': ['a', 'b', 'c', 'd', 'f', '2', 'u']},
  {'tag': '600', 'sortOrder': sortOrderForX00},
  {'tag': '610', 'sortOrder': sortOrderForX10},
  {'tag': '611', 'sortOrder': sortOrderForX11},
  {'tag': '650', 'sortOrder': ['a', 'x', 'y', 'z']},
  {'tag': '700', 'sortOrder': sortOrderForX00},
  {'tag': '710', 'sortOrder': sortOrderForX10},
  {'tag': '711', 'sortOrder': sortOrderForX11},
  {'tag': '760', 'sortOrder': sortOrderFor7XX},
  {'tag': '762', 'sortOrder': sortOrderFor7XX},
  {'tag': '765', 'sortOrder': sortOrderFor7XX},
  {'tag': '767', 'sortOrder': sortOrderFor7XX},
  {'tag': '770', 'sortOrder': sortOrderFor7XX},
  {'tag': '772', 'sortOrder': sortOrderFor7XX},
  {'tag': '773', 'sortOrder': sortOrderFor7XX},
  {'tag': '774', 'sortOrder': sortOrderFor7XX},
  {'tag': '775', 'sortOrder': sortOrderFor7XX},
  {'tag': '776', 'sortOrder': sortOrderFor7XX},
  {'tag': '777', 'sortOrder': sortOrderFor7XX},
  {'tag': '780', 'sortOrder': sortOrderFor7XX},
  {'tag': '785', 'sortOrder': sortOrderFor7XX},
  {'tag': '786', 'sortOrder': sortOrderFor7XX},
  {'tag': '787', 'sortOrder': sortOrderFor7XX},
  {'tag': '788', 'sortOrder': sortOrderFor7XX},
  {'tag': '800', 'sortOrder': sortOrderForX00},
  {'tag': '810', 'sortOrder': sortOrderForX10},
  {'tag': '811', 'sortOrder': sortOrderForX11},
  {'tag': '830', 'sortOrder': ['a', 'n', 'x', 'v']}, // INCOMPLETE, SAME AS 490? APPARENTLY NOT...
  {'tag': '856', 'sortOrder': ['3', 'u', 'q', 'x', 'y', 'z', '5']}, // incomplete, LoC examples are inconclusive
  {'tag': '880', 'sortOrder': ['6', 'a']},
  {'tag': '946', 'sortOrder': sortOrderFor246},
  {'tag': 'LOW', 'sortOrder': ['a', 'b', 'c', 'l', 'h']},
  {'tag': 'SID', 'sortOrder': ['c', 'b']} // Hack, so that default order is not used
];

function getSubfieldSortOrder(field) {
  const entry = subfieldSortOrder.filter(currEntry => field.tag === currEntry.tag);
  if (entry.length > 0 && 'sortOrder' in entry[0]) {
    debugDev(`sort order for ${field.tag}: ${entry[0].sortOrder}`);
    return entry[0].sortOrder;
  }
  nvdebug(`WARNING!\tNo subfield order found for ${field.tag}.`);
  return [];
}


function swapSubfields(field, sortOrder) {
  if (!field.subfields) {
    return;
  }

  const loopAgain = field.subfields.some((sf, index) => {
    if (index === 0) {
      return false;
    }
    const currPos = getPosition(sf, sortOrder);
    const prevPos = getPosition(field.subfields[index - 1], sortOrder);
    if (currPos === -1 || prevPos === -1 || currPos >= prevPos) {
      return false;
    }
    // Swap:
    const tmp = field.subfields[index - 1];
    field.subfields[index - 1] = sf; // eslint-disable-line functional/immutable-data
    field.subfields[index] = tmp; // eslint-disable-line functional/immutable-data
    return true;
  });

  if (loopAgain) {
    return swapSubfields(field, sortOrder);
  }

  return;

  function getPosition(subfield, sortOrder) {
    // Magic exception that *always* comes first, used by Aleph in linking overlong fields
    if (sortOrder.indexOf('9') > -1 && subfield.code === '9' && ['^', '^^'].includes(subfield.value)) {
      return -0.5; // normal "best value" is 0, and "worst value" is N
    }
    return sortOrder.indexOf(subfield.code);
  }
}


function twoBeforeZero(field) {
  const sf2 = field.subfields.filter(sf => sf.code === '2');
  if (sf2.length !== 1) {
    return true; // both true and false are ok here
  }
  // MRA-465: gcipplatform (field 753)
  // rdasco (344), creatorbio (353), gbd (668), lsch (eg. 385)
  if (['creatorbio', 'gbd', 'gcipplatform', 'lscsh', 'rdasco'].includes(sf2[0].value)) {
    return false;
  }
  return true;
}

export function sortAdjacentSubfields(field, externalSortOrder = []) {
  if (!field.subfields) {
    return field;
  }
  // Features:
  // - Swap only sort adjacent pairs.
  // - No sorting over unlisted subfield codes. Thus a given subfield can not shift to wrong side of 700$t...

  // Implement: 880 field should use values from $6...

  // Should we support multiple sort orders per field?

  // Try to handle control subfield order. This is not 100% fool proof. Control subfields are pretty stable, though.
  // However, there are exceptions (eg. $9 ^^ comes first and $2 $0 is a Finnish convention...)

  const finnishWay = twoBeforeZero(field);
  const controlSubfieldOrder = finnishWay ? ['8', '6', '7', '3', 'a', '4', '2', '0', '1', '5', '9'] : ['8', '6', '7', '3', 'a', '4', '0', '2', '1', '5', '9'];
  swapSubfields(field, controlSubfieldOrder);

  const sortOrderForField = externalSortOrder.length > 0 ? externalSortOrder : getSubfieldSortOrder(field);
  //nvdebug(`INTERMEDIATE SUBFIELD ORDER FOR ${field.tag}: ${sortOrderForField.join(', ')}`);

  const defaultSortOrder = finnishWay ? defaultSortOrderFinns : defaultSortOrderOthers; // $2 vs $0
  const subfieldOrder = sortOrderForField.length > 0 ? sortOrderForField : defaultSortOrder;
  //nvdebug(`FINAL SUBFIELD ORDER (FINNISH=${finnishWay}) FOR ${field.tag}: ${subfieldOrder.join(', ')}`);
  //if (sortOrder === null) { return field; } //// Currently always sort..
  //nvdebug(`IN:  ${fieldToString(field)}`);
  swapSubfields(field, subfieldOrder);
  //nvdebug(`OUT: ${fieldToString(field)}`);

  return field;
}

