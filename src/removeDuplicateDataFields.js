import createDebugLogger from 'debug';
import {fieldsToString, fieldToString, nvdebug} from './utils';
import {fieldHasValidSubfield6, fieldsGetOccurrenceNumbers, fieldsToNormalizedString, fieldToNormalizedString, get6s} from './subfield6Utils';
import {add8s, fieldHasLinkingNumber, fieldHasValidSubfield8, fieldsGetAllSubfield8LinkingNumbers, getSubfield8LinkingNumber, recordGetAllSubfield8LinkingNumbers, recordGetFieldsWithSubfield8LinkingNumber} from './subfield8Utils';

const LINK_ROOT = 4;
const LINKED_AND_PROCESSED = 2;
const LINKED_NOT_PROCESSED = 1;


// Relocated from melinda-marc-record-merge-reducers (and renamed)

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:removeDuplicateDataFields');

export default function () {
  return {
    description: 'Remove duplicate data fields. Certain exceptions apply, mainly too complited chained fields',
    validate, fix
  };

  function fix(record) {
    nvdebug('Remove duplicate data fields');
    const res = {message: [], fix: [], valid: true};
    removeDuplicateDatafields(record, true);
    // This can not really fail...
    return res;
  }

  function validate(record) {
    // Check max, and check number of different indexes
    nvdebug('Validate record: duplicate data fields cause (t)error', debug);

    const duplicates = removeDuplicateDatafields(record, false);

    //const orphanedFields = getOrphanedFields(fieldsContainingSubfield6);

    const res = {message: duplicates};

    /*
    if (orphanedFields.length > 0) { // eslint-disable-line functional/no-conditional-statement
      res.message = [`${orphanedFields.length} orphaned occurrence number field(s) detected`]; // eslint-disable-line functional/immutable-data
    }
    */
    res.valid = res.message.length < 1; // eslint-disable-line functional/immutable-data
    return res;
  }
}


/*
function numberOfLinkageSubfields(field) {
  nvdebug(`N of Linkage Subs(${fieldToString(field)})`);
  const subfields = field.subfields.filter(sf => sf.code === '6' || sf.code === '8');
  return subfields.length;
}
*/

function removeLinkNotes(record) {
  record.fields.forEach(f => delete f.linkNote); // eslint-disable-line functional/immutable-data
}


function newGetAllLinkedFields(field, record, useSixes = true, useEights = true) {
  removeLinkNotes(record); // should be clear, but let's play safe

  /* eslint-disable */
  field.linkNote = LINK_ROOT;

  let currField = field;

  // Loop until all linked fields have been processed:
  while (currField !== undefined) {
    if (useSixes) {
      const related6s = get6s(currField, record.fields)
      related6s.forEach(f => linkField(f));
    }
    if (useEights) {
      const related8s = add8s([currField], record);
      related8s.forEach(f => linkField(f));
    }
    if (currField.linkNote !== LINK_ROOT) {
      currField.linkNote = LINKED_AND_PROCESSED;
    }
    currField = record.fields.find(f => f.linkNote === LINKED_NOT_PROCESSED);
  }

  // Collect relevant fields:
  const linkedFields = record.fields.filter(f => f.linkNote);

  removeLinkNotes(record);

  return linkedFields;

  function linkField(f) {
    if (!f.linkNote) {
      f.linkNote = LINKED_NOT_PROCESSED;
    }
  }


  /* eslint-enable */
}


function recordRemoveFieldOrSubfield8(record, field, currLinkingNumber) {
  const eights = field.subfields.filter(sf => sf.code === '8');
  if (eights.length < 2) {
    record.removeField(field);
    return;
  }
  const subfields = field.subfields.filter(sf => getSubfield8LinkingNumber(sf) === currLinkingNumber);
  subfields.forEach(sf => record.removeSubfield(sf, field));
}

function newRecordRemoveFieldOrSubfield8(record, field, currLinkingNumber, fix) {
  const eights = field.subfields.filter(sf => sf.code === '8');
  if (eights.length < 2) {
    field.deleted = 1; // eslint-disable-line functional/immutable-data
    return;
  }
  const subfields = field.subfields.filter(sf => getSubfield8LinkingNumber(sf) === currLinkingNumber);
  subfields.forEach(sf => {
    field.modified = 1; // eslint-disable-line functional/immutable-data
    if (fix) { // eslint-disable-line functional/no-conditional-statement
      record.removeSubfield(sf, field);
    }
  });
}


