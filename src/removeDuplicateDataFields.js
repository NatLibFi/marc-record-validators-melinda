import createDebugLogger from 'debug';
import {fieldHasSubfield, fieldToString, nvdebug} from './utils';
import {fieldHasOccurrenceNumber, fieldsToNormalizedString, isValidSubfield6, subfield6GetOccurrenceNumber} from './subfield6Utils';
import {recordGetAllSubfield8LinkingNumbers} from './subfield8Utils';

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

function add6s(field, record) {

  /*
  // Can't rely on nice pairs...
  if (fieldHasSubfield(field, '6')) {

    const pairs = fieldGetOccurrenceNumberPairs(field, record.fields);
    if (pairs) {
      return [field].concat(pairs);
    }

  }
  */

  // Get all fields with given occurence number
  const sixes = field.subfields.filter(sf => isValidSubfield6(sf));

  if (sixes.length === 0) {
    return [field];
  }
  nvdebug(`SIXES: ${sixes.length}`);
  const occurrenceNumbers = sixes.map(sf => subfield6GetOccurrenceNumber(sf)).filter(value => value !== undefined && value !== '00');
  nvdebug(occurrenceNumbers.join(' -- '));

  const relevantFields = record.fields.filter(f => occurrenceNumbers.some(o => fieldHasOccurrenceNumber(f, o)));
  nvdebug(`RELFIELDS FOUND: ${relevantFields.length}...`);
  relevantFields.forEach(f => nvdebug(fieldToString(f)));
  return relevantFields;
}

function add8s(fields, record) {
  // Not implemented yet:
  if (fields && fields.some(f => fieldHasSubfield(f, '8'))) {
    return [];
  }
  return record ? fields : fields;
}

function numberOfLinkageSubfields(field) {
  const subfields = field.subfields.filter(sf => sf.code === '6' || sf.code === '8');
  return subfields.length;
}


function getAllLinkedSubfield6Fields(field, record) {
  const fields = add6s(field, record);
  const moreFields = add8s(fields, record);

  // Currently we don't handle fields with more than one $6 and/or $8 subfield.
  if (moreFields.length === 0 || moreFields.some(f => numberOfLinkageSubfields(f) > 1)) {
    return []; // Don't fix!
  }
  return moreFields;
}

function getFirstField(record, fields) {
  const fieldsAsStrings = fields.map(field => fieldToString(field));
  record.fields.forEach((field, i) => nvdebug(`${i}:\t${fieldToString(field)}`));
  nvdebug(`INCOMING: ${fieldsAsStrings.join('\t')}`);
  const i = record.fields.findIndex(field => fieldsAsStrings.includes(fieldToString(field)));
  if (i > -1) {
    const field = record.fields[i];
    nvdebug(`1st F: ${i + 1}/${record.fields.length} ${fieldToString(field)}`);
    return field;
  }
  return undefined;
}


function isFirstLinkedSubfield6Field(field, record) {
  if (!field.subfields) { // Is not a datafield
    return false;
  }
  const chain = getAllLinkedSubfield6Fields(field, record);
  if (chain.length < 2) {
    return false;
  }

  // Interpretation of first: position of field in record (however, we might have a duplicate field. See tests...)
  const firstField = getFirstField(record, chain);
  if (firstField) {
    return fieldToString(field) === fieldToString(firstField);
  }
  return false;

  // Fallback:
  //return fieldToString(field) === fieldToString(chain[0]);
}

export function removeIndividualDuplicateDatafields(record, fix = true) { // No $6 nor $8 in field
  /* eslint-disable */
  let seen = {};

  let removables = []; // for validation

  record.fields.forEach(field => nvdebug(`DUPL-CHECK SINGLE ${fieldToString(field)}, mode=${fix ? 'FIX' : 'VALIDATE'}`));
  
  const fields = record.fields;
  
  fields.forEach(field => removeIndividualDuplicateDatafield(field));

  function removeIndividualDuplicateDatafield(field) {
    nvdebug(`removeIndividualDuplicateDatafield? ${fieldToString(field)} (and friends)`);

    // We are in trouble if $9 ^ and $9 ^^ style chains appear here...
    const fieldAsString = fieldToString(field); // Never normalize!

    nvdebug(` step 2 ${fieldAsString}`);
    if (fieldAsString in seen)  {
      nvdebug(` step 3 ${fieldAsString}`);
      // There's actually no reason to check whether individual fields contain a $6 or an $8...

      if (!removables.includes(fieldAsString)) {
        removables.push(fieldAsString);
      }

      if (fix) {
        nvdebug(`DOUBLE REMOVAL: REMOVE ${fieldAsString}`, debug);
        fields.forEach(currField => record.removeField(currField));
        return;
      }
      nvdebug(`VALIDATION: DUPLICATE DETECTED ${fieldAsString}`, debug);
      
    }
    nvdebug(`DOUBLE REMOVAL OR VALIDATION: ADD2SEEN ${fieldAsString}`, debug);
    seen[fieldAsString] = 1;
    return;
  }
  /* eslint-enable */
  return removables;
}

