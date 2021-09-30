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

import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/access-rights';

describe('access-rights', async () => {
	// Fields
	const ldf5061 = {
		tag: '506',
		ind1: '1',
		ind2: ' ',
		subfields: [
			{code: 'a', value: 'Aineisto on käytettävissä vapaakappalekirjastoissa.'},
			{code: 'f', value: 'Online access with authorization.'},
			{code: '2', value: 'star'},
			{code: '5', value: 'FI-Vapaa'},
			{code: '9', value: 'FENNI<KEEP>'},
		],
	};
	const ldf540 = {
		tag: '540',
		ind1: ' ',
		ind2: ' ',
		subfields: [
			{code: 'a', value: 'Aineisto on käytettävissä tutkimus- ja muihin tarkoituksiin;'},
			{code: 'b', value: 'Kansalliskirjasto;'},
			{code: 'c', value: 'Laki kulttuuriaineistojen tallettamisesta ja säilyttämisestä'},
			{code: 'u', value: 'http://www.finlex.fi/fi/laki/ajantasa/2007/20071433'},
			{code: '5', value: 'FI-Vapaa'},
			{code: '9', value: 'FENNI<KEEP>'},
		],
	};
	const f5060 = {
		tag: '506',
		ind1: '0',
		ind2: ' ',
		subfields: [
			{code: 'a', value: 'Aineisto on vapaasti saatavissa.'},
			{code: 'f', value: 'Unrestricted online access'},
			{code: '2', value: 'star'},
			{code: '9', value: 'FENNI<KEEP>'},
		],
	};
	const f540 = {
		tag: '540',
		ind1: ' ',
		ind2: ' ',
		subfields: [
			{code: 'c', value: 'This publication is copyrighted. You may download, display and print it for Your own personal use. Commercial use is prohibited.'},
		],
	};

	it('Creates a validator', async () => {
		const validator = await validatorFactory();

		expect(validator)
			.to.be.an('object')
			.that.has.any.keys('description', 'validate');

		expect(validator.description).to.be.a('string');
		expect(validator.validate).to.be.a('function');
	});

	// Tests
	const test = await (async () => {
		const validator = await validatorFactory();
		return {
			validate: async (valid, ...recfields) => {
				const result = await validator.validate(new MarcRecord({fields: recfields}));
				expect(result).to.eql({valid});
			},

			fix: async (recfields, resfields) => {
				const record = new MarcRecord({fields: recfields});
				await validator.fix(record);
				expect(record.fields).to.eql(resfields);
			},
		};
	})();

	describe('#validate', () => {
		it('Finds the record valid; Legal deposit fields 5061 and 540', async () => {
			await test.validate(true, ldf5061, ldf540);
		});

		it('Finds the record invalid; Missing 5061', async () => {
			await test.validate(false, f5060, ldf540);
		});

		it('Finds the record invalid; Missing 540', async () => {
			await test.validate(false, ldf5061, f540);
		});

		it('Finds the record invalid; Missing 5061 and 540', async () => {
			await test.validate(false, f5060, f540);
		});
	});

	describe('#fix', () => {
		it('Legal deposit fields 5061 and 540; Nothing to add', async () => {
			await test.fix([ldf5061, ldf540], [ldf5061, ldf540]);
		});

		it('540 but missing 5061; Adds 5061', async () => {
			await test.fix([f5060, ldf540], [f5060, ldf5061, ldf540]);
		});

		it('5061 but missing 540; Adds 540', async () => {
			await test.fix([ldf5061, f540], [ldf5061, f540, ldf540]);
		});

		it('Both, 5061 and 540, missing; Adds 5061 and 540', async () => {
			await test.fix([f5060, f540], [f5060, ldf5061, f540, ldf540]);
		});
	});
});
