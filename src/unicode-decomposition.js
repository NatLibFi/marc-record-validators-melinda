/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * Melinda-related validators for @natlibfi/marc-record-validate
 *
 * Copyright (c) 2014-2017 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of marc-record-validators-melinda
 *
 * marc-record-validators-melinda is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
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
 **/

import {MAP_CONVERSION, modifySubfields} from './utils/unicodes';

export default async function () {
	const PATTERN = Object.keys(MAP_CONVERSION).reduce((result, key, index, list) => {
		return index === list.length - 1 ? new RegExp(`${result}${key})`) : `${result}${key}|`;
	}, '(');

	return {
		description: 'Unicode decomposer',
		validate,
		fix
	};

	async function validate(record) {
		const codes = getFields(record.fields).map(field => {
			if ('subfields' in field) {
				return field.subfields.filter(subfield => PATTERN.test(subfield.value))
					.map(subfield => subfield.code);
			}
			return null;
		});
		const messages = codes.join(', ');

		return codes.length < 1 ? {valid: true, messages: []} : {valid: false, messages: [`The following subfields are not properly decomposed: ${messages}`]};
	}

	async function fix(record) {
		return getFields(record.fields).map(field => {
			return modifySubfields(field, subfield => {
				if (PATTERN.test(subfield.value)) {
					subfield.value = convert(subfield.value);
				}
			});
		});
	}

	function getFields(fields) {
		return fields.filter(field => {
			if ('subfields' in field) {
				return field.subfields.some(subfield => PATTERN.test(subfield.value));
			}
			return null;
		});
	}
	function convert(value) {
		return Object.keys(MAP_CONVERSION).reduce((result, key) => {
			return result.includes(key) ? result.replace(new RegExp(key, 'g'), MAP_CONVERSION[key]) : result;
		}, value);
	}
}
