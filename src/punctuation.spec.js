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

/* eslint-disable no-undef, max-nested-callbacks, no-unused-expressions */

'use strict';

import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './punctuation/';

describe('access-rights', () => {
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
						tag: '100',
						ind2: ' ',
						subfields: [
							{code: 'a', value: 'Sukunimi, Etunimi,'},
							{code: 'c', value: 'kirjoittaja.'}
						]
					}
				]
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: true});
		});

		it('Finds the record invalid', async () => {
			const validator = await validatorFactory();
			const record = new MarcRecord({
				fields: [
					{
						tag: '100',
						ind2: ' ',
						subfields: [
							{code: 'a', value: 'Sukunimi, Etunimi'},
							{code: 'c', value: 'kirjoittaja.'}
						]
					}
				]
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: false});
		});
	});

	describe('#fix', () => {
		it('Creates punctuation for field 100', async () => {
			const validator = await validatorFactory();
			const record = new MarcRecord({
				fields: [
					{
						tag: '100',
						ind1: ' ',
						ind2: ' ',
						subfields: [
							{code: 'a', value: 'Sukunimi, Etunimi'},
							{code: 'c', value: 'kirjoittaja'}
						]
					}
				]
			});

			await validator.fix(record);

			expect(record.fields).to.eql([
				{
					tag: '100',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Sukunimi, Etunimi,'},
						{code: 'c', value: 'kirjoittaja.'}
					]
				}
			]);
		});
	});
	/*
	Describe('#fix', () => {
		it('Creates punctuation for field 264', async () => {
			const validator = await validatorFactory();
			const record = new MarcRecord({
				fields: [
					{
						tag: '264',
						ind1: ' ',
						ind2: ' ',
						subfields: [
							{code: 'b', value: 'Julkaisija'},
							{code: 'c', value: '2019'}
						]
					}
				]
			});

			await validator.fix(record);

			expect(record.fields).to.eql([
				{
					tag: '264',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'b', value: 'Julkaisija,'},
						{code: 'c', value: '2019.'}
					]
				}
			]);
		});
	});
	*/
});
