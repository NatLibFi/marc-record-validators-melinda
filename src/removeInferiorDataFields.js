import createDebugLogger from 'debug';
import {fieldToChain, sameField} from './removeDuplicateDataFields';
import {fieldGetOccurrenceNumberPairs, fieldHasValidSubfield6, fieldSevenToOneOccurrenceNumber, fieldsToNormalizedString} from './subfield6Utils';
import {fieldHasSubfield, fieldsToString, fieldToString, nvdebug, uniqArray} from './utils';
import {fieldHasValidSubfield8} from './subfield8Utils';
import {encodingLevelIsBetterThanPrepublication, fieldRefersToKoneellisestiTuotettuTietue, getEncodingLevel} from './prepublicationUtils';
import {cloneAndNormalizeFieldForComparison} from './normalizeFieldForComparison';

// Relocated from melinda-marc-record-merge-reducers (and renamed)

// NB! This validator handles only full fields, and does not support subfield $8 removal.
// Also, having multiple $8 subfields in same fields is not supported.
// If this functionality is needed, see removeDuplicateDatafields.js for examples of subfield-only stuff.
const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:removeSubsetDataFields');

export default function () {
  return {
    description: 'Remove subset data fields. Certain exceptions apply, mainly too complicated for chained fields',
    validate, fix
  };

  function fix(record) {
    nvdebug('Fix record: remove inferior (eg. subset) data fields', debug);
    const res = {message: [], fix: [], valid: true};
    removeInferiorDatafields(record, true);
    // This can not really fail...
    return res;
  }

  function validate(record) {
    // Check max, and check number of different indexes
    nvdebug('Validate record: remove inferior (eg. subset) data fields', debug);

    const duplicates = removeInferiorDatafields(record, false);

    const res = {message: duplicates};

    res.valid = res.message.length < 1; // eslint-disable-line functional/immutable-data
    return res;
  }
}


function deriveInferiorChains(fields, record) {
  //nvdebug(`======= GOT ${fields.length} FIELDS TO CHAINIFY`);
  const hash = {};

  fields.forEach(f => fieldToChainToDeletables(f));

  return hash;

  //nvdebug(`WP1: GOT ${todoList.length} CHAINS`);


  // here we map deletableStringObject[str] => field. The idea is to help debugging. We don't actually need the field object...
  //return deriveChainDeletables(todoList);

  function fieldToChainToDeletables(field) {
    const chain = fieldToChain(field, record);
    if (chain.length < 2) {
      return;
    }
    const chainAsString = fieldsToNormalizedString(chain, 0, true, true);
    const arr = deriveChainDeletables([chainAsString]);
    //nvdebug(`GOT ${arr.length} DELETABLES FOR ${chainAsString}`);
    arr.forEach(val => {
      if (!(val in hash)) { // eslint-disable-line functional/no-conditional-statements
        hash[val] = field; // eslint-disable-line functional/immutable-data
      }
    });
  }

  function deriveChainDeletables(todoList, deletables = []) {
    const [chainAsString, ...stillToDo] = todoList;
    if (chainAsString === undefined) {
      return deletables;
    }

    // Fix MRA-476 (part 1): one $6 value can be worse than the other
    const withoutScriptIdentificationCode = chainAsString.replace(/( ‡6 [0-9X][0-9][0-9]-(?:XX|[0-9]+))\/[^ ]+/u, '$1'); // eslint-disable-line prefer-named-capture-group

    // Remove keepless versions:
    const keepless = chainAsString.replace(/ ‡9 [A-Z]+<KEEP>/u, '');

    // MRA-433: 490 ind1=1 vs ind1=0: remove latter (luckily no 2nd indicator etc)
    const linked490Ind1 = chainAsString.replace(/^490 1/u, '490 0').replace(/\t880 1/ug, '\t880 0');
    const arr = [withoutScriptIdentificationCode, keepless, linked490Ind1].filter(val => val !== chainAsString);
    if (arr.length > 0) {
      return deriveChainDeletables([...stillToDo, ...arr], [...deletables, ...arr]);
    }

    return deriveChainDeletables(stillToDo, deletables);
  }

}

