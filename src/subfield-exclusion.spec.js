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
import validatorFactory from '../src/subfield-exclusion';

const {expect} = chai;
chai.use(chaiAsPromised);

// Factory validation
describe('subfield-exclusion', () => {
	describe('#validate: Check configuration validation', () => {
		it('Creates a validator from simple config', async () => {
			const config = [{
				tag: /^500$/,
				subfields: [{code: /4/}]
			}];

			const validator = await validatorFactory(config);
			expect(validator)
				.to.be.an('object')
				.that.has.any.keys('description', 'validate');

			expect(validator.description).to.be.a('string');
			expect(validator.validate).to.be.a('function');
		});

		it('Creates a validator from complex config', async () => {
			const config = [{
				tag: /^210$/,
				ind2: /\s/,
				subfields: [{
					code: /2/,
					value: /.+/
				}]
			}];

			const validator = await validatorFactory(config);
			expect(validator)
				.to.be.an('object')
				.that.has.any.keys('description', 'validate');

			expect(validator.description).to.be.a('string');
			expect(validator.validate).to.be.a('function');
		});

		it('Fails to create a validator from invalid config - subfields missing', async () => {
			const config = [{
				tag: /^210$/
			}];

			await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - missing mandatory element: subfields');
		});

		it('Fails to create a validator from invalid config - tag', async () => {
			const config = [{
				tag: '500',
				subfields: [
					{code: /9/, value: /^(?!FENNI<KEEP>).*$/}
				]
			}];

			await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - invalid data type for: tag');
		});

		it('Fails to create a validator from invalid config - missing array', async () => {
			const config = {
				tag: '500',
				subfields: [
					{code: /9/, value: /^(?!FENNI<KEEP>).*$/}
				]
			};

			await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration array not provided');
		});

		it('Fails to create a validator from invalid config - code', async () => {
			const config = [{
				tag: /^500$/,
				subfields: [
					{code: 9, value: /^(?!FENNI<KEEP>).*$/}
				]
			}];

			await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - invalid data type for: code');
		});

		it('Fails to create a validator from invalid config - value', async () => {
			const config = [{
				tag: /^500$/,
				subfields: [
					{code: /9/, value: 'Fenni'}
				]
			}];

			await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - invalid data type for: value');
		});

		it('Fails to create a validator from invalid config - missing mandatory: tag', async () => {
			const config = [{
				value: /^500$/,
				subfields: [
					{code: /9/, value: /^(?!FENNI<KEEP>).*$/}
				]
			}];

			await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - missing mandatory element: tag');
		});

		it('Fails to create a validator from invalid config - missing mandatory: tag', async () => {
			const config = [{
				value: /^500$/,
				subfields: [
					{code: /9/, value: /^(?!FENNI<KEEP>).*$/}
				]
			}];

			await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - missing mandatory element: tag');
		});

		it('Fails to create a validator from invalid config - subfield not object: array', async () => {
			const config = [{
				tag: /^500$/,
				subfields: [
					['/9/', '/^(?!FENNI<KEEP>).*$/'],
					{value: /^(?!FENNI<KEEP>).*$/}
				]
			}];

			await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - subfield: /9/,/^(?!FENNI<KEEP>).*$/ not object');
		});

		it('Fails to create a validator from invalid config - subfield not object: string', async () => {
			const config = [{
				tag: /^500$/,
				subfields: [
					'/9/',
					'/^(?!FENNI<KEEP>).*$/',
					{value: /^(?!FENNI<KEEP>).*$/}
				]
			}];

			await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - subfield: /9/ not object');
		});

		it('Fails to create a validator from invalid config - missing mandatory: subfield.code', async () => {
			const config = [{
				tag: /^500$/,
				subfields: [
					{code: /9/, value: /^(?!FENNI<KEEP>).*$/},
					{value: /^(?!FENNI<KEEP>).*$/}
				]
			}];

			await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - missing mandatory element: code');
		});

		it('Fails to create a validator from invalid config - unidentified field: unidentified', async () => {
			const config = [{
				tag: /^500$/,
				unidentified: /^500$/,
				subfields: [
					{code: /9/, value: /^(?!FENNI<KEEP>).*$/},
					{value: /^(?!FENNI<KEEP>).*$/}
				]
			}];

			await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - unidentified value: unidentified');
		});
	});

	// Simple configuration https://github.com/NatLibFi/marc-record-validators-melinda/issues/46
	describe('#validate: Simple configuration (spec)', () => {
		const config = [{
			tag: /^100$/,
			subfields: [{code: /4/}]
		}];

		const recordValid = new MarcRecord({
			leader: 'foo',
			fields: [{
				tag: '100',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Foo Bar'}
				]
			}, {
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Fubar'}
				]
			}]
		});

		const recordInvalid = new MarcRecord({
			leader: 'foo',
			fields: [{
				tag: '100',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Foo Bar'},
					{code: '4', value: 'att'}
				]
			}, {
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Fubar'}
				]
			}]
		});

		const recordInvalidFixed = new MarcRecord({
			leader: 'foo',
			fields: [{
				tag: '100',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Foo Bar'}
				]
			}, {
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Fubar'}
				]
			}]
		});

		it('Finds the record valid (spec)', async () => {
			const validator = await validatorFactory(config);
			const result = await validator.validate(recordValid);
			expect(result).to.eql({valid: true, message: []});
		});

		it('Finds the record invalid (spec)', async () => {
			const validator = await validatorFactory(config);
			const result = await validator.validate(recordInvalid);
			expect(result).to.eql({valid: false, message: ['Subfield $100$$4should be excluded']});
		});

		it('Repairs invalid record', async () => {
			const validator = await validatorFactory(config);
			await validator.fix(recordInvalid);
			expect(recordInvalid.equalsTo(recordInvalidFixed)).to.eql(true);
		});
	});

	// Complex configuration https://github.com/NatLibFi/marc-record-validators-melinda/issues/46
	describe('#validate: Complex configuration (spec)', () => {
		const config = [{
			tag: /^210$/,
			ind2: /\s/,
			subfields: [
				{code: /2/, value: /.+/}
			]
		}];

		const recordValid = new MarcRecord({
			leader: 'foo',
			fields: [{
				tag: '210',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Foo'}
				]
			}, {
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Fubar'}
				]
			}]
		});

		const recordInvalid = new MarcRecord({
			leader: 'foo',
			fields: [{
				tag: '210',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Foo'},
					{code: '2', value: 'dnlm'}
				]
			}, {
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Fubar'}
				]
			}]
		});

		const recordInvalidFixed = new MarcRecord({
			leader: 'foo',
			fields: [{
				tag: '210',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Foo'}
				]
			}, {
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Fubar'}
				]
			}]
		});

		it('Finds the record valid (spec)', async () => {
			const validator = await validatorFactory(config);
			const result = await validator.validate(recordValid);
			expect(result).to.eql({valid: true, message: []});
		});

		it('Finds the record invalid (spec)', async () => {
			const validator = await validatorFactory(config);
			const result = await validator.validate(recordInvalid);
			expect(result).to.eql({valid: false, message: ['Subfield $210$$2should be excluded']});
		});

		it('Repairs invalid record', async () => {
			const validator = await validatorFactory(config);
			await validator.fix(recordInvalid);
			expect(recordInvalid.equalsTo(recordInvalidFixed)).to.eql(true);
		});
	});

	// More special cases to increase coverage
	describe('#validate: Custom configuration', () => {
		const configInd = [{
			tag: /^500$/,
			ind1: /^8$/,
			ind2: /^4$/,
			subfields: [
				{code: /2/, value: /.+/}
			]
		}];

		const recordValid = new MarcRecord({
			leader: 'foo',
			fields: [{
				tag: '210',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Foo'}
				]
			}, {
				tag: '500',
				subfields: [
					{code: 'a', value: 'Foo'},
					{code: '2', value: 'dnlm'}
				]
			}]
		});

		const recordIndInvalid = new MarcRecord({
			leader: 'foo',
			fields: [{
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Fubar'}
				]
			}, {
				tag: '500',
				ind1: '8',
				ind2: '4',
				subfields: [
					{code: 'a', value: 'Foo'},
					{code: '2', value: 'dnlm'}
				]
			}]
		});

		const recordIndInvalidFixed = new MarcRecord({
			leader: 'foo',
			fields: [{
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Fubar'}
				]
			}, {
				tag: '500',
				ind1: '8',
				ind2: '4',
				subfields: [
					{code: 'a', value: 'Foo'}
				]
			}]
		});

		it('Finds the record valid - Ind1&Ind2', async () => {
			const validator = await validatorFactory(configInd);
			const result = await validator.validate(recordValid);
			expect(result).to.eql({valid: true, message: []});
		});

		it('Finds the record invalid - Ind', async () => {
			const validator = await validatorFactory(configInd);
			const result = await validator.validate(recordIndInvalid);
			expect(result).to.eql({valid: false, message: ['Subfield $500$$2should be excluded']});
		});

		it('Repairs invalid record', async () => {
			const validator = await validatorFactory(configInd);
			await validator.fix(recordIndInvalid);
			expect(recordIndInvalid.equalsTo(recordIndInvalidFixed)).to.eql(true);
		});
	});
});
