import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/fixed-fields.js';
import {describe, it} from 'node:test';


describe('fixed-fields: language', () => {
  it('Creates a validator', async () => {
    const validator = await validatorFactory([]);

    assert.equal(typeof validator, 'object');
    assert.equal(typeof validator.description, 'string');
    assert.equal(typeof validator.validate, 'function');
  });

  it('Throws an error when configuration is not provided', () => {
    try {
      validatorFactory();
    } catch (error) {
      assert.equal(error instanceof Error, true);
      assert.equal(error.message, 'No configuration provided');
    }
  });

  describe('#validate', () => {
    it('Finds the record valid', async () => {
      const validator = await validatorFactory([
        {leader: true, length: 6, rules: [{position: [0, 6], pattern: /[abcdefg]/u}]},
        {tag: /^FOO$/u, length: 12, rules: [{position: 0, pattern: /f/u}]},
        {tag: /^BAR$/u, length: 6, rules: [
          {position: 0, pattern: /[fb]/u},
          {position: 1, pattern: /a/u, dependencies: [{position: 0, pattern: /b/u}]},
          {position: [2, 3], pattern: /u/u, dependencies: [{position: 0, pattern: /[^b]/u}]}
        ]}
      ]);
      const record = new MarcRecord({
        leader: 'bacgfe',
        fields: [
          {
            tag: 'FOO',
            value: 'foobarfoobar'
          },
          {
            tag: 'BAR',
            value: 'bauuoo'
          }
        ]
      });
      const result = await validator.validate(record);

      assert.equal(typeof result, 'object');
      assert.partialDeepStrictEqual(result, {valid: true});
    });

    it('Finds the record invalid', async () => {
      const validator = await validatorFactory([
        {leader: true, length: 6, rules: [{position: [0, 6], pattern: /[abcdefg]/u}]},
        {tag: /^FOO$/u, length: 12, rules: [{position: 0, pattern: /f/u}]},
        {tag: /^BAR$/u, length: 6, rules: [
          {position: 0, pattern: /[fb]/u},
          {position: 1, pattern: /a/u, dependencies: [{position: 0, pattern: /b/u}]},
          {position: [2, 3], pattern: /u/u, dependencies: [{position: 0, pattern: /[^a]/u}]}
        ]},
        {tag: /^FUB$/u, length: 5}
      ]);
      const record = new MarcRecord({
        leader: 'bacxfe',
        fields: [
          {
            tag: 'FOO',
            value: 'barfoofoobar'
          },
          {
            tag: 'BAR',
            value: 'burfoo'
          },
          {
            tag: 'FUB',
            value: 'foo'
          }
        ]
      });

      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: false, messages: [
        'Leader has invalid values at positions: 3 (Rule index 0)',
        'Field FOO has invalid values at positions: 0 (Rule index 0)',
        'Field BAR has invalid values at positions: 1 (Rule index 1)',
        'Field BAR has invalid values at positions: 2,3 (Rule index 2)',
        'Field FUB has invalid length'
      ]});
    });
  });
});