export function removeDuplicateSubfield8Chains(record, fix = true) {

  // Seen $8 subsfields in various fields:
  // 161 700
  // 17 710
  // 11 110
  // 8 730
  // 1 100
  // Given these stats, there's no need to check for 1XX-vs-7XX removals

  /* eslint-disable */
  let seen = {};

  let removables = []; // for validation

  nvdebug("CHAIN-8");
  const seenLinkingNumbers = recordGetAllSubfield8LinkingNumbers(record);
  if (seenLinkingNumbers.length === 0) {
    return removables;
  }

  nvdebug(`seen linking numbers ($8): ${seenLinkingNumbers.join(', ')}`, debug);

  seenLinkingNumbers.forEach(currLinkingNumber => {
    const linkedFields = recordGetFieldsWithSubfield8LinkingNumber(record, currLinkingNumber) //getFieldsWithSubfield8Index(base, baseIndex);
    // As/If there's just one occurrence number it should be fine to use normalizeOccurrenceNumber = true
    const normalizeOccurrenceNumber = true;
    const linkedFieldsAsString = fieldsToNormalizedString(linkedFields, currLinkingNumber, normalizeOccurrenceNumber, true);
    nvdebug(`Results for LINKING NUMBER ${currLinkingNumber}:`, debug);
    nvdebug(`${linkedFieldsAsString}`, debug);

    if (linkedFieldsAsString in seen)  {
      if (!removables.includes(linkedFieldsAsString)) {
        removables.push(linkedFieldsAsString);
      }

      if (fix) {
        nvdebug(`$8 CHAIN FIX: REMOVE $8 GROUP: ${fieldsToString(linkedFields)}`, debug);
        linkedFields.forEach(field => recordRemoveFieldOrSubfield8(record, field, currLinkingNumber));
        return;
      }

      nvdebug(`$8 VALIDATION: DUPLICATE DETECTED ${linkedFieldsAsString}`, debug);
      return;
    }
    nvdebug(`$8 DOUBLE REMOVAL OR VALIDATION: ADD2SEEN ${linkedFieldsAsString}`, debug);
    seen[linkedFieldsAsString] = 1;
    return;
  });

  /* eslint-enable */
  return removables;
}


export function handleDuplicateSubfield8Chains(record, fix) {

  // Seen $8 subsfields in various fields:
  // 161 700
  // 17 710
  // 11 110
  // 8 730
  // 1 100
  // Given these stats, there's no need to check for 1XX-vs-7XX removals

  /* eslint-disable */
  let seen = {};

  nvdebug("CHAIN-8");
  const seenLinkingNumbers = recordGetAllSubfield8LinkingNumbers(record);
  if (seenLinkingNumbers.length === 0) {
    return;
  }

  nvdebug(`seen linking numbers ($8): ${seenLinkingNumbers.join(', ')}`, debug);

  seenLinkingNumbers.forEach(currLinkingNumber => {
    const linkedFields = recordGetFieldsWithSubfield8LinkingNumber(record, currLinkingNumber) //getFieldsWithSubfield8Index(base, baseIndex);
    // As/If there's just one occurrence number it should be fine to use normalizeOccurrenceNumber = true
    const normalizeOccurrenceNumber = false; //true;
    const linkedFieldsAsString = fieldsToNormalizedString(linkedFields, currLinkingNumber, normalizeOccurrenceNumber, true);
    nvdebug(`Results for LINKING NUMBER ${currLinkingNumber}:`, debug);
    nvdebug(`${linkedFieldsAsString}`, debug);

    if (linkedFieldsAsString in seen)  {
      nvdebug(`$8 CHAIN FIX: REMOVE $8 GROUP: ${fieldsToString(linkedFields)}`, debug);
      linkedFields.forEach(field => newRecordRemoveFieldOrSubfield8(record, field, currLinkingNumber, fix));
      return;
    }
    nvdebug(`$8 DOUBLE REMOVAL OR VALIDATION: ADD2SEEN ${linkedFieldsAsString}`, debug);
    seen[linkedFieldsAsString] = 1;
    return;
  });

  /* eslint-enable */

}

