// Author(s): Nicholas Volk

import createDebugLogger from 'debug';
import clone from 'clone';

import {fieldToString} from './utils.js';

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:fix-sami-041');



export default function () {
  /* 'sma': eteläsaame, 'sme': pohjoissaame, 'smj': luulajansaame, 'smn': inarinsaame, 'sms': koltansaame */
  const samiLanguages = ['sma', 'sme', 'smj', 'smn', 'sms'];

  return {
    description: 'Add corresponding \'smi\' subfield before a specific sami language subfields and update 008/35-37, if needed',
    validate, fix
  };

  function getRelevantSubfieldCodes(record) { // Maybe this should be an exportable utility function...
    if (record && record.leader && record.leader[6]) {
      debug(` LDR/06 is '${record.leader[6]}'`);
      // We should test this properly...
      if (['i', 'j'].includes(record.leader[6])) { // Check type of record: sound recordings use 'd'
        return ['d'];
      }
      return ['a'];
    }

    return ['a', 'd']; // Både-och
  }


  function fix(record, validateMode = false) {
    debug(`Start ${validateMode ? 'validator' : 'fixer'}`);
    const relevantSubfieldCodes = getRelevantSubfieldCodes(record);
    debug(` Relevant subfield codes are '${relevantSubfieldCodes.join("', '")}'`);
    const relevantFields = record.fields.filter(f => isRelevantField(f, relevantSubfieldCodes)).map(f => validateMode ? clone(f) : f); // NV! relevant fields are cloned in validation mode!
    // Nothing to do:
    if (relevantFields.length === 0) {
      debug(` No relevant f041 fields found`);
      if (validateMode) {
        return {message: [], valid: true};
      }
      return {message: [], fix: [], valid: true};
    }

    const relevantFieldsAsStrings = relevantFields.map(f => fieldToString(f)); // get original values

    relevantFields.forEach(f => processField(f, relevantSubfieldCodes));
    const modFieldsAsStrings = relevantFields.map(f => fieldToString(f));
    const report = [...updateAndReport008(), ...createReport(relevantFieldsAsStrings, modFieldsAsStrings)];

    if (validateMode) {
      return {'message': report, 'valid': false};
    }

    return {message: [], fix: report, valid: true};

    function updateAndReport008() { // Update 008/35-37 if necessary + report it
      const [f008] = record.get('008').map(f => validateMode ? clone(f) : f);

      if (!f008) {
        debug(' WARNING: no f008 found');
        return [];
      }
      const currLang = f008.value.substr(35, 3);
      if (!samiLanguages.includes(currLang)) { // NB! If original 008/35-37 was not a sami language, we don't change anything!
        debug(` Existing 008/35-37 '${currLang}' is not a sami language. No need to update 008/35-37`);
        return [];
      }
      const origValue = f008.value;
      const firstRelevantSubfield = relevantFields[0].subfields.find(sf => relevantSubfieldCodes.includes(sf.code));
      if (firstRelevantSubfield.value !== 'smi') {
         debug(` First relevant subfield is '\$${firstRelevantSubfield.code} ${firstRelevantSubfield.value}'. No need to update 008/35-37`);
        return [];
      }
      f008.value = `${f008.value.substr(0, 35)}smi${f008.value.substr(38)}`;
      debug(` Update 008/35-37: '${currLang}' => 'smi'`);
      return createReport([origValue], [f008.value]);
    }

    function processField(f) {
      f.subfields = processSubfields(f.subfields, []);
    }

    function processSubfields(incomingSubfields, outgoingSubfields = []) {
      const [currSubfield, ...otherSubfields] = incomingSubfields;
      if (!currSubfield) {
        return outgoingSubfields;
      }
      if (!isRelevantSamiSubfield(currSubfield, [...outgoingSubfields, ...otherSubfields])) {
        return processSubfields(otherSubfields, [...outgoingSubfields, currSubfield]);
      }

      const smiSubfield = {
        code: currSubfield.code,
        value: 'smi'
      };
      debug(` f041: Add '\$${currSubfield.code} smi' before '${currSubfield.value}'`);

      return processSubfields(otherSubfields, [...outgoingSubfields, smiSubfield, currSubfield]);
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
      if (otherSubfields.some(sf2 => sf2.code === sf.code && sf2.value === 'smi')) { // fail if 'smi' already exists
        return false;
      }
      //debug(` '\${sf.code} ${sf.value}' requires preceding 'smi'`);
      return true;
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






}

