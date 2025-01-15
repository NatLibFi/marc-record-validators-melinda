import {fieldHasSubfield, nvdebug, nvdebugFieldArray} from './utils';
import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:prepublicationUtils');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

const KONEELLISESTI_TUOTETTU_TIETUE = 1; // Best
const TARKISTETTU_ENNAKKOTIETO = 2;
const ENNAKKOTIETO = 3;
//const EI_TASOA = 4;

const encodingLevelPreferenceArray = [' ', '1', '3', '4', '5', '2', '7', 'u', 'z', '8']; // MET-145
const prepublicationLevelIndex = encodingLevelPreferenceArray.indexOf('8');

export function prepublicationLevelIsKoneellisestiTuotettuTietueOrTarkistettuEnnakkotieto(prepublicationLevel) {
  return prepublicationLevel === KONEELLISESTI_TUOTETTU_TIETUE || prepublicationLevel === TARKISTETTU_ENNAKKOTIETO;
}


export function encodingLevelIsBetterThanPrepublication(encodingLevel) {
  const index = encodingLevelPreferenceArray.indexOf(encodingLevel);
  return index > -1 && index < prepublicationLevelIndex;
}

// These three functions below all refer to field 500:
export function fieldRefersToKoneellisestiTuotettuTietue(field) {
  return field.subfields?.some(sf => sf.code === 'a' && sf.value.match(/^Koneellisesti tuotettu tietue/u));
}


export function fieldRefersToTarkistettuEnnakkotieto(field) {
  return field.subfields?.some(sf => sf.code === 'a' && sf.value.match(/^tarkistettu ennakkotieto/ui));
}


export function fieldRefersToEnnakkotieto(field) {
  // NB! This no longer matches 'TARKISTETTU ENNAKKOTIETO' case! Bug or Feature?
  if (field.subfields?.some(sf => sf.code === 'a' && sf.value.match(/^ennakkotieto(?:$|[. ])/ui))) {
    return true;
  }

  // MRA-420: "EI VIELÄ ILMESTYNYT" is a Helmet note, that is semantically similar to ENNAKKOTIETO:
  return field.subfields?.some(sf => sf.code === 'a' && sf.value.match(/^EI VIELÄ ILMESTYNYT/u));
}


export function firstFieldHasBetterPrepubEncodingLevel(field1, field2) {
  if (fieldRefersToKoneellisestiTuotettuTietue(field2)) {
    return false;
  }
  if (fieldRefersToKoneellisestiTuotettuTietue(field1)) {
    return true;
  }
  if (fieldRefersToTarkistettuEnnakkotieto(field2)) {
    return false;
  }
  if (fieldRefersToTarkistettuEnnakkotieto(field1)) {
    return true;
  }
  if (fieldRefersToEnnakkotieto(field2)) {
    return false;
  }
  if (fieldRefersToEnnakkotieto(field1)) {
    return true;
  }
  return false;
}

export function getRelevant5XXFields(record, f500 = false, f594 = false) {
  const cands = actualGetFields();
  //nvdebugFieldArray(cands, 'gR5XXa: ', debugDev);
  const filtered = cands.filter(field => hasRelevantPrepubData(field));
  //nvdebugFieldArray(filtered, 'gR5XXb: ', debugDev);
  return filtered;

  //return actualGetFields().filter(field => hasRelevantPrepubData(field));

  function hasRelevantPrepubData(field) {
    // Check prepub ($a):
    if (!fieldRefersToKoneellisestiTuotettuTietue(field) && !fieldRefersToTarkistettuEnnakkotieto(field) && !fieldRefersToEnnakkotieto(field)) {
      return false;
    }
    // Check relevance (594$5):
    if (field.tag === '500') {
      return field.subfields.every(sf => sf.code !== '5'); //true;
    }
    return field.subfields.some(sf => sf.code === '5' && ['FENNI', 'FIKKA', 'VIOLA'].includes(sf.value));
  }

  function actualGetFields() {
    if (f500 && f594) {
      return record.get(/^(?:500|594)$/u);
    }
    if (f500) {
      return record.get(/^500$/u);
    }
    if (f594) {
      return record.get(/^594$/u);
    }
    return [];
  }

}


