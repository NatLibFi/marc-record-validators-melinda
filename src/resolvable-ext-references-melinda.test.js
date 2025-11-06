import assert from 'node:assert';
//import chai from 'chai';
//import chaiAsPromised from 'chai-as-promised';
import {MarcRecord} from '@natlibfi/marc-record';
import fetchMock from 'fetch-mock';
import * as testContext from './resolvable-ext-references-melinda.js';
import {fixture5000, fixture9550, fixture1000} from '../test-fixtures/resolvable-ext-references-melinda.js';
import {afterEach, beforeEach, describe, it} from 'node:test';

//const {expect} = chai;
//chai.use(chaiAsPromised);

const endpoint = 'http://melinda.kansalliskirjasto.fi:210/fin01';
const queryParam = '?operation=searchRetrieve&maximumRecords=2&version=1&query=rec.id=';
const prefixPattern = /^\(FOOBAR\)/u;
const fields = {
  773: ['w'],
  833: ['w', 'p']
};


describe('resolvable-ext-references-melinda', () => {
  afterEach(() => {
    fetchMock.unmockGlobal();
    // testContext.default.__ResetDependency__('fetch');
  });

  beforeEach(() => {
    fetchMock.mockGlobal(); // replace fetch with fetch-mock's implementation
    fetchMock.get(`${endpoint}${queryParam}5000`, {status: 200, headers: {}, body: fixture5000})
      .get(`${endpoint}${queryParam}9550`, {status: 200, headers: {}, body: fixture9550})
      .get(`${endpoint}${queryParam}1000`, {status: 200, headers: {}, body: fixture1000});

  });

  it('Creates a validator', async () => {
    const validator = await testContext.default({endpoint, prefixPattern, fields});

    assert.equal(typeof validator, 'object');
    assert.equal(typeof validator.description, 'string');
    assert.equal(typeof validator.validate, 'function');
  });

  it('Throws an error when prefixPattern not provided', async () => {
    const validator = await testContext.default({endpoint, prefixPattern, fields});
    // Cannot read property 'fields' of undefined or Cannot read properties of undefined (reading 'fields')'
    try {
      await validator.validate();
      throw new Error("Test expected an error");
    }
    catch (err) {
      assert.equal(err instanceof Error, true);
      assert.match(err.message, /^Cannot read propert/u);
    }
    //await assert(validator.validate()).to.be.rejectedWith(Error, /^Cannot read propert/u);
  });

  describe('#validate', () => {


    it('Finds prefixPattern on record and removes it', async () => {

      const validator = await testContext.default({endpoint, prefixPattern, fields});

      const record = new MarcRecord({
        fields: [
          {
            tag: '001',
            value: '123456'
          },
          {
            tag: '035',
            subfields: [
              {
                code: 'a',
                value: '(FI-MELINDA)123456'
              }
            ]
          },
          {
            tag: '773',
            subfields: [
              {
                code: 'w',
                value: '(FOOBAR)5000'
              }
            ]
          },
          {
            tag: '833',
            subfields: [
              {
                code: 'p',
                value: '(FOOBAR)9550'
              },
              {
                code: 'c',
                value: '(FI-MELINDA)8850'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: true, messages: []});
    });

    it('Finds no matching prefixPattern on record', async () => {
      //const mock = fetchMock.sandbox();

      //mock.get(`${endpoint}5000`, fixture5000);

      //testContext.default.__Rewire__('fetch', mock);
      const validator = await testContext.default({endpoint, prefixPattern, fields});

      const record = new MarcRecord({
        fields: [
          {
            tag: '001',
            value: '123456'
          },
          {
            tag: '035',
            subfields: [
              {
                code: 'a',
                value: '(FI-MELINDA)123456'
              }
            ]
          },
          {
            tag: '773',
            subfields: [
              {
                code: 'w',
                value: '(FI-MELINDA)123456'
              }
            ]
          },
          {
            tag: '833',
            subfields: [
              {
                code: 'p',
                value: '(FI-MELINDA)2620'
              },
              {
                code: 'w',
                value: '(FI-MELINDA)8850'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: true, messages: []});
    });

    it('Finds prefixPattern on record but values not resolvable', async () => {
      //const mock = fetchMock.sandbox();
      //mock.get(`${endpoint}${queryParam}1000`, fixture1000);

      //testContext.default.__Rewire__('fetch', mock);
      const validator = await testContext.default({endpoint, prefixPattern, fields});

      const record = new MarcRecord({
        fields: [
          {
            tag: '001',
            value: '123456'
          },
          {
            tag: '035',
            subfields: [
              {
                code: 'a',
                value: '(FI-MELINDA)123456'
              }
            ]
          },
          {
            tag: '773',
            subfields: [
              {
                code: 'w',
                value: '(FOOBAR)1000'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: false, messages: ['Field 773$w with value 1000 is not resolvable']});
    });
  });
});
