import {expect} from 'chai';
//import chaiAsPromised from 'chai-as-promised';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/subfield-exclusion';

//chai.use(chaiAsPromised);

// Factory validation
describe('subfield-exclusion', () => {
  describe('#validate: Check configuration validation', () => {
    it('Creates a validator from simple config', async () => {
      const config = [
        {
          tag: /^500$/u,
          subfields: [{code: /4/u}]
        }
      ];

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
          tag: /^210$/u,
          ind2: /\s/u,
          subfields: [
            {
              code: /2/u,
              value: /.+/u
            }
          ]
        }
      ];

      const validator = await validatorFactory(config);
      expect(validator)
        .to.be.an('object')
        .that.has.any.keys('description', 'validate');

      expect(validator.description).to.be.a('string');
      expect(validator.validate).to.be.a('function');
    });

    it('Fails to create a validator from invalid config - subfields missing', () => {
      const config = [
        {
          tag: /^210$/u
        }
      ];

      try {
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - missing mandatory element: subfields');
      }
    });

    it('Fails to create a validator from invalid config - tag', () => {
      const config = [
        {
          tag: '500',
          subfields: [{code: /9/u, value: /^(?!FENNI<KEEP>).*$/u}]
        }
      ];

      try {
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - invalid data type for: tag');
      }
    });

    it('Fails to create a validator from invalid config - missing array', () => {
      const config = {
        tag: '500',
        subfields: [{code: /9/u, value: /^(?!FENNI<KEEP>).*$/u}]
      };

      try {
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration array not provided');
      }
    });

    it('Fails to create a validator from invalid config - code', () => {
      const config = [
        {
          tag: /^500$/u,
          subfields: [{code: 9, value: /^(?!FENNI<KEEP>).*$/u}]
        }
      ];

      try {
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - invalid data type for: code');
      }
    });

    it('Fails to create a validator from invalid config - value', () => {
      const config = [
        {
          tag: /^500$/u,
          subfields: [{code: /9/u, value: 'Fenni'}]
        }
      ];

      try {
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - invalid data type for: value');
      }
    });


    it('Fails to create a validator from invalid config - missing mandatory: tag', () => {
      const config = [
        {
          value: /^500$/u,
          subfields: [{code: /9/u, value: /^(?!FENNI<KEEP>).*$/u}]
        }
      ];

      try {
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - missing mandatory element: tag');
      }
    });

    it('Fails to create a validator from invalid config - subfield not object: array', () => {
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
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - subfield: /9/,/^(?!FENNI<KEEP>).*$/ not object');
      }
    });

    it('Fails to create a validator from invalid config - subfield not object: string', () => {
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
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - subfield: /9/ not object');
      }
    });

    it('Fails to create a validator from invalid config - missing mandatory: subfield.code', () => {
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
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - missing mandatory element: code');
      }
    });

    it('Fails to create a validator from invalid config - unidentified field: unidentified', () => {
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
        validatorFactory(config);
      } catch (error) {
        expect(error).to.be.an('error').with.property('message', 'Configuration not valid - unidentified value: unidentified');
      }
    });
  });

  // Simple configuration https://github.com/NatLibFi/marc-record-validators-melinda/issues/46
  describe('#validate: Simple configuration (spec)', () => {
    const config = [
      {
        tag: /^100$/u,
        subfields: [{code: /4/u}]
      }
    ];

    const recordValid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '100',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Foo Bar'}]
        }, {
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
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
    });

    const recordInvalidFixed = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '100',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Foo Bar'}]
        }, {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
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


  describe('#validate: Remove only subfield -> remove field as well', () => {
    const config = [
      {
        tag: /^041$/u,
        subfields: [{code: /^[ad]$/u, value: /^zxx$/u}]
      }
    ];

    const recordOriginal = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '041',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'zxx'}]
        }, {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
    });

    const recordModified = new MarcRecord({
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

    it('Finds the record with 041$a zxx invalid (spec)', async () => {
      const validator = await validatorFactory(config);
      const result = await validator.validate(recordOriginal);
      expect(result).to.eql({valid: false, message: ['Subfield $041$$ashould be excluded']});
    });

    it('Repairs invalid record', async () => {
      const validator = await validatorFactory(config);
      await validator.fix(recordOriginal);
      expect(recordOriginal.equalsTo(recordModified)).to.eql(true);
    });
  });

  // Complex configuration https://github.com/NatLibFi/marc-record-validators-melinda/issues/46
  describe('#validate: Complex configuration (spec)', () => {
    const config = [
      {
        tag: /^210$/u,
        ind2: /\s/u,
        subfields: [{code: /2/u, value: /.+/u}]
      }
    ];

    const recordValid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '210',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Foo'}]
        }, {
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
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
    });

    const recordInvalidFixed = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '210',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Foo'}]
        }, {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Fubar'}]
        }
      ]
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
    const configInd = [
      {
        tag: /^500$/u,
        ind1: /^8$/u,
        ind2: /^4$/u,
        subfields: [{code: /2/u, value: /.+/u}]
      }
    ];

    const recordValid = new MarcRecord({
      leader: 'foo',
      fields: [
        {
          tag: '210',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'Foo'}]
        }, {
          tag: '500',
          subfields: [
            {code: 'a', value: 'Foo'},
            {code: '2', value: 'dnlm'}
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
            {code: 'a', value: 'Foo'},
            {code: '2', value: 'dnlm'}
          ]
        }
      ]
    });

    const recordIndInvalidFixed = new MarcRecord({
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
          subfields: [{code: 'a', value: 'Foo'}]
        }
      ]
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
