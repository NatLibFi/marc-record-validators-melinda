/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* MARC record validators used in Melinda
*
* Copyright (c) 2014-2021 University Of Helsinki (The National Library Of Finland)
*
* This file is part of marc-record-validators-melinda
*
* marc-record-validators-melinda program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* marc-record-validators-melinda is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

/* eslint-disable complexity, max-params */


// Import {validPuncMarks, finnishTerms, confSpec} from './ending-punctuation-conf.js';
import {validPuncMarks, finnishTerms, confSpec} from './ending-punctuation-conf';
import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/marc-record-validator-melinda/ending-punctuation');

export default function () {
  return {
    description:
      'Handles invalid ending punctuation',
    validate: record => validatePunc(record, false), // Record (Object), fix (boolean)
    fix: record => validatePunc(record, true) // Record (Object), fix (boolean)

  };

  // This is used to validate record against configuration
  function validatePunc(record, fix) {
    const message = {message: []};

    if (fix) { // eslint-disable-line functional/no-conditional-statements
      message.fix = []; // eslint-disable-line functional/immutable-data
    }

    // Actual parsing of all fields
    if (!record.fields) {
      return false;
    }

    record.fields.forEach(field => {
      validateField(field, false, fix, message);
    });

    message.valid = !(message.message.length >= 1); // eslint-disable-line functional/immutable-data
    return message;
  }
}

