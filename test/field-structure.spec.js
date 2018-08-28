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

// Factory validation
describe('field-structure', () => {
	// it('Creates a validator', async () => {
	// 	const config = [{
	// 		tag: /^035$/,
	// 		ind1: /^0$/,
	// 		ind2: /^1$/
	// 	}, {
	// 		tag: /^100$/,
	// 		subfields: {
	// 			a: {maxOccurrence: 1}
	// 		}
	// 	}];

	// 	const validator = await validatorFactory(config);

	// 	expect(validator)
	// 		.to.be.an('object')
	// 		.that.has.any.keys('description', 'validate');

	// 	expect(validator.description).to.be.a('string');
	// 	expect(validator.validate).to.be.a('function');
	// });

	// describe('#configuration', () => {
	// 	it('Throws an error when config array not provided', async () => {
	// 		await expect(validatorFactory()).to.be.rejectedWith(Error, 'Configuration array not provided');
	// 	});

	// 	it('Throws an error when config array has unidentified field', async () => {
	// 		const config = [{
	// 			leader: /^035$/,
	// 			tags: /^035$/
	// 		}];
	// 		await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - unidentified value: tags');
	// 	});

	// 	it('Throws an error when config array has field with incorrect data type', async () => {
	// 		const config = [{
	// 			leader: /^035$/,
	// 			tag: 35
	// 		}];
	// 		await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - invalid data type for: tag');
	// 	});

	// 	it('Throws an error when config array has excluded element', async () => {
	// 		const config = [{
	// 			leader: /^035$/,
	// 			tag: /^035$/
	// 		}];
	// 		await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - excluded element');
	// 	});

	// 	it('Throws an error when config subfields not object', async () => {
	// 		const config = [{
	// 			tag: /^001$/,
	// 			valuePattern: /\d+/
	// 		}, {
	// 			tag: /^245$/,
	// 			strict: true,
	// 			subfields: 'This should be Object'
	// 		}];
	// 		await expect(validatorFactory(config)).to.be.rejectedWith(Error, 'Configuration not valid - subfields not object');
	// 	});
	// });

	// // Indicators and subfields validation
	// describe('#validate: Indicators and subfields', () => {
	// 	const config = [{
	// 		tag: /^035$/,
	// 		ind1: /^0$/,
	// 		ind2: /^1$/
	// 	}, {
	// 		tag: /^100$/,
	// 		subfields: {
	// 			a: {maxOccurrence: 1}
	// 		}
	// 	}];

	// 	const recordValid = new MarcRecord({
	// 		fields: [{
	// 			tag: '001',
	// 			value: '123456'
	// 		}, {
	// 			tag: '035',
	// 			ind1: '0',
	// 			ind2: '1',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'foo'
	// 			}]
	// 		}, {
	// 			tag: '100',
	// 			ind1: ' ',
	// 			ind2: ' ',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}, {
	// 				code: 'b',
	// 				value: 'fubar'
	// 			}]
	// 		}]
	// 	});

	// 	const recordInvalidMany = new MarcRecord({
	// 		fields: [{
	// 			tag: '001',
	// 			value: '123456'
	// 		}, {
	// 			tag: '035',
	// 			ind1: '1',
	// 			ind2: '1',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'foo'
	// 			}]
	// 		}, {
	// 			tag: '100',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}, {
	// 				code: 'b',
	// 				value: 'fubar'
	// 			}, {
	// 				code: 'a',
	// 				value: 'barfoo'
	// 			}]
	// 		}]
	// 	});

	// 	it('Finds the record valid', async () => {
	// 		const validator = await validatorFactory(config);
	// 		const result = await validator.validate(recordValid);

	// 		expect(result).to.eql({valid: true});
	// 	});

	// 	it('Finds the record invalid: Too many subfields', async () => {
	// 		const validator = await validatorFactory(config);
	// 		const result = await validator.validate(recordInvalidMany);

	// 		expect(result).to.eql({valid: false});
	// 	});
	// });

	// // Patterns and mandatory & strict subfields
	// describe('#validate: Patterns and mandatory & strict subfields', () => {
	// 	const config = [{
	// 		tag: /^001$/,
	// 		valuePattern: /\d+/
	// 	}, {
	// 		tag: /^245$/,
	// 		strict: true,
	// 		subfields: {
	// 			a: {required: true, maxOccurrence: 1, pattern: /\w+/},
	// 			b: {maxOccurrence: 1, pattern: /\w+/}
	// 		}
	// 	}];

	// 	const recordValid = new MarcRecord({
	// 		fields: [{
	// 			tag: '001',
	// 			value: '123456'
	// 		}, {
	// 			tag: '100',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}]
	// 		}, {
	// 			tag: '245',
	// 			ind1: ' ',
	// 			ind2: ' ',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'foo'
	// 			}, {
	// 				code: 'b',
	// 				value: 'bar'
	// 			}]
	// 		}]
	// 	});

	// 	const recordInvalidExtra = new MarcRecord({
	// 		fields: [{
	// 			tag: '001',
	// 			value: '123456a'
	// 		}, {
	// 			tag: '100',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}]
	// 		}, {
	// 			tag: '245',
	// 			ind1: ' ',
	// 			ind2: ' ',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'foo'
	// 			}, {
	// 				code: 'b',
	// 				value: 'bar'
	// 			}, {
	// 				code: 'c',
	// 				value: 'fubar'
	// 			}]
	// 		}]
	// 	});

	// 	const recordInvalidTooMany = new MarcRecord({
	// 		fields: [{
	// 			tag: '001',
	// 			value: '123456a'
	// 		}, {
	// 			tag: '100',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}]
	// 		}, {
	// 			tag: '245',
	// 			ind1: ' ',
	// 			ind2: ' ',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'foo'
	// 			}, {
	// 				code: 'b',
	// 				value: 'bar'
	// 			}, {
	// 				code: 'a',
	// 				value: 'fubar'
	// 			}]
	// 		}]
	// 	});

	// 	const recordInvalidRegExp = new MarcRecord({
	// 		fields: [{
	// 			tag: '001',
	// 			value: '123456a'
	// 		}, {
	// 			tag: '100',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}]
	// 		}, {
	// 			tag: '245',
	// 			ind1: ' ',
	// 			ind2: ' ',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'ää'
	// 			}, {
	// 				code: 'b',
	// 				value: 'bar'
	// 			}]
	// 		}]
	// 	});

	// 	const recordInvalidMissing = new MarcRecord({
	// 		fields: [{
	// 			tag: '100',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}]
	// 		}, {
	// 			tag: '245',
	// 			ind1: ' ',
	// 			ind2: ' ',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'ää'
	// 			}, {
	// 				code: 'b',
	// 				value: 'bar'
	// 			}]
	// 		}]
	// 	});

	// 	const recordInvalidMissingSubfield = new MarcRecord({
	// 		fields: [{
	// 			tag: '001',
	// 			value: '123456'
	// 		}, {
	// 			tag: '100',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}]
	// 		}, {
	// 			tag: '245',
	// 			ind1: ' ',
	// 			ind2: ' ',
	// 			subfields: [{
	// 				code: 'b',
	// 				value: 'bar'
	// 			}]
	// 		}]
	// 	});

	// 	it('Finds the record valid', async () => {
	// 		const validator = await validatorFactory(config);
	// 		const result = await validator.validate(recordValid);

	// 		expect(result).to.eql({valid: true});
	// 	});

	// 	it('Finds the record invalid: Extra field in strict', async () => {
	// 		const validator = await validatorFactory(config);
	// 		const result = await validator.validate(recordInvalidExtra);

	// 		expect(result).to.eql({valid: false});
	// 	});

	// 	it('Finds the record invalid: Too many occurances', async () => {
	// 		const validator = await validatorFactory(config);
	// 		const result = await validator.validate(recordInvalidTooMany);

	// 		expect(result).to.eql({valid: false});
	// 	});

	// 	it('Finds the record invalid: Invalid RegExp', async () => {
	// 		const validator = await validatorFactory(config);
	// 		const result = await validator.validate(recordInvalidRegExp);

	// 		expect(result).to.eql({valid: false});
	// 	});

	// 	it('Finds the record invalid: Missing field', async () => {
	// 		const validator = await validatorFactory(config);
	// 		const result = await validator.validate(recordInvalidMissing);

	// 		expect(result).to.eql({valid: false});
	// 	});

	// 	it('Finds the record invalid: Missing subfield', async () => {
	// 		const validator = await validatorFactory(config);
	// 		const result = await validator.validate(recordInvalidMissingSubfield);

	// 		expect(result).to.eql({valid: false});
	// 	});
	// });

	//min/maxOccurance
	// describe('#validate: min/maxOccurance', () => {
	// 	const config = [{
	// 		tag: /^035$/,
	// 		ind1: /^0$/,
	// 		ind2: /^1$/,
	// 		minOccurrance: 2,
	// 		maxOccurrance: 2
	// 	}, {
	// 		tag: /^100$/,
	// 		subfields: {
	// 			a: {maxOccurrence: 1}
	// 		}
	// 	}];

	// 	const recordValid = new MarcRecord({
	// 		fields: [{
	// 			tag: '035',
	// 			ind1: '0',
	// 			ind2: '1',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'foo'
	// 			}]
	// 		},{
	// 			tag: '035',
	// 			ind1: '0',
	// 			ind2: '1',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}]
	// 		}, {
	// 			tag: '100',
	// 			ind1: ' ',
	// 			ind2: ' ',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}, {
	// 				code: 'b',
	// 				value: 'fubar'
	// 			}]
	// 		}]
	// 	});

	// 	const recordInvalidTooMany = new MarcRecord({
	// 		fields: [{
	// 			tag: '035',
	// 			ind1: '0',
	// 			ind2: '1',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'foo'
	// 			}]
	// 		},{
	// 			tag: '035',
	// 			ind1: '0',
	// 			ind2: '1',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}]
	// 		},{
	// 			tag: '035',
	// 			ind1: '0',
	// 			ind2: '1',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'fubar'
	// 			}]
	// 		}, {
	// 			tag: '100',
	// 			ind1: ' ',
	// 			ind2: ' ',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}, {
	// 				code: 'b',
	// 				value: 'fubar'
	// 			}]
	// 		}]
	// 	});

	// 	const recordInvalidNo = new MarcRecord({
	// 		fields: [{
	// 			tag: '100',
	// 			ind1: ' ',
	// 			ind2: ' ',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}, {
	// 				code: 'b',
	// 				value: 'fubar'
	// 			}]
	// 		}]
	// 	});

	// 	const recordInvalidTooFew = new MarcRecord({
	// 		fields: [{
	// 			tag: '100',
	// 			ind1: ' ',
	// 			ind2: ' ',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'bar'
	// 			}, {
	// 				code: 'b',
	// 				value: 'fubar'
	// 			}]
	// 		},{
	// 			tag: '035',
	// 			ind1: '0',
	// 			ind2: '1',
	// 			subfields: [{
	// 				code: 'a',
	// 				value: 'foo'
	// 			}]
	// 		}]
	// 	});

	// 	it('Finds the record valid', async () => {
	// 		const validator = await validatorFactory(config);
	// 		const result = await validator.validate(recordValid);

	// 		expect(result).to.eql({valid: true});
	// 	});

	// 	it('Finds the record invalid: Too many fields', async () => {
	// 		const validator = await validatorFactory(config);
	// 		const result = await validator.validate(recordInvalidTooMany);

	// 		expect(result).to.eql({valid: false});
	// 	});

	// 	it('Finds the record invalid: No field', async () => {
	// 		const validator = await validatorFactory(config);
	// 		const result = await validator.validate(recordInvalidNo);

	// 		expect(result).to.eql({valid: false});
	// 	});

	// 	it('Finds the record invalid: Too few fields', async () => {
	// 		const validator = await validatorFactory(config);
	// 		const result = await validator.validate(recordInvalidTooFew);

	// 		expect(result).to.eql({valid: false});
	// 	});
	// });

	// Dependencies
	describe('#validate: Dependencies', () => {
		const config = [{
			leader: /^.{6}s/,
			dependencies: [{
				tag: /^773$/,
				subfields: {7: /^nnas$/}
			}]
		}];

		const recordValid = new MarcRecord({
			leader: '63ab75sfoo122myhgh',
			fields: [{
				tag: '001',
				value: '123456'
			}, {
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [{
					code: 'a',
					value: 'foo'
				}]
			}, {
				tag: '773',
				ind1: ' ',
				ind2: ' ',
				subfields: [{
					code: '7',
					value: 'nnas'
				}, {
					code: 'w',
					value: '789101112'
				}]
			}]
		});

		const recordInvalid = new MarcRecord({
			leader: '63ab75sfoo122myhgh',
			fields: [{
				tag: '001',
				value: '123456'
			}, {
				tag: '245',
				ind1: ' ',
				ind2: ' ',
				subfields: [{
					code: 'a',
					value: 'foo'
				}]
			}, {
				tag: '773',
				ind1: ' ',
				ind2: ' ',
				subfields: [{
					code: 'w',
					value: '789101112'
				}]
			}]
		});

		const configDep = [{
			leader: /^.{6}s/,
			dependencies: [{
				tag: /^773$/,
				subfields: {7: /^nnas$/},
				minOccurrance: 1,
				maxOccurrance: 1
			}]
		}];

		const recordInvalidTooManyDep = new MarcRecord({
			leader: '63ab75sfoo122myhgh',
			fields: [{
				tag: '001',
				value: '123456'
			}, {
				tag: '773',
				ind1: ' ',
				ind2: ' ',
				subfields: [{
					code: '7',
					value: 'foo'
				},{
					code: '7',
					value: 'bar'
				}]
			}]
		});

		const recordInvalidTooFewDep = new MarcRecord({
			leader: '63ab75sfoo122myhgh',
			fields: [{
				tag: '001',
				value: '123456'
			}, {
				tag: '773',
				ind1: ' ',
				ind2: ' ',
				subfields: [{
					code: '7',
					value: 'foo'
				},{
					code: '7',
					value: 'bar'
				}]
			}]
		});

		it('Finds the record valid', async () => {
			const validator = await validatorFactory(config);
			const result = await validator.validate(recordValid);

			expect(result).to.eql({valid: true});
		});

		it('Finds the record invalid: Subfield not there', async () => {
			const validator = await validatorFactory(config);
			const result = await validator.validate(recordInvalid);

			expect(result).to.eql({valid: false});
		});
		
		it('Finds the record invalid: Too many dependencies', async () => {
			const validator = await validatorFactory(configDep);
			const result = await validator.validate(recordInvalidTooManyDep);

			expect(result).to.eql({valid: false});
		});
		
		it('Finds the record invalid: Too few dependencies', async () => {
			const validator = await validatorFactory(configDep);
			const result = await validator.validate(recordInvalidTooFewDep);

			expect(result).to.eql({valid: false});
		});
	});
});

