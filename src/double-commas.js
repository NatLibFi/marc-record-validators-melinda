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
	return {
		description: 'Handle double commas in 700$e-subfields',
		validate: async record => ({
			valid: !record
				.get(/^700$/)
				.some(f =>
					f.subfields.every(sf => sf.code === 'e' && /,,/.test(sf.value))
				)
		}),
		fix: async record =>
			record.get(/^700$/).forEach(f =>
				f.subfields.filter(sf => sf.code === 'e').forEach(sf => {
					sf.value = sf.value.replace(/,,/, ',');
				})
			)
	};
}