function isRelevantChain6(field, record) {
  //Can't be a chain:
  if (!fieldHasValidSubfield6(field) && !fieldHasValidSubfield8(field)) {
    return false;
  }
  // Too short to be a chain:
  const chain = fieldToChain(field, record);
  if (chain.length < 2) {
    return false;
  }
  // No field can contains no more than one subfield $6
  if (chain.some(f => f.subfields.filter(sf => sf.code === '6').length > 1)) {
    return false;
  }

  // Check whether our field is the head of a chain:
  return sameField(field, chain[0]);
}

export function removeInferiorChains(record, fix = true) {
  const fields = record.fields.filter(f => isRelevantChain6(f, record));
  //nvdebug(`WP2.0: GOT ${fields.length} chain(s)`);

  const deletableChainsAsKeys = deriveInferiorChains(fields, record);
  const nChains = Object.keys(deletableChainsAsKeys).length;
  //nvdebug(`WP2: GOT ${nChains} chain(s)`);
  if (nChains === 0) {
    return [];
  }

  //nvdebug(`removeInferiorChains() has ${fields.length} fields-in-chain(s), and a list of ${nChains} deletable(s)`);

  return innerRemoveInferiorChains(fields);

  function innerRemoveInferiorChains(fields, deletedStringsArray = []) {
    const [currField, ...remainingFields] = fields;

    if (currField === undefined) {
      return deletedStringsArray;
    }

    const chain = fieldToChain(currField, record);
    if (chain.length === 0 || !sameField(currField, chain[0])) {
      return innerRemoveInferiorChains(remainingFields, deletedStringsArray);
    }

    const chainAsString = fieldsToNormalizedString(chain, 0, true, true);
    if (!(chainAsString in deletableChainsAsKeys)) {
      return innerRemoveInferiorChains(remainingFields, deletedStringsArray);
    }

    const triggeringField = deletableChainsAsKeys[chainAsString];
    const triggeringChain = fieldToChain(triggeringField, record);

    // If the inferior (deletable) chain is 1XX-based, convert the triggering better chain from 7XX to 1XX:
    if (chainContains1XX(chain)) { // eslint-disable-line functional/no-conditional-statements
      triggeringChain.forEach(f => sevenToOne(f, triggeringChain));
    }
    //nvdebug(`iRIS6C: ${chainAsString}`);
    const deletedString = fieldsToString(chain);
    const message = `DEL: '${deletedString}'  REASON: '${fieldsToString(triggeringChain)}'`;
    if (fix) { // eslint-disable-line functional/no-conditional-statements
      //nvdebug(`INFERIOR $6 CHAIN REMOVAL: ${message}}`, debug);
      chain.forEach(field => record.removeField(field));
    }
    return innerRemoveInferiorChains(remainingFields, [...deletedStringsArray, message]);
  }

  function chainContains1XX(chain) {
    return chain.some(f => f.tag.substring(0, 1) === '1');
  }

  function sevenToOne(field, chain) { // Change 7XX field to 1XX field. Also handle the corresponding 880$6 7XX-NN subfields
    // NB! This function should be called only if the original 1XX gets deleted!
    if (!['700', '710', '711', '730'].includes(field.tag)) {
      return;
    }
    // Retag field 7XX as 1XX and fix corresponding occurrence numbers as well:
    const pairs = fieldGetOccurrenceNumberPairs(field, chain);
    field.tag = `1${field.tag.substring(1)}`; // eslint-disable-line functional/immutable-data
    // There should always be one pair, but I'm not sanity-checking this
    pairs.forEach(pairedField => fieldSevenToOneOccurrenceNumber(pairedField));
  }

}


function getIdentifierlessAndKeeplessSubsets(fieldAsString) {
  // The rules below are not perfect (in complex cases they don't catch all permutations), but good enough:
  // Remove identifier(s) (MELKEHITYS-2383-ish):

  const identifierlessString = fieldAsString.replace(/ ‡[01] [^‡]+($| ‡)/u, '$1'); // eslint-disable-line prefer-named-capture-group
  const keeplessString = fieldAsString.replace(/ ‡9 [A-Z]+<KEEP>/u, '');

  return [identifierlessString, keeplessString].filter(val => val !== fieldAsString);
}

