import createDebugLogger from 'debug';
import {fieldToChain, sameField} from './removeDuplicateDataFields';
import {fieldHasValidSubfield6, fieldsToNormalizedString} from './subfield6Utils';
import {fieldsToString, fieldToString, nvdebug} from './utils';
import {fieldHasValidSubfield8} from './subfield8Utils';

// Relocated from melinda-marc-record-merge-reducers (and renamed)

// NB! This validator handles only full fields, and does not support subfield $8 removal.
// Also, having multiple $8 subfields in same fields is not supported.
// If this functionality is needed, see removeDuplicateDatafields.js for examples of subfield-only stuff.
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


function deriveInferiorChains(fields, record) {
  /* eslint-disable */
  let deletableStringsArray = [];

  nvdebug(`WP1: GOT ${fields.length} field(s) for potential deletable chain derivation`);
  fields.forEach(field => fieldDeriveChainDeletables(field));

  function fieldDeriveChainDeletables(field) {
    const chain = fieldToChain(field, record);
    if (chain.length === 0) {
      return;
    }
    const chainAsString = fieldsToNormalizedString(chain, 0, true, true);

    nvdebug(`666: ${chainAsString}`);

    // Fix MRA-476 (part 1): one $6 value can be worse than the other
    let tmp = chainAsString;
    while (tmp.match(/ ‡6 [0-9X][0-9][0-9]-(?:XX|[0-9]+)\/[^ ]+/u)) {
      tmp = tmp.replace(/( ‡6 [0-9X][0-9][0-9]-(?:XX|[0-9]+))\/[^ ]+/u, '$1');
      nvdebug(`FFS: ${tmp}`);

      deletableStringsArray.push(tmp);
    }

    // Remove keepless versions:
    tmp = chainAsString;
    while (tmp.match(/ ‡9 [A-Z]+<KEEP>/)) {
      tmp = tmp.replace(/ ‡9 [A-Z]+<KEEP>/, '');
      deletableStringsArray.push(tmp);
      nvdebug(`FFS: ${tmp}`);
    }
  }


  /* eslint-enable */
  return deletableStringsArray;
}

function isRelevantChain6(field, record) {
  nvdebug(`CHAIN?-WP1: ${fieldToString(field)}`);
  if (!fieldHasValidSubfield6(field) && !fieldHasValidSubfield8(field)) {
    return false;
  }
  nvdebug(`CHAIN?-WP2: ${fieldToString(field)}`);
  const chain = fieldToChain(field, record);
  if (chain.length < 2) {
    return false;
  }
  nvdebug(`CHAIN?-WP4: ${fieldToString(field)}`);
  if (chain.some(f => f.subfields.filter(sf => sf.code === '6').length > 1)) {
    return false;
  }
  nvdebug(`CHAIN?-WP4: ${fieldToString(field)}`);

  /* eslint-disable */
  field.tmpInferiorId = 666;
  const result = chain[0].tmpInferiorId === 666 ? true : false;
  delete field.tmpInferiorId;
  /* eslint-enable */
  return result;
}

export function removeInferiorChains(record, fix = true) {
  const fields = record.fields.filter(f => isRelevantChain6(f, record));
  nvdebug(`WP2.0: GOT ${fields.length} chain(s)`);

  const deletableChainsAsString = deriveInferiorChains(fields, record);
  nvdebug(`WP2: GOT ${deletableChainsAsString.length} chain(s)`);
  if (deletableChainsAsString.length === 0) {
    return [];
  }

  nvdebug(`removeInferiorChains() has ${fields.length} fields-in-chain(s), and a list of ${deletableChainsAsString.length} deletable(s)`);


  /* eslint-disable */

  let deletedStringsArray = [];
  fields.forEach(f => innerRemoveInferiorChain(f));


  function innerRemoveInferiorChain(field) {
    const chain = fieldToChain(field, record);
    if (chain.length === 0 || !sameField(field, chain[0])) {
      return;
    }
    // 1XX may be converted to XXX. However, it should not be removed.
    // Better to keep inferior 1XX (vs better 7XX) than to delete 1XX!
    if(chain.some(f => f.tag.substring(0, 1) === '1')) {
      return;
    }

    const chainAsString = fieldsToNormalizedString(chain, 0, true, true);
    if (deletableChainsAsString.includes(chainAsString)) {
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
  const removables6 = removeInferiorChains(record, fix); // Lone subfield $6 chains
  // HOW TO HANDLE $6+$8 combos?

  nvdebug(`REMOVABLES:\n  ${removables.join('\n  ')}`);
  nvdebug(`REMOVABLES 6:\n  ${removables6.join('\n  ')}`);

  const removablesAll = removables.concat(removables6); //.concat(removables8);

  return removablesAll;
}
