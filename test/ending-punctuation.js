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
import validatorFactory from '../src/ending-punctuation';

const {expect} = chai;
chai.use(chaiAsPromised);

//Factory validation
describe('field-structure', () => {
	//Indicators and subfields validation
	describe('#validate: Indicators and subfields', () => {
		const recordValid = new MarcRecord({
			fields: [{
				tag: '245', //Index
				subfields: [{
					code: 'a',
					value: 'Elämäni ja tutkimusretkeni / '
				},{
					code: 'c',
					value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola.'
				},{
					code: '6',
					value: 'FOO'
				}]
			},{
				tag: '337', //Range 336-338
				subfields: [{
					code: 'a',
					value: 'käytettävissä ilman laitetta'
				  },{
					code: 'b',
					value: 'n'
				  },{
					code: '2',
					value: 'rdamedia'
				}]
			},{
				tag: '500', //Range 500-509
				subfields: [{
					code: 'a',
					value: 'FOO (Bar)'
				}]
			}]
		});

		const recordInvalid = new MarcRecord({
			fields: [{
				tag: '245',
				subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni / '
					},{
						code: 'c',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'
					},{
						code: '6',
						value: 'FOO'
					}]
			},{
				tag: '337',
				subfields: [{
						code: 'a',
						value: 'käytettävissä ilman laitetta'
					},{
						code: 'b',
						value: 'n.'
					},{
						code: '2',
						value: 'rdamedia'
					}]
			},{
				tag: '500',
				subfields: [{
					code: 'a',
					value: 'FOO (Bar).'
				}]
			}]
		});

		it('Finds the record valid', async () => {
			const validator = await validatorFactory();
			const result = await validator.validate(recordValid);

			expect(result).to.eql({valid: true});
		});

		it('Finds the record invalid', async () => {
			const validator = await validatorFactory();
			const result = await validator.validate(recordInvalid);

			expect(result).to.eql({valid: false});
		});

		it('Repairs the invalid record', async () => {
			const validator = await validatorFactory();
			const result = await validator.fix(recordInvalid);

			expect(result).to.eql({valid: false});
		});
	});
});