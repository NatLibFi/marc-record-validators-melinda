/**
 * Provides interface to validate and fix record fields, which include subfields that contain no-breaking space character
 * @returns {Object} Object containing interfaces required by marc-record-validators-melinda package
 */
export default function () {
  return {
    description: 'Handles subfields that contains non-breaking space character',
    validate,
    fix
  };

  function validate(record) {
    const nonValidFields = record.fields.filter((field) => collectNonValidFields(field));

    const valid = nonValidFields.length === 0;
    const messages = nonValidFields.flatMap(({tag, subfields}) => subfields.map(sf => `Field ${tag} subfield $${sf.code} contains non-breaking space character(s)`));

    return valid ? {valid, messages: []} : {valid, messages};

    function collectNonValidFields(field) {
      if (field.value) {
        return (/\u00A0/u).test(field.value);
      }

      return field.subfields.filter(valueContainsNonBreakingSpace).length > 0;
    }
  }

  /* eslint-disable functional/immutable-data,functional/no-conditional-statement */
  function fix(record) {
    record.fields.forEach((field) => {
      if (field.value) {
        field.value = field.value.replaceAll(/\u00A0/gu, ' ');
        return;
      }

      field.subfields.forEach(subfield => {
        if (valueContainsNonBreakingSpace(subfield)) {
          subfield.value = subfield.value.replaceAll(/\u00A0/gu, ' ');
        }
      });
    });
  }
  /* eslint-enable functional/immutable-data,functional/no-conditional-statement */

  function valueContainsNonBreakingSpace({value}) {
    return (/\u00A0/u).test(value);
  }
}
