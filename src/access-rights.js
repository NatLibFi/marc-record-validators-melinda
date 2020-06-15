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

/* eslint-disable require-await */

'use strict';

export default async function () {
	async function fix(record) {
		record.insertField({
			tag: '506',
			ind1: '1',
			subfields: [
				{code: 'a', value: 'Aineisto on käytettävissä vapaakappalekirjastoissa.'},
				{code: 'f', value: 'Online access with authorization.'},
				{code: '2', value: 'star'},
				{code: '5', value: 'FI-Vapaa'},
				{code: '9', value: 'FENNI<KEEP>'}
			]
		});

		record.insertField({
			tag: '540',
			subfields: [
				{code: 'a', value: 'Aineisto on käytettävissä tutkimus- ja muihin tarkoituksiin;'},
				{code: 'b', value: 'Kansalliskirjasto;'},
				{code: 'c', value: 'Laki kulttuuriaineistojen tallettamisesta ja säilyttämisestä'},
				{code: 'u', value: 'http://www.finlex.fi/fi/laki/ajantasa/2007/20071433'},
				{code: '5', value: 'FI-Vapaa'},
				{code: '9', value: 'FENNI<KEEP>'}
			]
		});

		const f856 = record.get(/^856$/).shift();
		if (f856) {
			f856.subfields.push(
				{code: 'z', value: 'Käytettävissä vapaakappalekirjastoissa'},
				{code: '5', value: 'FI-Vapaa'}
			);
		}

		return true;
	}

	return {
		description: 'Adds access rights fields for a record (if not existing)',
		validate: async record => ({
			valid: record.fields.some(sf => sf.tag === '506')
		}),
		fix
	};
}