function markIdenticalSubfield6Chains(chain, record) {
  const normalizeOccurrenceNumber = true;
  const normalizeTag = chain.some(field => field.tag.substring(0, 1) === '1'); // 1XX can delete 7XX as well!
  const chainAsString = fieldsToNormalizedString(chain, 0, normalizeOccurrenceNumber, normalizeTag);

  nvdebug(`markIdenticalSubfield6Chains: ${chainAsString}`);
  record.fields.forEach(f => compareWithChain(f));


  function compareWithChain(f) {
    nvdebug(`FIELD2CHAIN ${fieldToString(f)}`);
    const otherChain = fieldToChain(f, record);
    // Not a lone field or chain (head) or ... or is-same-chain
    if (otherChain.length === 0 || sameField(chain[0], otherChain[0])) {
      return;
    }
    const otherChainAsString = fieldsToNormalizedString(otherChain, 0, normalizeOccurrenceNumber, normalizeTag);

    // Mark other chain as deleted:
    if (chainAsString === otherChainAsString) {
      otherChain.forEach(f => {
        nvdebug(` mark ${fieldToString(f)} as deleted ($6-chain)...`);
        f.deleted = 1; // eslint-disable-line functional/immutable-data
      });
      return;
    }
  }

}

function markIdenticalLoneFields(field, record) {
  // targetLinkingNumber = 0, normalizedOccurenceNumber = false, normalizeTag = true)
  const normalizeTag = field.tag.substring(0, 1) === '1'; // 1XX can delete 7XX as well!
  const fieldAsString = fieldToNormalizedString(field, 0, false, normalizeTag);
  nvdebug(`mILF(): ${fieldAsString}`);
  const identicalLoneFields = record.fields.filter(f => !sameField(f, field) && fieldToNormalizedString(f, 0, false, normalizeTag) === fieldAsString);

  // Mark fields as deleted:
  identicalLoneFields.forEach(f => {
    nvdebug(` mark ${fieldToString(f)} as deleted (lone field)...`);
    f.deleted = 1; // eslint-disable-line functional/immutable-data
  });

}

function acceptFieldsWithSubfield6(fieldsWithSubfield6) {
  // There can be only one non-880 field:
  const non880 = fieldsWithSubfield6.filter(f => f.tag !== '880');
  if (non880.length > 1) {
    return false;
  }

  const occurrenceNumbers = fieldsGetOccurrenceNumbers(fieldsWithSubfield6);
  // Chain can contain only single occurrence number:
  if (occurrenceNumbers.length > 1) {
    return false;
  }

  return true;
}


function isSingleTagLinkingNumber(linkingNumber, fields, tag) {
  const relevantFields = fields.filter(f => fieldHasLinkingNumber(f, linkingNumber));
  if (relevantFields.some(f => f.tag !== tag)) {
    return false;
  }
  return true;
}

function acceptFieldsWithSubfield8(fieldsWithSubfield8, requireSingleTag = false) {
  const linkingNumbers = fieldsGetAllSubfield8LinkingNumbers(fieldsWithSubfield8);
  if (linkingNumbers.some(linkingNumber => anomaly8(linkingNumber))) {
    return false;
  }
  return true;

  // If linking number
  function anomaly8(linkingNumber) {
    nvdebug(`  Looking for anomalies in linkin number ${linkingNumber}`);
    const relevantFields = fieldsWithSubfield8.filter(f => fieldHasLinkingNumber(f, linkingNumber));
    if (requireSingleTag) {
      return !isSingleTagLinkingNumber(linkingNumber, relevantFields, relevantFields[0].tag);
    }

    const f880 = relevantFields.filter(f => f.tag === '880');
    if (f880.length === 0 || f880.length === relevantFields.length) {
      return false;
    }
    return true;
  }
}


export function sameField(field1, field2) {
  /* eslint-disable */
    field1.tmpMyId = 666;
    const result = field2.tmpMyId === 666 ? true : false;
    delete field1.tmpMyId;
    /* eslint-enable */
  return result;
}

export function isChainHead(field, chain) {
  return sameField(field, chain[0]);
}

