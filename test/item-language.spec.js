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
import validatorFactory from '../src/item-language';

const {expect} = chai;
chai.use(chaiAsPromised);

describe('language', () => {
	it('Creates a validator', async () => {
		const validator = await validatorFactory(/^520$/);

		expect(validator)
			.to.be.an('object')
			.that.has.any.keys('description', 'validate');

		expect(validator.description).to.be.a('string');
		expect(validator.validate).to.be.a('function');
	});

	it('Throws an error when tagPattern is not provided', async () => {
		await expect(validatorFactory()).to.be.rejectedWith(Error, 'No tagPattern provided');
	});

	describe('#validate', () => {
		it('Finds the record valid', async () => {
			const validator = await validatorFactory(/^520$/);
			const record = new MarcRecord({
				fields: [
					{
						tag: '041',
						ind1: ' ',
						ind2: ' ',
						subfields: [{code: 'a', value: 'fin'}]
					},
					{
						tag: '520',
						ind1: ' ',
						ind2: '',
						subfields: [{
							code: 'a',
							value: 'Matti Ylösen Veroparatiisit on kirja siitä, kuinka miljonäärit ja monikansalliset yritykset ovat 20 vuoden aikana siirtäneet kiihtyvällä tahdilla tulojaan säätelyn ja verottajan ulottumattomiin korkeiden pankkisalaisuuslakien suojiin. Samoihin keitaisiin, joita myös kansainvälinen rikollisuus käyttää rahanpesuun. Suomi on toistaiseksi ollut osa ongelmaa, ei sen ratkaisua.\nKirja sisältää näkökulmia ja kiinnekohtia demokratian, hyvinvointivaltion ja kilpailullisen markkinatalouden kriiseihin. Mukana myös toimintaehdotuksia, joita Suomen tulee ajaa veroparatiisiongelman ratkaisemiseksi. Veroparatiisit on ajankohtainen tietopaketti veronkierron mekanismeista ja vaikutuksista.'
						}]
					}
				]
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: true});
		});

		it('Finds the record invalid (Language code is missing and detection fails)', async () => {
			const validator = await validatorFactory(/^520$/);
			const record = new MarcRecord({
				fields: [
					{
						tag: '520',
						ind1: ' ',
						ind2: '',
						subfields: [{
							code: 'a',
							value: '.'
						}]
					}
				]
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: false, messages: [
				'Language detection failed'
			]});
		});

		it('Finds the record invalid (Detected language differs)', async () => {
			const validator = await validatorFactory(/^520$/);
			const record = new MarcRecord({
				fields: [
					{
						tag: '008',
						value: '151118t20162016fi^a|||^^^^^^^|0|^0|fin|^'
					},
					{
						tag: '041',
						ind1: ' ',
						ind2: ' ',
						subfields: [{code: 'a', value: 'fin'}]
					},
					{
						tag: '520',
						ind1: ' ',
						ind2: '',
						subfields: [{
							code: 'a',
							value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
						}]
					}
				]
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: false, messages: [
				'Item language code is invalid. Correct language code: eng'
			]});
		});

		it('Finds the record invalid (Detected language differs and has multiple suggestions)', async () => {
			const validator = await validatorFactory(/^520$/);
			const record = new MarcRecord({
				fields: [
					{
						tag: '041',
						ind1: ' ',
						ind2: ' ',
						subfields: [{code: 'a', value: 'eng'}]
					},
					{
						tag: '520',
						ind1: ' ',
						ind2: '',
						subfields: [{
							code: 'a',
							value: 'You should have received a copy of the GNU Affero General Public License along with this program. Mukana myös toimintaehdotuksia, joita Suomen tulee ajaa veroparatiisiongelman ratkaisemiseksi. Veroparatiisit on ajankohtainen tietopaketti veronkierron mekanismeista ja vaikutuksista.'
						}]
					}
				]
			});
			const result = await validator.validate(record);

			expect(result).to.eql({valid: false, messages: [
				'Item language code is invalid. Suggestions: fin, eng'
			]});
		});
	});

	describe('#fix', () => {
		it('Fixes the record', async () => {
			const validator = await validatorFactory(/^520$/);
			const record = new MarcRecord({
				fields: [
					{
						tag: '008',
						value: '151118t20162016fi^a|||^^^^^^^|0|^0|fin|^'
					},
					{
						tag: '041',
						ind1: ' ',
						ind2: ' ',
						subfields: [{code: 'a', value: 'eng'}]
					},
					{
						tag: '520',
						ind1: ' ',
						ind2: '',
						subfields: [{
							code: 'a',
							value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
						}]
					}
				]
			});
			await validator.fix(record);

			expect(record.fields).to.eql([
				{
					tag: '008',
					value: '151118t20162016fi^a|||^^^^^^^|0|^0|eng|^'
				},
				{
					tag: '041',
					ind1: ' ',
					ind2: ' ',
					subfields: [{code: 'a', value: 'eng'}]
				},
				{
					tag: '520',
					ind1: ' ',
					ind2: '',
					subfields: [{
						code: 'a',
						value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
					}]
				}
			]);
		});

		it('Fixes the record (Insert missing fields)', async () => {
			const validator = await validatorFactory(/^520$/);
			const record = new MarcRecord({
				fields: [
					{
						tag: '008',
						value: '151118t20162016fi^a|||^^^^^^^|0|^0|fin|^'
					},
					{
						tag: '520',
						ind1: ' ',
						ind2: '',
						subfields: [{
							code: 'a',
							value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
						}]
					}
				]
			});
			await validator.fix(record);

			expect(record.fields).to.eql([
				{
					tag: '008',
					value: '151118t20162016fi^a|||^^^^^^^|0|^0|eng|^'
				},
				{
					tag: '041',
					ind1: ' ',
					ind2: ' ',
					subfields: [{code: 'a', value: 'eng'}]
				},
				{
					tag: '520',
					ind1: ' ',
					ind2: '',
					subfields: [{
						code: 'a',
						value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
					}]
				}
			]);
		});

		it('Fixes the record (Insert missing subfields)', async () => {
			const validator = await validatorFactory(/^520$/);
			const record = new MarcRecord({
				fields: [
					{
						tag: '008',
						value: '151118t20162016fi^a|||^^^^^^^|0|^0|fin|^'
					},
					{
						tag: '041',
						ind1: ' ',
						ind2: ' ',
						subfields: [{code: 'b', value: 'foo'}]
					},
					{
						tag: '520',
						ind1: ' ',
						ind2: '',
						subfields: [{
							code: 'a',
							value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
						}]
					}
				]
			});
			await validator.fix(record);

			expect(record.fields).to.eql([
				{
					tag: '008',
					value: '151118t20162016fi^a|||^^^^^^^|0|^0|eng|^'
				},
				{
					tag: '041',
					ind1: ' ',
					ind2: ' ',
					subfields: [{code: 'a', value: 'eng'}, {code: 'b', value: 'foo'}]
				},
				{
					tag: '520',
					ind1: ' ',
					ind2: '',
					subfields: [{
						code: 'a',
						value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
					}]
				}
			]);
		});

		it('Fails to fix the record', async () => {
			const validator = await validatorFactory(/^520$/);
			const record = new MarcRecord({
				fields: [
					{
						tag: '520',
						ind1: ' ',
						ind2: '',
						subfields: [{
							code: 'a',
							value: '.'
						}]
					}
				]
			});

			try {
				await validator.fix(record);
			} catch (err) {
				expect(err.message).to.equal('Language code is missing and detection failed');
			}
		});
	});
});
