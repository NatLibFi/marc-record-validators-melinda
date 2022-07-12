import fetch from 'node-fetch';

const URN_GENERATOR_URL = 'http://generator.urn.fi/cgi-bin/urn_generator.cgi?type=nbn';

export default function (isLegalDeposit = false) {
  const hasURN = f => f.tag === '856' && f.subfields.some(({code, value}) => code === 'u' && (/urn.fi/u).test(value));

  return {
    description: 'Adds URN for record, to 856-field (if not existing)',
    validate,
    fix
  };

  async function fix(record) {
    const f856sUrn = record.fields.filter(hasURN);
    const ldSubfields = isLegalDeposit ? createLDSubfields() : [];

    if (f856sUrn.length === 0) { // eslint-disable-line functional/no-conditional-statement
      record.insertField({
        tag: '856',
        ind1: '4',
        ind2: '0',
        subfields: [...await createURNSubfield(record), ...ldSubfields]
      });
    } else if (isLegalDeposit) { // eslint-disable-line functional/no-conditional-statement
      f856sUrn.forEach(f => {
        ldSubfields.forEach(ldsf => {
          if (!f.subfields.some(sf => sf.code === ldsf.code && sf.value === ldsf.value)) { // eslint-disable-line functional/no-conditional-statement
            f.subfields.push(ldsf); // eslint-disable-line functional/immutable-data
          }
        });
      });
    }

    return true;

    async function createURNSubfield(rec) {
      const isbn = rec.fields.reduce((acc, f) => {
        if (f.tag === '020') {
          const a = f.subfields.find(sf => sf.code === 'a');
          return a ? a.value : undefined;
        }

        return acc;
      }, undefined);

      if (isbn) {
        return [{code: 'u', value: await createURN(isbn)}];
      }

      return [
        {code: 'u', value: await createURN(false)},
        {code: '9', value: 'MELINDA<TEMP>'}
      ];

      async function createURN(isbn = false) {
        if (isbn) {
          return `http://urn.fi/URN:ISBN:${isbn}`;
        }

        const response = await fetch(URN_GENERATOR_URL);
        const body = await response.text();
        return `http://urn.fi/${body}`;
      }
    }

    function createLDSubfields() {
      return [
        {
          code: 'z',
          value: 'Käytettävissä vapaakappalekirjastoissa'
        },
        {
          code: '5',
          value: 'FI-Vapaa'
        }
      ];
    }
  }

  function validate(record) {
    return {valid: record.fields.some(hasURN) && !isLegalDeposit};
  }
}
