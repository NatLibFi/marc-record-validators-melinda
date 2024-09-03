import {isElectronicMaterial} from './utils';

export default function (isViolaRecord = false) {
  const sf506 = [{code: 'a', value: /aineisto on käytettävissä vapaakappaletyöasemilla/ui}];
  const sf506old = [{code: 'a', value: /aineisto on käytettävissä vapaakappalekirjastoissa/ui}];
  const sf540 = [{code: 'c', value: /laki kulttuuriaineistojen tallettamisesta ja säilyttämisestä/ui}];

  function fix(record) {
    // If printed do nothing

    // If material is electronic add theis if missing
    if (!hasTag(record, '506', sf506) && !hasTag(record, '506', sf506old)) { // eslint-disable-line functional/no-conditional-statements
      const subfield9 = isViolaRecord ? [{code: '9', value: 'VIOLA<KEEP>'}] : [{code: '9', value: 'FENNI<KEEP>'}];
      const staticSubfields = [
        {
          code: 'a',
          value: 'Aineisto on käytettävissä vapaakappaletyöasemilla.'
        }, {
          code: 'f',
          value: 'Online access with authorization'
        }, {
          code: '2',
          value: 'star'
        }, {
          code: '5',
          value: 'FI-Vapaa'
        }
      ];

      record.insertField({
        tag: '506',
        ind1: '1',
        subfields: staticSubfields.concat(subfield9)
      });
    }

    // Change phrase from old to new if field with old phrase is found
    if (!hasTag(record, '506', sf506) && hasTag(record, '506', sf506old)) { // eslint-disable-line functional/no-conditional-statements
      record.fields // eslint-disable-line functional/immutable-data
        .find(f => f.tag === '506' && sf506old.every(({code, value}) => f.subfields.some(sf => sf.code === code && value.test(sf.value))))
        .subfields.find(sf => sf506old.every(({code, value}) => sf.code === code && value.test(sf.value)))
        .value = 'Aineisto on käytettävissä vapaakappaletyöasemilla.';
    }

    if (!hasTag(record, '540', sf540) && !isViolaRecord) { // eslint-disable-line functional/no-conditional-statements
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

    return {valid: hasTag(record, '506', sf506) && (hasTag(record, '540', sf540) || isViolaRecord)};
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
