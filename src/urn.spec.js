import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/urn';

describe('urn', async () => {
  // Fields
  const ldf856 = {
    tag: '856',
    ind1: '4',
    ind2: '0',
    subfields: [
      {code: 'u', value: 'http://urn.fi/URN:ISBN:978-951-9155-47-0'},
      {code: 'z', value: 'Käytettävissä vapaakappalekirjastoissa'},
      {code: '5', value: 'FI-Vapaa'}
    ]
  };
  const f856URN = {
    tag: '856',
    ind1: '4',
    ind2: '0',
    subfields: [{code: 'u', value: 'http://urn.fi/URN:ISBN:978-951-9155-47-0'}]
  };
  const f856URL = {
    tag: '856',
    ind1: '4',
    ind2: '0',
    subfields: [{code: 'u', value: 'http://foo.bar/'}]
  };
  const f020 = {
    tag: '020',
    ind1: ' ',
    ind2: ' ',
    subfields: [{code: 'a', value: '978-951-9155-47-0'}]
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
  const test = async isLegalDeposit => {
    const validator = await validatorFactory(isLegalDeposit);
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
  };

  /// Non-legal and legal deposit
  const nonld = await test(false);
  const ld = await test(true);

  describe('#validate', () => {
    // Validate non-legal deposit
    it('Finds the record valid; 856 with urn, and is non-legal deposit', async () => {
      await nonld.validate(true, f856URN);
    });

    it('Finds the record invalid; 856 without urn, and is non-legal deposit', async () => {
      await nonld.validate(false, f856URL);
    });

    it('Finds the record invalid; Missing 856, and is non-legal deposit', async () => {
      await nonld.validate(false, f020);
    });

    // Validate legal deposit
    it('Finds the record invalid; 856 with urn, and is legal deposit', async () => {
      await ld.validate(false, f020, f856URN);
    });

    it('Finds the record invalid; 856 without urn, and is legal deposit', async () => {
      await ld.validate(false, f020, f856URL);
    });

    it('Finds the record invalid; Missing 856, and is legal deposit', async () => {
      await ld.validate(false, f020);
    });
  });

  describe('#fix', () => {
    // Validate non-legal deposit
    it('856 with urn, and is non-legal deposit; Nothing to add', async () => {
      await nonld.fix([f020, f856URL, f856URN], [f020, f856URL, f856URN]);
    });

    it('856 without urn, and is non-legal deposit; Adds 856 with urn', async () => {
      await nonld.fix([f020, f856URL], [f020, f856URL, f856URN]);
    });

    it('Missing 856, and is non-legal deposit; Adds 856 with urn', async () => {
      await nonld.fix([f020], [f020, f856URN]);
    });

    // Validate legal deposit
    it('856 with urn and legal deposit fields, and is legal deposit; Nothing to add', async () => {
      await ld.fix([f020, f856URL, ldf856], [f020, f856URL, ldf856]);
    });

    it('856 without urn, and is legal deposit; Adds 856 with urn and legal deposit fields', async () => {
      await ld.fix([f020, f856URL], [f020, f856URL, ldf856]);
    });

    it('Missing 856, and is legal deposit; Adds 856 with urn and legal deposit fields', async () => {
      await ld.fix([f020], [f020, ldf856]);
    });

    it('856 with urn, and is legal deposit; Adds legal deposit fields', async () => {
      await ld.fix([f020, f856URL, f856URN], [f020, f856URL, ldf856]);
    });
  });
});
