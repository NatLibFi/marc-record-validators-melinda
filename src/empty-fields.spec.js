import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/empty-fields';

before(() => {
  MarcRecord.setValidationOptions({subfields: false, subfieldValues: false});
});

after(() => {
  MarcRecord.setValidationOptions({});
});

describe('empty-fields', () => {
  it('Creates a validator', async () => {
    const validator = await validatorFactory();

    expect(validator)
      .to.be.an('object')
      .that.has.any.keys('description', 'validate');

    expect(validator.description).to.be.a('string');
    expect(validator.validate).to.be.a('function');
  });

  describe('#validate', () => {
    it('Finds the record valid', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '001',
            value: '1234567',
            subfields: [
              {
                code: 'a',
                value: 'foo'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);
      expect(result).to.to.have.property('valid', true);
    });

    it('Finds a missing subfield value', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '245',
            subfields: [
              {
                code: 'a'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);

      expect(result).to.eql({valid: false, messages: ['Field 245 has missing subfield values: a']});
    });

    it('Finds an empty subfield array', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '500',
            subfields: []
          }
        ]
      });
      const result = await validator.validate(record);

      expect(result).to.eql({valid: false, messages: ['Field 500 has no subfields']});
    });
  });

  describe('#fix', () => {
    it('Removes a subfield with missing value', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '245',
            subfields: [
              {
                code: 'a',
                value: 'foo'
              },
              {
                code: 'b'
              }
            ]
          }
        ]
      });
      await validator.fix(record);

      expect(record.fields).to.eql([
        {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'foo'
            }
          ]
        }
      ]);
    });

    it('Removes a field with no subfields', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '001',
            value: '1234567'
          },
          {
            tag: '500',
            subfields: []
          }
        ]
      });
      await validator.fix(record);

      expect(record.fields).to.eql([
        {
          tag: '001',
          value: '1234567'
        }
      ]);
    });
  });
});
