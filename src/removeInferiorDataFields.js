import createDebugLogger from 'debug';
import {fieldToChain, sameField} from './removeDuplicateDataFields';
import {fieldHasValidSubfield6, fieldsToNormalizedString} from './subfield6Utils';
import {fieldsToString, fieldToString, nvdebug} from './utils';

// Relocated from melinda-marc-record-merge-reducers (and renamed)

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:removeSubsetDataFields');

export default function () {
  return {
    description: 'Remove subset data fields. Certain exceptions apply, mainly too complited chained fields',
    validate, fix
  };

  function fix(record) {
    nvdebug('Fix record: remove subset data fields', debug);
    const res = {message: [], fix: [], valid: true};
    removeInferiorDatafields(record, true);
    // This can not really fail...
    return res;
  }

  function validate(record) {
    // Check max, and check number of different indexes
    nvdebug('Validate record: remove subset data fields', debug);

    const duplicates = removeInferiorDatafields(record, false);

    const res = {message: duplicates};

    res.valid = res.message.length < 1; // eslint-disable-line functional/immutable-data
    return res;
  }
}


function deriveInferiorSubfield6Chains(fields, record) {
  /* eslint-disable */
  let deletableStringsArray = [];

  nvdebug(`WP1: GOT ${fields.length} field(s) for potential deletable chain derivation`);
  fields.forEach(field => fieldDeriveSubfield6ChainDeletables(field));

  function fieldDeriveSubfield6ChainDeletables(field) {
    const chain = fieldToChain(field, record);
    if (chain.length === 0) {
      return;
    }
    const chainAsString = fieldsToNormalizedString(chain, 0, true, true);

    nvdebug(`666: ${chainAsString}`);

    // Fix MRA-476 (part 1): list inferior field chains as deletables 
    let tmp = chainAsString;
    while (tmp.match(/ ‡6 [0-9X][0-9][0-9]-(?:XX|[0-9]+)\/[^ ]+/u)) {
      tmp = tmp.replace(/( ‡6 [0-9X][0-9][0-9]-(?:XX|[0-9]+))\/[^ ]+/u, '$1');
      nvdebug(`FFS: ${tmp}`);

      deletableStringsArray.push(tmp);
    }
  }


  /* eslint-enable */
  return deletableStringsArray;
}

function isRelevantChain6(field, record) {
  nvdebug(`CHAIN?-WP1: ${fieldToString(field)}`);
  if (!fieldHasValidSubfield6(field)) {
    return false;
  }
  nvdebug(`CHAIN?-WP2: ${fieldToString(field)}`);
  const chain = fieldToChain(field, record);
  if (chain.length < 2) {
    return false;
  }
  nvdebug(`CHAIN?-WP3: ${fieldToString(field)}`);

  /* eslint-disable */
  field.tmpInferiorId = 666;
  const result = chain[0].tmpInferiorId === 666 ? true : false;
  delete field.tmpInferiorId;
  /* eslint-enable */
  return result;
}

export function removeInferiorSubfield6Chains(record, fix = true) {
  const fields = record.fields.filter(f => isRelevantChain6(f, record));
  nvdebug(`WP2.0: GOT ${fields.length} chain(s)`);

  const deletableSubfield6ChainsAsString = deriveInferiorSubfield6Chains(fields, record);
  nvdebug(`WP2: GOT ${deletableSubfield6ChainsAsString.length} chain(s)`);
  if (deletableSubfield6ChainsAsString.length === 0) {
    return [];
  }

  nvdebug(`removeInferiorSubfield6Chains() has ${fields.length} fields-in-chain(s), and a list of ${deletableSubfield6ChainsAsString.length} deletable(s)`);


  /* eslint-disable */

  let deletedStringsArray = [];
  fields.forEach(f => innerRemoveInferiorSubfield6Chain(f));


  function innerRemoveInferiorSubfield6Chain(field) {
    const chain = fieldToChain(field, record);
    if (chain.length === 0 || !sameField(field, chain[0])) {
      return;
    }
    const chainAsString = fieldsToNormalizedString(chain, 0, true, true);
    if (deletableSubfield6ChainsAsString.includes(chainAsString)) {
      nvdebug(`iRIS6C: ${chainAsString}`);
      const deletedString = fieldsToString(chain);
      deletedStringsArray.push(`DEL: ${deletedString}`);
      if (fix) {
        nvdebug(`INFERIOR $6 CHAIN REMOVAL: REMOVE ${deletedString}`, debug);
        chain.forEach(currField => record.removeField(currField));
      }
    }
  }

  /* eslint-enable */
  return deletedStringsArray;
}

function deriveIndividualDeletables(record) {
  /* eslint-disable */
  let deletableStringsArray = [];

  record.fields.forEach(field => fieldDeriveIndividualDeletables(field));

  function fieldDeriveIndividualDeletables(field) {
    const fieldAsString = fieldToString(field);

    // Proof-of-concept rule:
    let tmp = fieldAsString;
    if (field.tag.match(/^[1678]00$/u)) {
      while (tmp.match(/, ‡e [^‡]+\.$/)) {
        tmp = tmp.replace(/, ‡e [^‡]+\.$/, '.');
        deletableStringsArray.push(tmp);
      }
    }


    // Remove keepless versions:
    tmp = fieldAsString;
    while (tmp.match(/ ‡9 [A-Z]+<KEEP>/)) {
      tmp = tmp.replace(/ ‡9 [A-Z]+<KEEP>/, '');
      deletableStringsArray.push(tmp);
    }
  }
  /* eslint-enable */
  return deletableStringsArray; // we should do uniq!

}


export function removeIndividualInferiorDatafields(record, fix = true) { // No $6 nor $8 in field
  const deletableFieldsAsStrings = deriveIndividualDeletables(record);
  const hits = record.fields.filter(field => isDeletableField(field));

  const deletedFieldsAsStrings = hits.map(f => fieldToString(f));

  if (fix) { // eslint-disable-line functional/no-conditional-statements
    hits.forEach(field => {
      nvdebug(`Remove inferior field: ${fieldToString(field)}`);
      record.removeField(field);
    });
  }

  return deletedFieldsAsStrings;

  function isDeletableField(field) {
    const fieldAsString = fieldToString(field);
    return deletableFieldsAsStrings.includes(fieldAsString);
  }
}


export function removeInferiorDatafields(record, fix = true) {
  const removables = removeIndividualInferiorDatafields(record, fix); // Lone fields
  //const removables8 = removeDuplicateSubfield8Chains(record, fix); // Lone subfield $8 chains
  const removables6 = removeInferiorSubfield6Chains(record, fix); // Lone subfield $6 chains
  // HOW TO HANDLE $6+$8 combos?

  nvdebug(`REMOVABLES:\n  ${removables.join('\n  ')}`);
  nvdebug(`REMOVABLES 6:\n  ${removables6.join('\n  ')}`);

  const removablesAll = removables.concat(removables6); //.concat(removables8);

  return removablesAll;
}
