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
import {validate as validateISBN} from 'beautify-isbn';
import validateISSN from 'issn-verify';

export default async function () {
	return {
		description: 'Validates ISSBN and ISSN values',
		validate: record => record.get(/^(020|022)$/).reduce((acc, field) => {
			if (field.tag === '020') {
				const isbn = field.subfields.find(sf => sf.code === 'a').value;

				if (!validateISBN(isbn)) {
					acc.messages.push(`ISBN ${isbn} is not valid`);
					acc.valid = false;
				}

				return acc;
			}

			const issn = field.subfields.find(sf => sf.code === 'a').value;

			if (!validateISSN(issn)) {
				acc.messages.push(`ISSN ${issn} is not valid`);
				acc.valid = false;
			}

			return acc;
		}, {valid: true, messages: []})
	};
}
