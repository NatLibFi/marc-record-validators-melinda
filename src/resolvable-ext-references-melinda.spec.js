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
import fetchMock from 'fetch-mock';
import * as testContext from '../src/resolvable-ext-references-melinda';
import {fixture5000, fixture9550, fixture1000} from '../test-fixtures/resolvable-ext-references-melinda';

const {expect} = chai;
chai.use(chaiAsPromised);

const endpoint = 'http://melinda.kansalliskirjasto.fi:210/fin01';
const queryParam = '?operation=searchRetrieve&maximumRecords=2&version=1&query=rec.id=';
const prefixPattern = /^\(FOOBAR\)/;
const fields = {
	773: ['w'],
	833: ['w', 'p']
};

describe('resolvable-ext-references-melinda', () => {
	afterEach(() => {
		testContext.default.__ResetDependency__('fetch');
	});

	it('Creates a validator', async () => {
		const validator = await testContext.default({endpoint, prefixPattern, fields});

		expect(validator)
			.to.be.an('object')
			.that.has.any.keys('description', 'validate');

		expect(validator.description).to.be.a('string');
		expect(validator.validate).to.be.a('function');
	});

	it('Throws an error when prefixPattern not provided', async () => {
		const validator = await testContext.default({endpoint, prefixPattern, fields});
		await expect(validator.validate()).to.be.rejectedWith(Error, 'Cannot read property \'fields\' of undefined');
	});

	describe('#validate', () => {
		it('Finds prefixPattern on record and removes it', async () => {
			const mock = fetchMock.sandbox();
			mock.get(`${endpoint}${queryParam}5000`, fixture5000);
			mock.get(`${endpoint}${queryParam}9550`, fixture9550);

			testContext.default.__Rewire__('fetch', mock);
			const validator = await testContext.default({endpoint, prefixPattern, fields});

			const record = new MarcRecord({
				fields: [
					{
						tag: '001',
						value: '123456'
					},
					{
						tag: '035',
						subfields: [
							{
								code: 'a',
								value: '(FI-MELINDA)123456'
							}
						]
					},
					{
						tag: '773',
						subfields: [
							{
								code: 'w',
								value: '(FOOBAR)5000'
							}
						]
					},
					{
						tag: '833',
						subfields: [
							{
								code: 'p',
								value: '(FOOBAR)9550'
							},
							{
								code: 'c',
								value: '(FI-MELINDA)8850'
							}
						]
					}
				]
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: true, messages: []});
		});

		it('Finds no matching prefixPattern on record', async () => {
			const mock = fetchMock.sandbox();

			mock.get(`${endpoint}5000`, fixture5000);

			testContext.default.__Rewire__('fetch', mock);
			const validator = await testContext.default({endpoint, prefixPattern, fields});

			const record = new MarcRecord({
				fields: [
					{
						tag: '001',
						value: '123456'
					},
					{
						tag: '035',
						subfields: [
							{
								code: 'a',
								value: '(FI-MELINDA)123456'
							}
						]
					},
					{
						tag: '773',
						subfields: [
							{
								code: 'w',
								value: '(FI-MELINDA)123456'
							}
						]
					},
					{
						tag: '833',
						subfields: [
							{
								code: 'p',
								value: '(FI-MELINDA)2620'
							},
							{
								code: 'w',
								value: '(FI-MELINDA)8850'
							}
						]
					}
				]
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: true, messages: []});
		});

		it('Finds prefixPattern on record but values not resolvable', async () => {
			const mock = fetchMock.sandbox();
			mock.get(`${endpoint}${queryParam}1000`, fixture1000);

			testContext.default.__Rewire__('fetch', mock);
			const validator = await testContext.default({endpoint, prefixPattern, fields});

			const record = new MarcRecord({
				fields: [
					{
						tag: '001',
						value: '123456'
					},
					{
						tag: '035',
						subfields: [
							{
								code: 'a',
								value: '(FI-MELINDA)123456'
							}
						]
					},
					{
						tag: '773',
						subfields: [
							{
								code: 'w',
								value: '(FOOBAR)1000'
							}
						]
					}
				]
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: false, messages: ['Field 773$w with value 1000 is not resolvable']});
		});
	});
});