// Very similar to getPrepublicationLevel() in melinda-record-match-validator's getPrepublicationLevel()...
// We should use that and not have a copy here...
export function getPrepublicationLevel(record, f500 = false, f594 = false) {
  // Smaller return value is better
  const fields = getRelevant5XXFields(record, f500, f594);

  if (!fields) {
    return null;
  }
  if (fields.some(f => fieldRefersToKoneellisestiTuotettuTietue(f))) {
    return KONEELLISESTI_TUOTETTU_TIETUE;
  }

  if (fields.some(f => fieldRefersToTarkistettuEnnakkotieto(f))) {
    return TARKISTETTU_ENNAKKOTIETO;
  }

  if (fields.some(f => fieldRefersToEnnakkotieto(f))) {
    return ENNAKKOTIETO;
  }

  return null;
}


export function baseHasEqualOrHigherEncodingLevel(baseEncodingLevel, sourceEncodingLevel) {
  const baseIndex = encodingLevelPreferenceArray.indexOf(baseEncodingLevel);
  const sourceIndex = encodingLevelPreferenceArray.indexOf(sourceEncodingLevel);

  if (baseIndex === -1) {
    // Base wins if both are bad:
    return sourceIndex === -1;
  }
  return baseIndex <= sourceIndex;
}


function hasFikkaLOW(record) {
  return record.fields.some(field => field.tag === 'LOW' && fieldHasSubfield(field, 'a', 'FIKKA'));
}


function hasNatLibFi042(record) {
  return record.fields.some(field => field.tag === '042' && (fieldHasSubfield(field, 'a', 'finb') || fieldHasSubfield(field, 'a', 'finbd')));
}


export function isFikkaRecord(record) {
  // NB! Does not include Humaniora. Pienpainatteet (not that they'd have duplicates)?
  return hasFikkaLOW(record) && hasNatLibFi042(record);
}


export function getEncodingLevel(record) {
  return record.leader.substring(17, 18);
}


export function deleteAllPrepublicationNotesFromField500InNonPubRecord(record) {
  const encodingLevel = getEncodingLevel(record);
  // Skip prepublication (or theoretically even worse) records:
  if (!encodingLevelIsBetterThanPrepublication(encodingLevel)) {
  //if (['2', '8'].includes(encodingLevel)) { // MET-306: added '2' here
    return;
  }

  // MET-306: keep "koneellisesti tuotettu tietue" if encoding level is '2':
  const f500 = getRelevant5XXFields(record, true, false).filter(field => encodingLevel === '2' ? !fieldRefersToKoneellisestiTuotettuTietue(field) : true);
  if (f500.length === 0) {
    return;
  }


  nvdebug(`Delete all ${f500.length} instance(s) of field 500`, debugDev);
  f500.forEach(field => record.removeField(field));
}


export function removeWorsePrepubField500s(record) {
  // Remove lower-level entries:
  const fields = getRelevant5XXFields(record, true, false); // 500=false, 594=true
  nvdebugFieldArray(fields, '  Candidates for non-best 500 b4 filtering: ', debugDev);
  const nonBest = fields.filter(field => fields.some(field2 => firstFieldHasBetterPrepubEncodingLevel(field2, field)));
  nvdebugFieldArray(nonBest, '  Remove non-best 500: ', debugDev);
  nonBest.forEach(field => record.removeField(field));
}


export function removeWorsePrepubField594s(record) {
  // Remove lower-level entries:
  const fields594 = getRelevant5XXFields(record, false, true); // 500=false, 594=true
  nvdebugFieldArray(fields594, '  Candidates for non-best 594 b4 filtering: ', debugDev);
  const nonBest = fields594.filter(field => fields594.some(field2 => firstFieldHasBetterPrepubEncodingLevel(field2, field)));
  nvdebugFieldArray(nonBest, '  Remove non-best 594: ', debugDev);
  nonBest.forEach(field => record.removeField(field));
}


export function isEnnakkotietoSubfield(subfield) {
  if (subfield.code !== '9' && subfield.code !== 'g') {
    return false;
  }
  // Length <= 13 allows punctuation, but does not require it:
  if (subfield.value.length <= 13) {
    const coreString = subfield.value.substr(0, 12);
    if (coreString.toLowerCase() === 'ennakkotieto') { // Lowercase term first seen in MET-575
      return true;
    }
  }
  return false;
}

export function isEnnakkotietoField(field) {
  return field.subfields.some(sf => isEnnakkotietoSubfield(sf));
}

export function isKingOfTheHill(field, opposingFields) {
  // Field is no better than at least one of the opposing fields
  return opposingFields.every(opposingField => firstFieldHasBetterPrepubEncodingLevel(field, opposingField));
}

