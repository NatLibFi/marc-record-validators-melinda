import createDebugLogger from 'debug';

//import fs from 'fs';
//import path from 'path';

const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge-reducers:utils');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

import {melindaFieldSpecs} from './melindaCustomMergeFields.js';

//JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'melindaCustomMergeFields.json'), 'utf8'));

export function isElectronicMaterial(record) {
  const f337s = record.get('337');

  return f337s.length > 0 && f337s.some(f => fieldHasSubfield(f, 'b', 'c') && fieldHasSubfield(f, '2', 'rdamedia'));
}

export function nvdebug(message, func = undefined) {
  if (func) {
    func(message);
  }
  //console.info(message); // eslint-disable-line no-console
}

export function fieldHasSubfield(field, subfieldCode, subfieldValue = null) {
  if (!field.subfields) {
    return false;
  }
  if (subfieldValue === null) {
    return field.subfields.some(sf => sf.code === subfieldCode);
  }
  return field.subfields.some(sf => sf.code === subfieldCode && subfieldValue === sf.value);
}

export function subfieldToString(sf) {
  if (!sf.value) {
    return `‡${sf.code}`;
  }
  return `‡${sf.code} ${sf.value}`;
}

function normalizeIndicatorValue(val) {
  if (val === ' ') {
    return '#';
  }
  return val;
}

export function recordToString(record) {
  const ldr = `LDR   ${record.leader}`;
  const fields = record.fields.map(f => fieldToString(f));
  return `${ldr}\n${fields.join('\n')}`;
}

export function removeSubfield(record, tag, subfieldCode) {
  record.fields = record.fields.map(field => {
    if (field.tag !== tag || !field.subfields) { // Don't procss irrelevant fields
      return field;
    }
    field.subfields = field.subfields.filter(sf => sf.code !== subfieldCode);
    if (field.subfields.length === 0) {
      return false;
    }
    return field;
  }).filter(field => field);
}

export function recordRemoveValuelessSubfields(record) {
  record.fields = record.fields.map(field => {
    if (!field.subfields) { // Keep control fields
      return field;
    }
    // Remove empty subfields from datafields:
    field.subfields = field.subfields.filter(sf => sf.value);

    if (field.subfields && field.subfields.length === 0) {
      return false; // Return false instead of a field if field has no subfields left. These will soon be filtered out.
    }

    return field; //if field has subfields return it
  }).filter(field => field); // Filter those falses out
}

export function fieldToString(f) {
  if ('subfields' in f) {
    return `${f.tag} ${normalizeIndicatorValue(f.ind1)}${normalizeIndicatorValue(f.ind2)}${formatSubfields(f)}`;
  }
  return `${f.tag}    ${f.value}`;

  function formatSubfields(field) {
    return field.subfields.map(sf => ` ${subfieldToString(sf)}`).join('');
  }
}

export function fieldsToString(fields) {
  return fields.map(f => fieldToString(f)).join('\t__SEPARATOR__\t');
}

export function nvdebugFieldArray(fields, prefix = '  ', func = undefined) {
  fields.forEach(field => nvdebug(`${prefix}${fieldToString(field)}`, func));
}

