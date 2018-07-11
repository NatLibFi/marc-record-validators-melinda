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

/* eslint-disable no-undef, max-nested-callbacks, no-unused-expressions */

'use strict';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import MarcRecord from 'marc-record-js';
import validatorFactory from '../src/unicode-decomposition';

const {expect} = chai;
chai.use(chaiAsPromised);

describe('unicode-decomposition', () => {
	it('Creates a validator', async () => {
		const validator = await validatorFactory();

		expect(validator)
			.to.be.an('object')
			.that.has.any.keys('description', 'validate');

		expect(validator.description).to.be.a('string');
		expect(validator.validate).to.be.a('function');
	});

	describe('#validate', () => {
		it('Finds the record valid', async () => {
			const validator = await validatorFactory();
			const record = new MarcRecord({
				fields: [
					{
						tag: '500',
						ind1: ' ',
						ind2: '0',
						subfields: [{code: 'a', value: 'foo'}]
					},
					{
						tag: 'FOO',
						ind1: ' ',
						ind2: '0',
						subfields: [{code: 'a', value: 'foo'}]
					}
				]
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: true, messages: []});
		});
		it('Finds the record invalid', async () => {
			const validator = await validatorFactory();
			const record = new MarcRecord({
				fields: [
					{
						tag: '001',
						ind1: ' ',
						ind2: '0',
						subfields: [{code: 'a', value: 'foo'}]
					},
					{
						tag: 'BAR',
						ind1: '1',
						ind2: '0',
						subfields: [{code: 'a', value: 'foo'}]
					}
				]
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: false, messages: []});
		});
	});
});
