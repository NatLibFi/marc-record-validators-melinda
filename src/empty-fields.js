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
import {isEmpty} from 'lodash';
// Import {isEmpty, some, valuesIn, includes} from 'lodash';

export default async function () {
	return {
		description: 'Handles empty fields',
		validate: async record => ({
			valid: validateRecord(record)
		}),
		fix: async record => (
			console.log('FIX stringify: ', JSON.stringify(record.toJsonObject(), undefined, 2))
		)
	};

	// Function emptyFields(fields) {
	// 	const state = iterateRecordObjects(fields);
	// 	return state;
	// }

	// function iterateRecordObjects(fields) {
	// 	const validation = {
	// 		controlFields: false,
	// 		subfields: some(flattenArray(fields), isEmpty),
	// 		isEmptySubfield: valuesIn(fields.map(item => isEmpty(item.subfields)))
	// 			.includes(true)
	// 	};

	// 	fields.forEach(item => {
	// 		validation.controlFields = valuesIn(item).includes('');
	// 	});

	// 	return !includes(validation, true);
	// }
	function validateRecord(record) {
		const validateObject = findEmptyValues(record).every(subfield => isEmpty(subfield));
		console.log('validateObject: ', validateObject);
		return validateObject;
	}

	function findEmptyValues(record) {
		// Const record = {fields: [{tag: 'FOO', value: 'bar'}, {tag: 'BAR', value: ''}, {tag: 'FUBAR', subfields: [{code: 'a', value: ''}]}, {tag: 'heppi', value: ''}]};
		// const filteredFields = record.fields.filter(filterFields);
		const controlFields = record.fields.filter(emptyControlFields);
		const subfieldValues = record.fields.filter(emptySubfieldValues);
		const subfieldArray = record.fields.filter(emptySubfields);
		// Console.log('controlFields: ', JSON.stringify(controlFields, undefined, 2));
		// console.log('subfields: ', JSON.stringify(subfieldArray, undefined, 2));
		// console.log('subfieldValues', JSON.stringify(subfieldValues, undefined, 2));

		function emptyControlFields(field) {
			return 'value' in field && field.value.length === 0;
		}

		function emptySubfields(field) {
			return field.subfields && field.subfields.length === 0;
		}

		function emptySubfieldValues(field) {
			return field.subfields.some(subfield => subfield.value.length === 0);
		}

		// Return 'value' in field && field.value.length === 0 ||
		// 	field.subfields &&
		// 		(field.subfields.length === 0 || field.subfields.some(
		// 			subfield => subfield.value.length === 0)
		// 		);
		return [controlFields, subfieldValues, subfieldArray];
	}

	// Function flattenArray(data) {
	// 	return data.reduce(function iter(r, a) {
	// 		if (a === null) {
	// 			return a;
	// 		}
	// 		if (Array.isArray(a)) {
	// 			return a.reduce(iter, a);
	// 		}
	// 		if (typeof a === 'object') {
	// 			return Object.keys(a).map(key => a[key]).reduce(iter, r);
	// 		}
	// 		return r.concat(a);
	// 	}, []);
	// }
}
