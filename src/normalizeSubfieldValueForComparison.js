import {nvdebug} from './utils';
import createDebugLogger from 'debug';

// Normalizes at least 490$v and 773$g which contain information such as "Raita 5" vs "5", and "Osa 3" vs "Osa III".

const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge-reducers:normalizePart');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

export function subfieldContainsPartData(tag, subfieldCode) {
  // NB! Used by reducers' mergeSubield.js
  if (subfieldCode === 'v' && ['490', '800', '810', '811', '830'].includes(tag)) {
    return true;
  }
  if (tag === '773' && subfieldCode === 'g') {
    return true;
  }
  return false;
}

function splitPartData(originalValue) {
  // Remove brackets from number-only:
  const value = originalValue.replace(/^\[([0-9]+)\][-.,:; ]*$/ui, '$1'); // eslint-disable-line prefer-named-capture-group
  const splitPoint = value.lastIndexOf(' '); // MRA-627: "5, 2017" should be split here. Think of this later on...
  if (splitPoint === -1) {
    return [undefined, value];
  }
  const lhs = value.substr(0, splitPoint);
  const rhs = value.substr(splitPoint + 1);
  return [lhs, rhs];
}

function normalizePartType(originalValue) {
  if (originalValue === undefined) {
    return undefined;
  }
  const value = originalValue.toLowerCase();

  // Return Finnish singular nominative. Choise of language is arbitrary. This is best-ish for debug purposes...
  if (['n:o', 'no', 'nr', 'nro', 'number', 'numero', 'nummer'].includes(value)) {
    return 'numero';
  }
  if (['band', 'bd', 'häfte', 'nide', 'osa', 'part', 'teil', 'vol', 'vol.', 'volume'].includes(value)) {
    return 'osa';
  }

  if (['p.', 'page', 'pages', 'pp.', 's.', 'sidor', 'sivu', 'sivut'].includes(value)) {
    return 'sivu';
  }

  return value;
}

const romanNumbers = {'I': '1', 'II': '2', 'III': '3', 'IV': '4', 'V': '5', 'VI': '6', 'X': '10'};

function normalizePartNumber(value) {
  // Should we handle all Roman numbers or some range of them?
  // There's probably a library for our purposes..
  if (value in romanNumbers) {
    const arabicValue = romanNumbers[value];
    nvdebug(` MAP ${value} to ${arabicValue}`, debugDev);
    return arabicValue;
  }
  return value.toLowerCase();
}

function splitAndNormalizePartData(value) {
  // This is just a stub. Does not handle eg. "Levy 2, raita 15"
  const [lhs, rhs] = splitPartData(value);
  nvdebug(`  LHS: '${lhs}'`, debugDev);
  nvdebug(`  RHS: '${rhs}'`, debugDev);
  const partType = normalizePartType(lhs);
  const partNumber = normalizePartNumber(rhs);
  return [partType, partNumber];
}

export function partsAgree(value1, value2, tag, subfieldCode) {
  // Note, that parts can not be normalized away, as "2" can agree with "Part 2" and "Raita 2" and "Volume 2"...
  // NB! Used by reducers' mergeSubield.js
  if (!subfieldContainsPartData(tag, subfieldCode)) {
    return false;
  }
  const [partType1, partNumber1] = splitAndNormalizePartData(value1);
  const [partType2, partNumber2] = splitAndNormalizePartData(value2);
  if (partNumber1 !== partNumber2) {
    // MRA-627: This should/could accept 5/1997
    return false;
  }
  if (partType1 === undefined || partType2 === undefined || partType1 === partType2) {
    return true;
  }

  return false;
}

export function normalizePartData(value, subfieldCode, tag) {
  // This is for normalizing values for equality comparison only!
  if (!subfieldContainsPartData(tag, subfieldCode)) {
    return value;
  }

  const [partType, partNumber] = splitAndNormalizePartData(value);
  if (partType === undefined) {
    return partNumber;
  }
  return `${partType} ${partNumber}`;
}
