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

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {MarcRecord} from '@natlibfi/marc-record';
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
						tag: '245',
						subfields: [{
							code: 'a',
							value: 'Föö, Bär'
						}]
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
						subfields: [{
							code: 'a',
							value: 'Föö, Bär'
						}]
					}
				]
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: false, messages: ['The following subfields are not properly decomposed: a']});
		});

		describe('#fix', () => {
			it('Should fix the record', async () => {
				const validator = await validatorFactory();

				const record = new MarcRecord({
					fields: [{
						tag: '245',
						subfields: [
							{
								code: 'a',
								value: 'Föö, Bär'
							},
							{
								code: 'b',
								value: '== Fubar'
							}
						]
					}]
				});

				const recordOriginal = record.toObject();
				const fieldModified = {
					tag: '245',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{
							code: 'a',
							value: 'Föö, Bär'
						},
						{
							code: 'b',
							value: '== Fubar'
						}
					]
				};
				await validator.fix(record);

				expect(recordOriginal).to.not.eql(record);
				expect(record.fields).to.eql([fieldModified]);
			});
		});
	});
});
