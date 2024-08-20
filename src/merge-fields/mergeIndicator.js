import createDebugLogger from 'debug';
import {fieldToString, marc21GetTagsLegalInd1Value, marc21GetTagsLegalInd2Value, nvdebug} from '../utils';

// Specs: https://workgroups.helsinki.fi/x/K1ohCw (though we occasionally differ from them)...

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:merge-fields:mergeIndicator');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

const ind1NonFilingChars = ['130', '630', '730', '740'];
const ind2NonFilingChars = ['222', '240', '242', '243', '245', '830'];


export function mergeIndicators(toField, fromField, config) {
  // NB! For non-filing indicators we deem that bigger is better. This is a bit quick'n'dirty, as usual.
  // We could and should checks the relevant article length (using language information whilst doing it).
  // However, this is a task for record internal fixer, not merge.
  //
  // For other indicators the situation is trickier, as we don't know which one is the good value.
  //
  // NB! We could add fixes for various other indicator types as well. However, it gets quickly pretty ad hoc.
  // nvdebug(fieldToString(toField), debugDev);
  // nvdebug(fieldToString(fromField), debugDev);

  mergeIndicator1(toField, fromField, config);
  mergeIndicator2(toField, fromField, config);

  function getIndicatorPreferredValues(tag, indicatorNumber, config) {
    const cands = getIndicatorPreferredValuesForGivenTag(tag, indicatorNumber, config);
    // More complex systems where multiple indicators have same priority are objects.
    // Example: field 506 might return {"0": 1, "1": 1, " ": 2}
    // Here indicator values '0' and '1' share top priority 1, and '#' is of lesser importance, namely 2.
    if (Array.isArray(cands) || typeof cands === 'object') {
      return cands;
    }
    if (typeof cands === 'string') { // single cand as string (seen in json in the past), though now they should all be arrays
      return cands.split('');
    }

    return [];

    function getIndicatorPreferredValuesForGivenTag(tag, indicatorNumber, config) {
      const preferredValues = indicatorNumber === 1 ? config.indicator1PreferredValues : config.indicator2PreferredValues;
      nvdebug(`${tag} IND${indicatorNumber}: get preferred values...\nCONFIG: ${JSON.stringify(config)}`, debugDev);
      if (preferredValues) {
        //nvdebug(`${tag} PREF VALS: ${JSON.stringify(preferredValues)}`, debugDev);
        if (tag in preferredValues) {
          return preferredValues[tag];
        }
      }

      // Easter Egg #1: Use good-ish hard-coded defaults as not defined by user:
      if (indicatorNumber === 1 && ind1NonFilingChars.includes(tag)) {
        return '9876543210 ';
      }
      if (indicatorNumber === 2 && ind2NonFilingChars.includes(tag)) {
        return '9876543210 ';
      }

      // Easter Egg #2: Marc21 standard has just one value for given indicator, so prefer it:
      const cands = indicatorNumber === 1 ? marc21GetTagsLegalInd1Value(tag) : marc21GetTagsLegalInd2Value(tag);
      if (cands) {
        if (typeof cands === 'string' && cands.length === 1) { // single cand
          return [cands];
        }
        if (Array.isArray(cands) && cands.length === 1) {
          return cands;
        }
      }

      return [];
    }
  }

  function getPreferredValue(preferences, val1, val2) {
    const i1 = scoreValue(preferences, val1);
    const i2 = scoreValue(preferences, val2);
    if (i1 === -1) {
      return i2 === -1 ? undefined : val2;
    }
    if (i2 === -1) {
      return val1;
    }
    // The sooner, the better:
    return i1 < i2 ? val1 : val2;

    function scoreValue(preferences, val) {
      if (Array.isArray(preferences)) {
        return preferences.indexOf(val);
      }
      // preferences may be an object, since diffent values can return same score
      // (eg. 506 ind1 values '0' and '1' are equal but better than '#')
      if (!(val in preferences)) {
        return -1;
      }
      return preferences[val];
    }
  }


  function fieldIsFenniKept(field) {
    return field.subfields && field.subfields.some(sf => sf.code === '9' && sf.value === 'FENNI<KEEP>');
  }

  function mergeIndicator1(toField, fromField, config) {
    if (toField.ind1 === fromField.ind1) {
      return; // Do nothing
    }

    // MRA-300: If source contains the (un)holy $9 FENNI<KEEP>, we prefer that value regardless of whatever...
    if (!fieldIsFenniKept(toField) && fieldIsFenniKept(fromField)) {
      toField.ind1 = fromField.ind1; // eslint-disable-line functional/immutable-data
      return;
    }


    const preferredValues = getIndicatorPreferredValues(toField.tag, 1, config);

    if (preferredValues) {
      //nvdebug(`Try to merge indicator 1: '${toField.ind1}' vs '${fromField.ind1}'`, debugDev);
      //nvdebug(`PREF VALS: ${preferredValues}`, debugDev);
      const preferredValue = getPreferredValue(preferredValues, fromField.ind1, toField.ind1);
      if (typeof preferredValue !== 'undefined') {
        //nvdebug(`${preferredValue} WINS!`, debugDev);
        toField.ind1 = preferredValue; // eslint-disable-line functional/immutable-data
        return;
      }
      //nvdebug(`No winner found indicator 1: '${toField.ind1}' vs '${fromField.ind1}', keep '${toField.ind1}'`, debugDev);
      //return;
    }
    //nvdebug(`TAG '${toField.tag}': No rule to merge indicator 1: '${toField.ind1}' vs '${fromField.ind1}', keep '${toField.ind1}'`, debugDev);
  }


  function publisherTagSwapHack(toField, fromField) {
    // NB! Note that field 264.ind2==3 maps to $efg in field 260, so it is not relevant *here*:
    // (Not sure whether our ind2 sanity check list should contain '4' (copyright year) as well:)
    if (toField.tag !== '260' || fromField.tag !== '264' || !['0', '1', '2'].includes(fromField.ind2)) {
      return;
    }
    // Field 264 IND2 contains information that can not be coded into field 260.

    // However, 260 contains data that cannot be converted to 264 as well
    if (toField.subfields.some(sf => ['e', 'f', 'g'].includes(sf.code))) {
      nvdebug(`WARNING: can not change base 260 to 264 as it contains $e, $f and/or $g. Source IND2 info lost.`, debugDev);
      nvdebug(` ${fieldToString(toField)}\n ${fieldToString(fromField)}`, debugDev);
      return;
    }

    // Convert 260 to 264 so that no information is lost:
    nvdebug(`Apply base 260->264 tag swap hack`, debugDev);
    nvdebug(` ${fieldToString(toField)}\n ${fieldToString(fromField)}`, debugDev);

    toField.tag = '264'; // eslint-disable-line functional/immutable-data
    toField.ind2 = fromField.ind2; // eslint-disable-line functional/immutable-data
  }

  function mergeIndicator2(toField, fromField, config) {
    if (toField.ind2 === fromField.ind2) {
      return; // Do nothing
    }

    //nvdebug(`Merge IND2`, debugDev);
    //nvdebug(` ${fieldToString(toField)}\n ${fieldToString(fromField)}`, debugDev);


    publisherTagSwapHack(toField, fromField); // Easter egg/hack for base-260 vs source-264

    // If source contains $9 FENNI<KEEP>, we might prefer it?

    //nvdebug(`Try to merge indicator 2: '${toField.ind2}' vs '${fromField.ind2}'`, debugDev);
    const preferredValues = getIndicatorPreferredValues(toField.tag, 2, config);

    if (preferredValues) {
      //nvdebug(`  Try to merge indicator 2. Got preferred values '${preferredValues}'`, debugDev);
      const preferredValue = getPreferredValue(preferredValues, fromField.ind2, toField.ind2);
      if (typeof preferredValue !== 'undefined') {
        toField.ind2 = preferredValue; // eslint-disable-line functional/immutable-data
        return;
      }
    }

  }

}
