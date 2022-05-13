import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/unicode-decomposition';

const {expect} = chai;
chai.use(chaiAsPromised);

describe('unicode-decomposition', () => {
  it('Creates a validator', async () => {
    const validator = await validatorFactory();

    expect(validator)
      .to.be.an('object')
      .that.has.any.keys('description', 'validate');

    expect(validator.description).to.be.a('string');
    expect(validator.validate).to.be.a('function');
  });

  describe('#validate', () => {
    it('Finds the record valid', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '245',
            subfields: [
              {
                code: 'a',
                value: 'Föö, Bär'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);
      expect(result).to.eql({valid: true, messages: []});
    });

    it('Finds the record invalid', async () => {
      const validator = await validatorFactory();
      const record = new MarcRecord({
        fields: [
          {
            tag: '001',
            ind1: ' ',
            ind2: '0',
            subfields: [
              {
                code: 'a',
                value: 'Föö, Bär'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);

      expect(result).to.eql({valid: false, messages: ['The following subfields are not properly decomposed: a']});
    });

    describe('#fix', () => {
      it('Should fix the record', async () => {
        const validator = await validatorFactory();

        const record = new MarcRecord({
          fields: [
            {
              tag: '245',
              subfields: [
                {
                  code: 'a',
                  value: 'Föö, Bär'
                },
                {
                  code: 'b',
                  value: '== Fubar'
                }
              ]
            }
          ]
        });

        const recordOriginal = record.toObject();
        const fieldModified = {
          tag: '245',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'Föö, Bär'
            },
            {
              code: 'b',
              value: '== Fubar'
            }
          ]
        };
        await validator.fix(record);

        expect(recordOriginal).to.not.eql(record);
        expect(record.fields).to.eql([fieldModified]);
      });
    });
  });
});
