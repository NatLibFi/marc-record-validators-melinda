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

// Import {validPuncMarks, finnishTerms, confSpec} from './ending-punctuation-conf.js';
import {validPuncMarks, validQuoteChars, finnishTerms, confSpec} from './ending-punctuation-conf.js';
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

    if (fix) {
      message.fix = [];
    }

    // Actual parsing of all fields
    if (!record.fields) {
      return false;
    }

    record.fields.forEach(field => {
      validateField(field, false, fix, message);
    });

    message.valid = !(message.message.length >= 1);
    return message;
  }
}

// Field validation with punctuation rules for normal and special cases in subfunction (to reduce complexity to please travisci)
function validateField(field, linkedTag, fix, message) {
  function getDefaultPuncMarks(tag) {
    if (tag.match(/^[1678](?:00|10|11|30)/u) || tag === '740') { // As defined in Loppupisteohje
      return `${validPuncMarks})`;
    }
    // We don't want ').' here either. However, Loppupisteohje is a bit iffy here.
    // BUG: Note that our generic rules will remove dot from Finnish terms such as https://finto.fi/yso-aika/fi/page/p1069910600
    if (['647', '648', '650', '651', '654', '655', '656', '657', '658', '662'].includes(tag)) {
       return `${validPuncMarks})`;
    }
    if(['260'].includes(tag)) {
      return `${validPuncMarks})]`;
    }
    return validPuncMarks;
  }

  // Punctuation rule (Boolean), Check no ending dot strict (Boolean)
  function normalPuncRules(subfield, punc, tag, checkEnd, overrideValidPuncMarks) {
    const puncMarks = overrideValidPuncMarks || getDefaultPuncMarks(tag);
    const lastChar = subfield.value.slice(-1);
    const lastPuncMark = puncMarks.includes(lastChar); // If string ends to punctuation char
    const lastPuncDot = '.'.includes(lastChar); // If string ends to dot
    const penultimateCharacter = subfield.value.length >= 2 ? subfield.value.charAt(subfield.value.length - 2) : undefined;
    const antePenultimateCharacter = subfield.value.length >= 3 ? subfield.value.charAt(subfield.value.length - 3) : undefined;


    // Last char should be punc, but it's not one of listed punctuation marks nor dot
    if (punc && !(lastPuncMark || lastPuncDot)) {
      //console.log(puncMarks)
      if (penultimateCharacter && validQuoteChars.includes(lastChar) && puncMarks.includes(penultimateCharacter)) {
        // Exception: do nothing! Ending in punc+quote combo is all right, and does not imply a missing punc
      }
      else {
        // Console.log("1. Invalid punctuation - missing")
        message.message.push(`Field ${tag} requires ending punctuation, ends in '${lastChar}'`);
        if (fix) {
          subfield.value = subfield.value.concat('.');
          message.fix.push(`Field ${tag} - Added punctuation to $${subfield.code}`);
        }
      }

      // Last char is dot, but previous char is one of punc marks, like 'Question?.'
    } else if (lastPuncDot && penultimateCharacter && puncMarks.includes(penultimateCharacter)) {
      // Console.log("2. Invalid punctuation - duplicate, like '?.'")
      message.message.push(`Field ${tag} has an extra dot after '${penultimateCharacter}'`);
      if (fix) {
        subfield.value = subfield.value.slice(0, -1);
        message.fix.push(`Field ${tag} - Removed dot after punctuation from $${subfield.code}`);
      }
      // Last char is dot, but previous two cars are punc+quote, like 'Lorum "Ipsum.".'
    } else if (lastPuncDot && antePenultimateCharacter && validQuoteChars.includes(penultimateCharacter) && puncMarks.includes(antePenultimateCharacter)) {
      message.message.push(`Field ${tag} has an extra dot in '${antePenultimateCharacter}${penultimateCharacter}${lastChar}'`);
      if (fix) {
        subfield.value = subfield.value.slice(0, -1);
        message.fix.push(`Field ${tag} - Removed '${lastChar}' after '${antePenultimateCharacter}${penultimateCharacter}'`);
      }
      // Last char shouldn't be dot !! This is behind checkEnd boolean, because of dots at end of abbreviations, so this is checked only in special cases !!//
    } else if (checkEnd && (!punc && lastPuncDot)) {
      // Console.log("3. Invalid punctuation - Shouldn't be dot, is")
      message.message.push(`Field ${tag} has unwanted ending punctuation '${lastChar}'`);
      if (fix) {
        subfield.value = subfield.value.slice(0, -1);
        message.fix.push(`Field ${tag} - Removed punctuation from $${subfield.code}`);
      }
    }
  }

  // Special cases from here on
  function specialCases(res, field, tag) {
    let lastSubField = null;
    // Punctuation should be only after specific field
    if (res.special.afterOnly) {
      lastSubField = findLastSubfield(field);

      if (lastSubField) {
        if (typeof res.special.strict === 'undefined') {
          res.special.strict = true;
        }

        if (lastSubField.code === res.special.afterOnly) {
          normalPuncRules(lastSubField, res.punc, tag, res.special.strict, false);
        } else {
          normalPuncRules(lastSubField, !res.punc, tag, true, false);
        }
      }
    } else if (res.special.noPuncIfField) {
      if (field.subfields.some(subField => subField.code === res.special.noPuncIfField) === false) {
        lastSubField = findLastSubfield(field);
        normalPuncRules(lastSubField, res.punc, tag, true, false);
      }
    } else if (res.special.ifBoth) {
      lastSubField = findLastSubfield(field);
      if (lastSubField && lastSubField.code === res.special.puncSubField) {
        // Ind2 match, check second if at punc rules with special punc char override
        if (res.special.ifInd2 && res.special.ifInd2.includes(field.ind2)) {
          normalPuncRules(lastSubField, res.special.ifBoth, tag, true, res.special.ifLastCharNot);

          // Matches exception to special rule, noPuncIfInd2 (likely with value 4, that indicates copyright mark)
        } else if (res.special.noPuncIfInd2 && field.ind2 && res.special.noPuncIfInd2.includes(field.ind2)) {
          normalPuncRules(lastSubField, !res.special.ifBoth, tag, true, res.special.ifLastCharNot);

          // Does not match rules -> shouldn't have punc
        } else {
          normalPuncRules(lastSubField, !res.special.ifBoth, tag, true, res.special.ifLastCharNot);
        }
      }
    } else if (res.special.secondLastIfLast) {
      field.subfields.forEach(subField => {
        if (isNaN(subField.code) && res.special.secondLastIfLast !== subField.code) {
          lastSubField = subField;
        } // Not control field

        if (typeof res.special.last !== 'undefined' && res.special.secondLastIfLast === subField.code) {
          normalPuncRules(subField, res.special.last, tag, true, false);
        } // Strict because this field should not be abbreviation
      });
      normalPuncRules(lastSubField, res.punc, tag, false, false);

      // Search for Finnish terms
    } else if (res.special.termSubfieldCode) {
      lastSubField = findLastSubfield(field);

      if (lastSubField) {
        const lexicon = getLexicon(field, res.special.termSubfieldCode);
        const proceed = !finnishException(field, res.special.termSubfieldCode, false);


        //const languageField = field.subfields.find(({code}) => code === res.special.termSubfieldCode);
        //if (languageField && languageField.value && finnishTerms.some(p => p.test(languageField.value))) {
        if (lexicon && finnishTerms.some(p => p.test(lexicon)) && proceed) {
          // If (languageField && languageField.value && finnishTerms.indexOf(languageField.value) > -1) {
          normalPuncRules(lastSubField, res.punc, tag, true, false);
        } else {
          normalPuncRules(lastSubField, res.special.else, tag, false, false); // Strict because of years etc (648, 650)
        }
      }
      // Search last of array in subfields and check if it has punc
    } else if (res.special.lastOf) {
      lastSubField = null;
      field.subfields.filter(subField => 'value' in subField).forEach(subField => {
        if (isNaN(subField.code) && res.special.lastOf.indexOf(subField.code) > -1) {
          lastSubField = subField;
        } // Not control field

        if (res.special.mandatory && res.special.mandatory.indexOf(subField.code) > -1) {
          normalPuncRules(subField, res.punc, tag, true, false);
        } // Strict because of mandatory
      });

      if (lastSubField) {
        normalPuncRules(lastSubField, res.punc, tag, false, false);
      }

      // If field has linked rules (tag: 880), find rules and re-validate
    } else if (res.special.linked) {
      let linkedTag = null;
      try {
        linkedTag = parseInt(field.subfields.find(({code}) => code === res.special.linked).value.substr(0, 3), 10); // Substring feels stupid, but is used in MarcRecord to extract tag.
      } catch (err) {
        debug(`Got error while parsing tag: ${err instanceof Error ? err.stack : err}`);
        return false;
      }

      validateField(field, linkedTag, fix, message);
    }
    // fallback
    else {
      debug(`special is definedm but no rule applies`);
      const lastSubField = findLastSubfield(field);

      if (lastSubField) {
        normalPuncRules(lastSubField, res.punc, field.tag, false, false, fix, message);
      }
    }
  }

  let res = null;
  let tag = null;
  let lastSubField = null;

  if (linkedTag) {
    tag = linkedTag;
  } else {
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
    message.message.push(`Field ${field.tag} has invalid ending punctuation`);
    return;
  }

  const forceNormal = res.special ? finnishException(field, res.special.termSubfieldCode, true) : false;
  // Normal rules
  if (typeof res.special === 'undefined' || res.special === null || forceNormal) {
    if (forceNormal) {
      console.info("EXCEPTION. SKIP FINNISH RULES");
    }
    lastSubField = findLastSubfield(field);

    if (lastSubField) {
      normalPuncRules(lastSubField, res.punc, field.tag, false, false, fix, message);
    }
  } else {
    try {
      specialCases(res, field, field.tag);
    } catch (e) {
      console.error('Catched error from special case: ', e); // eslint-disable-line no-console
    }
  }
}

