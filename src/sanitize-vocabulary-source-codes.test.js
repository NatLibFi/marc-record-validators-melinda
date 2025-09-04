import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './sanitize-vocabulary-source-codes.js';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';

generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'sanitize-vocabulary-source-codes'],
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
const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/sanitize-vocabulary-source-codes:test');

async function testValidatorFactory() {
  const validator = await validatorFactory();

  assert.equal(typeof validator, 'object');
  assert.equal(typeof validator.description, 'string');
  assert.equal(typeof validator.validate, 'function');
}

async function callback({getFixture, enabled = true, fix = false}) {
  if (enabled === false) {
    debug('TEST SKIPPED!');
    return;
  }

  const validator = await validatorFactory();
  const record = new MarcRecord(getFixture('record.json'));
  const expectedResult = getFixture('expectedResult.json');
  // console.log(expectedResult); // eslint-disable-line

  if (!fix) {
    const result = await validator.validate(record);
    assert(result).to.eql(expectedResult);
    return;
  }

  await validator.fix(record);
  assert(record).to.eql(expectedResult);
}
