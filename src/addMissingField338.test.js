import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/addMissingField338.js';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';

generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'addMissingField338'],
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

async function testValidatorFactory() {
  const validator = await validatorFactory();

  assert.equal(typeof validator, 'object');
  assert.equal(typeof validator.description, 'string');
  assert.equal(typeof validator.validate, 'function');
  assert.equal(validator.fix, 'function');
}

async function callback({getFixture, fix = false}) {
  const validator = await validatorFactory();
  const record = new MarcRecord(getFixture('record.json'));
  const expectedResult = getFixture('expectedResult.json');
  // console.log(expectedResult); // eslint-disable-line

  if (!fix) {
    const result = await validator.validate(record);
    assert.deepEqual(result, expectedResult);
    return;
  }

  await validator.fix(record);
  assert.deepEqual(record, expectedResult);
}
