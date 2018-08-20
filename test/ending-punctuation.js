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
	// Indicators and subfields validation
	// describe('#validate: Indicators and subfields', () => {
	// 	const recordValid = new MarcRecord({
	// 		fields: [{
	// 			tag: '245', //Index
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'Elämäni ja tutkimusretkeni / '
	// 			},{
	// 				code: 'c',
	// 				value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola.'
	// 			},{
	// 				code: '6',
	// 				value: 'FOO'
	// 			}]
	// 		},{
	// 			tag: '337', //Range 336-338
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'käytettävissä ilman laitetta'
	// 			  },{
	// 				code: 'b',
	// 				value: 'n'
	// 			  },{
	// 				code: '2',
	// 				value: 'rdamedia'
	// 			}]
	// 		},{
	// 			tag: '500', //Range 500-509
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'FOO (Bar)'
	// 			}]
	// 		}]
	// 	});

	// 	const recordInvalid = new MarcRecord({
	// 		fields: [{
	// 			tag: '245',
	// 			subfields: [{
	// 					code: 'a',
	// 					value: 'Elämäni ja tutkimusretkeni / '
	// 				},{
	// 					code: 'c',
	// 					value: 'Roald Amundsen ; suomentanut Sulo Veikko Pekkola'
	// 				},{
	// 					code: '6',
	// 					value: 'FOO'
	// 				}]
	// 		},{
	// 			tag: '337',
	// 			subfields: [{
	// 					code: 'a',
	// 					value: 'käytettävissä ilman laitetta'
	// 				},{
	// 					code: 'b',
	// 					value: 'n'
	// 				},{
	// 					code: '2',
	// 					value: 'rdamedia'
	// 				}]
	// 		},{
	// 			tag: '500',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'FOO (Bar).'
	// 			}]
	// 		}]
	// 	});

	// 	it('Finds the record valid', async () => {
	// 		const validator = await validatorFactory();
	// 		const result = await validator.validate(recordValid);

	// 		expect(result).to.eql({valid: true});
	// 	});

	// 	it('Finds the record invalid', async () => {
	// 		const validator = await validatorFactory();
	// 		const result = await validator.validate(recordInvalid);

	// 		expect(result).to.eql({valid: false});
	// 	});

	// 	it('Repairs the invalid record', async () => {
	// 		const validator = await validatorFactory();
	// 		await validator.fix(recordInvalid);

	// 		expect( recordInvalid.equalsTo(recordValid)).to.eql(true);
	// 	});
	// });

	describe('#specials', () => {
		//036 KYLLÄ vain osakentän $b jälkeen
		//Can have subfields a and b, dot only after b
		//DONE
		describe('#036 TRUE - only after subfield $b', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '036', //Index
					subfields: [{
						code: 'a',
						value: 'CNRS 84115'
					},{
						code: 'b',
						value: 'Centre national de la recherche scientifique.'
					}]
				}]
			});

			const recordValidOnlyA = new MarcRecord({
				fields: [{
					tag: '036', //Index
					subfields: [{
						code: 'a',
						value: 'CNRS 84115'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '036', //Index
					subfields: [{
						code: 'a',
						value: 'CNRS 84115'
					},{
						code: 'b',
						value: 'Centre national de la recherche scientifique'
					}]
				}]
			});

			const recordInvalidOnlyA = new MarcRecord({
				fields: [{
					tag: '036', //Index
					subfields: [{
						code: 'a',
						value: 'CNRS 84115.'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid);

				expect(result).to.eql({valid: true});
			});

			it('Finds record valid - Only subfield a', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidOnlyA);

				expect(result).to.eql({valid: true});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid - Only subfield a', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidOnlyA);

				expect(result).to.eql({valid: false});
			});
		});


		//242 KYLLÄ Jos viimeinen osakenttä on $y, piste on ennen sitä - Eli siis ei kentässä y (ennen sitä)
		//DONE
		describe('#242 TRUE - if last subfield $y, punc before it', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '242', //Index
					subfields: [{
						code: 'a',
						value: 'World of art.'
					},{
						code: 'y',
						value: 'eng'
					}]
				}]
			});			
			
			const recordValidY = new MarcRecord({
				fields: [{
					tag: '242', //Index
					subfields: [{
						code: 'a',
						value: 'World of art.'
					},{
						code: 'y',
						value: 'eng'
					}]
				}]
			});

			const recordInvalidPunc = new MarcRecord({
				fields: [{
					tag: '242', //Index
					subfields: [{
						code: 'a',
						value: 'The Arab East.'
					},{
						code: 'y',
						value: 'eng.'
					}]
				}]
			});

			const recordInvalidMissingPunc = new MarcRecord({
				fields: [{
					tag: '242', //Index
					subfields: [{
						code: 'a',
						value: 'The Arab East'
					},{
						code: 'y',
						value: 'eng'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid);

				expect(result).to.eql({valid: true});
			});
	
			it('Finds record valid - without $y', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidY);

				expect(result).to.eql({valid: true});
			});

			// Artturi?
			// it('Finds record invalid - Punctuation at $y', async () => {
			// 	const validator = await validatorFactory();
			// 	const result = await validator.validate(recordInvalidPunc);

			// 	expect(result).to.eql({valid: false});
			// });

			it('Finds record invalid - Missing punc at $a', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidMissingPunc);

				expect(result).to.eql({valid: false});
			});
		});


		//260 KYLLÄ Pääsääntö: $a : $b, $c. Tarkista eri poikkeukset ja välimerkitys MARC 21 Full -versiosta
		//Piste vain jos viimeinen kenttä c
		//DONE
		describe('#260 TRUE - TODO', () => {
			const recordValidEndC = new MarcRecord({
				fields: [{
					tag: '260', //Index
					subfields: [
						{code: 'a', value: 'Helsinki'},
						{code: 'b', value: 'Suomen atk-kustannus,'},
						{code: 'c', value: '1982.'}
					]
				}]
			});			
			
			const recordValidEndG = new MarcRecord({
				fields: [{
					tag: '260', //Index
					subfields: [
						{code: 'a', value: 'London'},
						{code: 'b', value: 'Macmillan,'},
						{code: 'c', value: '1971'},
						{code: 'g', value: '(1973 printing)'}
					]
				}]
			});			
			
			const recordValidEndB = new MarcRecord({
				fields: [{
					tag: '260', //Index
					subfields: [
						{code: '3', value: 'June 1993-'},
						{code: 'a', value: 'London'},
						{code: 'b', value: 'Elle'}
					]
				}]
			});

			const recordInvalidEndC = new MarcRecord({
				fields: [{
					tag: '260', //Index
					subfields: [
						{code: 'a', value: 'Helsinki'},
						{code: 'b', value: 'Suomen atk-kustannus,'},
						{code: 'c', value: '1982'}
					]
				}]
			});			
			
			const recordInvalidEndG = new MarcRecord({
				fields: [{
					tag: '260', //Index
					subfields: [
						{code: 'a', value: 'London'},
						{code: 'b', value: 'Macmillan,'},
						{code: 'c', value: '1971'},
						{code: 'g', value: '(1973 printing).'}
					]
				}]
			});			
			
			const recordInvalidEndB = new MarcRecord({
				fields: [{
					tag: '260', //Index
					subfields: [
						{code: '3', value: 'June 1993-'},
						{code: 'a', value: 'London'},
						{code: 'b', value: 'Elle.'}
					]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidEndC);

				expect(result).to.eql({valid: true});
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidEndG);

				expect(result).to.eql({valid: true});
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidEndB);

				expect(result).to.eql({valid: true});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidEndC);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidEndG);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidEndB);

				expect(result).to.eql({valid: false});
			});
		});

		//264 KYLLÄ Tarkista poikkeukset MARC 21 -sovellusohjeesta
		//Eli jos `ind2 === '4'` niin silloin loppupiste merkitä osakentän *b* loppuun
		//DONE
		describe('#264 TRUE - If ind2 === 4, punc at the end of $b', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '264',
					subfields: [
						{code: 'a', value: 'Helsinki'},
						{code: 'b', value: 'Helsingin yliopisto'},
						{code: 'c', value: '1995-2006.'}
					]
				}]
			});

			const recordValidInd = new MarcRecord({
				fields: [{
					tag: "264",
					ind1: ' ',
					ind2: '4',
					subfields: [
						{code: 'a', value: 'Helsinki : '},
						{code: 'b', value: 'Suomen poliisikoirayhdistys.'},
						{code: 'c', value: '© 1974'}
					]
				  }]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '264',
					subfields: [
						{code: 'a', value: 'Helsinki'},
						{code: 'b', value: 'Helsingin yliopisto'},
						{code: 'c', value: '1995-2006'}
					]
				}]
			});

			const recordInvalidIndB = new MarcRecord({
				fields: [{
					tag: "264",
					ind1: ' ',
					ind2: '4',
					subfields: [
						{code: 'a', value: 'Helsinki : '},
						{code: 'b', value: 'Suomen poliisikoirayhdistys'},
						{code: 'c', value: '© 1974'}
					]
				  }]
			});

			const recordInvalidIndCExtra = new MarcRecord({
				fields: [{
					tag: "264",
					ind1: ' ',
					ind2: '4',
					subfields: [
						{code: 'a', value: 'Helsinki : '},
						{code: 'b', value: 'Suomen poliisikoirayhdistys.'},
						{code: 'c', value: '© 1974.'}
					]
				  }]
			});

			const recordInvalidIndCB = new MarcRecord({
				fields: [{
					tag: "264",
					ind1: ' ',
					ind2: '4',
					subfields: [
						{code: 'a', value: 'Helsinki : '},
						{code: 'b', value: 'Suomen poliisikoirayhdistys'},
						{code: 'c', value: '© 1974.'}
					]
				  }]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid);

				expect(result).to.eql({valid: true});
			});	

			it('Finds record valid - Ind, copyright', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidInd);

				expect(result).to.eql({valid: true});
			});

			it('Finds record invalid - missing punctuation', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid - Ind, copyright, punc at $b missing', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidIndB);

				expect(result).to.eql({valid: false});
			});
					
			it('Finds record invalid - Ind, copyright, extra punc $c', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidIndCExtra);

				expect(result).to.eql({valid: false});
			});
			
					
			it('Finds record invalid - Ind, copyright, extra punc $c, missing from $b', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidIndCB);

				expect(result).to.eql({valid: false});
			});
		});


		//340 KYLLÄ Vain joidenkin osakenttien jälkeen. Tarkista osakentät MARC 21 Full -versiosta
		// -b: Piste aina osakentän loppuun
		// - a, d, e, f, h, i: Piste näistä viimeisen osakentän loppuun
		//This doesn't match spec at all, but these rules were provided (https://www.kansalliskirjasto.fi/extra/marc21/bib/3XX.htm#340)
		//DONE
		describe('#340 TRUE - TODO', () => {
			const recordValidSimple = new MarcRecord({
				fields: [{
					tag: '340', //Index
					subfields: [
						{code: 'a', value: 'marble.'}
					]
				}]
			});

			const recordValidAB = new MarcRecord({
				fields: [{
					tag: '340', //Index
					subfields: [
						{code: 'a', value: 'parchment.'}, //This punc doesn't match example: https://www.kansalliskirjasto.fi/extra/marc21/bib/3XX.htm#340
						{code: 'b',	value: '20 cm. folded to 10 x 12 cm.'}
					]
				}]
			});
	
			const recordValidDD = new MarcRecord({
				fields: [{
					tag: '340', //Index
					subfields: [
						{code: 'd', value: 'handwritten'},
						{code: 'd',	value: 'typed.'}
					]
				}]
			});	

			const recordValidComplex = new MarcRecord({
				fields: [{
					tag: '340', //Index
					subfields: [
						{code: 'a', value: 'wove paper'},
						{code: 'c',	value: 'ink'},
						{code: 'c',	value: 'gouache'},
						{code: 'd',	value: 'lithography'},
						{code: 'd',	value: 'collage.'}, //This punc doesn't match example: https://www.kansalliskirjasto.fi/extra/marc21/bib/3XX.htm#340
						{code: 'g',	value: 'polychrome'}
					]
				}]
			});

			const recordValidJ2 = new MarcRecord({
				fields: [{
					tag: '340', //Index
					subfields: [
						{code: 'j', value: 'original'},
						{code: '2',	value: 'rda'}
					]
				}]
			});
	
			it('Finds record valid - Punc $a (last)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidSimple);

				expect(result).to.eql({valid: true});
			});

	
			it('Finds record valid - Punc $a (last) & punc $b (mandatory)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidAB);

				expect(result).to.eql({valid: true});
			});

	
			it('Finds record valid - Punc $d (last of two)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidDD);

				expect(result).to.eql({valid: true});
			});

	
			it('Finds record valid - Punc $d (last of two) followed by $g', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidComplex);

				expect(result).to.eql({valid: true});
			});

	
			it('Finds record valid -  No punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidJ2);

				expect(result).to.eql({valid: true});
			});

			//Invalid tests
			const recordInvalidSimple = new MarcRecord({
				fields: [{
					tag: '340', //Index
					subfields: [
						{code: 'a', value: 'marble'}
					]
				}]
			});

			const recordInvalidAMissingB = new MarcRecord({
				fields: [{
					tag: '340', //Index
					subfields: [
						{code: 'a', value: 'parchment'}, //This punc doesn't match example: https://www.kansalliskirjasto.fi/extra/marc21/bib/3XX.htm#340
						{code: 'b',	value: '20 cm. folded to 10 x 12 cm.'}
					]
				}]
			});			
			
			const recordInvalidABMissing = new MarcRecord({
				fields: [{
					tag: '340', //Index
					subfields: [
						{code: 'a', value: 'parchment.'}, //This punc doesn't match example: https://www.kansalliskirjasto.fi/extra/marc21/bib/3XX.htm#340
						{code: 'b',	value: '20 cm. folded to 10 x 12 cm'}
					]
				}]
			});
	
			const recordInvalidDDMIssing = new MarcRecord({
				fields: [{
					tag: '340', //Index
					subfields: [
						{code: 'd', value: 'handwritten'},
						{code: 'd',	value: 'typed'}
					]
				}]
			});	

			const recordInvalidComplexDMissing = new MarcRecord({
				fields: [{
					tag: '340', //Index
					subfields: [
						{code: 'a', value: 'wove paper'},
						{code: 'c',	value: 'ink'},
						{code: 'c',	value: 'gouache'},
						{code: 'd',	value: 'lithography'},
						{code: 'd',	value: 'collage'}, //This punc doesn't match example: https://www.kansalliskirjasto.fi/extra/marc21/bib/3XX.htm#340
						{code: 'g',	value: 'polychrome'}
					]
				}]
			});
	
			it('Finds record invalid - No punc $a (last)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidSimple);

				expect(result).to.eql({valid: false});
			});

	
			it('Finds record invalid - No punc $a (last) & punc $b (mandatory)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidAMissingB);

				expect(result).to.eql({valid: false});
			});

	
			it('Finds record invalid - Punc $a (last) & no punc $b (mandatory)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidABMissing);

				expect(result).to.eql({valid: false});
			});

	
			it('Finds record invalid - No punc $d (last of two)', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidDDMIssing);

				expect(result).to.eql({valid: false});
			});

	
			it('Finds record invalid - No punc $d (last of two) followed by $g', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidComplexDMissing);

				expect(result).to.eql({valid: false});
			});

		});
		

		//520 KYLLÄ Jos viimeinen osakenttä on $u, piste on ennen sitä (Sama kuin 242, $y)
		//DONE
		describe('#520 TRUE - If last subfield $u, punc before it', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '520', //Index
					subfields: [{
						code: 'a',
						value: 'Mediaväkivalta ja sen yleisö.'
					}]
				}]
			});
			
			const recordValidWithU = new MarcRecord({
				fields: [{
					tag: '520', //Index
					subfields: [{
						code: 'a',
						value: 'Abstrakti.'
					},{
						code: 'u',
						value: 'http://www.ojp.usdoj.gov/bjs/abstract/cchrie98.htm'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '520', //Index
					subfields: [{
						code: 'a',
						value: 'Mediaväkivalta ja sen yleisö'
					}]
				}]
			});

			const recordInvalidWithU = new MarcRecord({
				fields: [{
					tag: '520', //Index
					subfields: [{
						code: 'a',
						value: 'Abstrakti'
					},{
						code: 'u',
						value: 'http://www.ojp.usdoj.gov/bjs/abstract/cchrie98.htm'
					}]
				}]
			});
	
			it('Finds record valid - $a without $u', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid);

				expect(result).to.eql({valid: true});
			});	

			it('Finds record valid - $a with $u ', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidWithU);

				expect(result).to.eql({valid: true});
			});

			it('Finds record invalid - $a without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid - $a without punc with $u', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidWithU);

				expect(result).to.eql({valid: false});
			});
		});
		

		//538 KYLLÄ Jos viimeinen osakenttä on $u, piste on ennen sitä (Sama kuin 520)
		//Eli piste merkitään vikaan osakenttään as usual, mutta ennen *y*-osakenttää 
		//(speksin mukaan y->u) https://www.kansalliskirjasto.fi/extra/marc21/bib/53X-58X.htm#538
		//DONE
		describe('#538 TRUE - If last subfield $u, punc before it', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '538', //Index
					subfields: [{
						code: 'a',
						value: 'Project methodology for digital version'
					},{
						code: 'i',
						value: 'Technical details.' //This ended to ':' in examples, but it doesn't match statet rules: https://www.kansalliskirjasto.fi/extra/marc21/bib/53X-58X.htm#538
					},{
						code: 'u',
						value: 'http://www.columbia.edu/dlc/linglung/methodology.html'
					}]
				}]
			});			
			
			const recordValidOnlyA = new MarcRecord({
				fields: [{
					tag: '538', //Index
					subfields: [{
						code: 'a',
						value: 'SECAM-videolaite.'
					}]
				}]
			});

			const recordInvalidPuncU = new MarcRecord({
				fields: [{
					tag: '538', //Index
					subfields: [{
						code: 'a',
						value: 'Project methodology for digital version'
					},{
						code: 'i',
						value: 'Technical details:'
					},{
						code: 'u',
						value: 'http://www.columbia.edu/dlc/linglung/methodology.html.'
					}]
				}]
			});			
			
			const recordInvalidI = new MarcRecord({
				fields: [{
					tag: '538', //Index
					subfields: [{
						code: 'a',
						value: 'Project methodology for digital version'
					},{
						code: 'i',
						value: 'Technical details:' //This is actually like in examples, but it doesn't match statet rules: https://www.kansalliskirjasto.fi/extra/marc21/bib/53X-58X.htm#538
					},{
						code: 'u',
						value: 'http://www.columbia.edu/dlc/linglung/methodology.html'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid);

				expect(result).to.eql({valid: true});
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidOnlyA);

				expect(result).to.eql({valid: true});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidPuncU);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidI);

				expect(result).to.eql({valid: false});
			});
		});


		//567 KYLLÄ osakentän $a jälkeen, EI muiden osakenttien jälkeen
		//Only after subfield a
		//DONE
		describe('#567 TRUE - After subfield $a, FALSE after others', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '567', //Index
					subfields: [{
						code: 'a',
						value: 'Narratiivinen tutkimus.'
					}]
				}]
			});

			const recordValidWithoutA = new MarcRecord({
				fields: [{
					tag: '567', //Index
					subfields: [{
						code: 'b',
						value: 'Narrative inquiry (Research method)'
					},{
						code: '2',
						value: 'lcsh'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '567', //Index
					subfields: [{
						code: 'a',
						value: 'Narratiivinen tutkimus'
					}]
				}]
			});

			
			const recordInvalidWithoutA = new MarcRecord({
				fields: [{
					tag: '567', //Index
					subfields: [{
						code: 'b',
						value: 'Narrative inquiry.'
					},{
						code: '2',
						value: 'lcsh'
					}]
				}]
			});

	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid);

				expect(result).to.eql({valid: true});
			});

			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidWithoutA);

				expect(result).to.eql({valid: true});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidWithoutA);

				expect(result).to.eql({valid: false});
			});
		});


		//647-651 EI - EI suomalaisten sanastojen termeihin, muihin sanaston käytännön mukaan, yleensä KYLLÄ - Default TRUE, until more special cases are added
		//DONE
		describe('#647-651 FALSE - If finnish, else TRUE', () => {
			//Valid tests
			const recordValid647FastEndPunc= new MarcRecord({
				fields: [{
					tag: '647', //Index
					subfields: [
						{code: 'a', value: 'Hurricane Katrina'},
						{code: 'd', value: '(2005)'},
						{code: '2', value: 'fast'}
					]
				}]
			});

			const recordVali648dFinNo = new MarcRecord({
				fields: [{
					tag: '648', //Index
					subfields: [
						{code: 'a', value: '1900-luku'},
						{code: '2', value: 'ysa'}
					]
				}]
			});

			const recordValid648FastNo = new MarcRecord({
				fields: [{
					tag: '648', //Index
					subfields: [
						{code: 'a', value: '1862'},
						{code: '2', value: 'fast'} //https://www.kansalliskirjasto.fi/extra/marc21/bib/6XX.htm#648
					]
				}]
			});

			const recordValid650FinNo = new MarcRecord({
				fields: [{
					tag: '650', //Index
					subfields: [
						{code: 'a', value: 'kirjastot'},
						{code: 'x', value: 'atk-järjestelmät'},
						{code: '2', value: 'ysa'}
					]
				}]
			});

			const recordValid650EngNoControl= new MarcRecord({
				fields: [{
					tag: '650', //Index
					subfields: [
						{code: 'a', value: 'Flour industry'},
						{code: 'v', value: 'Periodicals.'}
					]
				}]
			});

			const recordValid650EngControl= new MarcRecord({
				fields: [{
					tag: '650', //Index
					subfields: [
						{code: 'a', value: 'Career Exploration.'},
						{code: '2', value: 'ericd'}
					]
				}]
			});

	
			it('Finds record valid - 647 Fast, punc char at end', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid647FastEndPunc);

				expect(result).to.eql({valid: true});
			});			
			
			it('Finds record valid - 648 Finnish, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordVali648dFinNo);

				expect(result).to.eql({valid: true});
			});
			
			it('Finds record valid - 648 Fast, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid648FastNo);

				expect(result).to.eql({valid: true});
			});
			
			it('Finds record valid - 650 Finnish, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid650FinNo);

				expect(result).to.eql({valid: true});
			});
			
			it('Finds record valid - 650 English, punc without control field', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid650EngNoControl);

				expect(result).to.eql({valid: true});
			});
			
			it('Finds record valid - 650 English, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid650EngControl);

				expect(result).to.eql({valid: true});
			});

			//Invalid tests
			const recordInvalid647FastEndPunc= new MarcRecord({
				fields: [{
					tag: '647', //Index
					subfields: [
						{code: 'a', value: 'Hurricane Katrina'},
						{code: 'd', value: '(2005).'},
						{code: '2', value: 'fast'}
					]
				}]
			});

			const recordInvali648dFinYes = new MarcRecord({
				fields: [{
					tag: '648', //Index
					subfields: [
						{code: 'a', value: '1900-luku.'},
						{code: '2', value: 'ysa'}
					]
				}]
			});

			const recordInvalid648FastYes = new MarcRecord({
				fields: [{
					tag: '648', //Index
					subfields: [
						{code: 'a', value: '1862.'},
						{code: '2', value: 'fast'}
					]
				}]
			});

			const recordInvalid650FinYes = new MarcRecord({
				fields: [{
					tag: '650', //Index
					subfields: [
						{code: 'a', value: 'kirjastot'},
						{code: 'x', value: 'atk-järjestelmät.'},
						{code: '2', value: 'ysa'}
					]
				}]
			});

			const recordInvalid650EngNoControl= new MarcRecord({
				fields: [{
					tag: '650', //Index
					subfields: [
						{code: 'a', value: 'Flour industry'},
						{code: 'v', value: 'Periodicals'}
					]
				}]
			});

			const recordInvalid650EngControl= new MarcRecord({
				fields: [{
					tag: '650', //Index
					subfields: [
						{code: 'a', value: 'Career Exploration'},
						{code: '2', value: 'ericd'}
					]
				}]
			});

	
			it('Finds record invalid - 647 Fast, dot at end', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid647FastEndPunc);

				expect(result).to.eql({valid: false});
			});			
			
			it('Finds record invalid - 648 Finnish, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvali648dFinYes);

				expect(result).to.eql({valid: false});
			});
			
			it('Finds record invalid - 648 Fast, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid648FastYes);

				expect(result).to.eql({valid: false});
			});
			
			it('Finds record invalid - 650 Finnish, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid650FinYes);

				expect(result).to.eql({valid: false});
			});
			
			it('Finds record invalid - 650 English, without punc without control field', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid650EngNoControl);

				expect(result).to.eql({valid: false});
			});
			
			it('Finds record invalid - 650 English, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid650EngControl);

				expect(result).to.eql({valid: false});
			});
		});


		//654-662 EI - EI suomalaisten sanastojen termeihin, muihin sanaston käytännön mukaan, yleensä KYLLÄ - Default TRUE, until more special cases are added
		//DONE
		describe('#654-662 TRUE - If finnish, else TRUE', () => {
			//Valid tests
			const recordValid655FinNo = new MarcRecord({
				fields: [{
					tag: '655', //Index
					subfields: [
						{code: 'a', value: 'kausijulkaisut'},
						{code: '2', value: 'ysa'}
					]
				}]
			});

			const recordValid655EngYes = new MarcRecord({
				fields: [{
					tag: '655', //Index
					subfields: [
						{code: 'a', value: 'Bird\'s-eye views'},
						{code: 'y', value: '1874.'},
						{code: '2', value: 'gmgpc'}
					]
				}]
			});

			const recordValid655EngYesNoControl = new MarcRecord({
				fields: [{
					tag: '655', //Index
					subfields: [
						{code: 'a', value: 'Diaries.'},
					]
				}]
			});

			const recordValid656FinNo = new MarcRecord({
				fields: [{
					tag: '656', //Index
					subfields: [
						{code: 'a', value: 'kuvaamataidonopettajat'},
						{code: '2', value: 'ysa'}
					]
				}]
			});
	
			const recordValid657EngYes = new MarcRecord({
				fields: [{
					tag: '657', //Index
					subfields: [
						{code: 'a', value: 'Personnel benefits management'},
						{code: 'x', value: 'Vital statistics'},
						{code: 'z', value: 'Love Canal, New York.'},
						{code: '2', value: 'New York State Management Functions Index'}
					]
				}]
			});

			const recordValid658EngYes = new MarcRecord({
				fields: [{
					tag: '658', //Index
					subfields: [
						{code: 'a', value: 'Math manipulatives'},
						{code: 'd', value: 'highly correlated.'},
						{code: '2', value: '[source code]'}
					]
				}]
			});

			const recordValid662EngYes = new MarcRecord({
				fields: [{
					tag: '662', //Index
					subfields: [
						{code: 'a', value: 'Antarctica.'},
						{code: '2', value: 'lcsh/naf'}
					]
				}]
			});
	
			it('Finds record valid - 655 Finnish, no punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid655FinNo);

				expect(result).to.eql({valid: true});
			});
			
			it('Finds record valid - 655 English, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid655EngYes);

				expect(result).to.eql({valid: true});
			});	
			
			it('Finds record valid - 655 English, with punc no control', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid655EngYesNoControl);

				expect(result).to.eql({valid: true});
			});	
			
			it('Finds record valid - 656 Finnish, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid656FinNo);

				expect(result).to.eql({valid: true});
			});	
			
			it('Finds record valid - 657 English, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid657EngYes);

				expect(result).to.eql({valid: true});
			});	
			
			it('Finds record valid - 658 English, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid658EngYes);

				expect(result).to.eql({valid: true});
			});	

			it('Finds record valid - 662 English, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid662EngYes);

				expect(result).to.eql({valid: true});
			});
			
			//Invalid tests
			const recordInvalid655FinYes = new MarcRecord({
				fields: [{
					tag: '655', //Index
					subfields: [
						{code: 'a', value: 'kausijulkaisut.'},
						{code: '2', value: 'ysa'}
					]
				}]
			});

			const recordInvalid655EngNo = new MarcRecord({
				fields: [{
					tag: '655', //Index
					subfields: [
						{code: 'a', value: 'Bird\'s-eye views'},
						{code: 'y', value: '1874'},
						{code: '2', value: 'gmgpc'}
					]
				}]
			});

			const recordInvalid655EngNoNoControl = new MarcRecord({
				fields: [{
					tag: '655', //Index
					subfields: [
						{code: 'a', value: 'Diaries'},
					]
				}]
			});

			const recordInvalid656FinYes = new MarcRecord({
				fields: [{
					tag: '656', //Index
					subfields: [
						{code: 'a', value: 'kuvaamataidonopettajat.'},
						{code: '2', value: 'ysa'}
					]
				}]
			});

			const recordInvalid657EngNo = new MarcRecord({
				fields: [{
					tag: '657', //Index
					subfields: [
						{code: 'a', value: 'Personnel benefits management'},
						{code: 'x', value: 'Vital statistics'},
						{code: 'z', value: 'Love Canal, New York'},
						{code: '2', value: 'New York State Management Functions Index'}
					]
				}]
			});

			const recordInvalid658EngNo = new MarcRecord({
				fields: [{
					tag: '658', //Index
					subfields: [
						{code: 'a', value: 'Math manipulatives'},
						{code: 'd', value: 'highly correlated'},
						{code: '2', value: '[source code]'}
					]
				}]
			});

			const recordInvalid662EngNo = new MarcRecord({
				fields: [{
					tag: '662', //Index
					subfields: [
						{code: 'a', value: 'Antarctica'},
						{code: '2', value: 'lcsh/naf'}
					]
				}]
			});

			it('Finds record invalid - 655 Finnish, punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid655FinYes);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid - 655 English, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid655EngNo);

				expect(result).to.eql({valid: false});
			});	

			it('Finds record invalid - 655 English, without punc no control', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid655EngNoNoControl);

				expect(result).to.eql({valid: false});
			});	

			it('Finds record invalid - 656 Finnish, with punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid656FinYes);

				expect(result).to.eql({valid: false});
			});	

			it('Finds record invalid - 657 English, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid657EngNo);

				expect(result).to.eql({valid: false});
			});	

			it('Finds record invalid - 658 English, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid658EngNo);

				expect(result).to.eql({valid: false});
			});	

			it('Finds record invalid - 662 English, without punc', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid662EngNo);

				expect(result).to.eql({valid: false});
			});		
		});


		//760-787 KYLLÄ osakentän $a jälkeen, EI muiden osakenttien jälkeen (kuten 567)
		//DONE
		describe('#760-787 TRUE - After subfield $a, FALSE after others', () => {
			const recordValid = new MarcRecord({
				fields: [{
					tag: '760', //Index
					subfields: [{
						code: 'a',
						value: 'Mellor, Alec.'
					},{
						code: 't',
						value: 'Strange masonic stories'
					},{
						code: 'e',
						value: 'eng'
					}]
				}]
			});			
			
			const recordValidOnlyA = new MarcRecord({
				fields: [{
					tag: '760', //Index
					subfields: [{
						code: 'a',
						value: 'Mellor, Alec.'
					}]
				}]
			});

			const recordInvalid = new MarcRecord({
				fields: [{
					tag: '760', //Index
					subfields: [{
						code: 'a',
						value: 'Mellor, Alec.'
					},{
						code: 't',
						value: 'Strange masonic stories'
					},{
						code: 'e',
						value: 'eng.'
					}]
				}]
			});

			const recordInvalidOnlyA = new MarcRecord({
				fields: [{
					tag: '760', //Index
					subfields: [{
						code: 'a',
						value: 'Mellor, Alec'
					}]
				}]
			});
	
			it('Finds record valid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValid);

				expect(result).to.eql({valid: true});
			});	

			it('Finds record valid - Only subfield a', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidOnlyA);

				expect(result).to.eql({valid: true});
			});

			it('Finds record invalid', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalid);

				expect(result).to.eql({valid: false});
			});

			it('Finds record invalid - Only subfield a', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordInvalidOnlyA);

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
			const recordValidSimple = new MarcRecord({
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

			const recordValidComplex = new MarcRecord({
				fields: [{
					tag: '880', //Index
					subfields: [{
						code: 'b',
						value: 'ידיעות אחרונות'
					},{
						code: 'b',
						value: 'ספרי חמד'
					},{
						code: 'c',
						value: '2006.'
					},{
						code: '6',
						value: '260-02/(2/r ‡a תל-אביב' //Tag 260 has value TRUE -> last data subfield should have punc
					}]
				}]
			});
	
			it('Finds record valid - Simple', async () => {
				const validator = await validatorFactory();
				const result = await validator.validate(recordValidSimple);

				expect(result).to.eql({valid: true});
			});
	
			// it('Finds record valid - Complex', async () => {
			// 	const validator = await validatorFactory();
			// 	const result = await validator.validate(recordValidComplex);

			// 	expect(result).to.eql({valid: true});
			// });

			// it('Finds record invalid', async () => {
			// 	const validator = await validatorFactory();
			// 	const result = await validator.validate(recordInvalid);

			// 	expect(result).to.eql({valid: false});
			// });
		});
	});
});