// Relocated from melinda-marc-record-merge-reducers (and renamed)
//import createDebugLogger from 'debug';
//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:normalizeIdentifiers');

import {fieldToString} from './utils.js';


export default function () {

  return {
    description: 'Normalizes indicator values',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};

    recordNormalizeIndicators(record);

    return res;
  }

  function validate(record) {
    const res = {message: []};

    validateRecord(record, res);

    res.valid = res.message.length < 1;
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
      if (clonedFields[index].ind1 !== field.ind1) {
        //nvdebug(`FIX IND1: '${clonedFields[index].ind1}' => '${field.ind1}': ${clonedFieldAsString}`);
        res.message.push(`Expected IND1 for '${origFieldAsString}' is '${field.ind1}'`);
      }
      if (clonedFields[index].ind2 !== field.ind2) {
        //nvdebug(`FIX IND2: '${clonedFields[index].ind2}' => '${field.ind2}': ${clonedFieldAsString}`);
        res.message.push(`Expected IND2 for '${origFieldAsString}' is '${field.ind2}'`);
      }
    }
    // Validator should not change the original record:
    record.fields = clonedFields;
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
    if (name.match(/^de[nt] /u) && !name.match(/^de[nt] som /u)) {
      return '4';
    }
  }

  // Fallback-ish: try to guess even without languages:
  const match = valueBeginsWithDeterminer(name, ['the ']);
  if (match) {
    return `${match.length}`;
  }
  if (name.match(/^a /u) && !languages.includes('hun') && !name.match(/^a (?:b |la )/u)) { // Skip "a b c", "a la carte"...
    return '2';
  }

  return '0';
}

function normalizeNonFilingIndicator1(field, languages = []) {
  if (!hasNonFilingIndicator1(field) || !modifiableIndicatorValue(field.ind1)) {
    return;
  }

  field.ind1 = determineNonFilingIndicatorValue(field, languages);
}

function normalizeNonFilingIndicator2(field, languages = []) {
  if (!hasNonFilingIndicator2(field) || !modifiableIndicatorValue(field.ind2)) {
    return;
  }

  field.ind2 = determineNonFilingIndicatorValue(field, languages);
}

const fiktiivisenAineistonLisaluokatFI = ['Eläimet', 'Erotiikka', 'Erä', 'Fantasia', 'Historia', 'Huumori', 'Jännitys', 'Kauhu', 'Novellit', 'Romantiikka', 'Scifi', 'Sota', 'Urheilu', 'Uskonto'];

function containsFiktiivisenAineistonLisaluokka(field) {
  // Should we check Swedish versions as well?
  return field.subfields.some(sf => sf.code === 'a' && fiktiivisenAineistonLisaluokatFI.includes(sf.value));
}

function normalize084Indicator1(field) {
  if (field.tag !== '084') {
    return;
  }

  // https://marc21.kansalliskirjasto.fi/bib/05X-08X.htm#084 and https://finto.fi/ykl/fi/page/fiktioluokka
  if (field.ind1 !== '9' && containsFiktiivisenAineistonLisaluokka(field) && field.subfields.some(sf => sf.code === '2' && sf.value === 'ykl')) {
    field.ind1 = '9';
    return;
  }
}

function normalize245Indicator1(field, record) {
  if (field.tag !== '245') {
    return;
  }
  const field1XX = record.get('^1..$');
  field.ind1 = field1XX.length === 0 ? '0' : '1';
}

function noDisplayContantGenerated520Indicator1(field) {
  if (field.tag !== '520') {
    return;
  }
  const as = field.subfields.filter(sf => sf.code === 'a');
  // Set ind1=8 "no display constant generated" fro certain values (part of MELKEHITYS-2579):
  if (as.length === 1 && ['Abstract.', 'Abstrakt.', 'Abstrakti.', 'Abstract.', 'English Summary.', 'Sammandrag.', 'Tiivistelmä.'].includes(field.subfields[0].value)) {
    field.ind1 = '8';
  }

}

function normalize776Indicator2(field) {
  if (field.tag !== '776') {
    return;
  }
  // If subfield $i exists, ind2 must me '8'
  if (field.subfields.some(sf => sf.code === 'i')) {
    field.ind2 = '8';
    return;
  }
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
      f.ind1 = '1';
    });
    return;
  }
  if (fields8XX.length === 0) { // Fields 490 are always untraced (no traces found)
    fields490.forEach(f => {
      f.ind1 = '0';
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
    if (!['a', 'd', 'h'].includes(subfield.code)) {
      return false;
    }
    if (subfield.value.length !== 3) {
      return false;
    }
    // We could require /^[a-z][a-z][a-z]$/ etc as well, but it's not really that relevant.
    return true;
  }

}

function recordNormalizeIndicators(record) {
  recordNormalize490(record);

  // Language is used to handle non-filing indicators
  const languages = getLanguages(record);

  record.fields.forEach(field => fieldNormalizeIndicators(field, record, languages));

}

function fieldNormalizeIndicators(field, record, languages) {
  normalize084Indicator1(field);
  normalize245Indicator1(field, record);
  noDisplayContantGenerated520Indicator1(field);
  normalizeNonFilingIndicator1(field, languages);
  normalizeNonFilingIndicator2(field, languages);
  normalize776Indicator2(field);
}
