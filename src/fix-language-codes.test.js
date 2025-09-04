//import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './fix-language-codes.js';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';

generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'fix-language-codes'],
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

  assert(validator)
    .to.be.an('object')
    .that.has.any.keys('description', 'validate');

  assert(validator.description).to.be.a('string');
  assert(validator.validate).to.be.a('function');
}

async function callback({getFixture, fix = false}) {
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
