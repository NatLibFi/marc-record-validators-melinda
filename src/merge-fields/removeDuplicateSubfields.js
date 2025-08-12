
import {nvdebug, subfieldToString} from '../utils.js';
import createDebugLogger from 'debug';
import {cloneAndRemovePunctuation} from '../normalizeFieldForComparison.js';
import {sortAdjacentSubfields} from '../sortSubfields';
import {fieldFixPunctuation} from '../punctuation2';


// NB This should be moved and converted to a validator/fixer as well...
const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:merge-fields:removeDuplicateSubfields');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

export function recordRemoveDuplicateSubfieldsFromFields(record) {
  record.fields.forEach(field => fieldRemoveDuplicateSubfields(field));
}

export function fieldRemoveDuplicateSubfields(field) {
  // Skip bad (382, 505) and risky (264 ...) stuff: 382$n, 505$r, others...
  if (!field.subfields || ['264', '300', '382', '505'].includes(field.tag)) {
    return;
  }

  const strippedField = cloneAndRemovePunctuation(field); // make punctuation-less version

  let seen = {};

  field.subfields = field.subfields.filter((sf, i) => notSeenBefore(sf, i));

  if (field.collapsed) {
    sortAdjacentSubfields(field);
    fieldFixPunctuation(field);
    delete field.collapsed;
  }


  function notSeenBefore(sf, index) {
    const subfieldAsString = subfieldToString(strippedField.subfields[index]); // use normalized form
    if (seen[subfieldAsString]) {
      nvdebug(`Remove field-internal duplicate subfield ${subfieldToString(sf)}`, debugDev);
      field.collapsed = 1; // trigger punctuation reset
      return false;
    }
    //nvdebug(`identical subfield removal: Add ${subfieldAsString} to seen[]`, debugDev);
    seen[subfieldAsString] = subfieldAsString;
    return true;
  }

}
