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
import validatorFactory from '../src/field-exclusion';

const {expect} = chai;
chai.use(chaiAsPromised);

// Factory validation
describe('field-exclusion', () => {
  describe('#validate: Check configuration validation', () => {
    it('Creates a validator from simple config', async () => {
      const config = [/^500$/u];

      const validator = await validatorFactory(config);
      expect(validator)
        .to.be.an('object')
        .that.has.any.keys('description', 'validate');

      expect(validator.description).to.be.a('string');
      expect(validator.validate).to.be.a('function');
    });

    it('Creates a validator from complex config', async () => {
      const config = [
        {
          tag: /^500$/u,
          subfields: [{code: /9/u, value: /^(?!FENNI<KEEP>).*$/u}]
        }
      ];

      const validator = await validatorFactory(config);
      expect(validator)
        .to.be.an('object')
        .that.has.any.keys('description', 'validate');

      expect(validator.description).to.be.a('string');
      expect(validator.validate).to.be.a('function');
    });

    it('Fails to create a validator from invalid config - tag', async () => {
      const config = [
        {
          tag: '500',
          subfields: [{code: /9/u, value: /^(?!FENNI<KEEP>).*$/u}]
        }
      ];

      try {
        await validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - invalid data type for: tag');
      }
    });

    it('Fails to create a validator from invalid config - msising array', async () => {
      const config = {
        tag: '500',
        subfields: [{code: /9/u, value: /^(?!FENNI<KEEP>).*$/u}]
      };

      try {
        await validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration array not provided');
      }
    });

    it('Fails to create a validator from invalid config - code', async () => {
      const config = [
        {
          tag: /^500$/u,
          subfields: [{code: 9, value: /^(?!FENNI<KEEP>).*$/u}]
        }
      ];

      try {
        await validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - invalid data type for: code');
      }
    });

    it('Fails to create a validator from invalid config - value', async () => {
      const config = [
        {
          tag: /^500$/u,
          subfields: [{code: /9/u, value: 'Fenni'}]
        }
      ];

      try {
        await validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - invalid data type for: value');
      }
    });

    it('Fails to create a validator from invalid config - exclusion: value, ind1', async () => {
      const config = [
        {
          tag: /^500$/u,
          value: /^500$/u,
          ind1: /^500$/u,
          subfields: [{code: /9/u, value: /^(?!FENNI<KEEP>).*$/u}]
        }
      ];

      try {
        await validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - excluded element');
      }
    });

    it('Fails to create a validator from invalid config - missing mandatory: tag', async () => {
      const config = [
        {
          value: /^500$/u,
          subfields: [{code: /9/u, value: /^(?!FENNI<KEEP>).*$/u}]
        }
      ];

      try {
        await validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - missing mandatory element: tag');
      }
    });

    it('Fails to create a validator from invalid config - subfield not object: array', async () => {
      const config = [
        {
          tag: /^500$/u,
          subfields: [
            ['/9/', '/^(?!FENNI<KEEP>).*$/'],
            {value: /^(?!FENNI<KEEP>).*$/u}
          ]
        }
      ];

      try {
        await validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - subfield: /9/,/^(?!FENNI<KEEP>).*$/ not object');
      }
    });

    it('Fails to create a validator from invalid config - subfield not object: string', async () => {
      const config = [
        {
          tag: /^500$/u,
          subfields: [
            '/9/',
            '/^(?!FENNI<KEEP>).*$/',
            {value: /^(?!FENNI<KEEP>).*$/u}
          ]
        }
      ];

      try {
        await validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - subfield: /9/ not object');
      }
    });

    it('Fails to create a validator from invalid config - missing mandatory: subfield.code', async () => {
      const config = [
        {
          tag: /^500$/u,
          subfields: [
            {code: /9/u, value: /^(?!FENNI<KEEP>).*$/u},
            {value: /^(?!FENNI<KEEP>).*$/u}
          ]
        }
      ];

      try {
        await validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - missing mandatory element: code');
      }
    });

    it('Fails to create a validator from invalid config - unidentified field: unidentified', async () => {
      const config = [
        {
          tag: /^500$/u,
          unidentified: /^500$/u,
          subfields: [
            {code: /9/u, value: /^(?!FENNI<KEEP>).*$/u},
            {value: /^(?!FENNI<KEEP>).*$/u}
          ]
        }
      ];

      try {
        await validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - unidentified value: unidentified');
      }
    });
  });

  // Simple configuration https://github.com/NatLibFi/marc-record-validators-melinda/issues/45
  describe('#validate: Simple configuration (spec)', () => {
    const config = [
      {
        tag: /^500$/u
      }
    ];

    const recordValid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
    });

    const recordInvalid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '500',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Foo Bar Foo Bar Foo Bar'},
            {code: '9', value: 'ALMA<KEEP>'}
          ]
        }
      ]
    });

    const recordInvalidDouble = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '500',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Foo'},
            {code: '9', value: 'ALMA<KEEP>'}
          ]
        }, {
          tag: '500',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Bar'},
            {code: '9', value: 'ALMA<KEEP>'}
          ]
        }
      ]
    });

    const recordInvalidFixed = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
    });

    it('Finds the record valid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordValid);
      expect({valid, message}).to.eql({valid: true, message: []});
    });

    it('Finds the record invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalid);
      expect({valid, message}).to.eql({valid: false, message: ['Field $500 should be excluded']});
    });

    it('Finds the record invalid - double', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalidDouble);
      expect({valid, message}).to.eql({valid: false, message: ['Field $500 should be excluded', 'Field $500 should be excluded']});
    });

    it('Repairs invalid record', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalid);
      expect(recordInvalid.equalsTo(recordInvalidFixed)).to.eql(true);
    });

    it('Repairs invalid record - double', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalidDouble);
      expect(recordInvalidDouble.equalsTo(recordInvalidFixed)).to.eql(true);
    });
  });

  // Simple multi tag configuration
  describe('#validate: Simple multi tag configuration (spec)', () => {
    const config = [
      {
        tag: /^(648|650|651|655)$/u // eslint-disable-line prefer-named-capture-group
      }
    ];

    const recordValid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
    });

    const recordInvalid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '648',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Foo Bar Foo Bar Foo Bar'},
            {code: '9', value: 'ALMA<KEEP>'}
          ]
        }
      ]
    });

    const recordInvalidDouble = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '648',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Foo'},
            {code: '9', value: 'ALMA<KEEP>'}
          ]
        }, {
          tag: '650',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Bar'},
            {code: '9', value: 'ALMA<KEEP>'}
          ]
        }
      ]
    });

    const recordInvalidFixed = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
    });

    it('Finds the record valid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordValid);
      expect({valid, message}).to.eql({valid: true, message: []});
    });

    it('Finds the record invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalid);
      expect({valid, message}).to.eql({valid: false, message: ['Field $648 should be excluded']});
    });

    it('Finds the record invalid - double', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalidDouble);
      expect({valid, message}).to.eql({valid: false, message: ['Field $648 should be excluded', 'Field $650 should be excluded']});
    });

    it('Repairs invalid record', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalid);
      expect(recordInvalid.equalsTo(recordInvalidFixed)).to.eql(true);
    });

    it('Repairs invalid record - double', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalidDouble);
      expect(recordInvalidDouble.equalsTo(recordInvalidFixed)).to.eql(true);
    });
  });

  // Simple multi tag configuration
  describe('#validate: Simple multi tag configuration - No object (spec)', () => {
    const config = [/^(648|650|651|655)$/u]; // eslint-disable-line prefer-named-capture-group

    const recordValid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
    });

    const recordInvalid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '648',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Foo Bar Foo Bar Foo Bar'},
            {code: '9', value: 'ALMA<KEEP>'}
          ]
        }
      ]
    });

    const recordInvalidDouble = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '648',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Foo'},
            {code: '9', value: 'ALMA<KEEP>'}
          ]
        }, {
          tag: '650',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Bar'},
            {code: '9', value: 'ALMA<KEEP>'}
          ]
        }
      ]
    });

    const recordInvalidFixed = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
    });

    it('Finds the record valid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordValid);
      expect({valid, message}).to.eql({valid: true, message: []});
    });

    it('Finds the record invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalid);
      expect({valid, message}).to.eql({valid: false, message: ['Field $648 should be excluded']});
    });

    it('Finds the record invalid - double', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalidDouble);
      expect({valid, message}).to.eql({valid: false, message: ['Field $648 should be excluded', 'Field $650 should be excluded']});
    });

    it('Repairs invalid record', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalid);
      expect(recordInvalid.equalsTo(recordInvalidFixed)).to.eql(true);
    });

    it('Repairs invalid record - double', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalidDouble);
      expect(recordInvalidDouble.equalsTo(recordInvalidFixed)).to.eql(true);
    });
  });


  // Complex configuration https://github.com/NatLibFi/marc-record-validators-melinda/issues/45
  describe('#validate: Complex configuration (spec)', () => {
    const config = [
      {
        tag: /^500$/u,
        subfields: [{code: /9/u, value: /^(?!FENNI<KEEP>).*$/u}]
      }
    ];

    const recordValid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '500',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Foo Bar Foo Bar Foo Bar'},
            {code: '9', value: 'FENNI<KEEP>'}
          ]
        }
      ]
    });

    const recordInvalid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '500',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Foo Bar Foo Bar Foo Bar'},
            {code: '9', value: 'ALMA<KEEP>'}
          ]
        }
      ]
    });

    const recordInvalidFixed = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
    });

    it('Finds the record valid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordValid);
      expect({valid, message}).to.eql({valid: true, message: []});
    });

    it('Finds the record invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalid);
      expect({valid, message}).to.eql({valid: false, message: ['Field $500 should be excluded']});
    });

    it('Repairs invalid record', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalid);
      expect(recordInvalid.equalsTo(recordInvalidFixed)).to.eql(true);
    });
  });

  // Complex multi tag configuration
  describe('#validate: Complex multi tag configuration (spec)', () => {
    const config = [
      {
        tag: /^(648|650|651|655)$/u, // eslint-disable-line prefer-named-capture-group
        subfields: [{code: /^2$/u, value: /^(ysa|musa|allars|cilla)$/u}] // eslint-disable-line prefer-named-capture-group
      }
    ];

    const recordValid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '650',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Foo Bar Foo Bar Foo Bar'},
            {code: '2', value: 'yso'}
          ]
        }
      ]
    });

    const recordInvalid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '650',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: 'Foo Bar Foo Bar Foo Bar'},
            {code: '2', value: 'ysa'}
          ]
        }
      ]
    });

    const recordInvalidMulti = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '648',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: '2', value: 'ysa'}]
        }, {
          tag: '650',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: '2', value: 'ysa'}]
        }, {
          tag: '650',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: '2', value: 'ysa'}]
        }, {
          tag: '651',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: '2', value: 'ysa'}]
        }, {
          tag: '655',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: '2', value: 'ysa'}]
        }
      ]
    });

    const recordInvalidFixed = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
    });

    it('Finds the record valid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordValid);
      expect({valid, message}).to.eql({valid: true, message: []});
    });

    it('Finds the record invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalid);
      expect({valid, message}).to.eql({valid: false, message: ['Field $650 should be excluded']});
    });

    it('Finds the record invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalidMulti);
      expect({valid, message}).to.eql({valid: false, message: [
        'Field $648 should be excluded',
        'Field $650 should be excluded',
        'Field $650 should be excluded',
        'Field $651 should be excluded',
        'Field $655 should be excluded'
      ]});
    });

    it('Repairs invalid multi record', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalidMulti);
      expect(recordInvalidMulti.equalsTo(recordInvalidFixed)).to.eql(true);
    });

    it('Repairs invalid record', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalid);
      expect(recordInvalid.equalsTo(recordInvalidFixed)).to.eql(true);
    });
  });

  // More special cases to increase coverage
  describe('#validate: Custom configuration', () => {
    const configInd = [
      {
        tag: /^500$/u,
        ind1: /^8$/u,
        ind2: /^4$/u
      }
    ];

    const configValue = [
      {
        tag: /^500$/u,
        value: /^8$/u
      }
    ];

    const recordValid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '500',
          ind1: '8',
          ind2: '0',
          subfields: [
            {code: 'a', value: 'Foo Bar Foo Bar Foo Bar'},
            {code: '9', value: 'ALMA<KEEP>'}
          ]
        }
      ]
    });

    const recordIndInvalid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '500',
          ind1: '8',
          ind2: '4',
          subfields: [
            {code: 'a', value: 'Foo Bar Foo Bar Foo Bar'},
            {code: '9', value: 'ALMA<KEEP>'}
          ]
        }
      ]
    });

    const recordValueInvalid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }, {
          tag: '500',
          value: '8'
        }
      ]
    });

    const recordInvalidFixed = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
    });

    it('Finds the record valid - Ind1&Ind2', async () => {
      const validator = await validatorFactory(configInd);
      const {valid, message} = await validator.validate(recordValid);
      expect({valid, message}).to.eql({valid: true, message: []});
    });

    it('Finds the record valid - Value', async () => {
      const validator = await validatorFactory(configValue);
      const {valid, message} = await validator.validate(recordValid);
      expect({valid, message}).to.eql({valid: true, message: []});
    });

    it('Finds the record invalid - Ind', async () => {
      const validator = await validatorFactory(configInd);
      const {valid, message} = await validator.validate(recordIndInvalid);
      expect({valid, message}).to.eql({valid: false, message: ['Field $500 should be excluded']});
    });

    it('Finds the record invalid - Value', async () => {
      const validator = await validatorFactory(configValue);
      const {valid, message} = await validator.validate(recordValueInvalid);
      expect({valid, message}).to.eql({valid: false, message: ['Field $500 should be excluded']});
    });

    it('Repairs invalid record - Ind', async () => {
      const validator = await validatorFactory(configInd);
      await validator.fix(recordIndInvalid);
      expect(recordIndInvalid.equalsTo(recordInvalidFixed)).to.eql(true);
    });

    it('Repairs invalid record - Value', async () => {
      const validator = await validatorFactory(configValue);
      await validator.fix(recordValueInvalid);
      expect(recordValueInvalid.equalsTo(recordInvalidFixed)).to.eql(true);
    });
  });

  describe('Dependencies', () => {
    it('Finds the record invalid because dependency matches', async () => {
      const config = [
        {
          tag: /^041$/u,
          dependencies: [{leader: /^.{6}a/u}]
        }
      ];

      const record = new MarcRecord({
        leader: '00000cam^a22003372i^4500',
        fields: [
          {
            tag: '041',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: 'Fubar'}]
          }
        ]
      });

      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(record);

      expect({valid, message}).to.eql({valid: false, message: ['Field $041 should be excluded']});
    });
  });
});
