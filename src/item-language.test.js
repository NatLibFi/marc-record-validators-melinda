import assert from 'node:assert';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from './item-language.js';
import {describe, it} from 'node:test';

describe('item-language', () => {
  it('Creates a validator', async () => {
    const validator = await validatorFactory(/^520$/u);

    assert.equal(typeof validator, 'object');
    assert.equal(typeof validator.description, 'string');
    assert.equal(typeof validator.validate, 'function');
  });

  it('Throws an error when tagPattern is not provided', async () => {
    await assert.rejects(validatorFactory(), (err) => {
      assert.equal(err instanceof Error, true);
      assert.equal(err.message, 'No tagPattern provided');
      return true;
    });
    //await assert(validatorFactory()).to.be.rejectedWith(Error, 'No tagPattern provided');
  });

  describe('#validate', () => {
    it('Finds the record valid', async () => {
      const validator = await validatorFactory(/^520$/u);
      const record = new MarcRecord({
        fields: [
          {
            tag: '041',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: 'fin'}]
          },
          {
            tag: '520',
            ind1: ' ',
            ind2: '',
            subfields: [
              {
                code: 'a',
                value: 'Matti Ylösen Veroparatiisit on kirja siitä, kuinka miljonäärit ja monikansalliset yritykset ovat 20 vuoden aikana siirtäneet kiihtyvällä tahdilla tulojaan säätelyn ja verottajan ulottumattomiin korkeiden pankkisalaisuuslakien suojiin. Samoihin keitaisiin, joita myös kansainvälinen rikollisuus käyttää rahanpesuun. Suomi on toistaiseksi ollut osa ongelmaa, ei sen ratkaisua.\nKirja sisältää näkökulmia ja kiinnekohtia demokratian, hyvinvointivaltion ja kilpailullisen markkinatalouden kriiseihin. Mukana myös toimintaehdotuksia, joita Suomen tulee ajaa veroparatiisiongelman ratkaisemiseksi. Veroparatiisit on ajankohtainen tietopaketti veronkierron mekanismeista ja vaikutuksista.'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: true});
    });

    it('Finds the record invalid (Language code is missing and detection failed', async () => {
      const validator = await validatorFactory(/^520$/u);
      const record = new MarcRecord({
        fields: [
          {
            tag: '520',
            ind1: ' ',
            ind2: '',
            subfields: [
              {
                code: 'a',
                value: '.'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: false, messages: ['Language detection failed']});
    });

    it('Finds the record invalid (Detected language differs)', async () => {
      const validator = await validatorFactory(/^520$/u);
      const record = new MarcRecord({
        fields: [
          {
            tag: '008',
            value: '151118t20162016fi^a|||^^^^^^^|0|^0|fin|^'
          },
          {
            tag: '041',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: 'fin'}]
          },
          {
            tag: '520',
            ind1: ' ',
            ind2: '',
            subfields: [
              {
                code: 'a',
                value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: false, messages: ['Item language code is invalid. Correct language code: eng']});
    });

    it('Finds the record invalid (Probability doesn\'t meet treshold)', async () => {
      const validator = await validatorFactory(/^520$/u, 1);
      const record = new MarcRecord({
        fields: [
          {
            tag: '008',
            value: '151118t20162016fi^a|||^^^^^^^|0|^0|fin|^'
          },
          {
            tag: '041',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: 'fin'}]
          },
          {
            tag: '520',
            ind1: ' ',
            ind2: '',
            subfields: [
              {
                code: 'a',
                value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
              }
            ]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: true, messages: ['Item language code is invalid. Current code: fin, suggestions: eng']});
    });

    it('Finds the record invalid (No detectable text)', async () => {
      const validator = await validatorFactory(/^520$/u, 1);
      const record = new MarcRecord({
        fields: [
          {
            tag: '008',
            value: '151118t20162016fi^a|||^^^^^^^|0|^0|fin|^'
          },
          {
            tag: '041',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: 'fin'}]
          }
        ]
      });
      const result = await validator.validate(record);

      assert.deepEqual(result, {valid: true, messages: ['Language detection failed']});
    });
  });

  describe('#fix', () => {
    it('Fixes the record', async () => {
      const validator = await validatorFactory(/^520$/u);
      const record = new MarcRecord({
        fields: [
          {
            tag: '008',
            value: '151118t20162016fi^a|||^^^^^^^|0|^0|fin|^'
          },
          {
            tag: '041',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'a', value: 'eng'}]
          },
          {
            tag: '520',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
              }
            ]
          }
        ]
      });
      await validator.fix(record);

      assert.deepEqual(record.fields, [
        {
          tag: '008',
          value: '151118t20162016fi^a|||^^^^^^^|0|^0|eng|^'
        },
        {
          tag: '041',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'eng'}]
        },
        {
          tag: '520',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
            }
          ]
        }
      ]);
    });

    it('Fixes the record (Insert missing fields)', async () => {
      const validator = await validatorFactory(/^520$/u);
      const record = new MarcRecord({
        fields: [
          {
            tag: '008',
            value: '151118t20162016fi^a|||^^^^^^^|0|^0|fin|^'
          },
          {
            tag: '520',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
              }
            ]
          }
        ]
      });
      await validator.fix(record);

      assert.deepEqual(record.fields, [
        {
          tag: '008',
          value: '151118t20162016fi^a|||^^^^^^^|0|^0|eng|^'
        },
        {
          tag: '041',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'eng'}]
        },
        {
          tag: '520',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
            }
          ]
        }
      ]);
    });

    it('Fixes the record (Insert missing subfields)', async () => {
      const validator = await validatorFactory(/^520$/u);
      const record = new MarcRecord({
        fields: [
          {
            tag: '008',
            value: '151118t20162016fi^a|||^^^^^^^|0|^0|fin|^'
          },
          {
            tag: '041',
            ind1: ' ',
            ind2: ' ',
            subfields: [{code: 'b', value: 'foo'}]
          },
          {
            tag: '520',
            ind1: ' ',
            ind2: ' ',
            subfields: [
              {
                code: 'a',
                value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
              }
            ]
          }
        ]
      });
      await validator.fix(record);

      assert.deepEqual(record.fields, [
        {
          tag: '008',
          value: '151118t20162016fi^a|||^^^^^^^|0|^0|eng|^'
        },
        {
          tag: '041',
          ind1: ' ',
          ind2: ' ',
          subfields: [{code: 'a', value: 'eng'}, {code: 'b', value: 'foo'}]
        },
        {
          tag: '520',
          ind1: ' ',
          ind2: ' ',
          subfields: [
            {
              code: 'a',
              value: 'If the disclaimer of warranty and limitation of liability provided above cannot be given local legal effect according to their terms, reviewing courts shall apply local law that most closely approximates an absolute waiver of all civil liability in connection with the Program, unless a warranty or assumption of liability accompanies a copy of the Program in return for a fee.'
            }
          ]
        }
      ]);
    });

    it('Fails to fix the record', async () => {
      const validator = await validatorFactory(/^520$/u);
      const record = new MarcRecord({
        fields: [
          {
            tag: '520',
            ind1: ' ',
            ind2: '',
            subfields: [
              {
                code: 'a',
                value: '.'
              }
            ]
          }
        ]
      });

      try {
        await validator.fix(record);
      } catch (err) {
        assert.equal(err.message, 'Language code is missing and detection failed');
      }
    });
  });
});
