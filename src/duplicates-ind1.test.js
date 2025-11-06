import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './duplicates-ind1.js';

import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';

generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'duplicates-ind1'],
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

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/duplicates-ind1:test');

async function testValidatorFactory() {
  const validator = await validatorFactory(/^500$/u);

  assert.equal(typeof validator, 'object');
  assert.equal(typeof validator.description, 'string');
  assert.equal(typeof validator.validate, 'function');
}

async function callback({getFixture, tagPattern, fix = false}) {
  const validator = await validatorFactory(new RegExp(tagPattern, 'u'));
  const record = new MarcRecord(getFixture('record.json'));
  const expectedResult = getFixture('expectedResult.json');

  if (!fix) {
    const result = await validator.validate(record);
    return assert.deepEqual(result, expectedResult);
  }

  const fixedRecord = await validator.fix(record);
  debug(fixedRecord);
  assert.deepEqual(record.fields, expectedResult);
}
