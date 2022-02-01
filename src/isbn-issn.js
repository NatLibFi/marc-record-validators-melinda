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

import ISBN from 'isbn3';
import validateISSN from '@natlibfi/issn-verify';

export default ({hyphenateISBN = false, handleInvalid = false, keep10 = true} = {}) => {
  return {
    validate, fix,
    description: 'Validates ISBN and ISSN values'
  };

  function getInvalidFields(record) {
    return record.get(/^(020|022)$/u).filter(field => { // eslint-disable-line prefer-named-capture-group
      // Check ISBN:
      if (field.tag === '020') {
        if (invalidField020(field)) {
          return true;
        }

        const subfield = field.subfields.find(sf => sf.code === 'a');
        const auditedIsbn = ISBN.audit(subfield.value);
        if (!auditedIsbn.validIsbn) {
          return true;
        }
        // Should we refactor code by adding a function that returns legal set of values,
        // and then we compare subfield.value against that list?
        const parsedIsbn = ISBN.parse(subfield.value);
        if (hyphenateISBN) {
          if (keep10 && subfield.value === parsedIsbn.isbn10h) {
            return false;
          }
          return subfield.value !== parsedIsbn.isbn13h;
        }

        if (keep10 && subfield.value === parsedIsbn.isbn10) {
          return false;
        }

        return subfield.value !== parsedIsbn.isbn13;
      }
      // Check ISSN:
      if (invalidField022(field)) {
        return true;
      }

      const subfield = field.subfields.find(sf => sf.code === 'a' || sf.code === 'l');

      return !validateISSN(subfield.value);
    });

    function invalidField020(field) {
      if (field.tag !== '020') {
        return false;
      }
      const subfield = field.subfields.find(sf => sf.code === 'a');

      if (subfield === undefined) {
        const sfZ = field.subfields.find(sf => sf.code === 'z');
        if (sfZ) {
          return false;
        }
        return true;
      }

      // If value contains space, it's not ok (it's typically something like "1234567890 (nid.)")
      if (subfield.value.indexOf(' ') > -1) {
        return true;
      }
      return false;
    }

    function invalidField022(field) {
      if (field.tag !== '022') {
        return false;
      }
      const subfield = field.subfields.find(sf => sf.code === 'a' || sf.code === 'l');

      if (subfield === undefined) {
        const sfY = field.subfields.find(sf => sf.code === 'y');
        if (sfY) {
          return false;
        }

        return true;
      }
      return false;
    }
  }

  function validate(record) {
    const fields = getInvalidFields(record);

    if (fields.length === 0) {
      return {valid: true};
    }

    return fields
      .map(field => {
        if (field.tag === '020') {
          const sfvalue = field.subfields.find(sf => sf.code === 'a');
          if (sfvalue) {
            return {name: 'ISBN', value: sfvalue.value};
          }

          return {name: 'ISBN', value: undefined};
        }

        return {name: 'ISSN', value: getISSN()};

        function getISSN() {
          const result = field.subfields.find(sf => sf.code === 'a' || sf.code === 'l');

          if (result) {
            return result.value;
          }

          return undefined;
        }
      })
      .reduce((acc, obj) => {
        const {name, value} = obj;
        const msg = `${name} (${value}) is not valid`;

        return {...acc, messages: acc.messages.concat(msg)};
      }, {valid: false, messages: []});
  }

  function fix(record) {
    getInvalidFields(record).forEach(field => {
      if (field.tag === '020') {
        const subfield = field.subfields.find(sf => sf.code === 'a');
        if (subfield) {
          // ISBN is valid but is missing hyphens
          const normalizedValue = normalizeIsbnValue(subfield.value);
          if (normalizedValue !== undefined) { // eslint-disable-line functional/no-conditional-statement
            subfield.value = normalizedValue; // eslint-disable-line functional/immutable-data
          } else if (handleInvalid) { // eslint-disable-line functional/no-conditional-statement
            field.subfields.push({code: 'z', value: subfield.value}); // eslint-disable-line functional/immutable-data
            record.removeSubfield(subfield, field);
          }
        }
      } else {
        const subfield = field.subfields.find(sf => sf.code === 'a' || sf.code === 'l');
        if (subfield && handleInvalid) { // eslint-disable-line functional/no-conditional-statement
          field.subfields.push({code: 'y', value: trimSpaces(subfield.value)}); // eslint-disable-line functional/immutable-data
          record.removeSubfield(subfield, field);
        }
      }
    });

    function normalizeIsbnValue(value) {
      const trimmedValue = trimISBN(value); // NB! This might lose information that should be stored in $q...
      const auditResult = ISBN.audit(trimmedValue);
      if (auditResult.validIsbn) {
        const parsedIsbn = ISBN.parse(trimmedValue);
        if (hyphenateISBN) { // eslint-disable-line functional/no-conditional-statement
          return trimmedValue.length === 10 && keep10 ? parsedIsbn.isbn10h : parsedIsbn.isbn13h; // eslint-disable-line functional/immutable-data
        }
        // Just trim
        return trimmedValue.length === 10 && keep10 ? parsedIsbn.isbn10 : parsedIsbn.isbn13; // eslint-disable-line functional/immutable-data
      }
      return undefined;
    }

    function trimSpaces(value) {
      return value.replace(/\s/gu, '');
    }

    function trimISBN(value) {
      return trimSpaces(value.replace(/\s\D+$/gu, '')); // handle "1234567890 (nid.)" => "1234567890" as well as spaces
    }
  }
};
