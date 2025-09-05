import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/sort-tags.js';
import {describe, it} from 'node:test';

describe('sort-tags', () => {
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
            tag: '001',
            value: '100'
          },
          {
            tag: '008',
            value: 'bar'
          },
          {
            tag: '100',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'Foo Bar'
              }
            ]
          },
          {
            tag: '245',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'Fubar'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);

      assert(result).to.eql({valid: true, messages: []});
    });
    it('Finds the record invalid', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '008',
            value: 'bar'
          },
          {
            tag: '001',
            value: '100'
          },
          {
            tag: '245',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'Fubar'
              }
            ]
          },
          {
            tag: '100',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'Foo Bar'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);
      assert(result).to.eql({valid: false, messages: ['Fields are in incorrect order']});
    });
  });

  describe('#fix', () => {
    it('Sorts with exclusion', async () => {
      const validator = await validatorFactory([/^5..$/u, /^7..$/u]);
      const record = new MarcRecord({
        fields: [
          {
            tag: '001',
            value: '100'
          },
          {
            tag: '530',
            value: 'bar'
          },
          {
            tag: '300',
            value: 'bar'
          },
          {
            tag: 'CCC',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'Fubar'
              }
            ]
          },
          {
            tag: '520',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'asdassdaasdsadsasad'
              }
            ]
          },
          {
            tag: 'AAA',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'qweweqewqqweweqwq'
              }
            ]
          },
          {
            tag: '700',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'Bar Foo'
              }
            ]
          },
          {
            tag: '711',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'Foo'
              }
            ]
          },
          {
            tag: '710',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'w',
                value: 'Bar'
              }
            ]
          }
        ]
      });
      await validator.fix(record);
      assert(record.fields).to.eql([
        {
          tag: '001',
          value: '100'
        },
        {
          tag: '300',
          value: 'bar'
        },
        {
          tag: '530',
          value: 'bar'
        },
        {
          tag: '520',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'asdassdaasdsadsasad'
            }
          ]
        },
        {
          tag: '700',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'Bar Foo'
            }
          ]
        },
        {
          tag: '711',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'Foo'
            }
          ]
        },
        {
          tag: '710',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'w',
              value: 'Bar'
            }
          ]
        },
        {
          tag: 'AAA',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'qweweqewqqweweqwq'
            }
          ]
        },
        {
          tag: 'CCC',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'Fubar'
            }
          ]
        }
      ]);
    });
  });
});
