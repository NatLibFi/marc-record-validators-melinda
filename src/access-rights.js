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

export default async function () {
	const sf506 = [{code: 'a', value: /aineisto on käytettävissä vapaakappalekirjastoissa/i}];
	const sf540 = [{code: 'c', value: /laki kulttuuriaineistojen tallettamisesta ja säilyttämisestä/i}];

	async function fix(record) {
		if (!hasTag(record, '506', sf506)) {
			record.insertField({
				tag: '506',
				ind1: '1',
				subfields: [{
					code: 'a',
					value: 'Aineisto on käytettävissä vapaakappalekirjastoissa.',
				}, {
					code: 'f',
					value: 'Online access with authorization.',
				}, {
					code: '2',
					value: 'star',
				}, {
					code: '5',
					value: 'FI-Vapaa',
				}, {
					code: '9',
					value: 'FENNI<KEEP>',
				}],
			});
		}

		if (!hasTag(record, '540', sf540)) {
			record.insertField({
				tag: '540',
				subfields: [{
					code: 'a',
					value: 'Aineisto on käytettävissä tutkimus- ja muihin tarkoituksiin;',
				}, {
					code: 'b',
					value: 'Kansalliskirjasto;',
				}, {
					code: 'c',
					value: 'Laki kulttuuriaineistojen tallettamisesta ja säilyttämisestä',
				}, {
					code: 'u',
					value: 'http://www.finlex.fi/fi/laki/ajantasa/2007/20071433',
				}, {
					code: '5',
					value: 'FI-Vapaa',
				}, {
					code: '9',
					value: 'FENNI<KEEP>',
				}],
			});
		}

		return true;
	}

	async function validate(record) {
		return {valid: hasTag(record, '506', sf506) && hasTag(record, '540', sf540)};
	}

	return {
		description: 'Adds access rights fields for a record (if not existing)',
		validate,
		fix,
	};

	function hasTag(rec, tag, sfcv) {
		return rec.fields.some(f => (f.tag === tag) && sfcv.every(({code, value}) => f.subfields.some(sf => (sf.code === code) && value.test(sf.value))));
	}
}
