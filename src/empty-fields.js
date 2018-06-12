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
import 'babel-polyfill';
import {isEmpty, find} from 'lodash';

export default async function () {
	return {
		description: 'Handles empty fields',
		validate: async record => ({
			valid: validateRecord(record)
		}),
		fix: async record => (
			record.fields
				.filter(field => emptyControlFields(field) || emptySubfieldValues(field) || emptySubfields(field))
				.forEach(field => {
					if (Object.prototype.hasOwnProperty.call(field, 'subfields') && !isEmpty(field.subfields)) {
						const subfield = find(field.subfields, {value: ''});
						record.removeSubfield(subfield, field);
					} else {
						record.removeField(field);
					}
				})
		)
	};

	function validateRecord(record) {
		const controlFields = record.fields.filter(emptyControlFields);
		const subfieldValues = record.fields.filter(emptySubfieldValues);
		const subfieldArray = record.fields.filter(emptySubfields);
		const validateObject = [controlFields, subfieldValues, subfieldArray].every(subfield => isEmpty(subfield));

		return validateObject;
	}

	function emptyControlFields(field) {
		return 'value' in field && field.value.length === 0;
	}

	function emptySubfields(field) {
		return field.subfields && field.subfields.length === 0;
	}

	function emptySubfieldValues(field) {
		if (field.subfields) {
			return field.subfields.some(subfield => subfield.value.length === 0);
		}
	}
}
