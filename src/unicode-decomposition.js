const MAP_CONVERSION = {

  /**
   * @internal Normalizations
   **/
  '‐': '-',
  '‑': '-',
  '‒': '-',
  '–': '-',
  '—': '-',
  '―': '-',

  /**
  * @internal Normalizations (MELINDA-4172, MELINDA-4175)
  **/
  'Ⓒ': '©',
  'Ⓟ': '℗',

  /**
   * @internal Precompose å, ä, ö, Å, Ä and Ö
   **/
  å: 'å',
  ä: 'ä',
  ö: 'ö',
  Å: 'Å',
  Ä: 'Ä',
  Ö: 'Ö',

  /**
   * @internal Decompose everything else (list incomplete)
   **/
  á: 'á',
  à: 'à',
  â: 'â',
  ã: 'ã',
  ć: 'ć',
  č: 'č',
  ç: 'ç',
  é: 'é',
  è: 'è',
  ê: 'ê',
  ẽ: 'ẽ',
  ë: 'ë',
  í: 'í',
  ì: 'ì',
  î: 'î',
  ĩ: 'ĩ',
  ï: 'ï',
  ñ: 'ñ',
  ó: 'ó',
  ò: 'ò',
  ô: 'ô',
  õ: 'õ',
  ś: 'ś',
  š: 'š',
  ú: 'ú',
  ù: 'ù',
  û: 'û',
  ü: 'ü',
  ũ: 'ũ',
  ý: 'ý',
  ỳ: 'ỳ',
  ŷ: 'ŷ',
  ỹ: 'ỹ',
  ÿ: 'ÿ',
  ž: 'ž',
  Á: 'Á',
  À: 'À',
  Â: 'Â',
  Ã: 'Ã',
  É: 'É',
  È: 'È',
  Ê: 'Ê',
  Ẽ: 'Ẽ',
  Ë: 'Ë',
  Í: 'Í',
  Ì: 'Ì',
  Î: 'Î',
  Ĩ: 'Ĩ',
  Ï: 'Ï',
  Ñ: 'Ñ',
  Ó: 'Ó',
  Ò: 'Ò',
  Ô: 'Ô',
  Õ: 'Õ',
  Ś: 'Ś',
  Ú: 'Ú',
  Ù: 'Ù',
  Û: 'Û',
  Ũ: 'Ũ',
  Ü: 'Ü',
  Ý: 'Ý',
  Ỳ: 'Ỳ',
  Ŷ: 'Ŷ',
  Ỹ: 'Ỹ',
  Ÿ: 'Ÿ'
};

export default function () {
  const PATTERN = Object.keys(MAP_CONVERSION).reduce((result, key, index, list) => index === list.length - 1 ? new RegExp(`${result}${key})`, 'u') : `${result}${key}|`, '(');

  return {
    description: 'Unicode decomposer',
    validate,
    fix
  };

  function validate(record) {
    const codes = getFields(record.fields).map(field => {
      if ('subfields' in field) {
        return field.subfields.filter(subfield => PATTERN.test(subfield.value))
          .map(subfield => subfield.code);
      }

      return null;
    });
    return codes.length < 1 ? {valid: true, messages: []} : {valid: false, messages: [`The following subfields are not properly decomposed: ${codes.join(', ')}`]};
  }

  function fix(record) {
    getFields(record.fields).forEach(field => {
      field.subfields
        .filter(subfield => PATTERN.test(subfield.value))
        .forEach(subfield => {
          subfield.value = convert(subfield.value); // eslint-disable-line functional/immutable-data
        });
    });
  }

  function getFields(fields) {
    return fields.filter(field => {
      if ('subfields' in field) {
        return field.subfields.some(subfield => PATTERN.test(subfield.value));
      }

      return null;
    });
  }
}

export function convert(value) {
  return Object.keys(MAP_CONVERSION).reduce((result, key) => result.includes(key) ? result.replace(new RegExp(key, 'ug'), MAP_CONVERSION[key]) : result, value);
}

