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
import validatorFactory from '../src/identical-fields';

describe('identical-fields', () => {
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
						tag: '700',
						subfields: [
							{
								code: 'e',
								value: 'foo'
							}
						]
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
						tag: '700',
						subfields: [
							{
								code: 'e',
								value: 'foo'
							}
						]
					},
					{
						tag: '800',
						subfields: [
							{
								code: 'e',
								value: 'foo'
							}
						]
					},
					{
						tag: '800',
						subfields: [
							{
								code: 'e',
								value: 'foo'
							}
						]
					},
					{
						tag: '700',
						subfields: [
							{
								code: 'e',
								value: 'foo'
							}
						]
					}
				]
			});

			const result = await validator.validate(record);

			expect(result).to.eql({valid: false, messages: ['Field 800 has duplicates', 'Field 700 has duplicates']});
		});
	});

	describe('#fix', () => {
		it('Fixes the record', async () => {
			const validator = await validatorFactory();
			const record = new MarcRecord({
				fields: [
					{
						tag: '700',
						subfields: [
							{
								code: 'e',
								value: 'dest'
							}
						]
					},
					{
						tag: '700',
						subfields: [
							{
								code: 'e',
								value: 'dest'
							}
						]
					}
				]
			});
			await validator.fix(record);

			expect(record.fields).to.eql([
				{
					tag: '700',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{
							code: 'e',
							value: 'dest'
						}
					]
				}
			]);
		});
	});
});
