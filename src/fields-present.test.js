import {describe, it} from 'node:test';
import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/fields-present.js';



describe('fields-present', () => {
  it('Creates a validator', async () => {
    const validator = await validatorFactory([/^500$/u, /^400$/u]);

    assert(validator)
      .to.be.an('object')
      .that.has.any.keys('description', 'validate');

    assert(validator.description).to.be.a('string');
    assert(validator.validate).to.be.a('function');
  });

  it('Throws an error when tagPatterns not provided', () => {
    try {
      validatorFactory();
    } catch (error) {
      assert(error).to.be.an('error').with.property('message', 'No tag pattern array provided');
    }
  });

  describe('#validate', () => {
    it('Finds the record valid', async () => {
      const tagPatterns = [/^5..$/u, /^FOO$/u];
      const validator = await validatorFactory(tagPatterns);
      const record = new MarcRecord({
        fields: [
          {
            tag: '500',
            ind1: ' ',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          },
          {
            tag: 'FOO',
            ind1: ' ',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          }
        ]
      });
      const result = await validator.validate(record);

      assert(result).to.eql({valid: true, messages: []});
    });
    it('Finds the record valid', async () => {
      const tagPatterns = [/^(020|022|024)$/u];
      const validator = await validatorFactory(tagPatterns);
      const record = new MarcRecord({
        fields: [
          {
            tag: '020',
            ind1: ' ',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          },
          {
            tag: '040',
            ind1: ' ',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          }
        ]
      });
      const result = await validator.validate(record);

      assert(result).to.eql({valid: true, messages: []});
    });
    it('Finds the record invalid', async () => {
      const tagPatterns = [/^5..$/u, /^FOO$/u];
      const validator = await validatorFactory(tagPatterns);
      const record = new MarcRecord({
        fields: [
          {
            tag: '001',
            ind1: ' ',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          },
          {
            tag: '500',
            ind1: ' ',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          },
          {
            tag: 'BAR',
            ind1: '1',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          }
        ]
      });
      const result = await validator.validate(record);

      assert(result).to.eql({valid: false, messages: ['The following tag patterns are not present in the record tag field:   /^FOO$/u']});
    });
  });
});
