import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/double-commas.js';
import {describe, it} from 'node:test';

describe('double-commas', () => {
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
        fields: [{tag: '700', subfields: [{code: 'e', value: 'foo,bar'}]}]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: true});
    });
    it('Finds the record invalid', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [{tag: '700', subfields: [{code: 'e', value: 'foo,,bar'}]}]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: false});
    });
  });

  describe('#fix', () => {
    it('Fixes the record', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [{tag: '700', subfields: [{code: 'e', value: 'foo,,bar'}]}]
      });
      await validator.fix(record);

      assert.deepEqual(record.fields, [
        {
          tag: '700',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'e', value: 'foo,bar'}]
        }
      ]);
    });
  });
});
