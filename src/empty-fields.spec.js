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
import validatorFactory from '../src/empty-fields';

before(() => {
	MarcRecord.setValidationOptions({subfields: false, subfieldValues: false});
});

after(() => {
	MarcRecord.setValidationOptions({});
});

describe('empty-fields', () => {
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
						tag: '001',
						value: '1234567',
						subfields: [
							{
								code: 'a',
								value: 'foo',
							},
						],
					},
				],
			});
			const result = await validator.validate(record);
			expect(result).to.to.have.property('valid', true);
		});

		it('Finds a missing subfield value', async () => {
			const validator = await validatorFactory();
			const record = new MarcRecord({
				fields: [
					{
						tag: '245',
						subfields: [
							{
								code: 'a',
							},
						],
					},
				],
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: false, messages: ['Field 245 has missing subfield values: a']});
		});

		it('Finds an empty subfield array', async () => {
			const validator = await validatorFactory();
			const record = new MarcRecord({
				fields: [
					{
						tag: '500',
						subfields: [
						],
					},
				],
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: false, messages: ['Field 500 has no subfields']});
		});
	});

	describe('#fix', () => {
		it('Removes a subfield with missing value', async () => {
			const validator = await validatorFactory();
			const record = new MarcRecord({
				fields: [
					{
						tag: '245',
						subfields: [
							{
								code: 'a',
								value: 'foo',
							},
							{
								code: 'b',
							},
						],
					},
				],
			});
			await validator.fix(record);

			expect(record.fields).to.eql(
				[
					{
						tag: '245',
						ind1: ' ',
						ind2: ' ',
						subfields: [
							{
								code: 'a',
								value: 'foo',
							},
						],
					},
				]);
		});

		it('Removes a field with no subfields', async () => {
			const validator = await validatorFactory();
			const record = new MarcRecord({
				fields: [
					{
						tag: '001',
						value: '1234567',
					},
					{
						tag: '500',
						subfields: [],
					},
				],
			});
			await validator.fix(record);

			expect(record.fields).to.eql([
				{
					tag: '001',
					value: '1234567',
				},
			]);
		});
	});
});
