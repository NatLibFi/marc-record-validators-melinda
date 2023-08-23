import createDebugLogger from 'debug';
import {fieldToChain, sameField} from './removeDuplicateDataFields';
import {fieldGetOccurrenceNumberPairs, fieldHasValidSubfield6, fieldSevenToOneOccurrenceNumber, fieldsToNormalizedString} from './subfield6Utils';
import {fieldsToString, fieldToString, nvdebug} from './utils';
import {fieldHasValidSubfield8} from './subfield8Utils';
import {encodingLevelIsBetterThanPrepublication, getEncodingLevel} from './prepublicationUtils';

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
  let deletableStringsObject = {};

  nvdebug(`WP1: GOT ${fields.length} field(s) for potential deletable chain derivation`);
  fields.forEach(field => fieldDeriveChainDeletables(field));

  function fieldDeriveChainDeletables(field) {
    const chain = fieldToChain(field, record);
    if (chain.length === 0) {
      return;
    }
    const chainAsString = fieldsToNormalizedString(chain, 0, true, true);

    //nvdebug(`666: ${chainAsString}`);

    // Fix MRA-476 (part 1): one $6 value can be worse than the other
    let tmp = chainAsString;
    while (tmp.match(/ ‡6 [0-9X][0-9][0-9]-(?:XX|[0-9]+)\/[^ ]+/u)) {
      tmp = tmp.replace(/( ‡6 [0-9X][0-9][0-9]-(?:XX|[0-9]+))\/[^ ]+/u, '$1');
      //nvdebug(`FFS: ${tmp}`);
      deletableStringsObject[tmp] = field;
    }

    // Remove keepless versions:
    tmp = chainAsString;
    while (tmp.match(/ ‡9 [A-Z]+<KEEP>/)) {
      tmp = tmp.replace(/ ‡9 [A-Z]+<KEEP>/, '');
      deletableStringsObject[tmp] = field;
      //nvdebug(`FFS: ${tmp}`);
    }

    // MRA-433: 490 ind1=1 vs ind1=0: remove latter (luckily no 2nd indicator etc)
    if (chainAsString.match(/^490 1 .*\t880 1  ‡/) ) {
      // change ind1s to '0' to get the deletable chain:
      tmp = chainAsString.replace(/^490 1/u, '490 0').replace(/\t880 1/ug, "\t880 0");
      deletableStringsObject[tmp] = field;
    }

  }


  /* eslint-enable */
  return deletableStringsObject;
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

  // Chainwise non-initial fields are not relevant as chains is handled through the initial/head field
  /* eslint-disable */
  field.tmpInferiorId = 666;
  const result = chain[0].tmpInferiorId === 666 ? true : false;
  delete field.tmpInferiorId;
  /* eslint-enable */
  return result;
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

  nvdebug(`removeInferiorChains() has ${fields.length} fields-in-chain(s), and a list of ${nChains} deletable(s)`);


  /* eslint-disable */

  let deletedStringsArray = [];
  fields.forEach(f => innerRemoveInferiorChain(f));

  function chainContains1XX(chain) {
    return chain.some(f => f.tag.substring(0, 1) === '1');
  }

  function sevenToOne(field, chain) {
    if (!['700', '710', '711', '730'].includes(field.tag)) {
      return;
    }
    // Retag field 7XX as 1XX and fix corresponding occurrence numbers as well:
    const pairs = fieldGetOccurrenceNumberPairs(field, chain);
    field.tag = `1${field.tag.substring(1)}`; // eslint-disable-line functional/immutable-data
    // There should always be one pair, but I'm not sanity-checking this
    pairs.forEach(pairedField => fieldSevenToOneOccurrenceNumber(pairedField));
  }

  function innerRemoveInferiorChain(field) {
    const chain = fieldToChain(field, record);
    if (chain.length === 0 || !sameField(field, chain[0])) {
      return;
    }

    // Better to keep inferior 1XX (vs better 7XX) than to delete 1XX!
    if(chain.some(f => f.tag.substring(0, 1) === '1')) {
      return;
    }

    const chainAsString = fieldsToNormalizedString(chain, 0, true, true);
    if (chainAsString in deletableChainsAsKeys) {
      const triggeringField = deletableChainsAsKeys[chainAsString];
      const triggeringChain = fieldToChain(triggeringField, record);

      // 1XX may be converted to XXX. However, it should not be removed.
      // Better to keep inferior 1XX (vs better 7XX) than to delete 1XX!
      if(chainContains1XX(chain)) {
        if (chainContains1XX(triggeringChain)) {
          // This should *never* happen, but keep this as a sanity check
          return;
        }
        triggeringChain.forEach(f => sevenToOne(f, triggeringChain));
      }
      nvdebug(`iRIS6C: ${chainAsString}`);
      const deletedString = fieldsToString(chain);
      const message = `DEL: '${deletedString}'  REASON: '${fieldsToString(triggeringChain)}'`;
      deletedStringsArray.push(message);
      if (fix) {
        nvdebug(`INFERIOR $6 CHAIN REMOVAL: ${message}}`, debug);
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

  const finishedRecord = encodingLevelIsBetterThanPrepublication(getEncodingLevel(record));

  record.fields.forEach(field => fieldDeriveIndividualDeletables(field));

  function fieldDeriveIndividualDeletables(field) {
    const fieldAsString = fieldToString(field);

    nvdebug(`Derivations for ${fieldAsString}`);
    // Proof-of-concept rule:
    let tmp = fieldAsString;
    if (field.tag.match(/^[1678]00$/u)) {
      while (tmp.match(/, ‡e [^‡]+\.$/)) {
        tmp = tmp.replace(/, ‡e [^‡]+\.$/, '.');
        deletableStringsArray.push(tmp);
      }
    }

    // MET-381: remove occurence number TAG-00, if TAG-NN existists
    if (field.tag === '880') {
      tmp = fieldAsString;
      if (tmp.match(/ ‡6 [0-9][0-9][0-9]-(?:[1-9][0-9]|0[1-9])/)) {
        tmp = tmp.replace(/( ‡6 [0-9][0-9][0-9])-[0-9]+/, '$1-00');
        nvdebug(`MET-381: ADD TO DELETABLES: ${tmp}`);
        deletableStringsArray.push(tmp);
        if (tmp.match(/ ‡6 [0-9][0-9][0-9]-00\/[^ ]+ /)) {
          tmp = tmp.replace(/( ‡6 [0-9][0-9][0-9]-00)[^ ]+/, '$1');
          nvdebug(`MET-381: ADD TO DELETABLES: ${tmp}`);
          deletableStringsArray.push(tmp);
        }
      }
    }



    // Remove keepless versions:
    tmp = fieldAsString;
    while (tmp.match(/ ‡9 [A-Z]+<KEEP>/)) {
      tmp = tmp.replace(/ ‡9 [A-Z]+<KEEP>/u, '');
      deletableStringsArray.push(tmp);
    }

    //  MET-461:
    if (['245', '246'].includes(field.tag) && finishedRecord && fieldAsString.match(/ ‡a /u)) {
      tmp = fieldAsString;
      tmp = tmp.replace(/^(...) ../u, '946 ##'); // Ind
      tmp = tmp.replace(" ‡a ", " ‡i Nimeke Onixissa: ‡a ");
      tmp = tmp.replace(/ \/ ‡c[^‡]+$/u, ''); // Can $c be non-last?
      deletableStringsArray.push(tmp);
      if (field.tag === '245' && tmp.match(/\.$/u)) {
        tmp = tmp.replace(/\.$/u, '');
        deletableStringsArray.push(tmp);
      }
    }

    // 490 ind1=1 vs ind1=0: remove latter
    if (fieldAsString.match(/^490 1/) ) {
      tmp = fieldAsString.replace(/^490 1/u, '490 0');
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
