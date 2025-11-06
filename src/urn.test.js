import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './urn.js';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';

generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'urn'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON
  },
  hooks: {
    before: async () => {
      testValidatorFactory();
    }
  }
});
const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/urn:test');

async function testValidatorFactory() {
  const validator = await validatorFactory();

  assert.equal(typeof validator, 'object');
  assert.equal(typeof validator.description, 'string');
  assert.equal(typeof validator.validate, 'function');
}

async function callback({getFixture, enabled = true, fix = true, isLegalDeposit = false}) {
  if (enabled === false) {
    debug('TEST SKIPPED!');
    return;
  }

  const validator = await validatorFactory(isLegalDeposit);
  const record = new MarcRecord(getFixture('input.json'));
  const expectedResult = getFixture('result.json');
  // console.log(expectedResult); // eslint-disable-line

  if (!fix) {
    const result = await validator.validate(record);
    assert.deepEqual(result, expectedResult);
    return;
  }

  await validator.fix(record);
  assert.deepEqual(record, expectedResult);
}
