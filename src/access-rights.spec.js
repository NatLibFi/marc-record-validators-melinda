import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/access-rights';

describe('access-rights', async () => {
  // Fields
  const f337 = {
    tag: '337',
    ind1: ' ',
    ind2: ' ',
    subfields: [
      {code: 'b', value: 'c'},
      {code: '2', value: 'rdamedia'}
    ]
  };

  const f337nonElectronic = {
    tag: '337',
    ind1: ' ',
    ind2: ' ',
    subfields: [
      {code: 'a', value: 'käytettävissä ilman laitetta'},
      {code: 'b', value: 'n'},
      {code: '2', value: 'rdamedia'}
    ]
  };

  const ldf5061old = {
    tag: '506',
    ind1: '1',
    ind2: ' ',
    subfields: [
      {code: 'a', value: 'Aineisto on käytettävissä vapaakappalekirjastoissa.'},
      {code: 'f', value: 'Online access with authorization'},
      {code: '2', value: 'star'},
      {code: '5', value: 'FI-Vapaa'},
      {code: '9', value: 'FENNI<KEEP>'}
    ]
  };

  const ldf5061new = {
    tag: '506',
    ind1: '1',
    ind2: ' ',
    subfields: [
      {code: 'a', value: 'Aineisto on käytettävissä vapaakappaletyöasemilla.'},
      {code: 'f', value: 'Online access with authorization'},
      {code: '2', value: 'star'},
      {code: '5', value: 'FI-Vapaa'},
      {code: '9', value: 'FENNI<KEEP>'}
    ]
  };


  const ldf540 = {
    tag: '540',
    ind1: ' ',
    ind2: ' ',
    subfields: [
      {code: 'a', value: 'Aineisto on käytettävissä tutkimus- ja muihin tarkoituksiin;'},
      {code: 'b', value: 'Kansalliskirjasto;'},
      {code: 'c', value: 'Laki kulttuuriaineistojen tallettamisesta ja säilyttämisestä'},
      {code: 'u', value: 'http://www.finlex.fi/fi/laki/ajantasa/2007/20071433'},
      {code: '5', value: 'FI-Vapaa'},
      {code: '9', value: 'FENNI<KEEP>'}
    ]
  };

  const f5060 = {
    tag: '506',
    ind1: '0',
    ind2: ' ',
    subfields: [
      {code: 'a', value: 'Aineisto on vapaasti saatavissa.'},
      {code: 'f', value: 'Unrestricted online access'},
      {code: '2', value: 'star'},
      {code: '9', value: 'FENNI<KEEP>'}
    ]
  };

  const f540 = {
    tag: '540',
    ind1: ' ',
    ind2: ' ',
    subfields: [{code: 'c', value: 'This publication is copyrighted. You may download, display and print it for Your own personal use. Commercial use is prohibited.'}]
  };

  it('Creates a validator', async () => {
    const validator = await validatorFactory();

    expect(validator)
      .to.be.an('object')
      .that.has.any.keys('description', 'validate');

    expect(validator.description).to.be.a('string');
    expect(validator.validate).to.be.a('function');
  });

  // Tests
  const test = await (async () => {
    const validator = await validatorFactory();
    return {
      validate: async (valid, ...recfields) => {
        const result = await validator.validate(new MarcRecord({fields: recfields}));
        expect(result).to.eql({valid});
      },

      fix: async (recfields, resfields) => {
        const record = new MarcRecord({fields: recfields});
        await validator.fix(record);
        expect(record.fields).to.eql(resfields);
      }
    };
  })();

  describe('#validate', () => {
    it('Finds the record valid; fields 5061 and 540 are missing but its ok since record is not electronic', async () => {
      await test.validate(true, f337nonElectronic);
    });

    it('Finds the record valid; Legal deposit fields 5061 and 540', async () => {
      await test.validate(true, f337, ldf5061new, ldf540);
    });

    it('Finds the record invalid; Old phrase in 5061', async () => {
      await test.validate(false, f337, ldf5061old, ldf540);
    });

    it('Finds the record invalid; Missing 5061', async () => {
      await test.validate(false, f337, f5060, ldf540);
    });

    it('Finds the record invalid; Missing 540', async () => {
      await test.validate(false, f337, ldf5061new, f540);
    });

    it('Finds the record invalid; Missing 5061 and 540', async () => {
      await test.validate(false, f337, f5060, f540);
    });
  });

  describe('#fix', () => {
    it('Legal deposit fields 5061 and 540; Nothing to add', async () => {
      await test.fix([ldf5061new, ldf540], [ldf5061new, ldf540]);
    });

    it('Old phrase in 5061; Overwritten with new phrase', async () => {
      await test.fix([ldf5061old, ldf540], [ldf5061new, ldf540]);
    });

    it('540 but missing 5061; Adds 5061', async () => {
      await test.fix([f5060, ldf540], [f5060, ldf5061new, ldf540]);
    });

    it('5061 but missing 540; Adds 540', async () => {
      await test.fix([ldf5061new, f540], [ldf5061new, f540, ldf540]);
    });

    it('Both, 5061 and 540, missing; Adds 5061 and 540', async () => {
      await test.fix([f5060, f540], [f5060, ldf5061new, f540, ldf540]);
    });
  });
});
