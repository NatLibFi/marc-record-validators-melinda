import assert from 'node:assert/strict';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './removeInferiorDataFields.js';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
//import createDebugLogger from 'debug';

generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'remove-inferior-datafields'],
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

//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/removeInferiorDataFields:test');

async function testValidatorFactory() {
  const validator = await validatorFactory();

  assert.equal(typeof validator, 'object');
  assert.equal(typeof validator.description, 'string');
  assert.equal(typeof validator.validate).to.be.a('function');
}

async function callback({getFixture, fix = false}) {
  const validator = await validatorFactory();
  const record = new MarcRecord(getFixture('record.json'));
  const expectedResult = getFixture('expectedResult.json');
  // console.log(expectedResult); // eslint-disable-line

  if (!fix) {
    const result = await validator.validate(record);
    assert.deepEqual(result, expectedResult);
    const originalRecord = new MarcRecord(getFixture('record.json'));
    assert.deepEqual(record, originalRecord); // The record should now change in validation-only
    return;
  }

  await validator.fix(record);
  assert.deepEqual(record, new MarcRecord(expectedResult));
}
