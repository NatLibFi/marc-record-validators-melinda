/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* MARC record validators used in Melinda
*
* Copyright (C) 2014-2018 University Of Helsinki (The National Library Of Finland)
*
* This file is part of marc-record-validators-melinda
*
* marc-record-validators-melinda program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* marc-record-validators-melinda is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

/* eslint-disable require-await */
'use strict';
import {find} from 'lodash';
// Import {validPuncMarks, finnishTerms, confSpec} from './ending-punctuation-conf.js';
import {validPuncMarks, finnishTerms, confSpec} from './ending-punctuation-conf';

export default async function () {
	return {
		description:
		'Checks whether punctuation is valid',
		validate: async record => (
			validatePunc(record, false) // Record (Object), fix (boolean)
		),
		fix: async record => (
			validatePunc(record, true) // Record (Object), fix (boolean)
		)
	};

	// This is used to validate record against configuration
	function validatePunc(record, fix) {
		const message = {};

		message.message = [];
		if (fix) {
			message.fix = [];
		}

		// Actual parsing of all fields
		if (!record.fields) {
			return false;
		}
		record.fields.forEach(field => {
			validateField(field);
		});

		message.valid = !(message.message.length >= 1);
		return message;

		// This is used to find last subfield that should have punctuation
		function findLastSubfield(field) {
			return field.subfields.filter(sf => isNaN(sf.code)).slice(-1).shift();
		}

		// Punctuation rule (Boolean), Check no ending dot strict (Boolean)
		function normalPuncRules(subfield, punc, tag, checkEnd) {
			const lastPuncMark = validPuncMarks.includes(subfield.value.slice(-1)); // If string ends to punctuation char
			const lastPuncDot = '.'.includes(subfield.value.slice(-1)); // If string ends to dot

			// Last char should be punc, but its not either one of marks nor dot
			if (punc && !(lastPuncMark || lastPuncDot)) {
				// Console.log("1. Invalid punctuation - missing")
				message.message.push('Field ' + tag + ' has invalid ending punctuation');
				if (fix) {
					subfield.value = subfield.value.concat('.');
					message.fix.push('Field ' + tag + ' - Added punctuation to $' + subfield.code);
				}
				// Last char is dot, but previous char is one of punc marks, like 'Question?.'
			} else if (lastPuncDot && validPuncMarks.includes(subfield.value.charAt(subfield.value.length - 2))) {
				// Console.log("2. Invalid punctuation - duplicate, like '?.'")
				message.message.push('Field ' + tag + ' has invalid ending punctuation');
				if (fix) {
					subfield.value = subfield.value.slice(0, -1);
					message.fix.push('Field ' + tag + ' - Removed double punctuation from $' + subfield.code);
				}
				// Last char shouldn't be dot !! This is behind checkEnd boolean, because of dots at end of abbreviations, so this is checked only in special cases !!//
			} else if (checkEnd && (!punc && lastPuncDot)) {
				// Console.log("3. Invalid punctuation - Shouldn't be dot, is")
				message.message.push('Field ' + tag + ' has invalid ending punctuation');
				if (fix) {
					subfield.value = subfield.value.slice(0, -1);
					message.fix.push('Field ' + tag + ' - Removed punctuation from $' + subfield.code);
				}
			}
		}

		// Special cases from here on
		function specialCases(res, field, tag) {
			let lastSubField = null;
			// Punctuation should be only after specific field
			if (res.special.afterOnly) {
				lastSubField = findLastSubfield(field);
				if (typeof (res.special.strict) === 'undefined') { // Just to be safe
					res.special.strict = true;
				}

				if (lastSubField.code === res.special.afterOnly) {
					normalPuncRules(lastSubField, res.punc, tag, res.special.strict);
				} else {
					normalPuncRules(lastSubField, !res.punc, tag, true);
				}

				// Rules if last, some subrules
			} else if (res.special.ifLast) {
				lastSubField = findLastSubfield(field);

				// IF `ind2 === '4'` check punc at $b, $c should not have punc if it has ©
				if (res.special.ind && field.ind2 === res.special.ind) {
					// Extra dot at the end of $c ('© 1974.'), which should be only copyright year
					const lastPuncDot = '.'.includes(lastSubField.value.slice(-1)); // If string ends to dot
					if (lastSubField.value.includes('©') && lastPuncDot) {
						message.message.push('Field ' + tag + ' has invalid ending punctuation');
						if (fix) {
							lastSubField.value = lastSubField.value.slice(0, -1);
							message.fix.push('Field ' + tag + ' - Removed punctuation from $' + lastSubField.code);
						}
					}

					// Checked field is actually $b
					lastSubField = find(field.subfields, {code: 'b'});

					if (lastSubField) {
						normalPuncRules(lastSubField, res.punc, tag, false); // Punctuation rule (Boolean), Check no ending dot strict (Boolean)
					}
					// Otherwise normal punc rules
				} else {
					normalPuncRules(lastSubField, res.punc, tag, false);
				} // Punctuation rule (Boolean), Check no ending dot strict (Boolean)

				// Second last
			} else if (res.special.secondLastIfLast) {
				field.subfields.forEach(subField => {
					if (isNaN(subField.code) && res.special.secondLastIfLast !== subField.code) {
						lastSubField = subField;
					} // Not control field
					if (typeof (res.special.last) !== 'undefined' && res.special.secondLastIfLast === subField.code) {
						normalPuncRules(subField, res.special.last, tag, true);
					} // Strict because this field should not be abbreviation
				});
				normalPuncRules(lastSubField, res.punc, tag, false);

				// Search for Finnish terms
			} else if (res.special.termField) {
				lastSubField = findLastSubfield(field);
				const languageField = find(field.subfields, {code: res.special.termField});
				if (languageField && languageField.value && finnishTerms.indexOf(languageField.value) > -1) {
					normalPuncRules(lastSubField, res.punc, tag, true);
				} else {
					normalPuncRules(lastSubField, res.special.else, tag, false); // Strict because of years etc (648, 650)
				}

				// Search last of array in subfields and check if it has punc
			} else if (res.special.lastOf) {
				lastSubField = null;
				field.subfields.forEach(subField => {
					if (isNaN(subField.code) && res.special.lastOf.indexOf(subField.code) > -1) {
						lastSubField = subField;
					} // Not control field
					if (res.special.mandatory && res.special.mandatory.indexOf(subField.code) > -1) {
						normalPuncRules(subField, res.punc, tag, true);
					} // Strict because of mandatory
				});

				if (lastSubField) {
					normalPuncRules(lastSubField, res.punc, tag, false);
				}

				// If field has linked rules (tag: 880), find rules and re-validate
			} else if (res.special.linked) {
				let linkedTag = null;
				try {
					linkedTag = parseInt(find(field.subfields, {code: res.special.linked}).value.substr(0, 3), 10); // Substring feels stupid, but is used in MarcRecord to extract tag.
				} catch (e) {
					return false;
				}
				validateField(field, linkedTag);
			}
		}

		// Field validation with punctuation rules for normal and special cases in subfunction (to reduce complexity to please travisci)
		function validateField(field, linkedTag) {
			let res = null;

			let tag = null;

			let lastSubField = null;

			if (linkedTag) {
				tag = linkedTag;
			} else {
				try {
					tag = parseInt(field.tag, 10);
				} catch (e) {
					return false;
				}
			}

			// Find configuration object matching tag:
			res = find(confSpec, o => {
				return o.index === tag || (o.rangeStart <= tag && o.rangeEnd >= tag);
			});

			if (!res) {
				return;
			} // Configuration not found, pass field without error

			// Field does not have subfields; invalid
			if (typeof (field.subfields) === 'undefined' || field.subfields === null) {
				message.message.push('Field ' + field.tag + ' has invalid ending punctuation');
				return;
			}

			// Normal rules
			if (typeof (res.special) === 'undefined' || res.special === null) {
				lastSubField = findLastSubfield(field);

				if (lastSubField) {
					normalPuncRules(lastSubField, res.punc, field.tag, false);
				}				
			} else {
				specialCases(res, field, field.tag);
			}
		}
	}
}
