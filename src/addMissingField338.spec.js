import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './addMissingField338';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';

generateTests({
  callback,
  path: [__dirname, '..', 'test-fixtures', 'addMissingField338'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON
  },
  mocha: {
    before: () => testValidatorFactory()
  }
});

async function testValidatorFactory() {
  const validator = await validatorFactory();

  expect(validator)
    .to.be.an('object')
    .that.has.any.keys('description', 'validate');

  expect(validator.description).to.be.a('string');
  expect(validator.validate).to.be.a('function');
  expect(validator.fix).to.be.a('function');
}

async function callback({getFixture, fix = false}) {
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
