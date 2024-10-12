import fetch from 'node-fetch';
import {isElectronicMaterial} from './utils';
import createDebugLogger from 'debug';

const URN_GENERATOR_URL = 'https://generator.urn.fi/cgi-bin/urn_generator.cgi?type=nbn';

export default function (isLegalDeposit = false, useMelindaTemp = true) {
  const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:urn');
  const debugData = debug.extend('data');

  //console.log(`IS LEGAL DEPOSIT? ${isLegalDeposit ? 'YES' : 'NO'}`); // eslint-disable-line no-console

  // We should check that the f856 with URN has second indicator '0' (Resource), ' ' (No information provided) or '8' (No display constant generated)
  // - if second indicator is '1' (Version of resource) or '2' (Related resource) the URN in f856 is not correct for the resource described in the record

  // This checks only the existence of URNs from the Finnish urn.fi -resolver

  function hasLegalDepositURN(field) {
    if (field.tag !== '856' || ['1', '2', '3', '4'].includes(field.ind2)) {
      return false;
    }

    // First attempt to fix MET-573. However, does useMelindaTemp come into play as well?
    if (isLegalDeposit && !field.subfields.some(sf => sf.code === '5' && sf.value === 'FI-Vapaa')) {
      return false;
    }

    return field.subfields.some(sf => sf.code === 'u' && (/^https?:\/\/urn\.fi/u).test(sf.value));
  }


  return {
    description: 'Adds URN for record, to 856-field (if not existing). If isLegalDeposit is active, adds legal deposit subfields to the f856s with URN.',
    validate,
    fix
  };

  async function fix(record) {
    const f856sUrn = record.fields.filter(hasLegalDepositURN);
    debugData(`f856sUrn: ${JSON.stringify(f856sUrn)}`);

    const ldSubfields = isLegalDeposit ? createLDSubfields() : [];
    debugData(`IsLegalDeposit: ${isLegalDeposit}, LegalDepositSubfields: ${JSON.stringify(ldSubfields)}`);

    // We add the URN even if we're not getting the legalDeposit - where does this URN resolve?
    // We probably should not do these additions

    if (f856sUrn.length === 0) { // eslint-disable-line functional/no-conditional-statements
      const {code, value, generated} = await createURNSubfield(record);

      if (generated && useMelindaTemp) {
        const tempSubField = {code: '9', value: 'MELINDA<TEMP>'};

        record.insertField({
          tag: '856',
          ind1: '4',
          ind2: '0',
          subfields: [{code, value}, ...ldSubfields, tempSubField]
        });

        return true;
      }

      record.insertField({
        tag: '856',
        ind1: '4',
        ind2: '0',
        subfields: [{code, value}, ...ldSubfields]
      });

      return true;
    } else if (isLegalDeposit) { // eslint-disable-line functional/no-conditional-statements

      // We add here legal deposit information to all URN-f856s - we probably should not do this
      // We should add extra f856 URN / URNs for legal deposits that already have a open (non-legal-deposit) URN
      // How do we decide which URN to use as a template if there are several URNs
      // We should check for existence of a legal deposit URN anyways

      f856sUrn.forEach(f => {
        // Change phrase from old to new if field with old phrase is found
        if (f.subfields.some(sf => hasOld856LdPhrase(sf))) { // eslint-disable-line functional/no-conditional-statements
          f.subfields // eslint-disable-line functional/immutable-data
            .find(sf => hasOld856LdPhrase(sf))
            .value = 'Käytettävissä vapaakappaletyöasemilla';
        }

        // Create subfields if necessary
        ldSubfields.forEach(ldsf => {
          if (!f.subfields.some(sf => sf.code === ldsf.code && sf.value === ldsf.value && !hasOld856LdPhrase(sf))) { // eslint-disable-line functional/no-conditional-statements
            f.subfields.push(ldsf); // eslint-disable-line functional/immutable-data
          }
        });
      });
    }

    return true;

    // We should check existence of URN in f024 i1: '7' $2 urn/URN for this too

    async function createURNSubfield(rec) {
      // isbn is picked from the last 020 $a in the record
      // what should we do in case of several 020 $a:s
      const isbn = rec.fields.reduce((acc, f) => {
        if (f.tag === '020') {
          const a = f.subfields.find(sf => sf.code === 'a');
          return a ? a.value : undefined;
        }

        return acc;
      }, undefined);

      debugData(`isbns: ${isbn}`);

      const {generated, value} = await createURN(isbn);
      return {code: 'u', value, generated};

      async function createURN(isbn = false) {
        if (isbn) {
          return {generated: false, value: `https://urn.fi/URN:ISBN:${isbn}`};
        }

        const response = await fetch(URN_GENERATOR_URL);
        const body = await response.text();

        // If we generated URN we could also add it to the 024
        // generated 024 should also have $9 MELINDA<TEMP>
        return {generated: true, value: `https://urn.fi/${body}`};
      }
    }

    function hasOld856LdPhrase({code, value}) {
      if (code === 'z' && value === 'Käytettävissä vapaakappalekirjastoissa') {
        return true;
      }

      return false;
    }

  }

  // Later when the new subfields that have f506/f540 -type contents, we should add also them here
  function createLDSubfields() {
    return [
      {
        code: 'z',
        value: 'Käytettävissä vapaakappaletyöasemilla'
      },
      {
        code: '5',
        value: 'FI-Vapaa'
      }
    ];
  }

  function fieldHasLDSubfields(field, ldSubfields) {
    if (ldSubfields.every(ldsf => field.subfields.some(sf => sf.code === ldsf.code && sf.value === ldsf.value))) {
      return true;
    }
  }

  function validateLD(f856sUrn) {
    debug(`Validating the existence of legal deposit subfields`);
    const ldSubfields = createLDSubfields();
    const f856sUrnWithLdSubfields = f856sUrn.filter(field => fieldHasLDSubfields(field, ldSubfields));
    if (f856sUrnWithLdSubfields.length > 0) {
      debug(`Record has ${f856sUrnWithLdSubfields.length} URN fields with all necessary legal deposit subfields`);
      debugData(`f856sUrnWithLdSubfields: ${JSON.stringify(f856sUrnWithLdSubfields)}`);
      return true;
    }
    return false;
  }

  function validate(record) {
    // if not electronic skip this validator
    if (!isElectronicMaterial(record)) {
      debug(`Record is not electronic - no need to validate legal deposit URNs`);
      return {valid: true};
    }

    const f856sUrn = record.fields.filter(hasLegalDepositURN);

    if (f856sUrn.length > 0) {
      debug(`Record has ${f856sUrn.length} URN fields`);
      debugData(`f856sUrn: ${JSON.stringify(f856sUrn)}`);

      if (!isLegalDeposit || validateLD(f856sUrn)) {
        debug(`Record is valid`);
        return {valid: true};
      }
    }
    debug(`No (valid) URN fields - Record is not valid`);
    return {valid: false};
  }
}
