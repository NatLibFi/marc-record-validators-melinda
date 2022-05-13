import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/duplicates-ind1';

describe('duplicates-ind1', () => {
  it('Creates a validator', async () => {
    const validator = await validatorFactory(/^245$/u);

    expect(validator)
      .to.be.an('object')
      .that.has.any.keys('description', 'validate');

    expect(validator.description).to.be.a('string');
    expect(validator.validate).to.be.a('function');
  });

  describe('#validate', () => {
    it('Finds the record valid', async () => {
      const validator = await validatorFactory(/^500$/u);
      const record = new MarcRecord({
        fields: [
          {
            tag: '500',
            ind1: ' ',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          },
          {
            tag: '500',
            ind1: ' ',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          }
        ]
      });
      const result = await validator.validate(record);

      expect(result).to.eql({valid: true, messages: []});
    });
    it('Finds the record invalid', async () => {
      const validator = await validatorFactory(/^500$/u);
      const record = new MarcRecord({
        fields: [
          {
            tag: '500',
            ind1: ' ',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          },
          {
            tag: '500',
            ind1: '1',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          }
        ]
      });
      const result = await validator.validate(record);

      expect(result).to.eql({valid: false, messages: ['Multiple 500 fields which only differ in the first indicator']});
    });
  });

  describe('#fix', () => {
    it('Removes duplicate values', async () => {
      const validator = await validatorFactory(/^500$/u);
      const record = new MarcRecord({
        fields: [
          {
            tag: '500',
            ind1: ' ',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          },
          {
            tag: '500',
            ind1: '1',
            ind2: '0',
            subfields: [{code: 'a', value: 'foo'}]
          }
        ]
      });
      await validator.fix(record);
      expect(record.fields).to.eql([
        {
          tag: '500',
          ind1: ' ',
          ind2: '0',
          subfields: [{code: 'a', value: 'foo'}]
        }
      ]);
    });
  });
});