export function fieldToChain(field, record) {
  if (field.deleted || !field.subfields) {
    return [];
  }
  const chain = newGetAllLinkedFields(field, record, true, true);

  nvdebug(` Chain contains ${chain.length} field(s)`);
  if (!isChainHead(field, chain)) { // newGetAllLinkedFields() marks relevant record.fields!
    return [];
  }

  const fieldsWithSubfield6 = chain.filter(f => fieldHasValidSubfield6(f));
  // Hack: multiple $6 fields, but either all are non-880 or all are 880: treat field as a single entry
  if (fieldsWithSubfield6.length > 0) {
    const non880 = fieldsWithSubfield6.filter(f => f.tag !== '880');
    if (non880.length === 0 || non880.length === fieldsWithSubfield6.length) {
      return [field];
    }
    if (non880.length !== 1) {
      return [field];
    }
  }

  if (!acceptFieldsWithSubfield6(fieldsWithSubfield6)) { // Check tag subfield $6s are legal(ish)
    return [];
  }
  const fieldsWithSubfield8 = chain.filter(f => fieldHasValidSubfield8(f));
  if (!acceptFieldsWithSubfield8(fieldsWithSubfield8, false)) {
    return [];
  }

  //nvdebug(`Proceed with ${fieldsToString(chain)}`);


  return chain;
}


function fieldHandleDuplicateDatafields(field, record) {
  const chain = fieldToChain(field, record);
  nvdebug(` TRY TO HANDLE DUPLICATES OF '${fieldsToString(chain)}'`);

  if (chain.length === 0) {
    return;
  }

  const fieldsWithSubfield6 = chain.filter(f => fieldHasValidSubfield6(f));
  const fieldsWithSubfield8 = chain.filter(f => fieldHasValidSubfield8(f));

  // Lone fields:
  if (chain.length === 1) {
    markIdenticalLoneFields(chain[0], record);
    return;
  }
  if (fieldsWithSubfield6.length === 0) {

    if (fieldsWithSubfield8.length === 0) { // chain.length === 1?
      nvdebug(` Trying to find duplicates of single field '${fieldToString(chain[0])}'`);
      markIdenticalLoneFields(chain[0], record);
      return;
    }
    const linkingNumbers = fieldsGetAllSubfield8LinkingNumbers(fieldsWithSubfield8);
    if (linkingNumbers.length < 2) {
      markIdenticalSubfield6Chains(chain, record);
      return;
    }
  }

  if (fieldsWithSubfield6.length > 0 && acceptFieldsWithSubfield8(fieldsWithSubfield8, true)) { // Checks that non-880 tags are all same
    // Chain is removable
    markIdenticalSubfield6Chains(chain, record);
    return;
  }


  nvdebug(` NO HANDLER FOUND FOR '${fieldsToString(chain)}'`);
  nvdebug(`  N8s: ${fieldsWithSubfield6.length}`);

}


export function removeDuplicateDatafields(record, fix = true) {
  // Sometimes only $8 subfield (vs the whole field) is removed. Thus they are handled separately:
  handleDuplicateSubfield8Chains(record, fix);

  const dataFields = record.fields.filter(f => f.subfields !== undefined);

  dataFields.forEach(f => fieldHandleDuplicateDatafields(f, record));

  const deletableFields = dataFields.filter(f => f.deleted);
  const modifiedFields = dataFields.filter(f => f.modified && !f.deleted);

  const result = deletableFields.map(f => `DEL: ${fieldToString(f)}`);
  if (modifiedFields.length) { // eslint-disable-line functional/no-conditional-statement
    modifiedFields.forEach(f => delete f.modified); // eslint-disable-line functional/immutable-data
    result.push(modifiedFields.map(f => `MOD: ${fieldToString(f)}`)); // eslint-disable-line functional/immutable-data
  }

  if (fix) {
    deletableFields.forEach(f => record.removeField(f));
    return result;
  }

  deletableFields.forEach(f => delete f.deleted); // eslint-disable-line functional/immutable-data
  deletableFields.forEach(f => delete f.modified); // eslint-disable-line functional/immutable-data
  modifiedFields.forEach(f => delete f.modified); // eslint-disable-line functional/immutable-data

  return result;
}
