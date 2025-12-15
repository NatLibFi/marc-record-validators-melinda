// Author(s): Nicholas Volk

//import createDebugLogger from 'debug';
import clone from 'clone';

import {fieldToString} from './utils.js';

// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:fix-sami-041');



export default function () {
  /* 'sma': eteläsaame, 'sme': pohjoissaame, 'smj': luulajansaame, 'smn': inarinsaame, 'sms': koltansaame */
  const samiLanguages = ['sma', 'sme', 'smj', 'smn', 'sms'];
  const relevantSubfieldCodes = ['a', 'd']; // Subfield codes that should also have 'smi' if a sami langauge is used. Confirmed by A.R. via Slack 2025-12-05

  return {
    description: 'Add corresponing \'smi\' subfield before a specific sami language subfields, if needed',
    validate, fix
  };

  function fix(record, validateMode = false) {
    const relevantFields = record.fields.filter(f => isRelevantField(f, validateMode)).map(f => validateMode ? clone(f) : f); // NV! relevant fields are cloned in validation mode!
    // Nothing to do:
    if (relevantFields.length === 0) {
      if (validateMode) {
        return {message: [], valid: true};
      }
      return {message: [], fix: [], valid: true};
    }

    const relevantFieldsAsStrings = relevantFields.map(f => fieldToString(f)); // get original values

    relevantFields.forEach(f => processField(f));
    const modFieldsAsStrings = relevantFields.map(f => fieldToString(f));
    const report = [...updateAndReport008(), ...createReport(relevantFieldsAsStrings, modFieldsAsStrings)];

    if (validateMode) {
      return {'message': report, 'valid': false};
    }

    return {message: [], fix: report, valid: true};

    function updateAndReport008() {
      const [f008] = record.get('008').map(f => validateMode ? clone(f) : f);

      if (!f008) {
        return [];
      }
      const currLang = f008.value.substr(35, 3);
      if (!samiLanguages.includes(currLang)) { // NB! If original 008/35-37 was not a sami language, we don't change anything!
        return [];
      }
      const origValue = f008.value;
      const firstRelevantSubfield = relevantFields[0].subfields.find(sf => sf.code === 'a' || sf.code === 'd'); // NB! don't use relevantSubfieldCodes here!
      if (firstRelevantSubfield.value === 'smi') { // First relevant subfield is 
        f008.value = `${f008.value.substr(0, 35)}smi${f008.value.substr(38)}`;
      }
      return createReport([origValue], [f008.value]);
    }
  }

  function createReport(origArray, modArray) {
    return origArray.map((entry, index) => createEntry(entry, index));

    function createEntry(item, index) {
      return `'${item}' => '${modArray[index]}'`;
    }
  }

  function validate(record) {
    return fix(record, true);
  }

  function processField(f) {
    f.subfields = prosessSubfields(f.subfields);
    return f;
  }

  function prosessSubfields(incomingSubfields, outgoingSubfields = []) {
    const [currSubfield, ...otherSubfields] = incomingSubfields;
    if (!currSubfield) {
      return outgoingSubfields;
    }
    if (!isRelevantSamiSubfield(currSubfield, [...outgoingSubfields, ...otherSubfields])) {
      return prosessSubfields(otherSubfields, [...outgoingSubfields, currSubfield]);
    }

    const smiSubfield = {
      code: currSubfield.code,
      value: 'smi'
    };
    return prosessSubfields(otherSubfields, [...outgoingSubfields, smiSubfield, currSubfield]);
  }

  function isRelevantField(f) {
    if (f.tag !== '041' || !f.subfields || f.subfields.some(sf => sf.code === '2')) {
      return false;
    }
    return f.subfields.some(sf => isRelevantSamiSubfield(sf, f.subfields)); // it's ok to pass sf in f.subfields also
  }

  function isRelevantSamiSubfield(sf, otherSubfields) {
    if (!relevantSubfieldCodes.includes(sf.code) || !samiLanguages.includes(sf.value)) {
      return false;
    }
    if (otherSubfields.some(sf2 => sf2.code === sf.code && sf2.value === 'smi')) {
      return false;
    }
    return true;
  }
}

