/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * MARC record validators used in Melinda
 *
 * Copyright (c) 2014-2019 University Of Helsinki (The National Library Of Finland)
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
import {orderBy, isEqual, reject} from 'lodash';

export default async function (tagPattern) {
	return {
		description:
				'Handles field ordering',
		validate,
		fix: async record => ({
			fix: await sort(record, tagPattern)
		})
	};

	async function validate(record, tagPattern) {
		const compareArrays = isEqual(record.fields, await sort(record.fields, tagPattern));
		return compareArrays ? {valid: true, messages: []} : {valid: false, messages: ['Fields are in incorrect order']};
	}

	function sort(record, tagPattern) {
		if (tagPattern) {
			return sortPatternFields(record, tagPattern);
		}

		return sortFields(record);
	}
}

function sortPatternFields(record, tagPattern) {
	const matchingTags = record.fields.map(field => {
		return tagPattern.some(pattern => pattern.test(field.tag)) ? field : null;
	}).filter(tag => tag);
	const sortedArray = sortFields(record.fields);
	const fixedArray = reject(sortedArray, (field => tagPattern.some(pattern => pattern.test(field.tag))));
	fixedArray.splice(index(sortedArray, tagPattern), 0, ...matchingTags);
	record.fields = fixedArray;
}

function sortFields(fields) {
	return orderBy(fields, ['tag']);
}

function index(fields, tagPattern) {
	return fields.findIndex(field => {
		return tagPattern.some(pattern => pattern.test(field.tag));
	});
}
