import {expect} from 'chai';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/urn';

describe('urn', async () => {
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
      {code: 'b', value: 'n'},
      {code: '2', value: 'rdamedia'}
    ]
  };

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

  const ldf856partial = {
    tag: '856',
    ind1: '4',
    ind2: '0',
    subfields: [
      {code: 'u', value: 'http://urn.fi/URN:ISBN:978-951-9155-47-0'},
      {code: '5', value: 'FI-Vapaa'}
    ]
  };

  const f856URN = {
    tag: '856',
    ind1: '4',
    ind2: '0',
    subfields: [{code: 'u', value: 'http://urn.fi/URN:ISBN:978-951-9155-47-0'}]
  };

  const f856URNnotResource = {
    tag: '856',
    ind1: '4',
    ind2: '1',
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

  const f020second = {
    tag: '020',
    ind1: ' ',
    ind2: ' ',
    subfields: [{code: 'a', value: '9789519155470'}]
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
    // Validate non-electoronic
    it('Finds the record valid; non-electronic record', async () => {
      await nonld.validate(true, f337nonElectronic);
    });

    // Validate non-legal deposit
    it('Finds the record valid; 856 with urn, and is non-legal deposit', async () => {
      await nonld.validate(true, f337, f856URN);
    });


    // we should recognize that 856 with second indicator 1 is not describing the resource itself
    it.skip('Finds the record invalid; 856 ind2: 1 with urn, and is non-legal deposit', async () => {
      await nonld.validate(false, f337, f856URNnotResource);
    });

    // should we require urn if we're not handling a legal deposit
    it('Finds the record invalid; 856 without urn, and is non-legal deposit', async () => {
      await nonld.validate(false, f337, f856URL);
    });


    // should we require urn if we're not handling a legal deposit
    it('Finds the record invalid; Missing 856, and is non-legal deposit', async () => {
      await nonld.validate(false, f337, f020);
    });

    // Validate legal deposit
    it('Finds the record invalid; 856 with urn, and is legal deposit', async () => {
      await ld.validate(false, f020, f337, f856URN);
    });

    it('Finds the record invalid; 856 without urn, and is legal deposit', async () => {
      await ld.validate(false, f020, f337, f856URL);
    });

    it('Finds the record invalid; Missing 856, and is legal deposit', async () => {
      await ld.validate(false, f337, f020);
    });

    it('Finds the record valid; 856 with URN and legal deposit subfields, and is legal deposit', async () => {
      await ld.validate(true, f337, f020, ldf856);
    });

    it('Finds the record valid; 856 with URN and legal deposit subfields and other f856s, and is legal deposit', async () => {
      await ld.validate(true, f337, f020, ldf856partial, ldf856, f856URL);
    });

    it('Finds the record invalid; 856 with URN and partial legal deposit subfields, and is legal deposit', async () => {
      await ld.validate(false, f337, f020, ldf856partial);
    });


  });

  describe('#fix', () => {
    // Fix non-legal deposit
    it('856 with urn, and is non-legal deposit; Nothing to add', async () => {
      await nonld.fix([f020, f856URL, f856URN], [f020, f856URL, f856URN]);
    });

    // should we actually add non-resolvable urns?
    it('856 without urn, and is non-legal deposit; Adds 856 with urn', async () => {
      await nonld.fix([f020, f856URL], [f020, f856URL, f856URN]);
    });

    // should we actually add non-resolvable urns?
    it('Missing 856, and is non-legal deposit; Adds 856 with urn', async () => {
      await nonld.fix([f020], [f020, f856URN]);
    });

    // should we actually add non-resolvable urns?
    it('Missing 856, and is non-legal deposit, two 020 fields; Adds 856 with urn from second 020', async () => {
      await nonld.fix([f020second, f020], [f020second, f020, f856URN]);
    });

    // should we actually add non resovable urns?
    // we should think about how to choose the isbn to use in case of several ISBNs
    it.skip('Missing 856, and is non-legal deposit, two 020 fields; Adds 856 with urn from first 020', async () => {
      await nonld.fix([f020, f020second], [f020, f020second, f856URN]);
    });


    // Fix legal deposit
    it('856 with urn and legal deposit fields, and is legal deposit; Nothing to add', async () => {
      await ld.fix([f020, f856URL, ldf856], [f020, f856URL, ldf856]);
    });

    it('856 without urn, and is legal deposit; Adds 856 with urn and legal deposit fields', async () => {
      await ld.fix([f020, f856URL], [f020, f856URL, ldf856]);
    });

    // we should test generating the URN in case of no ISBN

    // we should test creating Melinda-temp field

    // We shouldn't lock the open URN for legal deposit use
    it('Missing 856, and is legal deposit; Adds 856 with urn and legal deposit fields', async () => {
      await ld.fix([f020], [f020, ldf856]);
    });

    // We should actually do this instead of locking the original non-legal deposit URN for legal deposit use
    it.skip('856 with urn, and is legal deposit; Adds another f856 with URN and legal deposit fields', async () => {
      await ld.fix([f020, f856URL, f856URN], [f020, f856URL, f856URN, ldf856]);
    });

    // We should actually add a new urn in case of a non-resource URN
    it.skip('856 with non-resource-urn, and is legal deposit; Adds another f856 with URN and legal deposit fields', async () => {
      await ld.fix([f020, f856URL, f856URNnotResource], [f020, f856URL, f856URNnotResource, ldf856]);
    });


  });
});
