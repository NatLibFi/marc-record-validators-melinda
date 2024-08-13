import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './merge-fields/';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';

generateTests({
  callback,
  path: [__dirname, '..', 'test-fixtures', 'merge-fields'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON
  },
  mocha: {
    before: () => testValidatorFactory()
  }
});
const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/merge-field:test');

async function testValidatorFactory() {
  const validator = await validatorFactory();

  expect(validator)
    .to.be.an('object')
    .that.has.any.keys('description', 'validate');

  expect(validator.description).to.be.a('string');
  expect(validator.validate).to.be.a('function');
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
    expect(result).to.eql(expectedResult);
    return;
  }

  await validator.fix(record);
  expect(record).to.eql(expectedResult);
}
