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

			expect( recordInvalid.equalsTo(recordValid)).to.eql(true);
		});
	});

	describe('#specials', () => {
		//036 KYLLÄ vain osakentän $b jälkeen - Pitääkö muutkin kuin vain viimeinen tarkistaa?
		describe('#036 TRUE - only after subfield $b', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '036', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni / '
					},{
						code: 'b',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola.'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '036', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni.'
					},{
						code: 'c',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);

				expect(result).to.eql({valid: false});
			});
		});


		//242 KYLLÄ Jos viimeinen osakenttä on $y, piste on ennen sitä - Eli siis ei kentässä y
		describe('#242 TRUE - if last subfield $y, punc before it', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '242', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni.'
					},{
						code: 'y',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '242', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni / '
					},{
						code: 'y',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola.'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);

				expect(result).to.eql({valid: false});
			});
		});


		//260 KYLLÄ Pääsääntö: $a : $b, $c. Tarkista eri poikkeukset ja välimerkitys MARC 21 Full -versiosta
		describe('#260 TRUE - TODO', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '260', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni.'
					},{
						code: 'y',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '260', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni / '
					},{
						code: 'y',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola.'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);

				expect(result).to.eql({valid: false});
			});
		});

		
		//264 KYLLÄ Tarkista poikkeukset MARC 21 -sovellusohjeesta
		describe('#264 TRUE - TODO', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '264', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni.'
					},{
						code: 'y',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '264', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni / '
					},{
						code: 'y',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola.'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);

				expect(result).to.eql({valid: false});
			});
		});
		

		//340 KYLLÄ Vain joidenkin osakenttien jälkeen. Tarkista osakentät MARC 21 Full -versiosta
		describe('#340 TRUE - TODO', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '340', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni.'
					},{
						code: 'y',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '340', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni / '
					},{
						code: 'y',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola.'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);

				expect(result).to.eql({valid: false});
			});
		});
		

		//520 KYLLÄ Jos viimeinen osakenttä on $u, piste on ennen sitä (Sama kuin 242, $y)
		describe('#520 TRUE - If last subfield $u, punc before it', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '520', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni.'
					},{
						code: 'u',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '520', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni / '
					},{
						code: 'u',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola.'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);

				expect(result).to.eql({valid: false});
			});
		});
		

		//538 KYLLÄ Jos viimeinen osakenttä on $u, piste on ennen sitä (Sama kuin 538)
		describe('#538 TRUE - If last subfield $u, punc before it', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '538', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni.'
					},{
						code: 'u',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '538', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni / '
					},{
						code: 'u',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola.'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);

				expect(result).to.eql({valid: false});
			});
		});


		//567 KYLLÄ osakentän $a jälkeen, EI muiden osakenttien jälkeen - tarkistetaanko muut?
		describe('#567 TRUE - After subfield $a, FALSE after others', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '567', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni.'
					},{
						code: 'u',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '567', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni / '
					},{
						code: 'u',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola.'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);

				expect(result).to.eql({valid: false});
			});
		});


		//647-651 EI - EI suomalaisten sanastojen termeihin, muihin sanaston käytännön mukaan, yleensä KYLLÄ - Default TRUE, until more special cases are added
		describe('#647-651 FALSE - If finnish, else TRUE', () => {
			const recordValidFinNo = new MarcRecord({
				fields: [{
					tag: '647', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni'
					},{
						code: '2',
						value: 'kulo'
					}]
				}]
			});

			const recordValidNoControlYes = new MarcRecord({
				fields: [{
					tag: '647', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni'
					},{
						code: '2',
						value: 'kulo'
					}]
				}]
			});

			const recordInvalidFinYes = new MarcRecord({
				fields: [{
					tag: '647', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni.'
					},{
						code: '2',
						value: 'kulo'
					}]
				}]
			});

			const recordInvalidNoControlNo = new MarcRecord({
				fields: [{
					tag: '647', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni'
					}]
				}]
			});
	
			it('Finds record valid - Finnish and no punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValidFinNo);

				expect(result).to.eql({valid: true});
			});			
			
			it('Finds record valid - Not Finnish and punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValidNoControlYes);

				expect(result).to.eql({valid: true});
			});

			it('Finds record invalid - Finnish and punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidFinYes);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid - no control field and no punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidNoControlNo);

				expect(result).to.eql({valid: false});
			});
		});


		//654-662 EI - EI suomalaisten sanastojen termeihin, muihin sanaston käytännön mukaan, yleensä KYLLÄ - Default TRUE, until more special cases are added
		describe('#654-662 TRUE - If finnish, else TRUE', () => {
			const recordValidFinNo = new MarcRecord({
				fields: [{
					tag: '662', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni'
					},{
						code: '2',
						value: 'kulo'
					}]
				}]
			});

			const recordValidNoControlYes = new MarcRecord({
				fields: [{
					tag: '662', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni'
					},{
						code: '2',
						value: 'kulo'
					}]
				}]
			});

			const recordInvalidFinYes = new MarcRecord({
				fields: [{
					tag: '662', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni.'
					},{
						code: '2',
						value: 'kulo'
					}]
				}]
			});

			const recordInvalidNoControlNo = new MarcRecord({
				fields: [{
					tag: '662', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni'
					}]
				}]
			});
	
			it('Finds record valid - Finnish and no punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValidFinNo);

				expect(result).to.eql({valid: true});
			});			
			
			it('Finds record valid - Not Finnish and punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValidNoControlYes);

				expect(result).to.eql({valid: true});
			});

			it('Finds record invalid - Finnish and punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidFinYes);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid - no control field and no punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalidNoControlNo);

				expect(result).to.eql({valid: false});
			});
		});


		//760-787 KYLLÄ osakentän $a jälkeen, EI muiden osakenttien jälkeen (kuten 567)
		describe('#760-787 TRUE - After subfield $a, FALSE after others', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '760', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni.'
					},{
						code: 'u',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '760', //Index
					subfields: [{
						code: 'a',
						value: 'Elämäni ja tutkimusretkeni / '
					},{
						code: 'u',
						value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola.'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);

				expect(result).to.eql({valid: false});
			});
		});
		
		// ok. Mut hei, nyt kun alat saamaan ton punctuationin valmiiks, niin se `880`-kenttä: https://www.kansalliskirjasto.fi/extra/marc21/bib/841-88X.htm#880
		// Spex on siinä, mutta lyhkäsesti: `880`-kentässä on muiden kenttien translitteroidut versiot (Data eri kirjaimistolla). 880-kentän osakentästä `6` selviää mihin kenttää se linkkaa.
		// Eli tää on se Loppupisteohjeen `Samoin kuin vastaavat kentät` -keissi
		//100 1# ‡6 880-01 ‡a Hirata, Atsutane, ‡d 1776-1843.
		//880 1# ‡6 100-01/$1 ‡a 平田 篤胤, ‡d 1776-1843.
		
		//880 Samoin kuin vastaavat kentät - TODO - Siis tarkistetaan kontrollikentän $6 säännön
		describe('#880 - Like linked fields', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '880', //Index
					subfields: [{
						code: 'a',
						value: '平田 篤胤'
					},{
						code: 'b',
						value: '1776-1843.'
					},{
						code: '6',
						value: '100-01/$1' //Tag 100 has value TRUE -> last data subfield should have punc
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '880', //Index
					subfields: []
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordValid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.fix(recordInvalid);

				expect(result).to.eql({valid: false});
			});
		});
	});
});