function deriveIndividualDeletables490(todoList, deletables = []) {
  const [fieldAsString, ...stillToDo] = todoList;
  if (fieldAsString === undefined) {
    return deletables;
  }
  //nvdebug(`PROCESS ${fieldAsString}`);
  if (!fieldAsString.match(/^490/u)) {
    return deriveIndividualDeletables490(stillToDo, deletables);
  }

  // $6-less version (keep this first)
  const sixless = fieldAsString.replace(/ ‡6 [^‡]+ ‡/u, ' ‡');

  // Without final $v or $x:
  const withoutFinalVOrX = fieldAsString.replace(/ *[;,] ‡[vx] [^‡]+$/u, '');
  // Add intermediate $x-less version
  const xless = fieldAsString.replace(/, ‡x [^‡]+(, ‡x| ; ‡v)/u, '$1'); // eslint-disable-line prefer-named-capture-group

  // Add $xv-less version (handled by recursion?)
  const xvless = fieldAsString.replace(/, ‡x [^‡]+ ‡v [^‡]+$/u, '');

  // MRA-433-ish (non-chain): 490 ind1=1 vs ind1=0: remove latter
  const modifiedInd2 = fieldAsString.match(/^490 1/u) ? `490 0${fieldAsString.substring(5)}` : fieldAsString;

  const arr = [sixless, withoutFinalVOrX, xless, xvless, modifiedInd2].filter(val => val !== fieldAsString);

  /*
  if (arr.length) { // eslint-disable-line functional/no-conditional-statements
    nvdebug(`${arr.length} derivation(s) for ${fieldAsString}`);
    nvdebug(arr.join('\n'));
  }
  */
  return arr;
}

function deriveIndividualDeletables(record) {
  const todoList = record.fields.map(f => fieldToString(f));
  //const finishedRecord = encodingLevelIsBetterThanPrepublication(getEncodingLevel(record));

  const deletableStringsArray = processTodoList(todoList);

  return uniqArray(deletableStringsArray);

  function processTodoList(thingsToDo, deletables = []) {
    const [currString, ...stillToDo] = thingsToDo;

    if (currString === undefined) {
      return deletables;
    }

    if (currString.match(/^[1678]00/u)) {
      // Proof-of-concept rule. Should be improved eventually...
      if (currString.match(/, ‡e [^‡]+\.$/u)) {
        const tmp = currString.replace(/, ‡e [^‡]+\.$/u, '.');
        return processTodoList([tmp, ...stillToDo], [...deletables, tmp]);
      }
    }

    const d490 = deriveIndividualDeletables490([currString]);
    if (d490.length) {
      return processTodoList([...stillToDo, ...d490], [...deletables, ...d490]);
    }

    if (currString.match(/^505 .0.*-- ‡t/u)) { // MRA-413-ish
      const tmp = currString.replace(/ -- ‡t /gu, ' -- '). // remove non-initial $t subfields
        replace(/ ‡[rg] /gu, ' '). // remove $r and $g subfields
        replace(/ ‡t /u, ' ‡a '). // change first $t to $a
        // ind2: '1' => '#':
        replace(/^505 (.)0/u, '505 $1#'); // eslint-disable-line prefer-named-capture-group
      if (tmp !== currString) {
        return processTodoList([tmp, ...stillToDo], [...deletables, tmp]);
      }
      //nvdebug(`505 ORIGINAL: '${fieldAsString}'`)
      //nvdebug(`505 DERIVATE: '${tmp}'`)
    }

    // MET-381: remove occurence number TAG-00, if TAG-NN existists
    if (currString.match(/^880.* ‡6 [0-9][0-9][0-9]-(?:[1-9][0-9]|0[1-9])/u)) {
      const tmp = currString.replace(/( ‡6 [0-9][0-9][0-9])-[0-9]+/u, '$1-00'); // eslint-disable-line prefer-named-capture-group
      //nvdebug(`MET-381: ADD TO DELETABLES: '${tmp}'`);
      //deletableStringsArray.push(tmp);
      if (tmp.match(/ ‡6 [0-9][0-9][0-9]-00\/[^ ]+ /u)) {
        const tmp2 = tmp.replace(/( ‡6 [0-9][0-9][0-9]-00)[^ ]+/u, '$1'); // eslint-disable-line prefer-named-capture-group
        //nvdebug(`MET-381: ADD TO DELETABLES: '${tmp2}'`);
        return processTodoList(stillToDo, [...deletables, tmp, tmp2]);
      }
      return processTodoList(stillToDo, [...deletables, tmp]);
    }

    const subsets = getIdentifierlessAndKeeplessSubsets(currString); // eslint-disable-line no-param-reassign
    const ennakkotieto653 = currString.match(/^653./u) ? [`${currString} ‡g ENNAKKOTIETO`] : []; // MET-528

    const newDeletables = [...deletables, ...subsets, ...ennakkotieto653];

    if (subsets.length) {
      return processTodoList([...stillToDo, ...subsets], newDeletables);
    }

    return processTodoList(stillToDo, newDeletables);
  }

}

