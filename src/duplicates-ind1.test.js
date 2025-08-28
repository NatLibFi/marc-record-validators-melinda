import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './duplicates-ind1';

import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';
import createDebugLogger from 'debug';

generateTests({
  callback,
  path: [__dirname, '..', 'test-fixtures', 'duplicates-ind1'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON
  },
  mocha: {
    before: () => testValidatorFactory()
  }
});

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/duplicates-ind1:test');

async function testValidatorFactory() {
  const validator = await validatorFactory(/^500$/u);

  expect(validator)
    .to.be.an('object')
    .that.has.any.keys('description', 'validate');

  expect(validator.description).to.be.a('string');
  expect(validator.validate).to.be.a('function');
}

async function callback({getFixture, tagPattern, fix = false}) {
  const validator = await validatorFactory(new RegExp(tagPattern, 'u'));
  const record = new MarcRecord(getFixture('record.json'));
  const expectedResult = getFixture('expectedResult.json');

  if (!fix) {
    const result = await validator.validate(record);
    return expect(result).to.eql(expectedResult);
  }

  const fixedRecord = await validator.fix(record);
  debug(fixedRecord);
  expect(record.fields).to.eql(expectedResult);
}
