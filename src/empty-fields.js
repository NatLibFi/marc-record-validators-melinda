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
import {find, isEmpty, omit} from 'lodash';

export default async function () {
	return {
		description: 'Handles empty fields',
		validate,
		fix
	};

	async function validate(record) {
		const result = searchFields(record);
		const isValid = result.find(obj => obj.valid === false);
		return isValid === undefined ? {valid: true, messages: []} : omit(isValid, ['field']);
	}

	async function fix(record) {
		const fixFields = searchFields(record);
		const isValid = fixFields.find(obj => obj.valid === false);

		if ('subfields' in isValid.field && !isEmpty(isValid.field.subfields)) {
			record.removeSubfield(find(isValid.field.subfields, {value: ''}), isValid.field);
		} else {
			record.removeField(isValid);
		}
	}
	function searchFields(record) {
		let validationResult;
		record.fields.forEach(obj => {
			validationResult = [emptyControlFields(obj), emptySubfieldValues(obj), emptySubfields(obj)];
		});
		return validationResult;
	}

	function emptyControlFields(field) {
		const result = 'value' in field && field.value.length === 0;
		return result === false ? {valid: true} : {valid: false, messages: [`Field ${field.tag} has empty value`], field};
	}

	function emptySubfields(field) {
		const result = field.subfields && field.subfields.length === 0;
		return result === false ? {valid: true} : {valid: false, messages: [`Field ${field.tag} has no subfields`], field};
	}

	function emptySubfieldValues(field) {
		if (field.subfields) {
			const result = field.subfields.filter(subfield => subfield.value.length === 0);
			return result.length === 0 ? {valid: true} : {valid: false, messages: result.map(item => `Field ${field.tag}$${item.code} has empty value`), field};
		}
	}
}