export function removeDuplicateSubfield8Chains(record, fix = true) {
  /* eslint-disable */
  let seen = {};

  let removables = []; // for validation

  nvdebug("CHAIN 8...");
  const seenLinkingNumbers = recordGetAllSubfield8LinkingNumbers(record); // recordGetAllSubfield8Indexes(base);
  if (seenLinkingNumbers.length === 0) {
    return removables;
  }

  nvdebug(`seen linking numbers ($8): ${seenLinkingNumbers.join(', ')}`, debug);

  seenLinkingNumbers.forEach(currLinkingNumber => {
    const linkedFields = recordGetFieldsWithSubfield8LinkingNumber(record, currLinkingNumber) //getFieldsWithSubfield8Index(base, baseIndex);
    const linkedFieldsAsString = fieldsToNormalizedString(linkedFields, currLinkingNumber);
    nvdebug(`Results for LINKING NUMBER ${currLinkingNumber}:`, debug);
    nvdebug(`${linkedFieldsAsString}`, debug);

    if (linkedFieldsAsString in seen)  {
      if (!removables.includes(linkedFieldsAsString)) {
        removables.push(linkedFieldsAsString);
      }

      if (fix) {
        nvdebug(`$8 FIX: REMOVE $8 GROUP: ${linkedFieldsAsString}`, debug);
        linkedFields.forEach(field => removeFieldOrSubfield8(record, field, currLinkingNumber));
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

export function removeDuplicateSubfield6Chains(record, fix = true) {
  /* eslint-disable */
  let seen = {};

  let removables = []; // for validation

  record.fields.forEach(field => nvdebug(`DUPL-CHECK $CHAIN ${fieldToString(field)}, mode=${fix ? 'FIX' : 'VALIDATE'}`));
  
  const fields = record.fields.filter(field => isFirstLinkedSubfield6Field(field, record)); // Well a
  
  fields.forEach(field => removeDuplicateDatafield(field));

  function removeDuplicateDatafield(field) {
    nvdebug(`removeDuplicateDatafield? $6 ${fieldToString(field)} (and friends)`);
    const fields = getAllLinkedSubfield6Fields(field, record);
    if(fields.length === 0) {
      return;
    }

    const fieldsAsString = fieldsToNormalizedString(fields);
    nvdebug(` step 2 ${fieldsAsString}`);
    if (fieldsAsString in seen)  {
      nvdebug(` step 3 ${fieldsAsString}`);

      removables.push(fieldsAsString);

      if (fix) {
        nvdebug(`DOUBLE REMOVAL: REMOVE ${fieldsAsString}`, debug);
        fields.forEach(currField => record.removeField(currField));
        return;
      }
      nvdebug(`VALIDATION: DUPLICATE DETECTED ${fieldsAsString}`, debug);
      
    }
    nvdebug(`DOUBLE REMOVAL OR VALIDATION: ADD2SEEN ${fieldsAsString}`, debug);
    seen[fieldsAsString] = 1;
    return;
  }


  /* eslint-enable */
  return removables;
}

export function removeDuplicateDatafields(record, fix = true) {
  const removables = removeIndividualDuplicateDatafields(record, fix); // Lone fields
  const removables8 = removeDuplicateSubfield8Chains(record, fix); // Lone subfield $8 chains
  const removables6 = removeDuplicateSubfield6Chains(record, fix); // Lone subfield $6 chains
  // HOW TO HANDLE $6+$8 combos?

  const removablesAll = removables.concat(removables8).concat(removables6);

  return removablesAll;
}
