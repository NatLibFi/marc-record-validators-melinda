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
import {orderBy, isEqual} from 'lodash';

export default async function (tagPattern) {
	return {
		description:
				'Handles field ordering',
		validate: async record => ({
			valid: await validate(record.fields, tagPattern)
		}),
		fix: async record => ({
			fix: await sort(record.fields, tagPattern)
		})
	};

	function validate(fields, tagPattern) {
		const original = fields;
		const sorted = sort(fields, tagPattern);
		const compareArrays = isEqual(original, sorted);
		return compareArrays ? {valid: true, messages: []} : {valid: false, messages: ['Fields are in incorrect order']};
	}

	function sort(fields, tagPattern) {
		if (tagPattern) {
			const matchingTags = fields.map((field, index) => {
				return tagPattern.some(pattern => pattern.test(field.tag)) ? {field, index} : null;
			});
			const trimmedResults = matchingTags.filter(x => x);
			return trimmedResults;
		}
		const sortedFields = orderBy(fields, ['tag']);
		return sortedFields;
	}
}
