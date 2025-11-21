import assert from 'node:assert/strict';
import createDebugLogger from 'debug';
//import fetchMock from 'fetch-mock';

import validatorFactory from './drop-terms.js';

import {MarcRecord} from '@natlibfi/marc-record';
import {READERS} from '@natlibfi/fixura';
import generateTests from '@natlibfi/fixugen';

/*
//import {fakeData} from '../test-fixtures/drop-terms-data.js';


const uris = [
  'http://www.yso.fi/onto/yso/p13299',
  'http://www.yso.fi/onto/yso/p111739',
  'http://www.yso.fi/onto/yso/p6197061979',
  'http://www.yso.fi/onto/yso/p6196061969',
  'http://urn.fi/URN:NBN:fi:au:slm:s161'
];
*/


generateTests({
  callback,
  path: [import.meta.dirname, '..', 'test-fixtures', 'drop-terms'],
  useMetadataFile: true,
  recurse: false,
  fixura: {
    reader: READERS.JSON
  },
  hooks: {
    before: async () => {

      /*
      fetchMock.mockGlobal()
      .get(`https://api.finto.fi/rest/v1/data?uri=${uris[0]}&format=application%2Fjson`, {status: 200, headers: {}, body: fakeData})
      .get(`https://api.finto.fi/rest/v1/data?uri=${uris[1]}&format=application%2Fjson`, {status: 200, headers: {}, body: fakeData})
      .get(`https://api.finto.fi/rest/v1/data?uri=${uris[2]}&format=application%2Fjson`, {status: 200, headers: {}, body: fakeData})
      .get(`https://api.finto.fi/rest/v1/data?uri=${uris[3]}&format=application%2Fjson`, {status: 200, headers: {}, body: fakeData})
      .get(`https://api.finto.fi/rest/v1/data?uri=${uris[4]}&format=application%2Fjson`, {status: 200, headers: {}, body: fakeData});
*/

      testValidatorFactory();
    }
  }
});

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/drop-terms:test');

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
  const expectedResult = new MarcRecord(getFixture('expectedResult.json'));
  // console.log(expectedResult); // eslint-disable-line

  if (!fix) {
    const result = await validator.validate(record);
    assert.deepEqual(result, expectedResult);
    return;
  }

  await validator.fix(record);
  assert.deepEqual(record, expectedResult);
}
