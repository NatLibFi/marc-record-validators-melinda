import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './merge-fields/index.js';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';
import { nvdebug } from './utils.js';

generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'merge-fields'],
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
const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/merge-fields:test');

async function testValidatorFactory() {
  const validator = await validatorFactory();

  assert.equal(typeof validator, 'object');
  assert.equal(typeof validator.description, 'string');
  assert.equal(typeof validator.validate, 'function');
}

async function callback({getFixture, enabled = true, fix = false, tagPattern = false}) {
  if (enabled === false) {
    debug('TEST SKIPPED!');
    return;
  }

  nvdebug(`TAG PATTERN: ${tagPattern}`);

  const validator = await validatorFactory(tagPattern);
  const record = new MarcRecord(getFixture('record.json'));
  const expectedResult = getFixture('expectedResult.json');
  // console.log(expectedResult); // eslint-disable-line

  // NB! This validator will only use tags matching /^[1678](?:00|10|11|30)$/ unless tagPattern is specified!
  if (!fix) {
    const result = await validator.validate(record);
    assert.deepEqual(result, expectedResult);
    return;
  }

  await validator.fix(record);
  assert.deepEqual(record, expectedResult);
}
