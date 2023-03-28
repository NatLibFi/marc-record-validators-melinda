import createDebugLogger from 'debug';
import {fieldToString, nvdebug} from './utils';

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

  if (fix) { // eslint-disable-line functional/no-conditional-statement
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
  //const removables6 = removeDuplicateSubfield6Chains(record, fix); // Lone subfield $6 chains
  // HOW TO HANDLE $6+$8 combos?

  const removablesAll = removables; //.concat(removables8).concat(removables6);

  return removablesAll;
}
