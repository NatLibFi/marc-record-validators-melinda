import {nvdebug} from './utils';
import createDebugLogger from 'debug';

// Normalizes at least 490$v and 773$g which contain information such as "Raita 5" vs "5", and "Osa 3" vs "Osa III".

const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge-reducers:normalizeSubfieldValueForComparison');
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
  // This a very hacky function, but cand really help it, as the the data is very iffy as well...
  // Remove punctuation and brackets:
  const value = originalValue.replace(/[-.,:; ]+$/ui, '').replace(/^\[([0-9]+)\]$/ui, '$1'); // eslint-disable-line prefer-named-capture-group

  const [year, rest] = extractYear(value);

  const splitPoint = rest.lastIndexOf(' '); // MRA-627: "5, 2017" should be split here. Think of this later on...
  if (splitPoint === -1) {
    return [undefined, year, rest];
  }
  const lhs = rest.substr(0, splitPoint);
  const rhs = rest.substr(splitPoint + 1);
  return [lhs, year, rhs];

  function extractYear(value) {
    // NB! Note that this is far for perfect. It cover just some very common cases...

    // "2023, 3" => ["2023", "3"]
    if (value.match(/^(?:1[89][0-9][0-9]|20[012][0-9]), (?:nro |n:o)?[1-9][0-9]{0,2}$/ui)) {
      return [value.substr(0, 4), value.substr(6)];
    }
    // "2023/12" => ["2023", "12"]
    if (value.match(/^(?:1[89][0-9][0-9]|20[012][0-9])[/:][1-9][0-9]{0,2}$/u)) {
      return [value.substr(0, 4), value.substr(5)];
    }
    // "Vol. 3/2023" => ["2023", "Vol. 3"]
    if (value.match(/^[^0-9]*[1-9][0-9]{0,2}\/(?:1[89][0-9][0-9]|20[012][0-9])$/u)) {
      const len = value.length;
      return [value.substr(len - 4), value.substr(0, len - 5)];
    }


    return [undefined, value];
  }
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
  const [partType, partYear, partNumber] = splitPartData(value);
  //nvdebug(`  LHS: '${lhs}'`, debugDev);
  //nvdebug(`  RHS: '${rhs}'`, debugDev);
  return [normalizePartType(partType), partYear, normalizePartNumber(partNumber)];
}

export function partsAgree(value1, value2, tag, subfieldCode) {
  // Note, that parts can not be normalized away, as "2" can agree with "Part 2" and "Raita 2" and "Volume 2"...
  // NB! Used by reducers' mergeSubield.js
  if (!subfieldContainsPartData(tag, subfieldCode)) {
    return false;
  }
  const [partType1, partYear1, partNumber1] = splitAndNormalizePartData(value1);
  const [partType2, partYear2, partNumber2] = splitAndNormalizePartData(value2);
  //nvdebug(`P1: ${partType1} | ${partYear1} | ${partNumber1}`);
  //nvdebug(`P2: ${partType2} | ${partYear2} | ${partNumber2}`);
  if (partNumber1 !== partNumber2) {
    return false;
  }
  if (partType1 !== undefined && partType2 !== undefined && partType1 !== partType2) {
    return false;
  }
  if (partYear1 !== undefined && partYear2 !== undefined && partYear1 !== partYear2) {
    return false;
  }


  return true;
}

export function normalizePartData(value, subfieldCode, tag) {
  // This is for normalizing values for equality comparison only!
  if (!subfieldContainsPartData(tag, subfieldCode)) {
    return value;
  }

  const [partType, partYear, partNumber] = splitAndNormalizePartData(value);
  if (partType === undefined) {
    if (partYear === undefined) {
      return partNumber;
    }
    return `${partNumber}/${partYear}`;
  }
  if (partYear === undefined) {
    return `${partType} ${partNumber}`;
  }
  return `${partType} ${partNumber}/${partYear}`;
}
