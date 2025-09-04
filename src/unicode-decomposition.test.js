import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/unicode-decomposition.js';
import {describe, it} from 'node:test';

describe('unicode-decomposition', () => {
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
            tag: '245',
            subfields: [
              {
                code: 'a',
                value: 'Föö, Bär'
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
            tag: '001',
            ind1: ' ',
            ind2: '0',
            subfields: [
              {
                code: 'a',
                value: 'Föö, Bär'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: false, messages: ['The following subfields are not properly decomposed: a']});
    });

    describe('#fix', () => {
      it('Should fix the record', async () => {
        const validator = await validatorFactory();

        const record = new MarcRecord({
          fields: [
            {
              tag: '245',
              subfields: [
                {
                  code: 'a',
                  value: 'Föö, Bär'
                },
                {
                  code: 'b',
                  value: '== Fubar'
                }
              ]
            }
          ]
        });

        const recordOriginal = record.toObject();
        const fieldModified = {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'Föö, Bär'
            },
            {
              code: 'b',
              value: '== Fubar'
            }
          ]
        };
        await validator.fix(record);

        assert.notDeepEqual(recordOriginal, record);
        assert.deepEqual(record.fields, [fieldModified]);
      });
    });
  });
});
