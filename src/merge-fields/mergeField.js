//import {MarcRecord} from '@natlibfi/marc-record';
import createDebugLogger from 'debug';
import {fieldToString, fieldsToString, fieldsAreIdentical, nvdebug, hasCopyright, removeCopyright, subfieldToString} from '../utils';
import {fieldGetOccurrenceNumberPairs} from '../subfield6Utils.js';
import {cloneAndNormalizeFieldForComparison, cloneAndRemovePunctuation, isEnnakkotietoSubfieldG} from '../normalizeFieldForComparison';
import {mergeOrAddSubfield} from './mergeOrAddSubfield';
import {mergeIndicators} from './mergeIndicator';
import {mergableTag} from './mergableTag';
import {getCounterpart} from './counterpartField';
//import {default as normalizeEncoding} from '@natlibfi/marc-record-validators-melinda/dist/normalize-utf8-diacritics';
//import {postprocessRecords} from './mergeOrAddPostprocess.js';
//import {preprocessBeforeAdd} from './processFilter.js';

//import fs from 'fs';
//import path from 'path';


//const defaultConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'reducers', 'config.json'), 'utf8'));

// Specs: https://workgroups.helsinki.fi/x/K1ohCw (though we occasionally differ from them)...

const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge-reducers:mergeField');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

// NB! Can we do this via config.json?
function removeEnnakkotieto(field) {
  const tmp = field.subfields.filter(subfield => !isEnnakkotietoSubfieldG(subfield));
  // remove only iff some other subfield remains
  if (tmp.length > 0) { // eslint-disable-line functional/no-conditional-statements
    field.subfields = tmp; // eslint-disable-line functional/immutable-data
  }
}


function copyrightYearHack(baseRecord, baseField, sourceField) {
  if (baseField.tag !== '264' || sourceField.tag !== '260') {
    return;
  }
  const relevantSubfields = sourceField.subfields.filter(sf => sf.code === 'c' && hasCopyright(sf.value));

  relevantSubfields.forEach(sf => {
    // Add new:
    const value = sf.value.replace(/\.$/u, '');
    baseRecord.insertField({'tag': '264', 'ind1': ' ', 'ind2': '4', 'subfields': [{'code': 'c', value}]});
    // Modify original subfield:
    sf.value = removeCopyright(sf.value); // eslint-disable-line functional/immutable-data
  });
}

// eslint-disable-next-line max-params
function mergeField2(baseRecord, baseField, sourceField, config, candFieldPairs880 = []) {
  //// Identical fields
  // No need to check every subfield separately.
  // Also no need to postprocess the resulting field.
  if (fieldToString(baseField) === fieldToString(sourceField)) {
    return baseRecord;
  }

  // If a base ennakkotieto is merged with real data, remove ennakkotieto subfield:
  // (If our prepub normalizations are ok, this should not be needed.
  //  However, it's simple and works well enough, so let's keep it here.)
  if (baseField.subfields?.find(sf => isEnnakkotietoSubfieldG(sf)) && !sourceField.subfields?.find(sf => isEnnakkotietoSubfieldG(sf))) { // eslint-disable-line functional/no-conditional-statements
    removeEnnakkotieto(baseField);
    baseField.merged = 1; // eslint-disable-line functional/immutable-data
  }

  copyrightYearHack(baseRecord, baseField, sourceField);

  mergeIndicators(baseField, sourceField, config);


  // We want to add the incoming subfields without punctuation, and add puctuation later on.
  // (Cloning is harmless, but probably not needed.)
  // NEW: we also drag the normalized version along. It is needed for the merge-or-add decision
  const normalizedSourceField = cloneAndNormalizeFieldForComparison(sourceField); // This is for comparison
  const strippedSourceField = cloneAndRemovePunctuation(sourceField); // This is for adding subfields

  //nvdebug(`  MERGING SUBFIELDS OF '${fieldToString(sourceField)}' (original)`, debugDev);
  //nvdebug(`  MERGING SUBFIELDS OF '${fieldToString(normalizedSourceField)}' (comparison)`, debugDev);
  nvdebug(`  MERGING SUBFIELDS OF '${fieldToString(strippedSourceField)}' (merge/add)`, debugDev);

  sourceField.subfields.forEach((originalSubfield, index) => {
  //strippedSourceField.subfields.forEach((subfieldForMergeOrAdd, index) => {
    const normalizedSubfield = normalizedSourceField.subfields[index];
    const punctlessSubfield = strippedSourceField.subfields[index];
    const originalBaseValue = fieldToString(baseField);
    nvdebug(`  TRYING TO MERGE SUBFIELD '${subfieldToString(originalSubfield)}' TO '${originalBaseValue}'`, debugDev);

    const subfieldData = {'tag': sourceField.tag, 'code': originalSubfield.code, 'originalValue': originalSubfield.value, 'normalizedValue': normalizedSubfield.value, 'punctuationlessValue': punctlessSubfield.value};

    mergeOrAddSubfield(baseField, subfieldData, candFieldPairs880); // candSubfield);
    const newValue = fieldToString(baseField);
    if (originalBaseValue !== newValue) { // eslint-disable-line functional/no-conditional-statements
      nvdebug(`   SUBFIELD MERGE RESULT: '${newValue}'`, debugDev);
      //debug(`   TODO: sort subfields, handle punctuation...`);
    }
    //else { debugDev(`  mergeOrAddSubfield() did not add '‡${fieldToString(subfieldForMergeOrAdd)}' to '${originalValue}'`); }

  });
}


