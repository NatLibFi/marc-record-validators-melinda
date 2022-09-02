// Relocated from melinda-marc-record-merge-reducers (and renamed)
//import createDebugLogger from 'debug';
import clone from 'clone';
//const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge-reducers:normalizeIdentifiers');
//import {fieldToString} from './utils.js';
//import { nvdebug} from './utils.js';

function fieldToString(f) {
  return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;

  function formatSubfields(field) {
    //return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
    return field.subfields.map(sf => `${sf.code}${sf.value}`).join(' ‡');
  }
}

export default function () {

  // NB! We should and could handle ISNIs here as well.
  return {
    description: 'Normalizes identifiers such as subfield $0 values',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};
    //message.fix = []; // eslint-disable-line functional/immutable-data

    // Actual parsing of all fields
    /*
      if (!record.fields) {
        return false;
      }
      */

    //nvdebug(`NORMALIZE CONTROL NUMBER FIX`, debug);
    record.fields.forEach(field => {
      //nvdebug(` NORMALIZE CONTROL NUMBER FIX ${fieldToString(field)}`, debug);

      fieldNormalizeControlNumbers(field);
      //validateField(field, true, message);
    });

    // message.valid = !(message.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validate(record) {
    const res = {message: []};
    //nvdebug(`NORMALIZE CONTROL NUMBER VALIDATE`, debug);
    // Actual parsing of all fields
    /*
      if (!record.fields) {
        return false;
      }
      */

    record.fields.forEach(field => {
      //nvdebug(` NORMALIZE CONTROL NUMBER VALIDATE ${fieldToString(field)}`, debug);
      validateField(field, res);
    });

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validateField(field, res) {
    if (!field.subfields) {
      return;
    }

    const normalizedField = clone(field);
    fieldNormalizeControlNumbers(normalizedField);

    const orig = fieldToString(field);
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`'${orig}' could do with control number identifier normalization`); // eslint-disable-line functional/immutable-data
      return;
    }

    return;
  }
}

const defaultFIN01 = '(FIN01)';
const defaultFIN10 = '(FIN10)';
const defaultFIN11 = '(FIN11)';
const defaultFIN12 = '(FIN12)';
const defaultFIN13 = '(FIN13)';

// Using default consts allow us to change the default value trivially.
// Note that som mappings map to themselves, for example, '(FIN01)' maps to itself '(FIN01)' on purpose.

const prefixMappings = {
  'FCC': defaultFIN01,
  '(FI-ASTERI-A)': defaultFIN12,
  '(FI-ASTERI-N)': defaultFIN11,
  '(FI-ASTERI-S)': defaultFIN10,
  '(FI-ASTERI-W)': defaultFIN13,
  '(FI-MELINDA)': defaultFIN01,
  '(FIN01)': defaultFIN01,
  '(FIN10)': defaultFIN10,
  '(FIN11)': defaultFIN11,
  '(FIN12)': defaultFIN12,
  '(FIN13)': defaultFIN13,
  'http://urn.fi/URN:NBN:fi:au:finaf:': defaultFIN11,
  'https://urn.fi/URN:NBN:fi:au:finaf:': defaultFIN11
};

function normalizeNineDigitIDs(value) {
  // $value should be prefix + nine-digits. Do nothing if nine-digit tail condition is not met:
  const nineDigitTail = value.slice(-9);
  if (!(/^[0-9]{9}$/u).test(nineDigitTail)) {
    return value;
  }
  // Normalize prefix:
  const currPrefix = value.slice(0, -9);
  if (currPrefix in prefixMappings) {
    return `${prefixMappings[currPrefix]}${value.slice(-9)}`;
  }
  return value;
}

export function normalizeControlSubfieldValue(value = '') {
  const normalizedValue = normalizeNineDigitIDs(value);
  if (normalizedValue !== value) {
    return normalizedValue;
  }
  // Something for isni IDs?
  return value;
}

//export function normalizableSubfieldPrefix(tag, sf) {
export function mayContainControlNumberIdentifier(tag, sf) {
  if (sf.code === '0' || sf.code === '1' || sf.code === 'w') {
    return true;
  }

  if (tag === '035' && ['a', 'z'].includes(sf.code)) {
    return true;
  }
  return false;
}

export function fieldNormalizeControlNumbers(field) {
  // Rename "Prefixes" as "ControlNumberIdentifiers"?
  // No, since isni etc...  however, just "ControlNumber" would do...
  if (!field.subfields) {
    return;
  }

  field.subfields.forEach(sf => {
    if (mayContainControlNumberIdentifier(field.tag, sf)) {
      //nvdebug(`NORMALIZE SUBFIELD: '${fieldToString(field)}'`, debug);
      sf.value = normalizeControlSubfieldValue(sf.value); // eslint-disable-line functional/immutable-data
      return;
    }
  });
}
