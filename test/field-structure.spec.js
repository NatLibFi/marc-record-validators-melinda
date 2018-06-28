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
import validatorFactory from '../src/field-structure';

const {expect} = chai;
chai.use(chaiAsPromised);

describe('field-structure', () => {
	it('Creates a validator', async () => {
		const config = [{
			tag: /^035$/,
			ind1: /^0$/,
			ind2: /^1$/
		},{
			tag: /^100$/,
			subfields: {
				a: {maxOccurrence: 1}
			}
		}];

		const validator = await validatorFactory(config);

		expect(validator)
			.to.be.an('object')
			.that.has.any.keys('description', 'validate');

		expect(validator.description).to.be.a('string');
		expect(validator.validate).to.be.a('function');
	});

	it('Throws an error when config array not provided', async () => {
		await expect(validatorFactory()).to.be.rejectedWith(Error, 'Configuration array not provided');
	});

	it('Throws an error when config array has unidentified field', async () => {
		const config = [{
			leader: /^035$/,
			tags: /^035$/
		}];
		await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - unidentified value: tags');
	});

	it('Throws an error when config array not valid', async () => {
		const config = [{
			leader: /^035$/,
			tag: /^035$/
		}];
		await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - excluded element');
	});

	// describe('#validate', () => {
	// 	it('Finds the record valid', async () => {
	// 		const config = [
	// 			{
	// 			  tag: /^035$/,
	// 			  ind1: /^0$/,
	// 			  ind2: /^1$/
	// 			},
	// 			{
	// 			  tag: /^100$/,
	// 			  subfields: {
	// 				a: {maxOccurrence: 1}
	// 			  }
	// 			}
	// 		  ];
	// 		const validator = await validatorFactory(config);
	// 		const record = new MarcRecord({
	// 			fields: [
	// 			  {
	// 				tag: '001',
	// 				value: '123456'
	// 			  },
	// 			  {
	// 				tag: '035',
	// 				ind1: '0',
	// 				ind2: '1',
	// 				subfields: [
	// 				  {
	// 					code: 'a',
	// 					value: 'foo'
	// 				  }
	// 				]
	// 			  },
	// 			  {
	// 				tag: '100',
	// 				ind1: ' ',
	// 				ind2: ' ',
	// 				subfields: [
	// 				  {
	// 					code: 'a',
	// 					value: 'bar'
	// 				  },
	// 				  {
	// 					code: 'b',
	// 					value: 'fubar'
	// 				  }
	// 				]
	// 			  }
	// 			]
	// 		  });
	// 		const result = await validator.validate(record);

	// 		expect(result).to.eql({valid: true});
	// 	});
	// 	it('Finds the record invalid', async () => {
	// 		const tagPatterns = [/^5..$/, /^FOO$/];
	// 		const validator = await validatorFactory(tagPatterns);
	// 		const record = new MarcRecord({
	// 			fields: [
	// 				{
	// 					tag: '001',
	// 					ind1: ' ',
	// 					ind2: '0',
	// 					subfields: [{code: 'a', value: 'foo'}]
	// 				},
	// 				{
	// 					tag: 'BAR',
	// 					ind1: '1',
	// 					ind2: '0',
	// 					subfields: [{code: 'a', value: 'foo'}]
	// 				}
	// 			]
	// 		});
	// 		const result = await validator.validate(record);

	// 		expect(result).to.eql({valid: false});
	// 	});
	// });
});