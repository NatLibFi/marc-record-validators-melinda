/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* MARC record validators used in Melinda
*
* Copyright (c) 2014-2020 University Of Helsinki (The National Library Of Finland)
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

import ISBN from 'isbn3';
import validateISSN from '@natlibfi/issn-verify';

export default async ({hyphenateISBN = false, handleInvalid = false} = {}) => {
	return {
		validate, fix,
		description: 'Validates ISBN and ISSN values'
	};

	function getInvalidFields(record) {
		return record.get(/^(020|022)$/).filter(field => {
			if (field.tag === '020') {
				const subfield = field.subfields.find(sf => sf.code === 'a');
				const sfZ = field.subfields.find(sf => sf.code === 'z');

				if (subfield === undefined) {
					if (sfZ) {
						return false;
					}

					return true;
				}

				// If value contains space
				if (subfield.value.indexOf(' ') > -1) {
					return true;
				}

				const auditedIsbn = ISBN.audit(subfield.value);
				if (!auditedIsbn.validIsbn) {
					return true;
				}

				const parsedIsbn = ISBN.parse(subfield.value);
				if (hyphenateISBN) {
					return subfield.value !== parsedIsbn.isbn13h;
				}

				return subfield.value !== parsedIsbn.isbn13;
			}

			const subfield = field.subfields.find(sf => sf.code === 'a' || sf.code === 'l');
			const sfY = field.subfields.find(sf => sf.code === 'y');

			if (subfield === undefined) {
				if (sfY) {
					return false;
				}

				return true;
			}

			return !validateISSN(subfield.value);
		});
	}

	async function validate(record) {
		const fields = getInvalidFields(record);

		if (fields.length === 0) {
			return {valid: true};
		}

		return fields
			.map(field => {
				if (field.tag === '020') {
					const sfvalue = field.subfields.find(sf => sf.code === 'a');
					if (sfvalue) {
						return {name: 'ISBN', value: sfvalue.value};
					}

					return {name: 'ISBN', value: undefined};
				}

				return {name: 'ISSN', value: getISSN()};

				function getISSN() {
					const result = field.subfields.find(sf => {
						return sf.code === 'a' || sf.code === 'l';
					});

					if (result) {
						return result.value;
					}

					return undefined;
				}
			})
			.reduce((acc, obj) => {
				const {name, value} = obj;
				const msg = `${name} (${value}) is not valid`;

				return {...acc, messages: acc.messages.concat(msg)};
			}, {valid: false, messages: []});
	}

	async function fix(record) {
		getInvalidFields(record).forEach(field => {
			if (field.tag === '020') {
				const subfield = field.subfields.find(sf => sf.code === 'a');
				if (subfield) {
					// ISBN is valid but is missing hyphens
					const trimmedValue = trimSpaces(subfield.value);
					const auditResult = ISBN.audit(trimmedValue);
					if (auditResult.validIsbn) {
						const parsedIsbn = ISBN.parse(trimmedValue);
						if (hyphenateISBN) {
							subfield.value = parsedIsbn.isbn13h;
						} else {
							// Just trim
							subfield.value = parsedIsbn.isbn13;
						}
					} else if (handleInvalid) {
						field.subfields.push({code: 'z', value: trimmedValue});
						record.removeSubfield(subfield, field);
					}
				}
			} else {
				const subfield = field.subfields.find(sf => sf.code === 'a' || sf.code === 'l');
				if (subfield && handleInvalid) {
					field.subfields.push({code: 'y', value: trimSpaces(subfield.value)});
					record.removeSubfield(subfield, field);
				}
			}
		});

		function trimSpaces(value) {
			return value.replace(/\s/gu, '');
		}
	}
};
