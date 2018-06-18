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

export default async function (tagPattern, fields) {
	if (tagPattern instanceof RegExp && typeof fields === 'object') {
		return {
			description: 'Checks if Melinda entity references are resolvable',
			validate: async record => ({
				valid: validateRecord(record)
			})
		};
	}
	throw new Error('Error in validation parameters');

	function validateRecord(record) {
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
		const matchingTag = [...subfields].reduce((prev, current) => {
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

		matchingTag.forEach(obj => {
			if (tagPattern.test(obj.value)) {
				obj.value = obj.value.replace(tagPattern, '');
			}
		});

		console.log('matchingTag: ', matchingTag);
		return null;
	}
}