// Configuration specification
const confSpec = {
	leader: { // Description: Leader pattern
		type: 'RegExp',
		excl: [
			'tag', 'valuePattern', 'subfields', 'ind1', 'ind2'
		]
	},
	tag: { // Description: Field tag pattern
		type: 'RegExp'
	},
	valuePattern: { // Description: Pattern to which the field's value must match against
		type: 'RegExp',
		excl: [
			'leader', 'subfields', 'ind1', 'ind2'
		]
	},
	ind1: { // Description: Indicator-specific configuration object
		type: 'RegExp', // Array<Indicator>
		excl: [
			'leader', 'value'
		]
	},
	ind2: { // Description: Indicator-specific configuration object
		type: 'RegExp', // Array<Indicator>
		excl: [
			'leader', 'value'
		]
	},
	strict: { // Description: Only the specified subfields are allowed if set to true. Defaults to false.
		type: 'boolean',
		excl: [
			'leader', 'valuePattern'
		]
	},
	subfields: { // Description: Subfields configuration
		type: 'object', // Object<String, Subfield> (Keys are subfield codes)
		contains: [
			'String', 'subfieldSpec'
		],
		excl: [
			'leader', 'value'
		]
	},
	dependencies: { // Description: Dependencies configuration
		type: 'array', // Array<Dependency>
		contains: 'dependencySpec'
	},
	minOccurrance: { //ToDo
		type: 'number' //Defines the minimum number of times the field must occur. Defaults to 1.
	},
	maxOccurrance: { //ToDo
		type: 'number' //Defines the maximum number of times the field can occur. Defaults to unlimited.
	}
};

