import createDebugLogger from 'debug';
import {marc21GetTagsLegalInd1Value, marc21GetTagsLegalInd2Value, nvdebug} from '../utils';

// Specs: https://workgroups.helsinki.fi/x/K1ohCw (though we occasionally differ from them)...

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:merge-fields:mergableIndicator');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

const ind1NonFilingChars = ['130', '630', '730', '740'];
const ind2NonFilingChars = ['222', '240', '242', '243', '245', '830'];

function marc21NoNeedToCheckInd1(tag) {
  const cands = marc21GetTagsLegalInd1Value(tag);
  if (typeof cands === 'string') { // single cand
    return true;
  }
  return false;
}

function marc21NoNeedToCheckInd2(tag) {
  const cands = marc21GetTagsLegalInd2Value(tag);
  nvdebug(`CHECK IND2 ${typeof cands} FOR ${tag}`, debugDev);
  if (typeof cands === 'string') { // single cand
    return true;
  }
  return false;
}


export function mergableIndicator1(field1, field2, config) {
  // Indicators are identical:
  if (field1.ind1 === field2.ind1) {
    return true;
  }
  const {tag} = field1; // means "tag = field1.tag"
  // Indicator has but one legal value or is a non-filing indicator (NB: can not be overridden via config...):
  if (marc21NoNeedToCheckInd1(tag) || ind1NonFilingChars.includes(tag)) {
    return true;
  }
  // Override via config:
  if (config.ignoreIndicator1 && config.ignoreIndicator1.includes(tag)) {
    return true;
  }
  // Tolerate value '#' (reason: not spefified etc, the other value is supposedly a good one)
  if (field1.ind1 === ' ' || field2.ind1 === ' ') {
    return config.tolerateBlankIndicator1 && config.tolerateBlankIndicator1.includes(tag);
  }
  // Fail:
  return false;
}

export function mergableIndicator2(field1, field2, config) {
  // Indicators are identical:
  if (field1.ind2 === field2.ind2) {
    return true;
  }

  // nvdebug(`mergableIndicator2\n '${fieldToString(field1)}' vs\n '${fieldToString(field2)}'`, debugDev);

  // NB! Our 260 vs 264 hacks...NB #2: We do this split check only for ind2, not for ind1.
  // Maybe reasons to this for ind1 will rise later on. None known yetr though.
  const tag1 = field1.tag;
  const tag2 = field2.tag;

  // Indicator has but one legal value or is a non-filing indicator (NB: can not be overridden via config...):
  if (marc21NoNeedToCheckInd2(tag1) || marc21NoNeedToCheckInd2(tag2) || ind2NonFilingChars.includes(tag1)) {
    return true;
  }

  // Override via config:
  if (config.ignoreIndicator2) {
    if (config.ignoreIndicator2.includes(tag1) || config.ignoreIndicator2.includes(tag2)) {
      return true;
    }
  }

  // Tolerate value '#' (reason: not spefified etc, the other value is supposedly a good one)
  if (config.tolerateBlankIndicator2) {
    if (field1.ind2 === ' ' && config.tolerateBlankIndicator2.includes(tag1)) {
      return true;
    }
    if (field2.ind2 === ' ' && config.tolerateBlankIndicator2.includes(tag2)) {
      return true;
    }

  }
  // Fail:
  return false;
}
