// Author(s): Nicholas Volk

import createDebugLogger from 'debug';
import clone from 'clone';

import {fieldToString, nvdebug} from './utils.js';

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:fix-sami-041');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');


// eslint-disable-next-line max-lines-per-function
export default function () {
  /* 'sma': eteläsaame, 'sme': pohjoissaame, 'smj': luulajansaame, 'smn': inarinsaame, 'sms': koltansaame */
  const samiLanguages = ['sma', 'sme', 'smj', 'smn', 'sms'];
  const subfieldCodesUsingSmi = ['a', 'd'];

  return {
    description: 'Add corresponding \'smi\' subfield before a specific sami language subfields and update 008/35-37, if needed',
    validate, fix
  };

  function getRelevantSubfieldCodes(record) { // Maybe this should be an exportable utility function...
    if (record && record.leader && record.leader[6]) {
     nvdebug(` LDR/06 is '${record.leader[6]}'`, debugDev);
      // We should test this properly...
      if (['i', 'j'].includes(record.leader[6])) { // Check type of record: sound recordings use 'd'
        return ['d'];
      }
      return ['a'];
    }

    return ['a', 'd']; // Både-och
  }


  function fix(record, validateMode = false) {
   nvdebug(`Start ${validateMode ? 'validator' : 'fixer'}`, debugDev);
    const relevantSubfieldCodes = getRelevantSubfieldCodes(record);
   nvdebug(` Relevant subfield codes are '${relevantSubfieldCodes.join("', '")}'`, debugDev);
    const relevantFields = record.fields.filter(f => isRelevantField(f, relevantSubfieldCodes)).map(f => validateMode ? clone(f) : f); // NV! relevant fields are cloned in validation mode!
    // Nothing to do:
    if (relevantFields.length === 0) {
     nvdebug(` No relevant f041 fields found`, debugDev);
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
       nvdebug(' WARNING: no f008 found'), debugDev;
        return [];
      }
      const currLang = f008.value.substr(35, 3);
      if (!samiLanguages.includes(currLang)) { // NB! If original 008/35-37 was not a sami language, we don't change anything!
       nvdebug(` Existing 008/35-37 '${currLang}' is not a sami language. No need to update 008/35-37`, debugDev);
        return [];
      }
      const origValue = f008.value;
      const firstRelevantSubfield = relevantFields[0].subfields.find(sf => relevantSubfieldCodes.includes(sf.code));
      if (firstRelevantSubfield.value !== 'smi') {
        nvdebug(` First relevant subfield is '\$${firstRelevantSubfield.code} ${firstRelevantSubfield.value}'. No need to update 008/35-37`, debugDev);
        return [];
      }
      f008.value = `${f008.value.substr(0, 35)}smi${f008.value.substr(38)}`;
     nvdebug(` Update 008/35-37: '${currLang}' => 'smi'`, debugDev);
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
     nvdebug(` f041: Add '\$${currSubfield.code} smi' before '${currSubfield.value}'`, debugDev);

      return processSubfields(otherSubfields, [...outgoingSubfields, smiSubfield, currSubfield]);
    }

    function isRelevantField(f) {
      if (f.tag !== '041' || !f.subfields || f.subfields.some(sf => sf.code === '2')) {
        return false;
      }
      return f.subfields.some(sf => isRelevantSamiSubfield(sf, f.subfields)); // it's ok to pass sf in f.subfields also
    }

    function isRelevantSamiSubfield(sf, otherSubfields) {
      // NB! preceding 'smi' is added to all $a and $d fields, regardless of the LDR/06 value! (However, copying 041$a/d -> 008/35-37 depends on LDR/06)
      if (!subfieldCodesUsingSmi.includes(sf.code) || !samiLanguages.includes(sf.value)) {
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

