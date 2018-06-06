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

'use strict';

export default async function(tagPattern) {
	if (tagPattern instanceof RegExp) {
		return {
			description: 'Handles data fields that only differ in the first indicator',
			validate: async record => ({valid: !record.fields.some(matches)}),
			fix: async record =>
				record.fields
					.filter(matches)
					.forEach(field => record.removeField(field))
		};
	}
	throw new Error('No tagPattern provided');

	function matches(field, index, fields) {
		return (
			tagPattern.test(field.tag) && field.ind1 === ' ' && hasDuplicate(field)
		);

		function hasDuplicate(a) {
			return fields.some(
				b =>
					a !== b &&
					a.tag === b.tag &&
					a.ind1 !== b.ind1 &&
					a.subfields.length === b.subfields.length &&
					a.subfields.every(aSf =>
						b.subfields.some(
							bSf => aSf.code === bSf.code && aSf.value === bSf.value
						)
					)
			);
		}
	}
}
