import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './urn';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';

generateTests({
  callback,
  path: [__dirname, '..', 'test-fixtures', 'urn'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON
  },
  mocha: {
    before: () => testValidatorFactory()
  }
});
const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/urn:test');

async function testValidatorFactory() {
  const validator = await validatorFactory();

  expect(validator)
    .to.be.an('object')
    .that.has.any.keys('description', 'validate');

  expect(validator.description).to.be.a('string');
  expect(validator.validate).to.be.a('function');
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
    expect(result).to.eql(expectedResult);
    return;
  }

  await validator.fix(record);
  expect(record).to.eql(expectedResult);
}
