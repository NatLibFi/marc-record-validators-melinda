// Relocated from melinda-marc-record-merge-reducers (and renamed)
//import createDebugLogger from 'debug';
//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:normalizeIdentifiers');


function fieldToString(f) {
  if (!f.subfields) {
    return `${f.tag}    ${f.value}`;
  }
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
    description: 'Normalizes indicator values',
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


    recordNormalizeIndicators(record);


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

    validateRecord(record, res);

    res.valid = res.message.length < 1; // eslint-disable-line functional/immutable-data
    return res;
  }


  function validateRecord(record, res) {
    //nvdebug(record);
    const clonedFields = JSON.parse(JSON.stringify(record.fields));
    recordNormalizeIndicators(record);

    record.fields.forEach((field, index) => compareFields(field, index));

    function compareFields(field, index) {
      const origFieldAsString = fieldToString(clonedFields[index]);
      //const clonedFieldAsString = fieldToString(field);
      if (clonedFields[index].ind1 !== field.ind1) { // eslint-disable-line functional/no-conditional-statement
        //nvdebug(`FIX IND1: '${clonedFields[index].ind1}' => '${field.ind1}': ${clonedFieldAsString}`);
        res.message.push(`Expected IND1 for '${origFieldAsString}' is '${field.ind1}'`); // eslint-disable-line functional/immutable-data
      }
      if (clonedFields[index].ind2 !== field.ind2) { // eslint-disable-line functional/no-conditional-statement
        //nvdebug(`FIX IND2: '${clonedFields[index].ind2}' => '${field.ind2}': ${clonedFieldAsString}`);
        res.message.push(`Expected IND2 for '${origFieldAsString}' is '${field.ind2}'`); // eslint-disable-line functional/immutable-data
      }
    }
    // Validator should not change the original record:
    record.fields = clonedFields; // eslint-disable-line functional/immutable-data
    return;
  }
}


const ind1NonFilingChars = ['130', '630', '730', '740'];
const ind2NonFilingChars = ['222', '240', '242', '243', '245', '830'];

function hasNonFilingIndicator1(field) {
  return ind1NonFilingChars.includes(field.tag);
}

function modifiableIndicatorValue(value) {
  // If field contains a legit-looking value, don't try to modify it here...
  return !['9', '8', '7', '6', '5', '4', '3', '2', '1'].includes(value);
}

function hasNonFilingIndicator2(field) {
  return ind2NonFilingChars.includes(field.tag);
}

function valueBeginsWithDeterminer(value, cands) {
  return cands.find(cand => value.substring(0, cand.length) === cand);
}

function determineNonFilingIndicatorValue(field, languages = undefined) {
  const subfieldA = field.subfields.find(sf => sf.code === 'a');
  if (!subfieldA) {
    // nvdebug(' Subfield $a miss!');
    return;
  }

  const name = subfieldA.value.toLowerCase();

  if (languages.includes('eng')) {
    const match = valueBeginsWithDeterminer(name, ['a ', 'an ', 'the ']);
    if (match) {
      return `${match.length}`;
    }
  }

  if (languages.includes('fre')) {
    const match = valueBeginsWithDeterminer(name, ['l\'', 'le ']);
    if (match) {
      return `${match.length}`;
    }
  }

  if (languages.includes('ger')) {
    const match = valueBeginsWithDeterminer(name, ['das ', 'der ', 'die ']);
    if (match) {
      return `${match.length}`;
    }
  }

  if (languages.includes('swe')) {
    const match = valueBeginsWithDeterminer(name, ['en ', 'ett ']);
    if (match) {
      return `${match.length}`;
    }
  }

  // Fallback-ish: try to guess even without languages:
  const match = valueBeginsWithDeterminer(name, ['the ']);
  if (match) {
    return `${match.length}`;
  }

  return '0';
}

function normalizeNonFilingIndicator1(field, languages = []) {
  if (!hasNonFilingIndicator1(field) || !modifiableIndicatorValue(field.ind1)) {
    return;
  }

  field.ind1 = determineNonFilingIndicatorValue(field, languages); // eslint-disable-line functional/immutable-data
}

function normalizeNonFilingIndicator2(field, languages = []) {
  if (!hasNonFilingIndicator2(field) || !modifiableIndicatorValue(field.ind2)) {
    return;
  }

  field.ind2 = determineNonFilingIndicatorValue(field, languages); // eslint-disable-line functional/immutable-data
}


function normalize245Indicator1(field, record) {
  if (field.tag !== '245') {
    return;
  }
  const field1XX = record.get('^1..$');
  field.ind1 = field1XX.length === 0 ? '0' : '1'; // eslint-disable-line functional/immutable-data
}


function recordNormalize490(record) {
  const fields490 = record.get('^490$');
  const fields8XX = record.get('^(?:800|810|811|830)$');

  if (fields490.length === 0) {
    return;
  }
  if (fields490.length <= fields8XX.length) {
    // Trace found for each field 490:
    fields490.forEach(f => {
      f.ind1 = '1'; // eslint-disable-line functional/immutable-data
    });
    return;
  }
  if (fields8XX.length === 0) { // Fields 490 are always untraced (no traces found)
    fields490.forEach(f => {
      f.ind1 = '0'; // eslint-disable-line functional/immutable-data
    });
    return;
  }
  // For other combinations we just can't be sure, so leave them as they are.
}


function getLanguages(record) {
  const langFields = record.get('^041$');

  if (langFields.length === 0) {
    return [];
  }

  return langFields[0].subfields.filter(sf => isRelevantSubfield(sf)).map(subfield => subfield.value);

  function isRelevantSubfield(subfield) {
    if (subfield.code !== 'a' && subfield.code !== 'd') {
      return false;
    }
    if (subfield.value.length !== 3) {
      return false;
    }
    // We could require /^[a-z][a-z][a-z]$/ etc as well, but it's not really that relevant.
    return true;
  }

}

export function recordNormalizeIndicators(record) {
  recordNormalize490(record);

  // Language is used to handle non-filing indicators
  const languages = getLanguages(record);

  record.fields.forEach(field => fieldNormalizeIndicators(field, record, languages));

}

function fieldNormalizeIndicators(field, record, languages) {
  normalize245Indicator1(field, record);
  normalizeNonFilingIndicator1(field, languages);
  normalizeNonFilingIndicator2(field, languages);
}
