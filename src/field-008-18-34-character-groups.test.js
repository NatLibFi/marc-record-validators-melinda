//import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/field-008-18-34-character-groups.js';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';

generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'field-008-18-34-character-groups'],
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
const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/field-008-18-34-character-groups:test');

async function testValidatorFactory() {
  const validator = await validatorFactory();

  assert(validator)
    .to.be.an('object')
    .that.has.any.keys('description', 'validate');

  assert(validator.description).to.be.a('string');
  assert(validator.validate).to.be.a('function');
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
