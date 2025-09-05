import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/field-exclusion.js';
import {describe, it} from 'node:test';

// Factory validation
describe('field-exclusion', () => {
  describe('#validate: Check configuration validation', () => {
    it('Creates a validator from simple config', async () => {
      const config = [/^500$/u];

      const validator = await validatorFactory(config);
      assert.equal(typeof validator, 'object');
      assert.equal(typeof validator.description, 'string');
      assert.equal(typeof validator.validate, 'function');
    });

    it('Creates a validator from complex config', async () => {
      const config = [
        {
          tag: /^500$/u,
          subfields: [{code: /9/u, value: /^(?!FENNI<KEEP>).*$/u}]
        }
      ];

      const validator = await validatorFactory(config);

      assert.equal(typeof validator, 'object');
      assert.equal(typeof validator.description, 'string');
      assert.equal(typeof validator.validate, 'function');

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
        assert.equal(error instanceof Error, true);
        assert.equal(error.message, 'Configuration not valid - invalid data type for: tag');
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
        assert.equal(error instanceof Error, true);
        assert.equal(error.message, 'Configuration array not provided');
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
        assert.equal(error instanceof Error, true);
        assert.equal(error.message, 'Configuration not valid - invalid data type for: code');
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
        assert.equal(error instanceof Error, true);
        assert.equal(error.message, 'Configuration not valid - invalid data type for: value');
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
        assert.equal(error instanceof Error, true);
        assert.equal(error.message, 'Configuration not valid - excluded element');
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
        assert.equal(error instanceof Error, true);
        assert.equal(error.message, 'Configuration not valid - missing mandatory element: tag');
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
        assert.equal(error instanceof Error, true);
        assert.equal(error.message, 'Configuration not valid - subfield: /9/,/^(?!FENNI<KEEP>).*$/ not object');
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
        assert.equal(error instanceof Error, true);
        assert.equal(error.message, 'Configuration not valid - subfield: /9/ not object');
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
        assert.equal(error instanceof Error, true);
        assert.equal(error.message, 'Configuration not valid - missing mandatory element: code');
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
        assert.equal(error instanceof Error, true);
        assert.equal(error.message, 'Configuration not valid - unidentified value: unidentified');
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
      assert.deepEqual({valid, message}, {valid: true, message: []});
    });

    it('Finds the record invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalid);
      assert.deepEqual({valid, message}, {valid: false, message: ['Field $500 should be excluded']});
    });

    it('Finds the record invalid - double', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalidDouble);
      assert.deepEqual({valid, message}, {valid: false, message: ['Field $500 should be excluded', 'Field $500 should be excluded']});
    });

    it('Repairs invalid record', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalid);
      assert.equal(recordInvalid.equalsTo(recordInvalidFixed), true);
    });

    it('Repairs invalid record - double', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalidDouble);
      assert.equal(recordInvalidDouble.equalsTo(recordInvalidFixed), true);
    });
  });

  // Simple multi tag configuration
  describe('#validate: Simple multi tag configuration (spec)', () => {
    const config = [
      {
        tag: /^(648|650|651|655)$/u
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
      assert.deepEqual({valid, message}, {valid: true, message: []});
    });

    it('Finds the record invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalid);
      assert.deepEqual({valid, message}, {valid: false, message: ['Field $648 should be excluded']});
    });

    it('Finds the record invalid - double', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalidDouble);
      assert.deepEqual({valid, message}, {valid: false, message: ['Field $648 should be excluded', 'Field $650 should be excluded']});
    });

    it('Repairs invalid record', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalid);
      assert.equal(recordInvalid.equalsTo(recordInvalidFixed), true);
    });

    it('Repairs invalid record - double', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalidDouble);
      assert.equal(recordInvalidDouble.equalsTo(recordInvalidFixed), true);
    });
  });

  // Simple multi tag configuration
  describe('#validate: Simple multi tag configuration - No object (spec)', () => {
    const config = [/^(648|650|651|655)$/u];

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
      assert.deepEqual({valid, message}, {valid: true, message: []});
    });

    it('Finds the record invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalid);
      assert.deepEqual({valid, message}, {valid: false, message: ['Field $648 should be excluded']});
    });

    it('Finds the record invalid - double', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalidDouble);
      assert.deepEqual({valid, message}, {valid: false, message: ['Field $648 should be excluded', 'Field $650 should be excluded']});
    });

    it('Repairs invalid record', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalid);
      assert.deepEqual(recordInvalid.equalsTo(recordInvalidFixed), true);
    });

    it('Repairs invalid record - double', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalidDouble);
      assert.equal(recordInvalidDouble.equalsTo(recordInvalidFixed), true);
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
      assert.deepEqual({valid, message}, {valid: true, message: []});
    });

    it('Finds the record invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalid);
      assert.deepEqual({valid, message}, {valid: false, message: ['Field $500 should be excluded']});
    });

    it('Repairs invalid record', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalid);
      assert.equal(recordInvalid.equalsTo(recordInvalidFixed), true);
    });
  });

  // Complex multi tag configuration
  describe('#validate: Complex multi tag configuration (spec)', () => {
    const config = [
      {
        tag: /^(648|650|651|655)$/u,
        subfields: [{code: /^2$/u, value: /^(ysa|musa|allars|cilla)$/u}]
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
      assert.deepEqual({valid, message}, {valid: true, message: []});
    });

    it('Finds the record invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalid);
      assert.deepEqual({valid, message}, {valid: false, message: ['Field $650 should be excluded']});
    });

    it('Finds the record invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const {valid, message} = await validator.validate(recordInvalidMulti);
      assert.deepEqual({valid, message}, {valid: false, message: [
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
      assert.equal(recordInvalidMulti.equalsTo(recordInvalidFixed), true);
    });

    it('Repairs invalid record', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordInvalid);
      assert.equal(recordInvalid.equalsTo(recordInvalidFixed), true);
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
      assert.deepEqual({valid, message}, {valid: true, message: []});
    });

    it('Finds the record valid - Value', async () => {
      const validator = await validatorFactory(configValue);
      const {valid, message} = await validator.validate(recordValid);
      assert.deepEqual({valid, message}, {valid: true, message: []});
    });

    it('Finds the record invalid - Ind', async () => {
      const validator = await validatorFactory(configInd);
      const {valid, message} = await validator.validate(recordIndInvalid);
      assert.deepEqual({valid, message}, {valid: false, message: ['Field $500 should be excluded']});
    });

    it('Finds the record invalid - Value', async () => {
      const validator = await validatorFactory(configValue);
      const {valid, message} = await validator.validate(recordValueInvalid);
      assert.deepEqual({valid, message}, {valid: false, message: ['Field $500 should be excluded']});
    });

    it('Repairs invalid record - Ind', async () => {
      const validator = await validatorFactory(configInd);
      await validator.fix(recordIndInvalid);
      assert.equal(recordIndInvalid.equalsTo(recordInvalidFixed), true);
    });

    it('Repairs invalid record - Value', async () => {
      const validator = await validatorFactory(configValue);
      await validator.fix(recordValueInvalid);
      assert.equal(recordValueInvalid.equalsTo(recordInvalidFixed), true);
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

      assert.deepEqual({valid, message}, {valid: false, message: ['Field $041 should be excluded']});
    });
  });
});