export function validateSingleField(field, linkedTag, fix) {
  const message = {};
  message.message = [];
  if (fix) {
    message.fix = [];
  }

  validateField(field, linkedTag, fix, message);
  message.valid = !(message.message.length >= 1);
  return message;
}

function getLexicon(field, subfieldCode) {
  const languageSubfield = field.subfields.find(({code}) => code === subfieldCode); // res.special.termSubfieldCode);
  if (!languageSubfield || !languageSubfield.value) {
    return undefined;
  }
  if (finnishTerms.find(p => p.test(languageSubfield.value))) {
    return languageSubfield.value;
  }
  return undefined;
}

function finnishException(field, termSubfieldCode, hasDot = true) {
  const lexicon = getLexicon(field, termSubfieldCode);
  if (!lexicon) {
    return false;
  }

  const lastSubfield = findLastSubfield(field);
  if (!lastSubfield || !lastSubfield.value) {
    return false;
  }
  // Some terms can end in '.' that we want to keep
  if (field.tag === '648') { // Yso-aika checks
    //console.log(`Finnish Exception? '${lastSubfield.value}', '${lexicon}', '${field.tag}'`);
    if (lexicon === 'yso/fin') { // 'eaa.' appears in prefLAbels and 'eKr.' in altLabels
      if (hasDot) {
        return lastSubfield.value.match(/ (?:eaa|[ej]Kr|jaa)\.$/u); // Finnish term from which the dot is not to be removed
      }
      return lastSubfield.value.match(/ (?:eaa|[ej]Kr)|jaa$/u); // Finnish word that needs a dot
    }

    if (lexicon === 'yso/swe') {
      if (hasDot) {
        return lastSubfield.value.match(/ (?:[ef]\.Kr|f\.v\.t)\.$/u);
      }
      return lastSubfield.value.match(/ (?:[ef]\.Kr|f\.v\.t)$/u);
    }
  }
  // yso has 'MODEL.LA.' and 'Corel R.A.V.E.' but these are so rare I'm not listing them

  return false;
}

  // This is used to find last subfield that should have punctuation
  function findLastSubfield(field) {
    const subfields = field.subfields.filter(sf => isNaN(sf.code) && 'value' in sf);
    return subfields.slice(-1).shift();
  }