// Field validation with punctuation rules for normal and special cases in subfunction (to reduce complexity to please travisci)
function validateField(field, linkedTag, fix, message) {
  // This is used to find last subfield that should have punctuation
  function findLastSubfield(field) {
    const subfields = field.subfields.filter(sf => isNaN(sf.code) && 'value' in sf);
    return subfields.slice(-1).shift();
  }

  // Punctuation rule (Boolean), Check no ending dot strict (Boolean)
  function normalPuncRules(subfield, punc, tag, checkEnd, overrideValidPuncMarks) {
    const puncMarks = overrideValidPuncMarks || validPuncMarks;
    const lastPuncMark = puncMarks.includes(subfield.value.slice(-1)); // If string ends to punctuation char
    const lastPuncDot = '.'.includes(subfield.value.slice(-1)); // If string ends to dot

    // Last char should be punc, but its not one of marks nor dot
    if (punc && !(lastPuncMark || lastPuncDot)) {
      // Console.log("1. Invalid punctuation - missing")
      message.message.push(`Field ${tag} has invalid ending punctuation`); // eslint-disable-line functional/immutable-data
      if (fix) { // eslint-disable-line functional/no-conditional-statements
        subfield.value = subfield.value.concat('.'); // eslint-disable-line functional/immutable-data
        message.fix.push(`Field ${tag} - Added punctuation to $${subfield.code}`); // eslint-disable-line functional/immutable-data
      }

      // Last char is dot, but previous char is one of punc marks, like 'Question?.'
    } else if (lastPuncDot && subfield.value.length > 1 && puncMarks.includes(subfield.value.charAt(subfield.value.length - 2))) {
      // Console.log("2. Invalid punctuation - duplicate, like '?.'")
      message.message.push(`Field ${tag} has invalid ending punctuation`); // eslint-disable-line functional/immutable-data
      if (fix) { // eslint-disable-line functional/no-conditional-statements
        subfield.value = subfield.value.slice(0, -1); // eslint-disable-line functional/immutable-data
        message.fix.push(`Field ${tag} - Removed double punctuation from $${subfield.code}`); // eslint-disable-line functional/immutable-data
      }

      // Last char shouldn't be dot !! This is behind checkEnd boolean, because of dots at end of abbreviations, so this is checked only in special cases !!//
    } else if (checkEnd && (!punc && lastPuncDot)) {
      // Console.log("3. Invalid punctuation - Shouldn't be dot, is")
      message.message.push(`Field ${tag} has invalid ending punctuation`); // eslint-disable-line functional/immutable-data
      if (fix) { // eslint-disable-line functional/no-conditional-statements
        subfield.value = subfield.value.slice(0, -1); // eslint-disable-line functional/immutable-data
        message.fix.push(`Field ${tag} - Removed punctuation from $${subfield.code}`); // eslint-disable-line functional/immutable-data
      }
    }
  }

  // Special cases from here on
  function specialCases(res, field, tag) {
    let lastSubField = null; // eslint-disable-line functional/no-let
    // Punctuation should be only after specific field
    if (res.special.afterOnly) {
      lastSubField = findLastSubfield(field);

      if (lastSubField) {
        if (typeof res.special.strict === 'undefined') { // eslint-disable-line functional/no-conditional-statements
          res.special.strict = true; // eslint-disable-line functional/immutable-data
        }

        if (lastSubField.code === res.special.afterOnly) { // eslint-disable-line functional/no-conditional-statements
          normalPuncRules(lastSubField, res.punc, tag, res.special.strict, false);
        } else { // eslint-disable-line functional/no-conditional-statements
          normalPuncRules(lastSubField, !res.punc, tag, true, false);
        }
      }
    } else if (res.special.noPuncIfField) {
      if (field.subfields.some(subField => subField.code === res.special.noPuncIfField) === false) { // eslint-disable-line functional/no-conditional-statements
        lastSubField = findLastSubfield(field);
        normalPuncRules(lastSubField, res.punc, tag, true, false);
      }
    } else if (res.special.ifBoth) {
      lastSubField = findLastSubfield(field);
      if (lastSubField && lastSubField.code === res.special.puncSubField) {
        // Ind2 match, check second if at punc rules with special punc char override
        if (res.special.ifInd2 && res.special.ifInd2.includes(field.ind2)) { // eslint-disable-line functional/no-conditional-statements
          normalPuncRules(lastSubField, res.special.ifBoth, tag, true, res.special.ifLastCharNot);

          // Matches execption to special rule, noPuncIfInd2 (likely with value 4, that indicates copyright mark)
        } else if (res.special.noPuncIfInd2 && field.ind2 && res.special.noPuncIfInd2.includes(field.ind2)) { // eslint-disable-line functional/no-conditional-statements
          normalPuncRules(lastSubField, !res.special.ifBoth, tag, true, res.special.ifLastCharNot);

          // Does not match rules -> shouldn't have punc
        } else { // eslint-disable-line functional/no-conditional-statements
          normalPuncRules(lastSubField, !res.special.ifBoth, tag, true, res.special.ifLastCharNot);
        }
      }
    } else if (res.special.secondLastIfLast) { // eslint-disable-line functional/no-conditional-statements
      field.subfields.forEach(subField => {
        if (isNaN(subField.code) && res.special.secondLastIfLast !== subField.code) { // eslint-disable-line functional/no-conditional-statements
          lastSubField = subField;
        } // Not control field

        if (typeof res.special.last !== 'undefined' && res.special.secondLastIfLast === subField.code) { // eslint-disable-line functional/no-conditional-statements
          normalPuncRules(subField, res.special.last, tag, true, false);
        } // Strict because this field should not be abbreviation
      });
      normalPuncRules(lastSubField, res.punc, tag, false, false);

      // Search for Finnish terms
    } else if (res.special.termField) {
      lastSubField = findLastSubfield(field);

      if (lastSubField) {
        const languageField = field.subfields.find(({code}) => code === res.special.termField);
        if (languageField && languageField.value && finnishTerms.some(p => p.test(languageField.value))) { // eslint-disable-line functional/no-conditional-statements
          // If (languageField && languageField.value && finnishTerms.indexOf(languageField.value) > -1) {
          normalPuncRules(lastSubField, res.punc, tag, true, false);
        } else { // eslint-disable-line functional/no-conditional-statements
          normalPuncRules(lastSubField, res.special.else, tag, false, false); // Strict because of years etc (648, 650)
        }
      }
      // Search last of array in subfields and check if it has punc
    } else if (res.special.lastOf) {
      lastSubField = null;
      field.subfields.filter(subField => 'value' in subField).forEach(subField => {
        if (isNaN(subField.code) && res.special.lastOf.indexOf(subField.code) > -1) { // eslint-disable-line functional/no-conditional-statements
          lastSubField = subField;
        } // Not control field

        if (res.special.mandatory && res.special.mandatory.indexOf(subField.code) > -1) { // eslint-disable-line functional/no-conditional-statements
          normalPuncRules(subField, res.punc, tag, true, false);
        } // Strict because of mandatory
      });

      if (lastSubField) { // eslint-disable-line functional/no-conditional-statements
        normalPuncRules(lastSubField, res.punc, tag, false, false);
      }

      // If field has linked rules (tag: 880), find rules and re-validate
    } else if (res.special.linked) { // eslint-disable-line functional/no-conditional-statements
      let linkedTag = null; // eslint-disable-line functional/no-let
      try {
        linkedTag = parseInt(field.subfields.find(({code}) => code === res.special.linked).value.substr(0, 3), 10); // Substring feels stupid, but is used in MarcRecord to extract tag.
      } catch (err) {
        debug(`Got error while parsing tag: ${err instanceof Error ? err.stack : err}`);
        return false;
      }

      validateField(field, linkedTag, fix, message);
    }
  }

  let res = null; // eslint-disable-line functional/no-let
  let tag = null; // eslint-disable-line functional/no-let
  let lastSubField = null; // eslint-disable-line functional/no-let

  if (linkedTag) { // eslint-disable-line functional/no-conditional-statements
    tag = linkedTag;
  } else { // eslint-disable-line functional/no-conditional-statements
    try {
      tag = parseInt(field.tag, 10);
    } catch (err) {
      debug(`Got error while parsing tag: ${err instanceof Error ? err.stack : err}`);
      return false;
    }
  }

  // Find configuration object matching tag:
  res = Object.values(confSpec).find(o => {
    const rangeFine = o.rangeStart <= tag && o.rangeEnd >= tag;
    return o.index === tag || rangeFine;
  });

  if (!res) {
    return;
  } // Configuration not found, pass field without error

  // Field does not have subfields; invalid
  if (typeof field.subfields === 'undefined' || field.subfields === null) {
    message.message.push(`Field ${field.tag} has invalid ending punctuation`); // eslint-disable-line functional/immutable-data
    return;
  }

  // Normal rules
  if (typeof res.special === 'undefined' || res.special === null) {
    lastSubField = findLastSubfield(field);

    if (lastSubField) { // eslint-disable-line functional/no-conditional-statements
      normalPuncRules(lastSubField, res.punc, field.tag, false, false, fix, message);
    }
  } else { // eslint-disable-line functional/no-conditional-statements
    try {
      specialCases(res, field, field.tag);
    } catch (e) {
      console.error('Catched error from special case: ', e); // eslint-disable-line no-console
    }
  }
}

export function validateSingleField(field, linkedTag, fix) {
  const message = {};
  message.message = []; // eslint-disable-line functional/immutable-data
  if (fix) { // eslint-disable-line functional/no-conditional-statements
    message.fix = []; // eslint-disable-line functional/immutable-data
  }

  validateField(field, linkedTag, fix, message);
  message.valid = !(message.message.length >= 1); // eslint-disable-line functional/immutable-data
  return message;
}

