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

'use strict';

import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/ending-punctuation';

const {expect} = chai;
chai.use(chaiAsPromised);

// Factory validation
describe('ending-punctuation', () => {
	// Indicators and subfields validation
	describe('#validate: Indicators and subfields', () => {
		const recordValid = new MarcRecord({
			leader: '',
			fields: [{
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Elämäni ja tutkimusretkeni / '},
					{code: 'c', value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola.'},
					{code: '6', value: 'FOO'}
				]
			}, {
				tag: '337', // Range 336-338
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'käytettävissä ilman laitetta'},
					{code: 'b', value: 'n'},
					{code: '2', value: 'rdamedia'}
				]
			}, {
				tag: '500', // Range 500-509
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'FOO (Bar)'}
				]
			}]
		});

		const recordInvalid = new MarcRecord({
			leader: '',
			fields: [{
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Elämäni ja tutkimusretkeni / '},
					{code: 'c', value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'},
					{code: '6', value: 'FOO'}
				]
			}, {
				tag: '337',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'käytettävissä ilman laitetta'},
					{code: 'b', value: 'n.'}, // This can be abbreviation -> does not generate error
					{code: '2', value: 'rdamedia'}
				]
			}, {
				tag: '500',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'FOO (Bar).'}
				]
			}]
		});
		const recordBroken = new MarcRecord({
			leader: '',
			fields: [{
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'Elämäni ja tutkimusretkeni / '},
					{code: 'c', value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'},
					{code: '6', value: 'FOO'}
				]
			}, {
				tag: '337',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'käytettävissä ilman laitetta'},
					{code: 'b', value: 'n'}, // Dot removed from possible abbreviation as it cannot be removed in fixing
					{code: '2', value: 'rdamedia'}
				]
			}, {
				tag: '500',
				ind1: ' ',
				ind2: ' ',
				subfields: [
					{code: 'a', value: 'FOO (Bar).'}
				]
			}]
		});

		it('Finds the record valid', async () => {
			const validator = await validatorFactory();
			const result = await validator.validate(recordValid);
			expect(result.valid).to.eql(true);
		});

		it('Finds the record invalid', async () => {
			const validator = await validatorFactory();
			const result = await validator.validate(recordInvalid);
			expect(result).to.eql({
				message: ['Field 245 has invalid ending punctuation', 'Field 500 has invalid ending punctuation'],
				valid: false
			});
		});

		it('Repairs the invalid record', async () => {
			const validator = await validatorFactory();
			const result = await validator.fix(recordBroken);
			expect(recordBroken.equalsTo(recordValid)).to.eql(true);
			expect(result).to.eql({
				message: ['Field 245 has invalid ending punctuation', 'Field 500 has invalid ending punctuation'],
				fix: ['Field 245 - Added punctuation to $c', 'Field 500 - Removed double punctuation from $a'],
				valid: false
			});
		});
	});

	describe('#specials', () => {
		// "036 KYLLÄ vain osakentän $b jälkeen"
		// Can have subfields a and b, dot only after b
		describe('#036 TRUE - only after subfield $b', () => {
			// Valid tests
			const recordValid = new MarcRecord({
				leader: '',
				fields: [{
					tag: '036',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'CNRS 84115'},
						{code: 'b', value: 'Centre national de la recherche scientifique.'}
					]
				}]
			});

			const recordValidOnlyA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '036',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'CNRS 84115'}
					]
				}]
			});

			it('Finds record valid - Punc $b', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Only $a without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidOnlyA);
				expect(result.valid).to.eql(true);
			});

			// Invalid tests
			const recordInvalid = new MarcRecord({
				leader: '',
				fields: [{
					tag: '036',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'CNRS 84115'},
						{code: 'b', value: 'Centre national de la recherche scientifique'}
					]
				}]
			});

			const recordInvalidOnlyA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '036',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'CNRS 84115.'} // $a is register number, no change for abbreviation
					]
				}]
			});

			it('Finds record invalid - No punc $b', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid);
				expect(result).to.eql({
					message: ['Field 036 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - Only $a with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidOnlyA);
				expect(result).to.eql({
					message: ['Field 036 has invalid ending punctuation'],
					valid: false
				});
			});

			// Fix tests; invalid->valid
			it('Repairs the invalid record - Add punc $b', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);
				expect(recordInvalid.equalsTo(recordValid)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 036 has invalid ending punctuation'],
					fix: ['Field 036 - Added punctuation to $b'],
					valid: false
				});
			});

			it('Repairs the invalid record - Removes punc $a (register)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidOnlyA);
				expect(recordInvalidOnlyA.equalsTo(recordValidOnlyA)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 036 has invalid ending punctuation'],
					fix: ['Field 036 - Removed punctuation from $a'],
					valid: false
				});
			});
		});

		// "242 KYLLÄ Jos viimeinen osakenttä on $y, piste on ennen sitä" - Eli siis ei kentässä y (ennen sitä)
		describe('#242 TRUE - if last subfield $y, punc before it', () => {
			// Valid tests
			const recordValidOnlyA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '242',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'World of art.'},
						{code: 'y', value: 'eng'}
					]
				}]
			});

			const recordValidMultiple = new MarcRecord({
				leader: '',
				fields: [{
					tag: '242',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Annals of chemistry.'},
						{code: 'n', value: 'Series C,'},
						{code: 'p', value: 'Organic chemistry and biochemistry.'},
						{code: 'y', value: 'eng'}
					]
				}]
			});

			// "Suositellaan käytettäväksi myös osakenttää ‡y (käännöksen kielikoodi)." https://www.kiwi.fi/pages/viewpage.action?pageId=51282044
			const recordValidWithoutY = new MarcRecord({
				leader: '',
				fields: [{
					tag: '242',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'World of art.'}
					]
				}]
			});

			it('Finds record valid - Punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidOnlyA);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Punc $p', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidMultiple);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Punc $a without $y', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidWithoutY);
				expect(result.valid).to.eql(true);
			});

			// Invalid tests
			const recordInvalidOnlyAMissingA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '242',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'World of art'},
						{code: 'y', value: 'eng'}
					]
				}]
			});

			const recordInvalidOnlyAPuncY = new MarcRecord({
				leader: '',
				fields: [{
					tag: '242',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'World of art.'},
						{code: 'y', value: 'eng.'} // $y is also checked as rule is explicit
					]
				}]
			});

			const recordInvalidOnlyAMissingAPuncY = new MarcRecord({
				leader: '',
				fields: [{
					tag: '242',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'World of art'},
						{code: 'y', value: 'eng.'} // $y is also checked as rule is explicit
					]
				}]
			});

			const recordValidMultipleMissingP = new MarcRecord({
				leader: '',
				fields: [{
					tag: '242',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Annals of chemistry.'},
						{code: 'n', value: 'Series C,'},
						{code: 'p', value: 'Organic chemistry and biochemistry'},
						{code: 'y', value: 'eng'}
					]
				}]
			});

			// "Suositellaan käytettäväksi myös osakenttää ‡y (käännöksen kielikoodi)." https://www.kiwi.fi/pages/viewpage.action?pageId=51282044
			const recordValidWithoutYMissingA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '242',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'World of art'}
					]
				}]
			});

			it('Finds record invalid - No punc at $a (only before $y)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidOnlyAMissingA);
				expect(result).to.eql({
					message: ['Field 242 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - Punc at $y (Language field)', async () => { // $y is also checked as rule is explicit
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidOnlyAPuncY);
				expect(result).to.eql({
					message: ['Field 242 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - No punc at $a & punc $y', async () => { // $y is also checked as rule is explicit
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidOnlyAMissingAPuncY);
				expect(result).to.eql({
					message: ['Field 242 has invalid ending punctuation', 'Field 242 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - No punc $p (last before $y)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidMultipleMissingP);
				expect(result).to.eql({
					message: ['Field 242 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - No punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidWithoutYMissingA);
				expect(result).to.eql({
					message: ['Field 242 has invalid ending punctuation'],
					valid: false
				});
			});

			// Fix tests; invalid->valid
			it('Repairs the invalid record - Add punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidOnlyAMissingA);
				expect(recordInvalidOnlyAMissingA.equalsTo(recordValidOnlyA)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 242 has invalid ending punctuation'],
					fix: ['Field 242 - Added punctuation to $a'],
					valid: false
				});
			});

			it('Repairs the invalid record - Remove punc $y (Language field)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidOnlyAPuncY);
				expect(recordInvalidOnlyAPuncY.equalsTo(recordValidOnlyA)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 242 has invalid ending punctuation'],
					fix: ['Field 242 - Removed punctuation from $y'],
					valid: false
				});
			});

			it('Repairs the invalid record - Add punc $a & remove punc $y (Language field)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidOnlyAMissingAPuncY);
				expect(recordInvalidOnlyAMissingAPuncY.equalsTo(recordValidOnlyA)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 242 has invalid ending punctuation', 'Field 242 has invalid ending punctuation'],
					fix: ['Field 242 - Removed punctuation from $y', 'Field 242 - Added punctuation to $a'],
					valid: false
				});
			});

			it('Repairs the invalid record - Add punc $p', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValidMultipleMissingP);
				expect(recordValidMultipleMissingP.equalsTo(recordValidMultiple)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 242 has invalid ending punctuation'],
					fix: ['Field 242 - Added punctuation to $p'],
					valid: false
				});
			});

			it('Repairs the invalid record - Add punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValidWithoutYMissingA);
				expect(recordValidWithoutYMissingA.equalsTo(recordValidWithoutY)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 242 has invalid ending punctuation'],
					fix: ['Field 242 - Added punctuation to $a'],
					valid: false
				});
			});
		});

		// "260 KYLLÄ Pääsääntö: $a : $b, $c. Tarkista eri poikkeukset ja välimerkitys MARC 21 Full -versiosta"
		// Punc only if last subfield c
		describe('#260 TRUE - Punc only if last subfield c', () => {
			// Valid tests
			const recordValidEndC = new MarcRecord({
				leader: '',
				fields: [{
					tag: '260',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Helsinki'},
						{code: 'b', value: 'Suomen atk-kustannus,'},
						{code: 'c', value: '1982.'}
					]
				}]
			});

			const recordValidEndG = new MarcRecord({
				leader: '',
				fields: [{
					tag: '260',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'London'},
						{code: 'b', value: 'Macmillan,'},
						{code: 'c', value: '1971'},
						{code: 'g', value: '(1973 printing)'}
					]
				}]
			});

			const recordValidEndB = new MarcRecord({
				leader: '',
				fields: [{
					tag: '260',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: '3', value: 'June 1993-'},
						{code: 'a', value: 'London'},
						{code: 'b', value: 'Elle'}
					]
				}]
			});

			it('Finds record valid - Punc $c', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidEndC);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Punc char $g (after $c)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidEndG);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - No punc $b', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidEndB);
				expect(result.valid).to.eql(true);
			});

			// Invalid tests
			const recordInvalidEndC = new MarcRecord({
				leader: '',
				fields: [{
					tag: '260',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Helsinki'},
						{code: 'b', value: 'Suomen atk-kustannus,'},
						{code: 'c', value: '1982'}
					]
				}]
			});

			const recordInvalidEndGDouble = new MarcRecord({
				leader: '',
				fields: [{
					tag: '260',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'London'},
						{code: 'b', value: 'Macmillan,'},
						{code: 'c', value: '1971'},
						{code: 'g', value: '(1973 printing).'}
					]
				}]
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidEndC);
				expect(result).to.eql({
					message: ['Field 260 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidEndGDouble);
				expect(result).to.eql({
					message: ['Field 260 has invalid ending punctuation'],
					valid: false
				});
			});

			// Fix tests; invalid->valid
			it('Repairs the invalid record - Add punc $c', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidEndC);
				expect(recordInvalidEndC.equalsTo(recordValidEndC)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 260 has invalid ending punctuation'],
					fix: ['Field 260 - Added punctuation to $c'],
					valid: false
				});
			});

			it('Repairs the invalid record - Remove double punc $g', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidEndGDouble);
				expect(recordInvalidEndGDouble.equalsTo(recordValidEndG)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 260 has invalid ending punctuation'],
					fix: ['Field 260 - Removed double punctuation from $g'],
					valid: false
				});
			});
		});

		// 264-kenttään tulee loppupiste, JOS on käytetty osakenttää ‡c tuotantoajan, julkaisuajan,
		// jakeluajan tai valmistusajan ilmaisemiseen (2. indikaattori = 0, 1, 2 tai 3) JA osakenttä ‡c
		// ei pääty hakasulkuun ']' tai tavuviivaan '-'   tai kaarisulkuun ')'  tai kysymysmerkkiin '?'

		// Copyright-vuoden kanssa ei käytetä loppupistettä (2. indikaattori = 4).

		// Esimerkit
		// 264 #0 ‡a [Vantaa?] : ‡b [Olli Kela], ‡c [2011?]
		// 264 #1 ‡a Helsinki : ‡b Helsingin yliopisto, ‡c 1992-
		// 264 #1 ‡a Helsinki : ‡b Helsingin yliopisto, ‡c 1995-2006.   ← loppupiste
		// 264 #2 ‡a Kouvola : ‡b Nuorisovirasto
		// 264 #3 ‡a Lahti : ‡b Valtion monistuskeskus, ‡c 1965.  ← loppupiste
		describe('#264 TRUE - If ind2 === 0, 1, 2 or 3, punc at the end', () => {
			// Valid tests
			const recordValidInd2v1 = new MarcRecord({
				leader: '',
				fields: [{
					tag: '264',
					ind1: '#',
					ind2: '1',
					subfields: [
						{code: 'a', value: 'Helsinki'},
						{code: 'b', value: 'Helsingin yliopisto'},
						{code: 'c', value: '1995-2006.'}
					]
				}]
			});

			const recordValidInd2v1Short = new MarcRecord({
				leader: '',
				fields: [{
					tag: '264',
					ind1: '#',
					ind2: '1',
					subfields: [
						{code: 'a', value: 'Helsinki'},
						{code: 'b', value: 'Helsingin yliopisto'},
						{code: 'c', value: '1995-'}
					]
				}]
			});

			const recordValidInd2v2WithoutC = new MarcRecord({
				leader: '',
				fields: [{
					tag: '264',
					ind1: '#',
					ind2: '2',
					subfields: [
						{code: 'a', value: 'Kouvola'},
						{code: 'b', value: 'Nuorisovirasto'}
					]
				}]
			});

			const recordValidCopyright = new MarcRecord({
				leader: '',
				fields: [{
					tag: '264',
					ind1: ' ',
					ind2: '4',
					subfields: [
						{code: 'a', value: 'Helsinki : '},
						{code: 'b', value: 'Suomen poliisikoirayhdistys.'},
						{code: 'c', value: '© 1974'}
					]
				}]
			});

			it('Finds record valid - Ind2 = 1, $c 1995-2006.', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidInd2v1);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Ind2 = 1, $c 1995-', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidInd2v1Short);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Ind2 = 2, no $c', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidInd2v2WithoutC);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Ind2 = 4, copyright', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidCopyright);
				expect(result.valid).to.eql(true);
			});

			const recordInvalidInd2v1 = new MarcRecord({
				leader: '',
				fields: [{
					tag: '264',
					ind1: '#',
					ind2: '1',
					subfields: [
						{code: 'a', value: 'Helsinki'},
						{code: 'b', value: 'Helsingin yliopisto'},
						{code: 'c', value: '1995-2006'}
					]
				}]
			});

			const recordInvalidCopyrightCExtra = new MarcRecord({
				leader: '',
				fields: [{
					tag: '264',
					ind1: ' ',
					ind2: '4',
					subfields: [
						{code: 'a', value: 'Helsinki : '},
						{code: 'b', value: 'Suomen poliisikoirayhdistys.'},
						{code: 'c', value: '© 1974.'}
					]
				}]
			});

			it('Finds record invalid - No punc $c', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidInd2v1);
				expect(result).to.eql({
					message: ['Field 264 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - Ind2 = 4, copyright, extra punc $c', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidCopyrightCExtra);
				expect(result).to.eql({
					message: ['Field 264 has invalid ending punctuation'],
					valid: false
				});
			});

			// Fix tests; invalid->valid
			it('Repairs the invalid record - Add punc $c', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidInd2v1);
				expect(recordInvalidInd2v1.equalsTo(recordValidInd2v1)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 264 has invalid ending punctuation'],
					fix: ['Field 264 - Added punctuation to $c'],
					valid: false
				});
			});

			it('Repairs the invalid record - Remove punc $c ($c has ©, should not have punc)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidCopyrightCExtra);
				expect(recordInvalidCopyrightCExtra.equalsTo(recordValidCopyright)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 264 has invalid ending punctuation'],
					fix: ['Field 264 - Removed punctuation from $c'],
					valid: false
				});
			});
		});

		// "340 KYLLÄ Vain joidenkin osakenttien jälkeen. Tarkista osakentät MARC 21 Full -versiosta
		// -b: Piste aina osakentän loppuun
		// - a, d, e, f, h, i: Piste näistä viimeisen osakentän loppuun"
		// This doesn't match spec at all, but these rules were provided (https://www.kansalliskirjasto.fi/extra/marc21/bib/3XX.htm#340)
		describe('#340 TRUE - Punc at $b always and to last of [$a, $d, $e, $f, $h, $i]', () => {
			// Valid tests
			const recordValidA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '340',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'marble.'}
					]
				}]
			});

			const recordValidAB = new MarcRecord({
				leader: '',
				fields: [{
					tag: '340',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'parchment.'}, // This punc doesn't match example: https://www.kansalliskirjasto.fi/extra/marc21/bib/3XX.htm#340
						{code: 'b', value: '20 cm. folded to 10 x 12 cm.'}
					]
				}]
			});

			const recordValidDD = new MarcRecord({
				leader: '',
				fields: [{
					tag: '340',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'd', value: 'handwritten'},
						{code: 'd', value: 'typed.'}
					]
				}]
			});

			const recordValidComplex = new MarcRecord({
				leader: '',
				fields: [{
					tag: '340',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'wove paper'},
						{code: 'c', value: 'ink'},
						{code: 'c', value: 'gouache'},
						{code: 'd', value: 'lithography'},
						{code: 'd', value: 'collage.'}, // This punc doesn't match example: https://www.kansalliskirjasto.fi/extra/marc21/bib/3XX.htm#340
						{code: 'g', value: 'polychrome'}
					]
				}]
			});

			const recordValidJ2 = new MarcRecord({
				leader: '',
				fields: [{
					tag: '340',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'j', value: 'original'},
						{code: '2', value: 'rda'}
					]
				}]
			});

			it('Finds record valid - Punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidA);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Punc $a (last) & punc $b (mandatory)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidAB);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Punc $d (last of two)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidDD);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Punc $d (last of two) followed by $g', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidComplex);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - No punc (not $b, nor from list)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidJ2);
				expect(result.valid).to.eql(true);
			});

			// Invalid tests
			const recordInvalidA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '340',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'marble'}
					]
				}]
			});

			const recordInvalidAMissingB = new MarcRecord({
				leader: '',
				fields: [{
					tag: '340',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'parchment'}, // This punc doesn't match example: https://www.kansalliskirjasto.fi/extra/marc21/bib/3XX.htm#340
						{code: 'b', value: '20 cm. folded to 10 x 12 cm.'}
					]
				}]
			});

			const recordInvalidABMissing = new MarcRecord({
				leader: '',
				fields: [{
					tag: '340',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'parchment.'}, // This punc doesn't match example: https://www.kansalliskirjasto.fi/extra/marc21/bib/3XX.htm#340
						{code: 'b', value: '20 cm. folded to 10 x 12 cm'}
					]
				}]
			});

			const recordInvalidDDMissing = new MarcRecord({
				leader: '',
				fields: [{
					tag: '340',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'd', value: 'handwritten'},
						{code: 'd', value: 'typed'}
					]
				}]
			});

			const recordInvalidComplexDMissing = new MarcRecord({
				leader: '',
				fields: [{
					tag: '340',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'wove paper'},
						{code: 'c', value: 'ink'},
						{code: 'c', value: 'gouache'},
						{code: 'd', value: 'lithography'},
						{code: 'd', value: 'collage'}, // This punc doesn't match example: https://www.kansalliskirjasto.fi/extra/marc21/bib/3XX.htm#340
						{code: 'g', value: 'polychrome'}
					]
				}]
			});

			it('Finds record invalid - No punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidA);
				expect(result).to.eql({
					message: ['Field 340 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - No punc $a (last)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidAMissingB);
				expect(result).to.eql({
					message: ['Field 340 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - No punc $b (mandatory)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidABMissing);
				expect(result).to.eql({
					message: ['Field 340 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - No punc $d (last of two)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidDDMissing);
				expect(result).to.eql({
					message: ['Field 340 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - No punc $d (last of two) followed by $g', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidComplexDMissing);
				expect(result).to.eql({
					message: ['Field 340 has invalid ending punctuation'],
					valid: false
				});
			});

			// Fix tests; invalid->valid
			it('Repairs the invalid record - Add punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidA);
				expect(recordInvalidA.equalsTo(recordInvalidA)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 340 has invalid ending punctuation'],
					fix: ['Field 340 - Added punctuation to $a'],
					valid: false
				});
			});

			it('Repairs the invalid record - Add punc $a (last)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidAMissingB);
				expect(recordInvalidAMissingB.equalsTo(recordValidAB)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 340 has invalid ending punctuation'],
					fix: ['Field 340 - Added punctuation to $a'],
					valid: false
				});
			});

			it('Repairs the invalid record - Add punc $b (mandatory)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidABMissing);
				expect(recordInvalidABMissing.equalsTo(recordValidAB)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 340 has invalid ending punctuation'],
					fix: ['Field 340 - Added punctuation to $b'],
					valid: false
				});
			});

			it('Repairs the invalid record - Add punc $d (last of two)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidDDMissing);
				expect(recordInvalidDDMissing.equalsTo(recordValidDD)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 340 has invalid ending punctuation'],
					fix: ['Field 340 - Added punctuation to $d'],
					valid: false
				});
			});

			it('Repairs the invalid record - Add punc $d (last of list)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidComplexDMissing);
				expect(recordInvalidComplexDMissing.equalsTo(recordInvalidComplexDMissing)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 340 has invalid ending punctuation'],
					fix: ['Field 340 - Added punctuation to $d'],
					valid: false
				});
			});
		});

		// "520 KYLLÄ Jos viimeinen osakenttä on $u, piste on ennen sitä" (Sama kuin 242, $y)
		describe('#520 TRUE - If last subfield $u, punc before it', () => {
			// Valid tests
			const recordValid = new MarcRecord({
				leader: '',
				fields: [{
					tag: '520',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Mediaväkivalta ja sen yleisö.'}
					]
				}]
			});

			const recordValidWithU = new MarcRecord({
				leader: '',
				fields: [{
					tag: '520',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Abstrakti.'}, // This does not match example: https://www.kansalliskirjasto.fi/extra/marc21/bib/50X-53X.htm#520
						{code: 'u', value: 'http://www.ojp.usdoj.gov/bjs/abstract/cchrie98.htm'}
					]
				}]
			});

			const recordValidU = new MarcRecord({
				leader: '',
				fields: [{
					tag: '520',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Abstrakti.'}, // This does not match example: https://www.kansalliskirjasto.fi/extra/marc21/bib/50X-53X.htm#520
						{code: 'u', value: 'http://www.ojp.usdoj.gov/bjs/abstract/cchrie98.htm.'}
					]
				}]
			});

			it('Finds record valid - Punc $a (without $u)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Punc $a (with $u) ', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidWithU);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Punc $a & $u (punc at $u should be ignored) ', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidU);
				expect(result.valid).to.eql(true);
			});

			// Invalid tests
			const recordInvalid = new MarcRecord({
				leader: '',
				fields: [{
					tag: '520',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Mediaväkivalta ja sen yleisö'}
					]
				}]
			});

			const recordInvalidWithU = new MarcRecord({
				leader: '',
				fields: [{
					tag: '520',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Abstrakti'},
						{code: 'u', value: 'http://www.ojp.usdoj.gov/bjs/abstract/cchrie98.htm'}
					]
				}]
			});

			it('Finds record invalid - No punc $a (without $u)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid);
				expect(result).to.eql({
					message: ['Field 520 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - No punc $a (with $u)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidWithU);
				expect(result).to.eql({
					message: ['Field 520 has invalid ending punctuation'],
					valid: false
				});
			});

			// Fix tests; invalid->valid
			it('Repairs the invalid record - Add punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);
				expect(recordInvalid.equalsTo(recordValid)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 520 has invalid ending punctuation'],
					fix: ['Field 520 - Added punctuation to $a'],
					valid: false
				});
			});

			it('Repairs the invalid record - Add punc $a (last before $u)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidWithU);
				expect(recordInvalidWithU.equalsTo(recordValidWithU)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 520 has invalid ending punctuation'],
					fix: ['Field 520 - Added punctuation to $a'],
					valid: false
				});
			});
		});

		// "538 KYLLÄ Jos viimeinen osakenttä on $u, piste on ennen sitä" (Sama kuin 520)
		// Eli piste merkitään vikaan osakenttään as usual, mutta ennen *y*-osakenttää
		// (speksin mukaan y->u) https://www.kansalliskirjasto.fi/extra/marc21/bib/53X-58X.htm#538
		describe('#538 TRUE - If last subfield $u, punc before it', () => {
			// Valid tests
			const recordValid = new MarcRecord({
				leader: '',
				fields: [{
					tag: '538',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Project methodology for digital version'},
						{code: 'i', value: 'Technical details.'}, // This ended to ':' in examples, but it doesn't match statet rules: https://www.kansalliskirjasto.fi/extra/marc21/bib/53X-58X.htm#538
						{code: 'u', value: 'http://www.columbia.edu/dlc/linglung/methodology.html'}
					]
				}]
			});

			const recordValidPuncU = new MarcRecord({
				leader: '',
				fields: [{
					tag: '538',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Project methodology for digital version'},
						{code: 'i', value: 'Technical details.'},
						{code: 'u', value: 'http://www.columbia.edu/dlc/linglung/methodology.html.'}
					]
				}]
			});

			const recordValidOnlyA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '538',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'SECAM-videolaite.'}
					]
				}]
			});

			it('Finds record valid - Punc $i (last before $u)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Punc $i & punc $u ($u is URL, should pass)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidPuncU);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidOnlyA);
				expect(result.valid).to.eql(true);
			});

			// Invalid tests
			const recordInvalidMissingI = new MarcRecord({
				leader: '',
				fields: [{
					tag: '538',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Project methodology for digital version'},
						{code: 'i', value: 'Technical details'},
						{code: 'u', value: 'http://www.columbia.edu/dlc/linglung/methodology.html'}
					]
				}]
			});

			const recordInvalidI = new MarcRecord({
				leader: '',
				fields: [{
					tag: '538',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Project methodology for digital version'},
						{code: 'i', value: 'Technical details:'}, // This is actually like in examples, but it doesn't match statet rules: https://www.kansalliskirjasto.fi/extra/marc21/bib/53X-58X.htm#538
						{code: 'u', value: 'http://www.columbia.edu/dlc/linglung/methodology.html'}
					]
				}]
			});

			const recordInvalidOnlyA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '538',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'SECAM-videolaite'}
					]
				}]
			});

			it('Finds record invalid - No punc $i (last before $u)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidMissingI);
				expect(result).to.eql({
					message: ['Field 538 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - Invalid punc $i (":" not valid punc mark, but this is according example...)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidI);
				expect(result).to.eql({
					message: ['Field 538 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - No punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidOnlyA);
				expect(result).to.eql({
					message: ['Field 538 has invalid ending punctuation'],
					valid: false
				});
			});

			// Fix tests; invalid->valid
			it('Repairs the invalid record - Add punc $i (last)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidMissingI);
				expect(recordInvalidMissingI.equalsTo(recordValid)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 538 has invalid ending punctuation'],
					fix: ['Field 538 - Added punctuation to $i'],
					valid: false
				});
			});

			it('Repairs the invalid record - Add punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidOnlyA);
				expect(recordInvalidOnlyA.equalsTo(recordValidOnlyA)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 538 has invalid ending punctuation'],
					fix: ['Field 538 - Added punctuation to $a'],
					valid: false
				});
			});
		});

		// "567 KYLLÄ osakentän $a jälkeen, EI muiden osakenttien jälkeen"
		// Only if last subfield $a
		describe('#567 TRUE - After subfield $a, FALSE after others', () => {
			// Valid tests
			const recordValid = new MarcRecord({
				leader: '',
				fields: [{
					tag: '567',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Narratiivinen tutkimus.'}
					]
				}]
			});

			const recordValidWithoutA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '567',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'b', value: 'Narrative inquiry'},
						{code: '2', value: 'lcsh'}
					]
				}]
			});

			it('Finds record valid - Punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - No punc $b (only data field)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidWithoutA);
				expect(result.valid).to.eql(true);
			});

			// Invalid tests
			const recordInvalid = new MarcRecord({
				leader: '',
				fields: [{
					tag: '567',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Narratiivinen tutkimus'}
					]
				}]
			});

			const recordInvalidWithoutA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '567',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'b', value: 'Narrative inquiry.'},
						{code: '2', value: 'lcsh'}
					]
				}]
			});

			it('Finds record invalid - No punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid);
				expect(result).to.eql({
					message: ['Field 567 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - Punc $b (only data field)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidWithoutA);
				expect(result).to.eql({
					message: ['Field 567 has invalid ending punctuation'],
					valid: false
				});
			});

			// Fix tests; invalid->valid
			it('Repairs the invalid record - Add punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);
				expect(recordInvalid.equalsTo(recordValid)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 567 has invalid ending punctuation'],
					fix: ['Field 567 - Added punctuation to $a'],
					valid: false
				});
			});

			it('Repairs the invalid record - Remove punc $b (only data field)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidWithoutA);
				expect(recordInvalidWithoutA.equalsTo(recordValidWithoutA)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 567 has invalid ending punctuation'],
					fix: ['Field 567 - Removed punctuation from $b'],
					valid: false
				});
			});
		});

		// "647-651 EI - EI suomalaisten sanastojen termeihin, muihin sanaston käytännön mukaan, yleensä KYLLÄ"
		// Finnish terms at $2:['ysa', 'yso', 'kassu', 'seko', 'valo', 'kulo', 'puho', 'oiko', 'mero', 'liito', 'fast', 'allars']
		// Default TRUE, until more special cases are added
		describe('#647-651 FALSE - If finnish, else TRUE', () => {
			// Valid tests
			const recordValid647FastEndPunc = new MarcRecord({
				leader: '',
				fields: [{
					tag: '647',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Hurricane Katrina'},
						{code: 'd', value: '(2005)'},
						{code: '2', value: 'fast'}
					]
				}]
			});

			const recordVali648dFinNo = new MarcRecord({
				leader: '',
				fields: [{
					tag: '648',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: '1900-luku'},
						{code: '2', value: 'yso/swe'}
					]
				}]
			});

			const recordValid648FastNo = new MarcRecord({
				leader: '',
				fields: [{
					tag: '648',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: '1862'},
						{code: '2', value: 'fast'} // https://www.kansalliskirjasto.fi/extra/marc21/bib/6XX.htm#648
					]
				}]
			});

			const recordValid650FinNo = new MarcRecord({
				leader: '',
				fields: [{
					tag: '650',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'kirjastot'},
						{code: 'x', value: 'atk-järjestelmät'},
						{code: '2', value: 'kauno/fin'}
					]
				}]
			});

			const recordValid650EngNoControl = new MarcRecord({
				leader: '',
				fields: [{
					tag: '650',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Flour industry'},
						{code: 'v', value: 'Periodicals.'}
					]
				}]
			});

			const recordValid650EngControl = new MarcRecord({
				leader: '',
				fields: [{
					tag: '650',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Career Exploration.'},
						{code: '2', value: 'ericd'}
					]
				}]
			});

			it('Finds record valid - 647 Fast, punc char at end', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid647FastEndPunc);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - 648 Finnish, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordVali648dFinNo);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - 648 Fast, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid648FastNo);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - 650 Finnish, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid650FinNo);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - 650 English, punc (no control)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid650EngNoControl);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - 650 English, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid650EngControl);
				expect(result.valid).to.eql(true);
			});

			// Invalid tests
			const recordInvalid647FastEndPunc = new MarcRecord({
				leader: '',
				fields: [{
					tag: '647',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Hurricane Katrina'},
						{code: 'd', value: '(2005).'},
						{code: '2', value: 'fast'}
					]
				}]
			});

			const recordInvali648dFinYes = new MarcRecord({
				leader: '',
				fields: [{
					tag: '648',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: '1900-luku.'},
						{code: '2', value: 'yso/swe'}
					]
				}]
			});

			const recordInvalid648FastYes = new MarcRecord({
				leader: '',
				fields: [{
					tag: '648',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: '1862.'},
						{code: '2', value: 'fast'}
					]
				}]
			});

			const recordInvalid650FinYes = new MarcRecord({
				leader: '',
				fields: [{
					tag: '650',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'kirjastot'},
						{code: 'x', value: 'atk-järjestelmät.'},
						{code: '2', value: 'kauno/fin'}
					]
				}]
			});

			const recordInvalid650EngNoControl = new MarcRecord({
				leader: '',
				fields: [{
					tag: '650',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Flour industry'},
						{code: 'v', value: 'Periodicals'}
					]
				}]
			});

			const recordInvalid650EngControl = new MarcRecord({
				leader: '',
				fields: [{
					tag: '650',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Career Exploration'},
						{code: '2', value: 'ericd'}
					]
				}]
			});

			it('Finds record invalid - 647 Fast, dot at end', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid647FastEndPunc);
				expect(result).to.eql({
					message: ['Field 647 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - 648 Finnish, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvali648dFinYes);
				expect(result).to.eql({
					message: ['Field 648 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - 648 Fast, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid648FastYes);
				expect(result).to.eql({
					message: ['Field 648 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - 650 Finnish, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid650FinYes);
				expect(result).to.eql({
					message: ['Field 650 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - 650 !Finnish, without punc (no control)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid650EngNoControl);
				expect(result).to.eql({
					message: ['Field 650 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - 650 !Finnish, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid650EngControl);
				expect(result).to.eql({
					message: ['Field 650 has invalid ending punctuation'],
					valid: false
				});
			});

			// Fix tests; invalid->valid
			it('Repairs the invalid record - 647 Fast, removes double punc $d', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid647FastEndPunc);
				expect(recordInvalid647FastEndPunc.equalsTo(recordValid647FastEndPunc)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 647 has invalid ending punctuation'],
					fix: ['Field 647 - Removed double punctuation from $d'],
					valid: false
				});
			});

			it('Repairs the invalid record - 648 Finnish, removes punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvali648dFinYes);
				expect(recordInvali648dFinYes.equalsTo(recordVali648dFinNo)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 648 has invalid ending punctuation'],
					fix: ['Field 648 - Removed punctuation from $a'],
					valid: false
				});
			});

			it('Repairs the invalid record - 648 Fast, removes punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid648FastYes);
				expect(recordInvalid648FastYes.equalsTo(recordValid648FastNo)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 648 has invalid ending punctuation'],
					fix: ['Field 648 - Removed punctuation from $a'],
					valid: false
				});
			});

			it('Repairs the invalid record - 650 Finnish, removes punc $x', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid650FinYes);
				expect(recordInvalid650FinYes.equalsTo(recordValid650FinNo)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 650 has invalid ending punctuation'],
					fix: ['Field 650 - Removed punctuation from $x'],
					valid: false
				});
			});

			it('Repairs the invalid record - 650 !Finnish, add punc $v (no control)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid650EngNoControl);
				expect(recordInvalid650EngNoControl.equalsTo(recordValid650EngNoControl)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 650 has invalid ending punctuation'],
					fix: ['Field 650 - Added punctuation to $v'],
					valid: false
				});
			});

			it('Repairs the invalid record - 650 !Finnish, add punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid650EngControl);
				expect(recordInvalid650EngControl.equalsTo(recordValid650EngControl)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 650 has invalid ending punctuation'],
					fix: ['Field 650 - Added punctuation to $a'],
					valid: false
				});
			});
		});

		// "654-662 EI - EI suomalaisten sanastojen termeihin, muihin sanaston käytännön mukaan, yleensä KYLLÄ"
		// Finnish terms at $2:['ysa', 'yso', 'kassu', 'seko', 'valo', 'kulo', 'puho', 'oiko', 'mero', 'liito', 'fast', 'allars']
		// Default TRUE, until more special cases are added
		describe('#654-662 TRUE - If finnish, else TRUE', () => {
			// Valid tests
			const recordValid655FinNo = new MarcRecord({
				leader: '',
				fields: [{
					tag: '655',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'kausijulkaisut'},
						{code: '2', value: 'yso/eng'}
					]
				}]
			});

			const recordValid655FinNo2 = new MarcRecord({
				leader: '',
				fields: [{
					tag: '655',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'vironkielinen kirjallisuus'},
						{code: '2', value: 'local'}
					]
				}]
			});

			const recordValid655EngYes = new MarcRecord({
				leader: '',
				fields: [{
					tag: '655',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Bird\'s-eye views'},
						{code: 'y', value: '1874.'},
						{code: '2', value: 'gmgpc'}
					]
				}]
			});

			const recordValid655EngYesNoControl = new MarcRecord({
				leader: '',
				fields: [{
					tag: '655',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Diaries.'}
					]
				}]
			});

			const recordValid656FinNo = new MarcRecord({
				leader: '',
				fields: [{
					tag: '656',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'kuvaamataidonopettajat'},
						{code: '2', value: 'slm/eng'}
					]
				}]
			});

			const recordValid657EngYes = new MarcRecord({
				leader: '',
				fields: [{
					tag: '657',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Personnel benefits management'},
						{code: 'x', value: 'Vital statistics'},
						{code: 'z', value: 'Love Canal, New York.'},
						{code: '2', value: 'New York State Management Functions Index'}
					]
				}]
			});

			const recordValid658EngYes = new MarcRecord({
				leader: '',
				fields: [{
					tag: '658',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Math manipulatives'},
						{code: 'd', value: 'highly correlated.'},
						{code: '2', value: '[source code]'}
					]
				}]
			});

			const recordValid662EngYes = new MarcRecord({
				leader: '',
				fields: [{
					tag: '662',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Antarctica.'},
						{code: '2', value: 'lcsh/naf'}
					]
				}]
			});

			it('Finds record valid - 655 Finnish, no punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid655FinNo);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - 655 Finnish, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid655FinNo2);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - 655 English, with punc $y', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid655EngYes);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - 655 English, with punc $a (no control)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid655EngYesNoControl);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - 656 Finnish, without punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid656FinNo);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - 657 English, with punc $z', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid657EngYes);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - 658 English, with punc $d', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid658EngYes);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - 662 English, with punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid662EngYes);
				expect(result.valid).to.eql(true);
			});

			// Invalid tests
			const recordInvalid655FinYes = new MarcRecord({
				leader: '',
				fields: [{
					tag: '655',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'kausijulkaisut.'},
						{code: '2', value: 'yso/eng'}
					]
				}]
			});

			const recordInvalid655FinYes2 = new MarcRecord({
				leader: '',
				fields: [{
					tag: '655',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'vironkielinen kirjallisuus.'},
						{code: '2', value: 'local'}
					]
				}]
			});

			const recordInvalid655EngNo = new MarcRecord({
				leader: '',
				fields: [{
					tag: '655',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Bird\'s-eye views'},
						{code: 'y', value: '1874'},
						{code: '2', value: 'gmgpc'}
					]
				}]
			});

			const recordInvalid655EngNoNoControl = new MarcRecord({
				leader: '',
				fields: [{
					tag: '655',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Diaries'}
					]
				}]
			});

			const recordInvalid656FinYes = new MarcRecord({
				leader: '',
				fields: [{
					tag: '656',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'kuvaamataidonopettajat.'},
						{code: '2', value: 'slm/eng'}
					]
				}]
			});

			const recordInvalid657EngNo = new MarcRecord({
				leader: '',
				fields: [{
					tag: '657',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Personnel benefits management'},
						{code: 'x', value: 'Vital statistics'},
						{code: 'z', value: 'Love Canal, New York'},
						{code: '2', value: 'New York State Management Functions Index'}
					]
				}]
			});

			const recordInvalid658EngNo = new MarcRecord({
				leader: '',
				fields: [{
					tag: '658',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Math manipulatives'},
						{code: 'd', value: 'highly correlated'},
						{code: '2', value: '[source code]'}
					]
				}]
			});

			const recordInvalid662EngNo = new MarcRecord({
				leader: '',
				fields: [{
					tag: '662',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Antarctica'},
						{code: '2', value: 'lcsh/naf'}
					]
				}]
			});

			it('Finds record invalid - 655 Finnish, punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid655FinYes);
				expect(result).to.eql({
					message: ['Field 655 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - 655 Finnish, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid655FinYes2);
				expect(result).to.eql({
					message: ['Field 655 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - 655 !Finnish, without punc $y', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid655EngNo);
				expect(result).to.eql({
					message: ['Field 655 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - 655 !Finnish, without punc $a (no control)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid655EngNoNoControl);
				expect(result).to.eql({
					message: ['Field 655 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - 656 Finnish, with punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid656FinYes);
				expect(result).to.eql({
					message: ['Field 656 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - 657 !Finnish, without punc $z', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid657EngNo);
				expect(result).to.eql({
					message: ['Field 657 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - 658 !Finnish, without punc $d', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid658EngNo);
				expect(result).to.eql({
					message: ['Field 658 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - 662 !Finnish, without punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid662EngNo);
				expect(result).to.eql({
					message: ['Field 662 has invalid ending punctuation'],
					valid: false
				});
			});

			// Fix tests; invalid->valid
			it('Repairs the invalid record - 655 Finnish, remove punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid655FinYes);
				expect(recordInvalid655FinYes.equalsTo(recordValid655FinNo)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 655 has invalid ending punctuation'],
					fix: ['Field 655 - Removed punctuation from $a'],
					valid: false
				});
			});

			it('Repairs the invalid record - 655 Finnish, removes punc $a 2', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid655FinYes2);
				expect(recordInvalid655FinYes2.equalsTo(recordValid655FinNo2)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 655 has invalid ending punctuation'],
					fix: ['Field 655 - Removed punctuation from $a'],
					valid: false
				});
			});

			it('Repairs the invalid record - 655 !Finnish, add punc $y', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid655EngNo);
				expect(recordInvalid655EngNo.equalsTo(recordValid655EngYes)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 655 has invalid ending punctuation'],
					fix: ['Field 655 - Added punctuation to $y'],
					valid: false
				});
			});

			it('Repairs the invalid record - 655 !Finnish, add punc $a (no control)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid655EngNoNoControl);
				expect(recordInvalid655EngNoNoControl.equalsTo(recordValid655EngYesNoControl)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 655 has invalid ending punctuation'],
					fix: ['Field 655 - Added punctuation to $a'],
					valid: false
				});
			});

			it('Repairs the invalid record - 656 Finnish, remove punc $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid656FinYes);
				expect(recordInvalid656FinYes.equalsTo(recordValid656FinNo)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 656 has invalid ending punctuation'],
					fix: ['Field 656 - Removed punctuation from $a'],
					valid: false
				});
			});

			it('Repairs the invalid record - 657 !Finnish, add punc $z', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid657EngNo);
				expect(recordInvalid657EngNo.equalsTo(recordValid657EngYes)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 657 has invalid ending punctuation'],
					fix: ['Field 657 - Added punctuation to $z'],
					valid: false
				});
			});

			it('Repairs the invalid record - 658 !Finnish, add punc $d', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid658EngNo);
				expect(recordInvalid658EngNo.equalsTo(recordValid658EngYes)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 658 has invalid ending punctuation'],
					fix: ['Field 658 - Added punctuation to $d'],
					valid: false
				});
			});

			it('Repairs the invalid record - 662 !Finnish, add pun $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid662EngNo);
				expect(recordInvalid662EngNo.equalsTo(recordValid662EngYes)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 662 has invalid ending punctuation'],
					fix: ['Field 662 - Added punctuation to $a'],
					valid: false
				});
			});
		});

		// "760-787 KYLLÄ osakentän $a jälkeen, EI muiden osakenttien jälkeen" (kuten 567)
		// Only if last subfield $a
		describe('#760-787 TRUE - After subfield $a, FALSE after others', () => {
			// Valid tests
			const recordValid = new MarcRecord({
				leader: '',
				fields: [{
					tag: '760',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Mellor, Alec.'},
						{code: 't', value: 'Strange masonic stories'},
						{code: 'e', value: 'eng'}
					]
				}]
			});

			const recordValidOnlyA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '760',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Mellor, Alec.'}
					]
				}]
			});

			it('Finds record valid - Punc $a, but following fields, $e no punc (last)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidOnlyA);
				expect(result.valid).to.eql(true);
			});

			// Invalid tests
			const recordInvalid = new MarcRecord({
				leader: '',
				fields: [{
					tag: '760',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Mellor, Alec.'},
						{code: 't', value: 'Strange masonic stories'},
						{code: 'e', value: 'eng.'}
					]
				}]
			});

			const recordInvalidOnlyA = new MarcRecord({
				leader: '',
				fields: [{
					tag: '760',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: 'Mellor, Alec'}
					]
				}]
			});

			it('Finds record invalid - Punc $e (language field, strict)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid);
				expect(result).to.eql({
					message: ['Field 760 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - No punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidOnlyA);
				expect(result).to.eql({
					message: ['Field 760 has invalid ending punctuation'],
					valid: false
				});
			});

			// Fix tests; invalid->valid
			it('Repairs the invalid record - Remove punc $e (language field, strict)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);
				expect(recordInvalid.equalsTo(recordValid)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 760 has invalid ending punctuation'],
					fix: ['Field 760 - Removed punctuation from $e'],
					valid: false
				});
			});

			it('Repairs the invalid record - Add punc $a (only)', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidOnlyA);
				expect(recordInvalidOnlyA.equalsTo(recordValidOnlyA)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 760 has invalid ending punctuation'],
					fix: ['Field 760 - Added punctuation to $a'],
					valid: false
				});
			});
		});

		// "`880`-kenttä: https://www.kansalliskirjasto.fi/extra/marc21/bib/841-88X.htm#880  Eli tää on se Loppupisteohjeen `Samoin kuin vastaavat kentät` -keissi
		// Spex on siinä, mutta lyhkäsesti: `880`-kentässä on muiden kenttien translitteroidut versiot (Data eri kirjaimistolla). 880-kentän osakentästä `6` selviää mihin kenttää se linkkaa."
		// 880 Samoin kuin vastaavat kentät - Siis tarkistetaan kontrollikentän $6 säännön
		describe('#880 - Like linked fields', () => {
			// Valid tests
			const recordValidSimple = new MarcRecord({
				leader: '',
				fields: [{
					tag: '880',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: '平田 篤胤'},
						{code: 'b', value: '1776-1843.'},
						{code: '6', value: '100-01/$1'} // Tag 100 has value TRUE -> last data subfield should have punc
					]
				}]
			});

			const recordValidComplex = new MarcRecord({
				leader: '',
				fields: [{
					tag: '880',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'b', value: 'ידיעות אחרונות'},
						{code: 'b', value: 'ספרי חמד'},
						{code: 'c', value: '2006.'},
						{code: '6', value: '260-02/(2/r ‡a תל-אביב'} // Tag 260 has value TRUE -> last data subfield should have punc
					]
				}]
			});

			it('Finds record valid - Punc $b', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidSimple);
				expect(result.valid).to.eql(true);
			});

			it('Finds record valid - Punc $c', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidComplex);
				expect(result.valid).to.eql(true);
			});

			// Invalid tests
			const recordInvalidSimple = new MarcRecord({
				leader: '',
				fields: [{
					tag: '880',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'a', value: '平田 篤胤'},
						{code: 'b', value: '1776-1843'},
						{code: '6', value: '100-01/$1'} // Tag 100 has value TRUE -> last data subfield should have punc
					]
				}]
			});

			const recordInvalidComplex = new MarcRecord({
				leader: '',
				fields: [{
					tag: '880',
					ind1: ' ',
					ind2: ' ',
					subfields: [
						{code: 'b', value: 'ידיעות אחרונות'},
						{code: 'b', value: 'ספרי חמד'},
						{code: 'c', value: '2006'},
						{code: '6', value: '260-02/(2/r ‡a תל-אביב'} // Tag 260 has value TRUE -> last data subfield should have punc
					]
				}]
			});

			it('Finds record invalid - No punc $b', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidSimple);
				expect(result).to.eql({
					message: ['Field 880 has invalid ending punctuation'],
					valid: false
				});
			});

			it('Finds record invalid - No punc $c', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidComplex);
				expect(result).to.eql({
					message: ['Field 880 has invalid ending punctuation'],
					valid: false
				});
			});

			// Fix tests; invalid->valid
			it('Repairs the invalid record - Add punc $b', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidSimple);
				expect(recordInvalidSimple.equalsTo(recordValidSimple)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 880 has invalid ending punctuation'],
					fix: ['Field 880 - Added punctuation to $b'],
					valid: false
				});
			});

			it('Repairs the invalid record - Add punc $c', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidComplex);
				expect(recordInvalidComplex.equalsTo(recordValidComplex)).to.eql(true);
				expect(result).to.eql({
					message: ['Field 880 has invalid ending punctuation'],
					fix: ['Field 880 - Added punctuation to $c'],
					valid: false
				});
			});
		});
	});
});
