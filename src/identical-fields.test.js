import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './identical-fields.js';
import {describe, it} from 'node:test';

describe('identical-fields', () => {
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

      assert.deepEqual(result, {valid: true, messages: []});
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

      assert.deepEqual(result, {valid: false, messages: ['Field 800 has duplicates', 'Field 700 has duplicates']});
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

      assert.deepEqual(record.fields, [
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