function skipMergeField(baseRecord, sourceField, config) {
  if (!mergableTag(sourceField.tag, config)) {
    nvdebug(`skipMergeField(): field '${fieldToString(sourceField)}' listed as skippable!`, debugDev);
    return true;
  }

  // Skip duplicate field:
  if (baseRecord.fields.some(baseField => !baseField.mergeCandidate && fieldsAreIdentical(sourceField, baseField))) {
    nvdebug(`skipMergeField(): field '${fieldToString(sourceField)}' already exists! No merge required!`, debugDev);
    sourceField.deleted = 1; // eslint-disable-line functional/immutable-data
    return true;
  }

  return false;
}

function sourceRecordIsBetter(baseField, sourceField) {
  if (!baseField.subfields) {
    return;
  }
  // MELINDA-8978: prefer Asteri version
  if (isAsteriField(sourceField) && !isAsteriField(baseField)) {
    return 1;
  }

  function isAsteriField(field) {
    if (field.subfields.some(sf => sf.code === '0' && sf.value.match(/^\((?:FI-ASTERI-[NW]|FIN1[13])\)[0-9]{9}$/u))) {
      return true;
    }
  }
  return false;
}

function swapDataBetweenFields(field1, field2) {
  // NB! Does not support controlfields yet! Add support if the need arises.
  if (field1.subfields) { // If field1 has subfields, then also field2 has them. No need to check the other field here.
    swapNamedData('ind1');
    swapNamedData('ind2');
    swapNamedData('subfields');
    return;
  }
  return;

  function swapNamedData(name) {
    const data = field1[name]; // eslint-disable-line functional/immutable-data
    field1[name] = field2[name]; // eslint-disable-line functional/immutable-data
    field2[name] = data; // eslint-disable-line functional/immutable-data
  }

}

export function mergeField(baseRecord, sourceRecord, sourceField, config) {
  nvdebug(`SELF: ${fieldToString(sourceField)}`, debugDev);

  sourceField.mergeCandidate = true; // eslint-disable-line functional/immutable-data
  // skip duplicates and special cases:
  if (skipMergeField(baseRecord, sourceField, config)) {
    nvdebug(`mergeField(): don't merge '${fieldToString(sourceField)}'`, debugDev);
    delete sourceField.mergeCandidate; // eslint-disable-line functional/immutable-data
    return false;
  }

  nvdebug(`mergeField(): Try to merge '${fieldToString(sourceField)}'.`, debugDev);
  const counterpartField = getCounterpart(baseRecord, sourceRecord, sourceField, config);

  if (counterpartField) {
    if (sourceRecordIsBetter(counterpartField, sourceField)) { // eslint-disable-line functional/no-conditional-statements
      swapDataBetweenFields(counterpartField, sourceField);
    }

    const candFieldPairs880 = sourceField.tag === '880' ? undefined : fieldGetOccurrenceNumberPairs(sourceField, sourceRecord.fields);
    nvdebug(`mergeField(): Got counterpart: '${fieldToString(counterpartField)}'. Thus try merge...`, debugDev);
    nvdebug(`PAIR: ${candFieldPairs880 ? fieldsToString(candFieldPairs880) : 'NADA'}`, debugDev);
    mergeField2(baseRecord, counterpartField, sourceField, config, candFieldPairs880);
    sourceField.deleted = 1; // eslint-disable-line functional/immutable-data
    delete sourceField.mergeCandidate; // eslint-disable-line functional/immutable-data
    return true;
  }
  // NB! Counterpartless field is inserted to 7XX even if field.tag says 1XX:
  debugDev(`mergeField(): No mergable counterpart found for '${fieldToString(sourceField)}'.`);
  delete sourceField.mergeCandidate; // eslint-disable-line functional/immutable-data
  return false;
}

