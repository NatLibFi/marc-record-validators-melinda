// Relocated from melinda-marc-record-merge-reducers (and renamed)
//import createDebugLogger from 'debug';
import clone from 'clone';
//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:normalizeIdentifiers');


function fieldToString(f) {
  return `${f.tag} ${f.ind1}${f.ind2} ‡${formatSubfields(f)}`;

  function formatSubfields(field) {
    //return field.subfields.map(sf => `${sf.code}${sf.value || ''}`).join('‡');
    return field.subfields.map(sf => `${sf.code}${sf.value}`).join(' ‡');
  }
}

/*
function nvdebug(message, func) {
  if (func) { // eslint-disable-line functional/no-conditional-statement
    func(message);
  }
  console.info(message); // eslint-disable-line no-console
}
*/

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

const alephInternal01 = '(FIN01)';
const alephInternal10 = '(FIN10)';
const alephInternal11 = '(FIN11)';
const alephInternal12 = '(FIN12)';
const alephInternal13 = '(FIN13)';

const standard01 = '(FI-MELINDA)';
const standard10 = '(FI-ASTERI-S)';
const standard11 = '(FI-ASTERI-N)';
const standard12 = '(FI-ASTERI-A)';
const standard13 = '(FI-ASTERI-W)';

const both01 = {ALEPH_INTERNAL: alephInternal01, STANDARD: standard01};
const both10 = {ALEPH_INTERNAL: alephInternal10, STANDARD: standard10};
const both11 = {ALEPH_INTERNAL: alephInternal11, STANDARD: standard11};
const both12 = {ALEPH_INTERNAL: alephInternal12, STANDARD: standard12};
const both13 = {ALEPH_INTERNAL: alephInternal13, STANDARD: standard13};

const mappings = {
  'FCC': both01,
  '(FI-ASTERI-A)': both12,
  '(FI-ASTERI-N)': both11,
  '(FI-ASTERI-S)': both10,
  '(FI-ASTERI-W)': both13,
  '(FI-MELINDA)': both01,
  '(FIN01)': both01,
  '(FIN10)': both10,
  '(FIN11)': both11,
  '(FIN12)': both12,
  '(FIN13)': both13,
  'http://urn.fi/URN:NBN:fi:au:finaf:': both11,
  'https://urn.fi/URN:NBN:fi:au:finaf:': both11
};

function normalizeNineDigitIDs(value, targetFormat = 'ALEPH_INTERNAL') {
  // $value should be prefix + nine-digits. Do nothing if nine-digit tail condition is not met:
  const nineDigitTail = value.slice(-9);
  if (!(/^[0-9]{9}$/u).test(nineDigitTail)) {
    return value;
  }
  // Normalize prefix:
  const currPrefix = value.slice(0, -9);

  if (currPrefix in mappings) {
    //nvdebug(`${currPrefix}, TF:${targetFormat}...`);
    //nvdebug(`${JSON.stringify(mappings[currPrefix])}`);
    return `${mappings[currPrefix][targetFormat]}${nineDigitTail}`;
  }
  return value;
}

export function normalizeControlSubfieldValue(value = '', targetFormat = 'ALEPH_INTERNAL') {
  const normalizedValue = normalizeNineDigitIDs(value, targetFormat);
  if (normalizedValue !== value) {
    return normalizedValue;
  }
  // Something for isni IDs?
  return value;
}

//export function normalizableSubfieldPrefix(tag, sf) {
export function normalizeAs(tag, subfieldCode) {
  //nvdebug(`nAs ${tag}, ${subfieldCode}`);
  if (subfieldCode === '0' || subfieldCode === '1' || subfieldCode === 'w') {
    return 'ALEPH_INTERNAL';
  }

  if (tag === '035' && ['a', 'z'].includes(subfieldCode)) {
    return 'STANDARD';
  }
  return undefined;
}

export function fieldNormalizeControlNumbers(field) {
  // Rename "Prefixes" as "ControlNumberIdentifiers"?
  // No, since isni etc...  however, just "ControlNumber" would do...
  if (!field.subfields) {
    return;
  }

  field.subfields.forEach(sf => {
    const targetFormat = normalizeAs(field.tag, sf.code);
    if (targetFormat !== undefined) {
      //nvdebug(`NORMALIZE SUBFIELD $${sf.code} IN FIELD: '${fieldToString(field)}' TO ${targetFormat}`);
      sf.value = normalizeControlSubfieldValue(sf.value, targetFormat); // eslint-disable-line functional/immutable-data
      return;
    }
  });
}
