import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/identical-fields';

describe('identical-fields', () => {
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
            tag: '700',
            subfields: [
              {
                code: 'e',
                value: 'foo'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);

      expect(result).to.eql({valid: true, messages: []});
    });
    it('Finds the record invalid', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({

        fields: [
          {
            tag: '700',
            subfields: [
              {
                code: 'e',
                value: 'foo'
              }
            ]
          },
          {
            tag: '800',
            subfields: [
              {
                code: 'e',
                value: 'foo'
              }
            ]
          },
          {
            tag: '800',
            subfields: [
              {
                code: 'e',
                value: 'foo'
              }
            ]
          },
          {
            tag: '700',
            subfields: [
              {
                code: 'e',
                value: 'foo'
              }
            ]
          }
        ]
      });

      const result = await validator.validate(record);

      expect(result).to.eql({valid: false, messages: ['Field 800 has duplicates', 'Field 700 has duplicates']});
    });
  });

  describe('#fix', () => {
    it('Fixes the record', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '700',
            subfields: [
              {
                code: 'e',
                value: 'dest'
              }
            ]
          },
          {
            tag: '700',
            subfields: [
              {
                code: 'e',
                value: 'dest'
              }
            ]
          }
        ]
      });
      await validator.fix(record);

      expect(record.fields).to.eql([
        {
          tag: '700',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'e',
              value: 'dest'
            }
          ]
        }
      ]);
    });
  });
});
