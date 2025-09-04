import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/isbn-issn.js';
import {describe, it} from 'node:test';

describe('isbn-issn', () => {
  it('Creates a validator', async () => {
    const validator = await validatorFactory();

    assert.equal(typeof validator, 'object');
    assert.equal(typeof validator.description, 'string');
    assert.equal(typeof validator.validate, 'function');
  });

  describe('#validate', () => {
    it('Finds the record valid', async () => {
      const validator = await validatorFactory({hyphenateISBN: true});
      const record = new MarcRecord({
        fields: [
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: '978-600-377-017-1'}]
          },
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: '90-6831-372-X'}]
          },
          {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'z', value: '978-600-377-017-1'}]},
          {
            tag: '022',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: '0355-0893'}]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: true});
    });

    it('Finds the record invalid', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: 'foo'}]
          },
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: '90-68-31-372-X'}] // contains an extra hyphen
          },
          {
            tag: '022',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: 'bar'}]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {
        valid: false, messages: [
          'ISBN (foo) is not valid',
          'ISSN (bar) is not valid'
        ]
      });
    });

    it('020 field without $a and $z is ok in this context (= no invalid ISBNs)', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'q', value: 'nidottu'}]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {
        valid: true
      });
    });

    it('Finds the invalid 022 field', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '022',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'z', value: '0000-0000'}]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {
        valid: false, messages: ['ISSN (undefined) is not valid']
      });
    });

    it('Finds the record invalid (reason: multiword)', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: '978-600-377-017-1 (nid.)'}]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: false, messages: ['ISBN (978-600-377-017-1 (nid.)) is not valid']});
    });

    it('Finds the record invalid (ISSN in \'l\'-subfield)', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: 'foo'}]
          },
          {
            tag: '022',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'l', value: 'bar'}]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {
        valid: false, messages: [
          'ISBN (foo) is not valid',
          'ISSN (bar) is not valid'
        ]
      });
    });

    it('Finds the record invalid (valid ISBN without hyphens)', async () => {
      const validator = await validatorFactory({hyphenateISBN: true});
      const record = new MarcRecord({
        fields: [
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: '9789519155470'}]
          },
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: '9068-31-372-X'}] // legal digits, but bad hyphenation
          },
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: '386006004X'}]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: false, messages: [
        'ISBN (9789519155470) is not valid',
        'ISBN (9068-31-372-X) is not valid',
        'ISBN (386006004X) is not valid'
      ]});
    });

    it.skip('Finds the record invalid (Missing ISBN)');
    it.skip('Finds the record invalid (Missing ISSN)');
  });

  describe('#fix', () => {
    it('Moves invalid ISBN to z-subfield', async () => {
      const validator = await validatorFactory({handleInvalid: true});
      const record = new MarcRecord({
        fields: [
          {
            tag: '020', ind1: ' ', ind2: ' ',
            subfields: [{code: 'a', value: 'foo'}]
          },
          {
            tag: '020', ind1: ' ', ind2: ' ',
            subfields: [{code: 'a', value: 'crappy val'}]
          },
          {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: '97895234216609'}]},
          // Just a sanity check due to earlier issues:
          {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'z', value: '97895234216609'}]}
        ]
      });

      await validator.fix(record);

      assert.deepEqual(record.fields, [
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'z', value: 'foo'}]},
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'z', value: 'crappy val'}]},
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'z', value: '97895234216609'}]},
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'z', value: '97895234216609'}]}
      ]);
    });

    it('Moves invalid ISSN to y-subfield', async () => {
      const validator = await validatorFactory({handleInvalid: true});
      const record = new MarcRecord({
        fields: [
          {
            tag: '022', ind1: ' ', ind2: ' ',
            subfields: [{code: 'a', value: 'foo'}]
          }
        ]
      });

      await validator.fix(record);

      assert.deepEqual(record.fields, [
        {
          tag: '022', ind1: ' ', ind2: ' ', subfields: [{code: 'y', value: 'foo'}]
        }
      ]);
    });

    it('Moves invalid ISSN to y-subfield (Origin l-subfield)', async () => {
      const validator = await validatorFactory({handleInvalid: true});
      const record = new MarcRecord({
        fields: [
          {
            tag: '022', ind1: ' ', ind2: ' ',
            subfields: [{code: 'l', value: 'foo'}]
          }
        ]
      });

      await validator.fix(record);

      assert.deepEqual(record.fields, [
        {
          tag: '022', ind1: ' ', ind2: ' ', subfields: [{code: 'y', value: 'foo'}]
        }
      ]);
    });

    it('Trims spaces from value (No hyphenate)', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: ' 9786003770171'}]
          },
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: '9786003770171 (nidottu)'}]
          }
        ]
      });
      await validator.fix(record);

      assert.deepEqual(record.fields, [
        // NB! Initial space does not need to be removed. It's crap, but not this fixer's crap.
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: ' 9786003770171'}]},
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: '9786003770171'}, {code: 'q', value: '(nidottu)'}]}
      ]);
    });

    it('Trims spaces and hyphenates value', async () => {
      const validator = await validatorFactory({hyphenateISBN: true});
      const record = new MarcRecord({
        fields: [
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {code: 'a', value: '9786003770171 (nid.)'},
              {code: 'z', value: '9786003770171 (nid.)'},
              {code: 'z', value: 'foo bar'}
            ]
          }
        ]
      });
      await validator.fix(record);

      assert.deepEqual(record.fields, [
        {
          tag: '020',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {code: 'a', value: '978-600-377-017-1'},
            {code: 'z', value: '978-600-377-017-1'},
            {code: 'z', value: 'foo bar'},
            // NB! Technically $q should come before $z subfields, but this is good enough.
            {code: 'q', value: '(nid.)'}
          ]
        }
      ]);
    });

    it('No relevant data', async () => {
      const validator = await validatorFactory({hyphenateISBN: true});
      const record = new MarcRecord({
        fields: [
          {
            tag: '005',
            value: 'whatever'
          },
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'q', value: 'sidottu'}]
          },
          {
            tag: '024',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: ' 9786003770171'}]
          }
        ]
      });
      await validator.fix(record);

      assert.deepEqual(record.fields, [
        {tag: '005', value: 'whatever'},
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'q', value: 'sidottu'}]},
        {tag: '024', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: ' 9786003770171'}]}
      ]);
    });

    it('Add hyphens to ISBN', async () => {
      const validator = await validatorFactory({hyphenateISBN: true});
      const record = new MarcRecord({
        fields: [
          {
            tag: '020', ind1: ' ', ind2: ' ',
            subfields: [{code: 'a', value: '9789916605325'}]
          },
          {
            tag: '020', ind1: ' ', ind2: ' ',
            subfields: [{code: 'a', value: '917153086X'}]
          },
          {
            tag: '020',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: '9068-31-372-X'}] // legal digits, but bad hyphenation
          },
          {
            tag: '020', ind1: ' ', ind2: ' ',
            subfields: [{code: 'a', value: '386006004X (nid.)'}]
          },
          {
            tag: '020', ind1: ' ', ind2: ' ',
            subfields: [{code: 'z', value: '9789916605325'}]
          },
          {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'z', value: '9789916605325 (sid.)'}]}
        ]
      });

      await validator.fix(record);

      assert(record.fields).to.eql([
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: '978-9916-605-32-5'}]},
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: '91-7153-086-X'}]},
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: '90-6831-372-X'}]}, // corrected hyphens
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'a', value: '3-86006-004-X'}, {code: 'q', value: '(nid.)'}]},
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'z', value: '978-9916-605-32-5'}]},
        {tag: '020', ind1: ' ', ind2: ' ', subfields: [{code: 'z', value: '978-9916-605-32-5'}]}
      ]);
    });
  });
});
