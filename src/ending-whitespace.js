/**
 * Provides interface to validate and fix record fields, which include subfields that end with whitespace character
 * @returns {Object} Object containing interfaces required by marc-record-validators-melinda package
 */
export default function () {
  return {
    description: 'Handles subfields that ends with whitespace character',
    validate,
    fix
  };

  function validate(record) {
    const nonValidFields = record.fields.filter(({subfields}) => subfields.filter(valueEndsWithWhitespace).length > 0);

    const valid = nonValidFields.length === 0;
    const messages = nonValidFields.flatMap(({tag, subfields}) => subfields.map(sf => `Field ${tag} subfield $${sf.code} ends with whitespace`));

    return valid ? {valid, messages: []} : {valid, messages};
  }

  /* eslint-disable functional/immutable-data,functional/no-conditional-statement */
  function fix(record) {
    record.fields.forEach(({subfields}) => {
      subfields.forEach(subfield => {
        if (valueEndsWithWhitespace(subfield)) {
          subfield.value = subfield.value.trimEnd();
        }
      });
    });
  }
  /* eslint-enable functional/immutable-data,functional/no-conditional-statement */

  function valueEndsWithWhitespace({value}) {
    return (/\s$/u).test(value);
  }
}
