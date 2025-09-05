import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/empty-fields.js';
import {after, before, describe, it} from 'node:test';

before(() => {
  MarcRecord.setValidationOptions({subfields: false, subfieldValues: false});
});

after(() => {
  MarcRecord.setValidationOptions({});
});

describe('empty-fields', () => {
  it('Creates a validator', async () => {
    const validator = await validatorFactory();

    assert.equal(typeof validator, 'object');
    assert.equal(typeof validator.description, 'string');
    assert.equal(typeof validator.validate, 'function');
  });

  describe('#validate', () => {
    it('Finds the record valid', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {tag: '001', value: '1234567'},
          {tag: '500', ind1: ' ', ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'foo'
              }
            ]}
        ]
      });
      const result = await validator.validate(record);
      assert.equal(result.valid, true);
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

      assert.deepEqual(result, {valid: false, messages: ['Field 245 has missing subfield values: a']});
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

      assert.deepEqual(result, {valid: false, messages: ['Field 500 has no subfields']});
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

      assert.equal(record, [
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

      assert.equal(record.fields, [
        {
          tag: '001',
          value: '1234567'
        }
      ]);
    });
  });
});
