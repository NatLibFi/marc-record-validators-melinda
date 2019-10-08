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

/* eslint-disable require-await */

'use strict';

import fetch from 'node-fetch';

const URN_GENERATOR_URL = 'http://generator.urn.fi/cgi-bin/urn_generator.cgi?type=nbn';

export default async function () {
	async function fix(record) {
		record.get(/^856$/).some(f => f.subfields.filter(sf => sf.code === 'u').forEach(async sf => {
			const isbn = record.fields.reduce((acc, f) => {
				if (f.tag === '020') {
					const a = f.subfields.find(sf => sf.code === 'a');
					acc = a ? a.value : undefined;
					return acc;
				}

				return acc;
			}, undefined);
			if (isbn) {
				sf.value = 'http://urn.fi/URN:ISBN:' + isbn;
			} else {
				const response = await fetch(URN_GENERATOR_URL);
				const body = await response.text();
				sf.value = body;
			}

			return true;
		}));
	}

	return {
		description: 'Handles URN in 856$u-subfields',
		validate: async record => ({
			valid: !record
				.get(/^856$/)
				.some(f =>
					f.subfields.some(sf => sf.code === 'u' && sf.value === 'URN')
				)
		}),
		fix
	};/* : async record =>
			record.get(/^856$/).some(f =>
				f.subfields.filter(sf => sf.code === 'u').forEach(sf => {
					f020 = record.get(/^020$/);
					console.log(f020);
					//if (isbn) {
					//	sf.value = 'http://urn.fi/URN:ISBN:' + isbn;
					//} else {

					//const response = await fetch(URN_GENERATOR_URL);
					const body = "bla";//await response.text();
					sf.value = body;
					//sf.value = createURN();
				})
			)
	}; */
}