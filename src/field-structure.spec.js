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


import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/field-structure';

const {expect} = chai;
chai.use(chaiAsPromised);

// Factory validation
describe('field-structure', () => {
  it('Creates a validator', async () => {
    const config = [
      {
        tag: /^035$/u,
        ind1: /^0$/u,
        ind2: /^1$/u
      }, {
        tag: /^100$/u,
        subfields: {
          a: {maxOccurrence: 1}
        }
      }
    ];

    const validator = await validatorFactory(config);

    expect(validator)
      .to.be.an('object')
      .that.has.any.keys('description', 'validate');

    expect(validator.description).to.be.a('string');
    expect(validator.validate).to.be.a('function');
  });

  describe('#configuration', () => {
    it('Throws an error when config array not provided', () => {
      try {
        validatorFactory();
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration array not provided');
      }
    });

    it('Throws an error when config array has unidentified field', () => {
      const config = [
        {
          leader: /^035$/u,
          tags: /^035$/u
        }
      ];

      try {
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - unidentified value: tags');
      }
    });

    it('Throws an error when config array has field with incorrect data type', () => {
      const config = [
        {
          leader: /^035$/u,
          tag: 35
        }
      ];

      try {
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - invalid data type for: tag');
      }
    });

    it('Throws an error when config array has excluded element', () => {
      const config = [
        {
          leader: /^035$/u,
          tag: /^035$/u
        }
      ];

      try {
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - excluded element');
      }
    });

    it('Throws an error when config subfields not object', () => {
      const config = [
        {
          tag: /^001$/u,
          valuePattern: /\d+/u
        }, {
          tag: /^245$/u,
          strict: true,
          subfields: 'This should be Object'
        }
      ];

      try {
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - subfields not object');
      }
    });
  });

  it('Should find the record valid because no fields match the config', async () => {
    const config = [
      {
        tag: /^FOO$/u,
        valuePattern: /bar/u
      }
    ];

    const record = new MarcRecord({
      leader: '',
      fields: [
        {
          tag: '001',
          value: '123456'
        }
      ]
    });

    const validator = await validatorFactory(config);
    const result = await validator.validate(record);

    expect(result).to.eql({valid: true});
  });

  // Indicators and subfields validation
  describe('#validate: Indicators and subfields', () => {
    const config = [
      {
        tag: /^035$/u,
        ind1: /^0$/u,
        ind2: /^1$/u
      }, {
        tag: /^100$/u,
        subfields: {
          a: {maxOccurrence: 1}
        }
      }
    ];

    const recordValid = new MarcRecord({
      leader: '',
      fields: [
        {
          tag: '001',
          value: '123456'
        }, {
          tag: '035',
          ind1: '0',
          ind2: '1',
          subfields: [
            {
              code: 'a',
              value: 'foo'
            }
          ]
        }, {
          tag: '100',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'bar'
            }, {
              code: 'b',
              value: 'fubar'
            }
          ]
        }
      ]
    });

    const recordInvalidMany = new MarcRecord({
      leader: '',
      fields: [
        {
          tag: '001',
          value: '123456'
        }, {
          tag: '035',
          ind1: '1',
          ind2: '1',
          subfields: [
            {
              code: 'a',
              value: 'foo'
            }
          ]
        }, {
          tag: '100',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'bar'
            }, {
              code: 'b',
              value: 'fubar'
            }, {
              code: 'a',
              value: 'barfoo'
            }
          ]
        }
      ]
    });

    it('Finds the record valid', async () => {
      const validator = await validatorFactory(config);
      const result = await validator.validate(recordValid);

      expect(result).to.eql({valid: true});
    });

    it('Finds the record invalid: Too many subfields', async () => {
      const validator = await validatorFactory(config);
      const result = await validator.validate(recordInvalidMany);

      expect(result).to.eql({valid: false});
    });
  });

  // Patterns and mandatory & strict subfields
  describe('#validate: Patterns and mandatory & strict subfields', () => {
    const config = [
      {
        tag: /^001$/u,
        valuePattern: /\d+/u
      }, {
        tag: /^245$/u,
        strict: true,
        subfields: {
          a: {required: true, maxOccurrence: 1, pattern: /\w+/u},
          b: {maxOccurrence: 1, pattern: /\w+/u}
        }
      }
    ];

    const recordValid = new MarcRecord({
      leader: '',
      fields: [
        {
          tag: '001',
          value: '123456'
        }, {
          tag: '100',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'bar'
            }
          ]
        }, {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'foo'
            }, {
              code: 'b',
              value: 'bar'
            }
          ]
        }
      ]
    });

    const recordInvalidExtra = new MarcRecord({
      leader: '',
      fields: [
        {
          tag: '001',
          value: '123456a'
        }, {
          tag: '100',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'bar'
            }
          ]
        }, {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'foo'
            }, {
              code: 'b',
              value: 'bar'
            }, {
              code: 'c',
              value: 'fubar'
            }
          ]
        }
      ]
    });

    const recordInvalidTooMany = new MarcRecord({
      leader: '',
      fields: [
        {
          tag: '001',
          value: '123456a'
        }, {
          tag: '100',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'bar'
            }
          ]
        }, {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'foo'
            }, {
              code: 'b',
              value: 'bar'
            }, {
              code: 'a',
              value: 'fubar'
            }
          ]
        }
      ]
    });

    const recordInvalidRegExp = new MarcRecord({
      leader: '',
      fields: [
        {
          tag: '001',
          value: '123456a'
        }, {
          tag: '100',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'bar'
            }
          ]
        }, {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'ää'
            }, {
              code: 'b',
              value: 'bar'
            }
          ]
        }
      ]
    });

    const recordInvalidMissing = new MarcRecord({
      leader: '',
      fields: [
        {
          tag: '100',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'bar'
            }
          ]
        }, {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'ää'
            }, {
              code: 'b',
              value: 'bar'
            }
          ]
        }
      ]
    });

    const recordInvalidMissingSubfield = new MarcRecord({
      leader: '',
      fields: [
        {
          tag: '001',
          value: '123456'
        }, {
          tag: '100',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'bar'
            }
          ]
        }, {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'b',
              value: 'bar'
            }
          ]
        }
      ]
    });

    it('Finds the record valid', async () => {
      const validator = await validatorFactory(config);
      const result = await validator.validate(recordValid);

      expect(result).to.eql({valid: true});
    });

    it('Finds the record invalid: Extra field in strict', async () => {
      const validator = await validatorFactory(config);
      const result = await validator.validate(recordInvalidExtra);

      expect(result).to.eql({valid: false});
    });

    it('Finds the record invalid: Too many occurances', async () => {
      const validator = await validatorFactory(config);
      const result = await validator.validate(recordInvalidTooMany);

      expect(result).to.eql({valid: false});
    });

    it('Finds the record invalid: Invalid RegExp', async () => {
      const validator = await validatorFactory(config);
      const result = await validator.validate(recordInvalidRegExp);

      expect(result).to.eql({valid: false});
    });

    it('Finds the record invalid: Missing field', async () => {
      const validator = await validatorFactory(config);
      const result = await validator.validate(recordInvalidMissing);

      expect(result).to.eql({valid: false});
    });
    it('Finds the record invalid: Missing subfield', async () => {
      const validator = await validatorFactory(config);
      const result = await validator.validate(recordInvalidMissingSubfield);

      expect(result).to.eql({valid: false});
    });
  });

  // Dependencies
  describe('#validate: Dependencies', () => {
    const config = [
      {
        leader: /^.{6}s/u,
        dependencies: [
          {
            tag: /^773$/u,
            subfields: {7: /^nnas$/u}
          }
        ]
      }
    ];

    const recordValid = new MarcRecord({
      leader: '63ab75sfoo122myhgh',
      fields: [
        {
          tag: '001',
          value: '123456'
        }, {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'foo'
            }
          ]
        }, {
          tag: '773',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: '7',
              value: 'nnas'
            }, {
              code: 'w',
              value: '789101112'
            }
          ]
        }
      ]
    });

    const recordInvalid = new MarcRecord({
      leader: '63ab75afoo122myhgh',
      fields: [
        {
          tag: '001',
          value: '123456'
        }, {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'foo'
            }
          ]
        }, {
          tag: '773',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: '7',
              value: 'nnas'
            }, {
              code: 'w',
              value: '789101112'
            }
          ]
        }
      ]
    });

    it('Finds the record valid', async () => {
      const validator = await validatorFactory(config);
      const result = await validator.validate(recordValid);

      expect(result).to.eql({valid: true});
    });

    it('Finds the record invalid', async () => {
      const validator = await validatorFactory(config);
      const result = await validator.validate(recordInvalid);

      expect(result).to.eql({valid: false});
    });

    it('Find the record valid (Dependency on leader)', async () => {
      const validator = await validatorFactory([{tag: /^007$/u, dependencies: [{leader: /^.{6}[at]/u}]}]);
      const result = await validator.validate(new MarcRecord({
        leader: '00000ccm^a22003372i^4500',
        fields: [
          {tag: '001', value: '123456'},
          {tag: '245', value: 'foobar'}
        ]
      }));

      expect(result).to.eql({valid: true});
    });

    it('Find the record invalid (Dependency on leader)', async () => {
      const validator = await validatorFactory([{tag: /^007$/u, dependencies: [{leader: /^.{6}[at]/u}]}]);
      const result = await validator.validate(new MarcRecord({
        leader: '00000cam^a22003372i^4500',
        fields: [
          {tag: '001', value: '123456'},
          {tag: '245', value: 'foobar'}
        ]
      }));

      expect(result).to.eql({valid: false});
    });
  });
});
