// Author(s): Nicholas Volk

//import createDebugLogger from 'debug';
import clone from 'clone';

import {fieldToString} from './utils.js';

// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:sync-language');

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
    if (val.match(/^[a-z]{3}$/u)) {
      // 'zxx' is an exception to the otherwise relatively transitive 008/35-37 <=> 041$a relationship...
      // https://wiki.helsinki.fi/xwiki/bin/view/rdasovellusohje/RDA-kuvailu%20MARC%2021%20-formaatilla/RDA-sovellusohje/008%20Kontrollikentt%C3%A4/#Hmp.35-37Kieli
      // "008-kielikoodi on sama kuin ensimmäinen 041-kentän a- (tai d-) osakenttä. Poikkeuksen muodostaa koodi zxx:
      //  jos tietueen 008ssa on kielikoodi zxx (ei kielellistä sisältöä, esim. soitinmusiikki), tietueessa ei voi olla 041 a- eikä d-osakenttää."
      // So 'zxx' ain't transferable (done here), and it should be removed from 041 ($a and $d at least, not done here nor elsewhere at the moment...)
      // Note that 'mul' and 'und' are treated (in this validator) the same as normal values.
      if (val === 'zxx') {
        return false;
      }
      return true;
    }
    return false;
  }


  function zxxRemoval041(record, field, validateMode) {
    const fields041 = record.fields.filter(f => f.tag === '041');

    return handleZxx(fields041);

    function handleZxx(fields, result = []) {
      const [currField, ...remainingFields] = fields;
      if ( !currField) {
        return result;
      }
      // Theoretically 'zxx' might mean something in ISO-639-3 or some other language code list:
      if (!field.subfields || field.subfields.some(sf => sf.code === '2')) {
        return handleZxx(remainingFields, result);
      }
      // Presumable 'zxx' is bad in any data subfield, not just 'a' and 'd':
      const otherSubfields = field.subfields.some(sf => !sf.code.match(/^[a-z]$/u || sf.value !== 'zxx'));
      if (otherSubfields.length === field.subfields.length) {
        return handleZxx(remainingFields, result);
      }
      const originalString = fieldToString(field);
      if (otherSubfields.length === 0) {
        const message = `Remove '${originalString}'`;
        if (!validateMode) {
          record.removeField(field);
        }
        return handleZxx(remainingFields, [...result, message]);
      }
      // Some subfields are removed:
      if (validateMode) {
        // NB! In validation field is not really deleted, and the non-deleted field might trigger other fixes (than won't be done to a deleted field) later on
        const clonedField = clone(field);
        clonedField.subfields = otherSubfields;
        const modifiedString = fieldToString(clonedField);
        const message = `Modify '${originalString}' => '${modifiedString}`;
        return handleZxx(remainingFields, [...result, message]);
      }
      field.subfields = otherSubfields;
      const modifiedString = fieldToString(field);
      const message = `Modify '${originalString}' => '${modifiedString}`;
      return handleZxx(remainingFields, [...result, message]);
    }


  }

  function sync008And041(record, validateMode) {
    const f008 = record.fields.find(f => f.tag === '008');
    const f041 = record.fields.find(f => f.tag === '041');

    if (!f008 || f008.value.length !== 40) { // Some sanity checks
      return [];
    }

    const subfieldCode = getSubfieldCodeFor041(record);
    const lang008 = f008.value.substring(35, 38);

    if (!f041) {
      // Insert missing 041
      if (transferableValue(lang008)) {
        const newField = {'tag': '041', 'ind1': ' ', 'ind2': ' ', 'subfields': [ {'code': subfieldCode, 'value': lang008}]};
        if (!validateMode) {
          record.insertField(newField);
        }
        return [ `Add '${fieldToString(newField)}'` ];
      }
      // Can't do anything, and we only report this we can fix...
      return [];
    }

    const firstRelevantSubfield = f041.subfields.find(sf => sf.code === subfieldCode);

    // NB! If $2 is set, *never* copy it's value to 008/35-37... Otherwise we might a loop in Aleph.
    // Note that if $2 is used, 008/35-37 should actually be '|||'. Now we just aggressively leave it alone.
    if (!firstRelevantSubfield || !transferableValue(firstRelevantSubfield.value) || f041.subfields.some(sf => sf.code === '2') || lang008 === firstRelevantSubfield.value) {
      return []
    }

    // Update 008/35-37:
    const cloned008 = clone(f008);
    cloned008.value = `${f008.value.substring(0, 35)}${firstRelevantSubfield.value}${f008.value.substring(38)}`;


    if (!validateMode) {
      f008.value = cloned008.value;
    }
    return [ `Modify '${f008.value}' to '${cloned008.value}'` ];
  }

  function fix(record, validateMode = false) {
    const zxxMessages = zxxRemoval041(record, validateMode);

    const syncMessages = sync008And041(record, validateMode);

    const messages = [...zxxMessages, ...syncMessages];

    if (validateMode) {
       return {message: messages, valid: messages.length === 0};
    }
    return {message: [], fix: messages, valid: true};
  }


  function validate(record) {
    return fix(record, true);
  }
}

