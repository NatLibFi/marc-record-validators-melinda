/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * MARC record validators used in Melinda
 *
 * Copyright (c) 2014-2020 University Of Helsinki (The National Library Of Finland)
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

'use strict';

import {forEach, every} from 'lodash';
import {isRegExp} from 'util';

// Tag (RegExp): Pattern to match the field's tags Mandatory
// ind1 (RegExp): Pattern to match the field's ind1 property
// ind2 (RegExp): Pattern to match the field's ind2 property
// subfields (Array<Object>): An array of objects with the following properties (Mandatory):
// // code (RegExp): Pattern to match the subfield's code Mandatory
// // value (RegExp): Pattern to match the subfield's value

// Configuration specification
const confSpec = {
	tag: { // Pattern to match the field's tags
		type: 'RegExp',
		mandatory: true
	},
	ind1: { // Pattern to match the field's ind1 property.
		type: 'RegExp' // Array<Indicator>
	},
	ind2: { // Pattern to match the field's ind2 property.
		type: 'RegExp' // Array<Indicator>
	},
	subfields: { // An array of objects with the following properties
		code: {
			type: 'RegExp',
			mandatory: true
		},
		value: {
			type: 'RegExp'
		},
		mandatory: true
	}
};

export default async function (config) {
	if (!Array.isArray(config)) {
		throw new TypeError('Configuration array not provided');
	}

	configValid(config);

	return {
		description:
			'Checks that the record does not contain the configured subfields',
		validate: async record => (
			excludeFields(record, config, false)
		),
		fix: async record =>
			excludeFields(record, config, true)
	};

	/// /////////////////////////////////////////
	// These check that configuration is valid
	function configValid(config) {
		config.forEach(obj => {
			checkMandatory(confSpec, obj);

			forEach(obj, (val, key) => {
				configMatchesSpec(val, key, confSpec);
			});
		});
	}

	// Recursive validator
	function configMatchesSpec(data, key, spec) {
		// Field not found in configuration spec
		if (!spec[key]) {
			throw new Error('Configuration not valid - unidentified value: ' + key);
		}

		// If configuration type does not match type in configuration spec
		if (typeof data !== spec[key].type &&
			(spec[key].type === 'RegExp' && !(isRegExp(data)))) {
			throw new Error('Configuration not valid - invalid data type for: ' + key);
		}

		// Check subfields recursively
		if (key === 'subfields') {
			forEach(data, subObj => {
				// Console.log("subObj: ", subObj, " type: ", typeof subObj, !(Array.isArray(subObj)))
				if (typeof subObj === 'object' && !(Array.isArray(subObj))) {
					checkMandatory(spec[key], subObj);

					forEach(subObj, (subVal, subKey) => {
						configMatchesSpec(subVal, subKey, spec[key]);
					});
				} else {
					throw new TypeError('Configuration not valid - subfield: ' + subObj + ' not object');
				}
			});
		}
	}

	function checkMandatory(spec, obj) {
		// Check if all mandatory fields are present
		forEach(spec, (val, key) => {
			if (val.mandatory && typeof (obj[key]) === 'undefined') {
				throw new Error('Configuration not valid - missing mandatory element: ' + key);
			}
		});
	}
	/// /////////////////////////////////////////

	/// /////////////////////////////////////////
	// These check that record is valid
	function excludeFields(record, conf, fix) {
		var res = {};
		res.message = [];
		res.valid = true;

		// Parse trough every element of config array
		forEach(conf, confObj => {
			var found = record.get(confObj.tag); // Find matching record fields based on mandatory tag

			// Check if some of found record fields matches all configuration fields
			forEach(found, element => {
				// Compare each found element against each configuration object
				if (every(confObj, (confField, confKey) => {
					// Tag already checked at .get(), subfields later
					if (confKey === 'tag' || confKey === 'subfields') {
						return true;
					}

					// Configuration object is RegExp and record value matches it
					if (element[confKey] && isRegExp(confField) && confField.test(element[confKey])) {
						return true;
					}

					// Configuration object not found from found element
					return false;
				})) {
					// All configuration fields match, check if some subfields should be excluded.
					forEach(confObj.subfields, subField => {
						const excluded = [];

						forEach(element.subfields, elemSub => {
							// Check if subfield matches configuration spec
							if (subField.code && elemSub.code && (subField.code.test(elemSub.code)) &&
								(typeof subField.value === 'undefined' || (subField.value && elemSub.value && (subField.value.test(elemSub.value))))) {
								if (fix) {
									excluded.push(elemSub);
								} else {
									res.message.push('Subfield $' + element.tag + '$$' + elemSub.code + 'should be excluded');
								}
							}
						});

						excluded.forEach(sf => record.removeSubfield(sf, element));
					});
				}
			});
		});

		// Fix does not send response
		if (!fix) {
			if (res.message.length > 0) {
				res.valid = false;
			}

			return res;
		}
		// Res.fix.push('Field $' + element.tag + ' excluded');
	}
	/// /////////////////////////////////////////
}