// Subfiled specification
const subSpec = {
	pattern: { // Description: Pattern to which the subfield's value must match against
		type: 'RegExp'
	},
	required: { // Description: Whether the subfield is mandatory or not. Defaults to false
		type: 'boolean'
	},
	maxOccurrence: { // Description: Maximum number of times this subfield can occur. Defaults to unlimited if omitted. The value 0 means that the subfield cannot exist.
		type: 'number'
	}
};

// Dependency specification
const depSpec = {
	tag: { // Description: Field tag pattern
		type: RegExp
	},
	ind1: { // Description: Pattern to which the indicator must match against
		type: RegExp,
		excl: [
			'value'
		]
	},
	ind2: { // Description: Pattern to which the indicator must match against
		type: RegExp,
		excl: [
			'value'
		]
	},
	valuePattern: { // Description: Pattern to which the field's value must match agains
		type: RegExp,
		excl: [
			'subfields', 'ind1', 'ind2'
		]
	},
	subfields: { // Description: An object with subfield codes as keys and RegExp patterns as values. The subfield value must this pattern.
		type: Object, // [String, RegExp]
		required: false
	},
	negate: { //ToDo
		type: 'boolean' // Determines if the rule is negated: No fields can match the dependency specification. Defaults to false.
	}, //ToDo
	minOccurrance: {
		type: 'number' //Defines the minimum number of times the field must occur. Defaults to 1.
	}, //ToDo
	maxOccurrance: {
		type: 'number' //Defines the maximum number of times the field can occur. Defaults to unlimited.
	}
};