import {isElectronicMaterial} from './utils';

export default function () {
  const sf506 = [{code: 'a', value: /aineisto on käytettävissä vapaakappalekirjastoissa/ui}];
  const sf540 = [{code: 'c', value: /laki kulttuuriaineistojen tallettamisesta ja säilyttämisestä/ui}];

  function fix(record) {
    // If printed do nothing

    // If material is electronic add theis if missing
    if (!hasTag(record, '506', sf506)) { // eslint-disable-line functional/no-conditional-statement
      record.insertField({
        tag: '506',
        ind1: '1',
        subfields: [
          {
            code: 'a',
            value: 'Aineisto on käytettävissä vapaakappalekirjastoissa.'
          }, {
            code: 'f',
            value: 'Online access with authorization'
          }, {
            code: '2',
            value: 'star'
          }, {
            code: '5',
            value: 'FI-Vapaa'
          }, {
            code: '9',
            value: 'FENNI<KEEP>'
          }
        ]
      });
    }

    if (!hasTag(record, '540', sf540)) { // eslint-disable-line functional/no-conditional-statement
      record.insertField({
        tag: '540',
        subfields: [
          {
            code: 'a',
            value: 'Aineisto on käytettävissä tutkimus- ja muihin tarkoituksiin;'
          }, {
            code: 'b',
            value: 'Kansalliskirjasto;'
          }, {
            code: 'c',
            value: 'Laki kulttuuriaineistojen tallettamisesta ja säilyttämisestä'
          }, {
            code: 'u',
            value: 'http://www.finlex.fi/fi/laki/ajantasa/2007/20071433'
          }, {
            code: '5',
            value: 'FI-Vapaa'
          }, {
            code: '9',
            value: 'FENNI<KEEP>'
          }
        ]
      });
    }

    return true;
  }

  function validate(record) {
    // if not electronic skip this validator
    if (!isElectronicMaterial(record)) {
      return {valid: true};
    }

    return {valid: hasTag(record, '506', sf506) && hasTag(record, '540', sf540)};
  }

  return {
    description: 'Adds access rights fields for a record (if not existing)',
    validate,
    fix
  };

  function hasTag(rec, tag, sfcv) {
    return rec.fields.some(f => f.tag === tag && sfcv.every(({code, value}) => f.subfields.some(sf => sf.code === code && value.test(sf.value))));
  }
}