function fieldToNormalizedString(field) {
  const normalizedField = cloneAndNormalizeFieldForComparison(field);
  return fieldToString(normalizedField);
}

function deriveIndividualNormalizedDeletables(record) { //  MET-461:
  const encodingLevel = getEncodingLevel(record);
  const recordIsFinished = encodingLevelIsBetterThanPrepublication(encodingLevel);
  const met495 = encodingLevel === '2' && record.fields.some(f => f.tag === '500' && fieldRefersToKoneellisestiTuotettuTietue(f));
  if (!recordIsFinished || met495) {
    return [];
  }
  const relevantFields = record.fields.filter(f => ['245', '246'].includes(f.tag) && fieldHasSubfield(f, 'a'));

  return deriveDeletable946s(relevantFields);

  function deriveDeletable946s(fields, results = []) {
    const [currField, ...remainingFields] = fields;
    if (currField === undefined) {
      return results;
    }

    const fieldAsNormalizedString = fieldToNormalizedString(currField);
    const tmp = fieldAsNormalizedString.replace(/^(?:...) ../u, '946 ##'). // <= Change tag to 946 and indicators to '##'
      replace(' ‡a ', ' ‡i nimeke onixissa ‡a '). // Add $i before $a. NB! This is added in the normalized lower-cased form!
      replace(/(?: \/)? ‡c[^‡]+$/u, ''); // Remove $c. (Can $c be non-last?)
    const candArray = [tmp, `${tmp} ‡5 MELINDA`].filter(val => val !== fieldAsNormalizedString);
    if (candArray.length) {
      return deriveDeletable946s(remainingFields, [...results, ...candArray]);
    }
    return deriveDeletable946s(remainingFields, results);
  }
}

export function removeIndividualInferiorDatafields(record, fix = true) { // No $6 nor $8 in field
  const deletableFieldsAsStrings = deriveIndividualDeletables(record);
  const deletableFieldsAsNormalizedStrings = deriveIndividualNormalizedDeletables(record);

  // nvdebug(`Deletables:\n ${deletableFieldsAsStrings.join('\n ')}`);
  // nvdebug(`Normalized deletables:\n ${deletableFieldsAsNormalizedStrings.join('\n ')}`);

  const hits = record.fields.filter(field => isDeletableField(field));

  const deletedFieldsAsStrings = hits.map(f => fieldToString(f));

  if (fix) { // eslint-disable-line functional/no-conditional-statements
    hits.forEach(field => {
      //nvdebug(`Remove inferior field: ${fieldToString(field)}`, debug);
      record.removeField(field);
    });
  }

  return deletedFieldsAsStrings;

  function isDeletableField(field) {
    const fieldAsString = fieldToString(field);
    if (deletableFieldsAsStrings.includes(fieldAsString)) {
      return true;
    }
    const fieldAsNormalizedString = fieldToNormalizedString(field);
    if (deletableFieldsAsNormalizedStrings.includes(fieldAsNormalizedString)) {
      return true;
    }

    return false;
  }
}


export function removeInferiorDatafields(record, fix = true) {
  const removables = removeIndividualInferiorDatafields(record, fix); // Lone fields
  //const removables8 = removeDuplicateSubfield8Chains(record, fix); // Lone subfield $8 chains
  const removables6 = removeInferiorChains(record, fix); // Lone subfield $6 chains
  // HOW TO HANDLE $6+$8 combos? Skipping is relatively OK.

  nvdebug(`REMOVABLES:\n  ${removables.join('\n  ')}`, debug);
  nvdebug(`REMOVABLES 6:\n  ${removables6.join('\n  ')}`, debug);

  const removablesAll = removables.concat(removables6); //.concat(removables8);

  return removablesAll;
}