export function isControlSubfieldCode(subfieldCode) {
  if (['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'w'].includes(subfieldCode)) {
    return true;
  }
  return false;
}

export function getCatalogingLanguage(record, defaultCatalogingLanguage = undefined) {
  const [field040] = record.get(/^040$/u);
  if (!field040) {
    return defaultCatalogingLanguage;
  }
  const [b] = field040.subfields.filter(sf => sf.code === 'b');
  if (!b) {
    return defaultCatalogingLanguage;
  }
  return b.value;
}


export function uniqArray(arr) {
  return arr.filter((val, i) => arr.indexOf(val) === i);
}

export function fieldsAreIdentical(field1, field2) {
  if (field1.tag !== field2.tag) { // NB! We are skipping normalizations here on purpose! They should be done beforehand...
    return false;
  }
  return fieldToString(field1) === fieldToString(field2);

  // The order of subfields is relevant! Bloody JS idiotisms make people use conditions such as:
  // return field1.subfields.every(sf => field2.subfields.some(sf2 => sf.code === sf2.code && sf.value === sf2.value));
}

export function fieldHasNSubfields(field, subfieldCode/*, subfieldValue = null*/) {
  const relevantSubfields = field.subfields.filter(sf => sf.code === subfieldCode);
  //if (subfieldValue === null) {
  return relevantSubfields.length;
  //}
  //const subset = relevantSubfields.filter(value => value === subfieldValue);
  //return subset.length;
}

export function removeCopyright(value) {
  return value.replace(/^(?:c|p|©|℗|Cop\. ?) ?((?:1[0-9][0-9][0-9]|20[012][0-9])\.?)$/ui, '$1');
}

function isNonStandardNonrepeatableSubfield(tag, subfieldCode) {
  // Put these into config or so...
  if (tag === '264') {
    return ['a', 'b', 'c'].includes(subfieldCode);
  }

  if (['336', '337', '338'].includes(tag)) {
    return ['a', 'b', '2'].includes(subfieldCode);
  }

  return false;
}


export function subfieldIsRepeatable(tag, subfieldCode) {

  if (isNonStandardNonrepeatableSubfield(tag, subfieldCode)) {
    return false;
  }

  // These we know or "know":
  // NB! $5 is (according to MARC21 format) non-repeatable, and not usable in all fields, but Melinda has a local exception to this, see MET-300
  if ('0159'.indexOf(subfieldCode) > -1) {
    // Uh, can $0 appear on any field?
    return true;
  }

  const fieldSpecs = melindaFieldSpecs.fields.filter(field => field.tag === tag);
  if (fieldSpecs.length !== 1) {
    nvdebug(` WARNING! Getting field ${tag} data failed! ${fieldSpecs.length} hits. Default value true is used for'${subfieldCode}' .`, debugDev);
    return true;
  }

  const subfieldSpecs = fieldSpecs[0].subfields.filter(subfield => subfield.code === subfieldCode);
  // Currently we don't support multiple $6 fields due to re-indexing limitations...
  // Well, $6 is non-repeatable, isn't it?!?
  // (This might actually already be fixed... Marginal issue, but check eventually.)
  if (subfieldSpecs.length !== 1 || subfieldCode === '6') {
    return false; // repeatable if not specified, I guess. Maybe add log or warn?
  }
  return subfieldSpecs[0].repeatable;
}

function marc21GetTagsLegalIndicators(tag) {
  const fieldSpecs = melindaFieldSpecs.fields.filter(field => field.tag === tag);
  if (fieldSpecs.length === 0) {
    return undefined;
  }
  return fieldSpecs[0].indicators;
}

export function marc21GetTagsLegalInd1Value(tag) {
  const indicator = marc21GetTagsLegalIndicators(tag);
  if (indicator === undefined) {
    return undefined;
  }
  return indicator.ind1;
}

export function marc21GetTagsLegalInd2Value(tag) {
  const indicator = marc21GetTagsLegalIndicators(tag);
  if (indicator === undefined) {
    return undefined;
  }
  return indicator.ind2;
}

export function nvdebugSubfieldArray(subfields, prefix = '  ', func = undefined) {
  subfields.forEach(subfield => nvdebug(`${prefix}${subfieldToString(subfield)}`, func));
}

export function subfieldsAreIdentical(subfieldA, subfieldB) {
  return subfieldA.code === subfieldB.code && subfieldA.value === subfieldB.value;
}

export function fieldHasMultipleSubfields(field, subfieldCode/*, subfieldValue = null*/) {
  return fieldHasNSubfields(field, subfieldCode) > 1;
}

export function hasCopyright(value) {
  const modValue = removeCopyright(value);
  return value !== modValue;
}
