/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* MARC record validators used in Melinda
*
* Copyright (c) 2014-2020 University Of Helsinki (The National Library Of Finland)
*
* This file is part of marc-record-validators-melinda
*
* marc-record-validators-melinda program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Lesser General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* marc-record-validators-melinda is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

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
      if (error.code === ERRORS.MISSING_SUBFIELD_VALUES) { // eslint-disable-line functional/no-conditional-statement
        if (error.emptySubfields.length === error.field.subfields.length) { // eslint-disable-line functional/no-conditional-statement
          record.removeField(error.field);
        } else { // eslint-disable-line functional/no-conditional-statement
          error.emptySubfields.forEach(sf => {
            record.removeSubfield(sf, error.field);
          });
        }
      } else { // eslint-disable-line functional/no-conditional-statement
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
