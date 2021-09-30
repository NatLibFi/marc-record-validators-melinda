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

'use strict';

import fetch from 'node-fetch';

const URN_GENERATOR_URL = 'http://generator.urn.fi/cgi-bin/urn_generator.cgi?type=nbn';

export default async function (isLegalDeposit = false) {
	async function fix(record) {
		const f856sUrn = record.fields.filter(hasURN);
		const ldSubfields = isLegalDeposit ? createLDSubfields() : [];

		if (f856sUrn.length === 0) {
			record.insertField({
				tag: '856',
				ind1: '4',
				ind2: '0',
				subfields: [await createURNSubfield(record), ...ldSubfields],
			});
		} else if (isLegalDeposit) {
			f856sUrn.forEach(f => {
				ldSubfields.forEach(ldsf => {
					if (!f.subfields.some(sf => (sf.code === ldsf.code) && (sf.value === ldsf.value))) {
						f.subfields.push(ldsf);
					}
				});
			});
		}

		return true;

		async function createURNSubfield(rec) {
			const isbn = rec.fields.reduce((acc, f) => {
				if (f.tag === '020') {
					const a = f.subfields.find(sf => sf.code === 'a');
					acc = a ? a.value : undefined;
					return acc;
				}

				return acc;
			}, undefined);

			return {
				code: 'u',
				value: await createURN(isbn),
			};

			async function createURN(isbn = false) {
				if (isbn) {
					return 'http://urn.fi/URN:ISBN:' + isbn;
				}

				const response = await fetch(URN_GENERATOR_URL);
				const body = await response.text();
				return 'http://urn.fi/' + body;
			}
		}

		function createLDSubfields() {
			return [
				{
					code: 'z',
					value: 'Käytettävissä vapaakappalekirjastoissa',
				},
				{
					code: '5',
					value: 'FI-Vapaa',
				},
			];
		}
	}

	async function validate(record) {
		return {valid: record.fields.some(hasURN) && !isLegalDeposit};
	}

	const hasURN = f => (f.tag === '856') && f.subfields.some(({code, value}) => (code === 'u') && /urn.fi/.test(value));

	return {
		description: 'Adds URN for record, to 856-field (if not existing)',
		validate,
		fix,
	};
}
