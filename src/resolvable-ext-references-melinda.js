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

import {parseString} from 'xml2js';
import fetch from 'node-fetch';
import {last} from 'lodash';

export default async function ({endpoint, prefixPattern, fields}) {
	if (typeof endpoint === 'string' && prefixPattern instanceof RegExp && typeof fields === 'object') {
		return {
			description: 'Checks if Melinda entity references are resolvable',
			validate: async record => ({
				valid: await validate(record),
				messages: await errorMessages(record)
			})
		};
	}
	throw new Error('Error in validation parameters');

	async function validate(record) {
		const validateResult = await validateRecord(record);
		console.log('validateResult.valid: ', validateResult.valid);
		return validateResult.valid;
	}

	async function errorMessages(record) {
		console.log('errorMessages function call');
		const validateResult = await validateRecord(record);
		console.log('validateResult.messages: ', validateResult.messages);
		return validateResult.messages;
	}

	function validateRecord(record) {
		const removedPrefixes = [];

		// Filter matching field keys from record.fields
		const subfields = record.fields.filter(item => item.subfields)
			.reduce((prev, current) => {
				Object.keys(fields).forEach(key => {
					if (key === current.tag) {
						prev.push(current);
					}
				});
				return prev;
			}, []);

		// Filter matching objects from subfields
		const matchingTags = [...subfields].reduce((prev, current) => {
			Object.keys(fields).forEach(key => {
				if (key === current.tag) {
					current.subfields.filter(item => {
						if (Object.values(fields[key]).filter(value => value === item.code)[0]) {
							prev.push(item);
						}
						return prev;
					});
				}
			});
			return prev;
		}, []);

		// Matching prefixPattern is removed from object value field.
		matchingTags.forEach(obj => {
			if (prefixPattern.test(obj.value)) {
				obj.value = obj.value.replace(prefixPattern, '');
				removedPrefixes.push(obj);
			}
		});
		// If matching prefixPatterns found make an API call
		if (removedPrefixes.length > 0) {
			return validateMatchingTags(removedPrefixes).then(result => {
				console.log('then: ', result);
				return result;
			});
		}
	}

	async function validateMatchingTags(tags) {
		const result = await Promise.all(tags.map(obj => getData(obj.value)));
		const response = {valid: false, messages: []};
		if (result.some(value => value === false)) {
			response.messages.push('error message');
		}
		if (result.every(value => value === true)) {
			response.valid = true;
		}
		console.log('response: ', response);
		return response;
	}

	async function getData(recID) {
		const queryParam = '?operation=searchRetrieve&maximumRecords=2&version=1&query=rec.id=';

		const response = await fetch(`${endpoint}${queryParam}${recID}`);

		return new Promise(async resolve => {
			parseString(await response.text(), (err, result) => {
				const record = last(result['zs:searchRetrieveResponse']['zs:records']);
				const position = parseInt(last(record['zs:record'])['zs:recordPosition'][0], 10);
				resolve(position === 1 && !err);
			});
		});
	}
}

