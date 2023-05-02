import clone from 'clone';
import createDebugLogger from 'debug';
import {fieldToString, nvdebug} from './utils';

const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge-reducers:sortSubfields');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

const defaultSortOrderString = '8673abcdefghijklmnopqrstuvwxyz420159';
const defaultSortOrder = defaultSortOrderString.split('');


// Author(s): Nicholas Volk
export default function () {

  return {
    description: 'Swap adjacent subfields',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};

    record.fields.forEach(field => {
      sortAdjacentSubfields(field);
    });

    return res;
  }

  function validate(record) {
    const res = {message: []};

    record.fields.forEach(field => {
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
const sortOrderFor7XX = ['8', '6', '7', 'i', 'a', 's', 't', 'b', 'c', 'd', 'm', 'h', 'k', 'o', 'x', 'z', 'g', 'q', 'w'];

// List *only* exceptional order here. Otherwise default order is used.
const subfieldSortOrder = [
  {'tag': '017', 'sortOrder': ['i', 'a', 'b', 'd']},
  {'tag': '028', 'sortOrder': ['b', 'a', 'q']}, // National convention
  //{'tag': '031', 'sortOrder': ['a', 'b', 'c', 'm', 'e', 'd']}, // utter guesswork
  {'tag': '040', 'sortOrder': ['8', '6', 'a', 'b', 'e', 'c', 'd', 'x']},
  {'tag': '041', 'sortOrder': ['8', '6', 'a', 'd', 'j', 'p', 'h', 'e', 'g', 'm']}, // guesswork
  {'tag': '048', 'sortOrder': ['8', '6', 'b', 'a']},
  {'tag': '100', 'sortOrder': ['6', 'a', 'b', 'c', 'q', 'd', 'e', 'j', 't', 'u', 'l', 'f', '0', '5', '9']}, // don't do $g
  {'tag': '110', 'sortOrder': ['6', 'a', 'b', 'n', 'e', '0', '5', '9']},
  {'tag': '111', 'sortOrder': ['a', 'n', 'd', 'c', 'e', 'g', 'j']},
  {'tag': '130', 'sortOrder': ['a', 'n', 'p', 'k', 'l']},
  {'tag': '240', 'sortOrder': ['a', 'm', 'n', 'p', 's', 'l', '2', '0', '1', '5', '9']},
  {'tag': '245', 'sortOrder': ['6', 'a', 'b', 'n', 'p', 'k', 'f', 'c']},
  {'tag': '246', 'sortOrder': ['i', 'a', 'n', 'p']},
  {'tag': '382', 'sortOrder': ['a']},
  {'tag': '385', 'sortOrder': ['8', 'm', 'n', 'a', '2', '0']},
  {'tag': '386', 'sortOrder': ['8', 'm', 'n', 'a']},
  {'tag': '490', 'sortOrder': ['a', 'x', 'y', 'v', 'l']},
  {'tag': '505', 'sortOrder': ['a']},
  {'tag': '526', 'sortOrder': ['i', 'a', 'b', 'x', 'z']},
  {'tag': '540', 'sortOrder': ['a', 'b', 'c', 'd', 'f', '2', 'u']},
  {'tag': '600', 'sortOrder': ['6', 'a', 'b', 'c', 'q', 'd', 'e', '0', '5', '9']},
  {'tag': '610', 'sortOrder': ['6', 'a', 'b', 'n']},
  {'tag': '611', 'sortOrder': ['a', 'n', 'd', 'c', 'e', 'g', 'j']},
  {'tag': '700', 'sortOrder': ['6', 'i', 'a', 'b', 'c', 'q', 'd', 'e', 't', 'u', 'l', 'f', '0', '5', '9']},
  {'tag': '710', 'sortOrder': ['a', 'b', 'n', 'e']},
  {'tag': '711', 'sortOrder': ['a', 'n', 'd', 'c', 'e', 'g', 'j']},
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
  {'tag': '800', 'sortOrder': ['i', 'a', 'b', 'c', 'q', 'd', 'e', 't', 'u', 'v', 'l', 'f', '0', '5', '9']},
  {'tag': '810', 'sortOrder': ['a', 'b', 't', 'n', 'v', 'w']},
  {'tag': '811', 'sortOrder': ['a', 'n', 'd', 'c', 'e', 'g', 'j']},
  {'tag': '830', 'sortOrder': ['a', 'n', 'x', 'v']}, // INCOMPLETE, SAME AS 490? APPARENTLY NOT...
  {'tag': '880', 'sortOrder': ['6', 'a']},
  {'tag': 'LOW', 'sortOrder': ['a', 'b', 'c', 'l', 'h']},
  {'tag': 'SID', 'sortOrder': ['c', 'b']} // Hack, so that default order is not used
];

function getSubfieldSortOrder(field) {
  const entry = subfieldSortOrder.filter(currEntry => field.tag === currEntry.tag);
  if (entry.length > 0 && 'sortOrder' in entry[0]) {
    debugDev(`sort order for ${field.tag}: ${entry[0].sortOrder}`);
    return entry[0].sortOrder;
  }
  nvdebug(`NO DROPPABLE SUBFIELDS FOUND FOR ${field.tag}.`);
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

export function sortAdjacentSubfields(field, externalSortOrder = false) {
  if (!field.subfields) {
    return;
  }
  // Features:
  // - Swap only sort adjacent pairs.
  // - No sorting over unlisted subfield codes. Thus a given subfield can not shift to wrong side of 700$t...

  // Implement: 880 field should use values from $6...

  // Should we support multiple sort orders per field?
  const sortOrderForField = externalSortOrder ? externalSortOrder : getSubfieldSortOrder(field);
  const subfieldOrder = sortOrderForField ? sortOrderForField : defaultSortOrder;
  nvdebug(`SUBFIELD ORDER: ${subfieldOrder.join(', ')}`);
  //if (sortOrder === null) { return field; } //// Currently always sort..

  swapSubfields(field, ['8', '6', '7', '3', 'a', '4', '2', '0', '1', '5', '9']); // <= Handle control subfield order (it never changes)
  swapSubfields(field, subfieldOrder);

  return field;
}

