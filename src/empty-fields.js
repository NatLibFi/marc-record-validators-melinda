const ERRORS = {
  EMPTY_SUBFIELDS: 2,
  MISSING_SUBFIELD_VALUES: 3
};

export default function () {
  return {
    description: 'Handles empty fields',
    validate,
    fix
  };

  function validate(record) {
    const errors = findErrors(record.fields);
    if (errors.length > 0) {
      return {
        valid: false,
        messages: errors.map(error => { // eslint-disable-line array-callback-return
          switch (error.code) {
          case ERRORS.EMPTY_SUBFIELDS:
            return `Field ${error.field.tag} has no subfields`;
          case ERRORS.MISSING_SUBFIELD_VALUES:
            return `Field ${error.field.tag} has missing subfield values: ${error.emptySubfields.map(sf => sf.code).join()}`;
          default:
          }
        })
      };
    }

    return {valid: true};
  }

  function fix(record) {
    const errors = findErrors(record.fields);
    errors.forEach(error => {
      if (error.code === ERRORS.MISSING_SUBFIELD_VALUES) {
        if (error.emptySubfields.length === error.field.subfields.length) {
          record.removeField(error.field);
        } else {
          error.emptySubfields.forEach(sf => {
            record.removeSubfield(sf, error.field);
          });
        }
      } else {
        record.removeField(error.field);
      }
    });
  }

  function findErrors(fields) {
    return fields.reduce((errors, field) => {
      if (field.subfields) {
        if (field.subfields.length === 0) {
          return errors.concat({field, code: ERRORS.EMPTY_SUBFIELDS});
        }

        const subfieldsWithoutValue = field.subfields.filter(sf => !sf.value);

        if (subfieldsWithoutValue.length > 0) {
          return errors.concat({
            field,
            emptySubfields: subfieldsWithoutValue,
            code: ERRORS.MISSING_SUBFIELD_VALUES
          });
        }
      }

      return errors;
    }, []);
  }
}
