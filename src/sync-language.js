// Author(s): Nicholas Volk

//import createDebugLogger from 'debug';
import clone from 'clone';

import {fieldToString} from './utils.js';

// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:fix-sami-041');




export default function () {

  return {
    description: 'Sync 008/35-37 and 041$a/$d',
    validate, fix
  };

  function getSubfieldCodeFor041(record) {
    const c = record?.leader[6];
    if (c === 'i' || c === 'j') {
      return 'd';
    }
    return 'a';
  }

  function transferableValue(val) {
    if (!val.match(/^[a-z]{3}$/u)) {
      return false;
    }
    // Should 'mul', 'zxx' and/or 'und' be treated differently?
    // Is 008/35-37 <=> 041$a a transitive relationship?
    return true;
  }

  function fix(record, validateMode = false) {
    const f008 = record.fields.find(f => f.tag === '008');
    const f041 = record.fields.find(f => f.tag === '041');

    if (!f008 || f008.value.length !== 40) { // Some sanity checks
      return;
    }

    const subfieldCode = getSubfieldCodeFor041(record);
    const lang008 = f008.value.substring(35, 38);

    if (!f041) {
      // Insert missing 041
      // Should 'mul', 'und' or 'zxx' be treated differently?
      if (transferableValue(lang008)) {
        const newField = {'tag': '041', 'ind1': ' ', 'ind2': ' ', 'subfields': [ {'code': subfieldCode, 'value': lang008}]};
        const msg = [ `Add '${fieldToString(newField)}'` ];
        if (validateMode) {
          return {message: msg, 'valid': false};
        }
        record.insertField(newField);
        return {message: [], fix: msg, valid: true };
      }
      // Can't do anything, and we only report this we can fix...
      return returnEmptiness();
    }

    const firstRelevantSubfield = f041.subfields.find(sf => sf.code === subfieldCode);

    // NB! If $2 is set, *never* copy it's value to 008/35-37... Otherwise we might a loop in Aleph.
    // Note that if $2 is used, 008/35-37 should actually be '|||'. Now we just aggressively leave it alone.
    if (!firstRelevantSubfield || !transferableValue(firstRelevantSubfield.value) || f041.subfields.some(sf => sf.code === '2') || lang008 === firstRelevantSubfield.value) {
      return returnEmptiness();
    }

    // Copy value
    const cloned008 = clone(f008);
    cloned008.value = `${f008.value.substring(0, 35)}${firstRelevantSubfield.value}${f008.value.substring(38)}`;
    const msg = [ `Modify '${f008.value}' to '${cloned008.value}'` ];

    if (validateMode) {
       return {message: msg, valid: false};
    }

    f008.value = cloned008.value;

    return {message: [], fix: msg, valid: true };

    function returnEmptiness() {
      if (validateMode) {
        return {message: [], valid: true};
      }
      return {message: [], fix: [], valid: true};
    }

  }


  function validate(record) {
    return fix(record, true);
  }
}

