/*
// remove-041-zxx.js
//
// https://wiki.helsinki.fi/xwiki/bin/view/rdasovellusohje/RDA-kuvailu%20MARC%2021%20-formaatilla/RDA-sovellusohje/008%20Kontrollikentt%C3%A4/#Hmp.35-37Kieli
// "008-kielikoodi on sama kuin ensimmäinen 041-kentän a- (tai d-) osakenttä. Poikkeuksen muodostaa koodi zxx:
//  jos tietueen 008ssa on kielikoodi zxx (ei kielellistä sisältöä, esim. soitinmusiikki), tietueessa ei voi olla 041 a- eikä d-osakenttää."
// Effectively this means, that 'zxx' does not appear in 041!
// Author(s): Nicholas Volk
*/

//import createDebugLogger from 'debug';
import clone from 'clone';

import {fieldToString} from './utils.js';

// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:remove-041-zxx');




export default function () {

  return {
    description: "Remove 'zxx' from f041",
    validate, fix
  };

  function zxxRemoval041(record, validateMode) {
    const fields041 = record.fields.filter(f => f.tag === '041');

    return handleZxx(fields041);

    function handleZxx(fields, result = []) {
      const [currField, ...remainingFields] = fields;
      if ( !currField) {
        return result;
      }
      // Theoretically 'zxx' might mean something in ISO-639-3 or some other language code list:
      if (!currField.subfields || currField.subfields.some(sf => sf.code === '2')) {
        return handleZxx(remainingFields, result);
      }
      // Presumable 'zxx' is bad in any data subfield, not just 'a' and 'd':
      const otherSubfields = currField.subfields.filter(sf => (!sf.code.match(/^[a-z]$/u) || sf.value !== 'zxx'));
      if (otherSubfields.length === currField.subfields.length) {
        return handleZxx(remainingFields, result);
      }
      const originalString = fieldToString(currField);
      if (otherSubfields.length === 0) {
        const message = `Remove '${originalString}'`;
        if (!validateMode) {
          record.removeField(currField);
        }
        return handleZxx(remainingFields, [...result, message]);
      }
      // Some subfields are removed:
      if (validateMode) {
        // NB! In validation field is not really deleted, and the non-deleted field might trigger other fixes (than won't be done to a deleted field) later on
        const clonedField = clone(currField);
        clonedField.subfields = otherSubfields;
        const modifiedString = fieldToString(clonedField);
        const message = `Modify '${originalString}' => '${modifiedString}`;
        return handleZxx(remainingFields, [...result, message]);
      }
      currField.subfields = otherSubfields;
      const modifiedString = fieldToString(currField);
      const message = `Modify '${originalString}' => '${modifiedString}`;
      return handleZxx(remainingFields, [...result, message]);
    }
  }

  function fix(record, validateMode = false) {
    const messages = zxxRemoval041(record, validateMode);

    if (validateMode) {
       return {message: messages, valid: messages.length === 0};
    }
    return {message: [], fix: messages, valid: true};
  }


  function validate(record) {
    return fix(record, true);
  }
}

