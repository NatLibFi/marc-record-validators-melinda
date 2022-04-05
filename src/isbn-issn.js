/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* MARC record validators used in Melinda
*
* Copyright (c) 2014-2022 University Of Helsinki (The National Library Of Finland)
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

// handleInvalid: move invalid 020$a to 020$z, and invalid 022$a to 022$y
export default ({hyphenateISBN = false, handleInvalid = false} = {}) => {
  return {
    validate, fix,
    description: 'Validates ISBN and ISSN values'
  };

  function invalidISBN(isbn) {
    // If value contains space, it's not necessarily crap. (It's typically something like "1234567890 (nid.)".)
    // Check the first word in string:
    if (isbn.indexOf(' ') > -1) {
      // const arr = isbn.split(' ');
      // console.info(`invalidISBN(): Check '${arr[0]}' instead of '${isbn}'`); // eslint-disable-line no-console
      // return invalidISBN(arr[0]);
      return true;
    }

    const auditedIsbn = ISBN.audit(isbn);
    if (!auditedIsbn.validIsbn) {
      console.info(`Invalid ISBN detected: ${isbn}`); // eslint-disable-line no-console
      return true;
    }
    return false;
  }


  function invalidField020(field) {
    if (field.subfields && field.subfields.some(sf => invalidField020a(sf) || invalidField020z(sf))) {
      return true;
    }
    return false;

    function invalidField020a(subfield) {
      if (subfield.code !== 'a') {
        return false;
      }
      if (invalidISBN(subfield.value)) {
        return true;
      }
      return false;
    }

    function invalidField020z(subfield) {
      if (subfield.code !== 'z' || !hyphenateISBN || invalidISBN(subfield.value)) {
        return false;
      }
      // We are only interested in $z field if it is valid ISBN that requires hyphenation:
      return subfield.value.indexOf('-') === -1;
    }
  }

  function subfieldRequiresHyphenation(subfield) {
    if (subfield.code !== 'a' && subfield.code !== 'z') {
      return false;
    }
    return requiresHyphenation(subfield.value);

    function requiresHyphenation(isbn) {
      if (isbn.indexOf(' ') > -1) {
        const arr = isbn.split(' ');
        console.info(`requiresHyphenation(): Check '${arr[0]}' instead of '${isbn}'`); // eslint-disable-line no-console
        return requiresHyphenation(arr[0]);
      }

      if (invalidISBN(isbn)) {
        return false;
      }
      console.info(`sfRH ${isbn}`); // eslint-disable-line no-console
      const parsedIsbn = ISBN.parse(isbn);
      if (hyphenateISBN) {
        return !(isbn === parsedIsbn.isbn10h || isbn === parsedIsbn.isbn13h);
      }
      return false;
      //return !(isbn === parsedIsbn.isbn10 || isbn === parsedIsbn.isbn13);
    }
  }

  function getInvalidFields(record) {
    //return record.get(/^(?:020|022)$/u).filter(field => {
    return record.fields.filter(field => {
      if (!field.subfields) {
        return false;
      }
      // Check ISBN:
      if (field.tag === '020') {
        if (invalidField020(field)) {
          return true;
        }
        return fieldRequiresHyphenation(field);
      }

      // Check ISSN:
      if (field.tag === '022') {
        if (invalidField022(field)) {
          return true;
        }

        const subfield = field.subfields.find(sf => sf.code === 'a' || sf.code === 'l');

        return !validateISSN(subfield.value);
      }
      return false;
    });

    function fieldRequiresHyphenation(field) {
      return field.subfields && field.subfields.some(sf => subfieldRequiresHyphenation(sf));
    }

    function invalidField022(field) {
      const subfieldAorL = field.subfields.find(sf => sf.code === 'a' || sf.code === 'l');

      if (subfieldAorL === undefined) {
        const subfieldY = field.subfields.find(sf => sf.code === 'y');
        if (subfieldY) {
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
          const subfieldA = field.subfields.find(sf => sf.code === 'a');
          if (subfieldA) {
            return {name: 'ISBN', value: subfieldA.value};
          }

          return {name: 'ISBN', value: undefined};
        }

        return {name: 'ISSN', value: getISSN()};

        function getISSN() {
          const subfieldAorL = field.subfields.find(sf => sf.code === 'a' || sf.code === 'l');

          if (subfieldAorL) {
            return subfieldAorL.value;
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
        field.subfields.forEach(subfield => fixField020Subfield(field, subfield));
        return;
      }
      // 022 ISSN:
      const subfield = field.subfields.find(sf => sf.code === 'a' || sf.code === 'l');
      if (subfield && handleInvalid) { // eslint-disable-line functional/no-conditional-statement
        // $a/$l => $y (bit overkill to add $z and remove $a/$l instead of just renaming)
        field.subfields.push({code: 'y', value: subfield.value}); // eslint-disable-line functional/immutable-data
        record.removeSubfield(subfield, field);
      }
    });

    /*
    function trimISBN(value) {
      return trimSpaces(value.replace(/\s$/gu, '')); // handle "1234567890 (nid.)" => "1234567890" as well as spaces
    }
    */

    function fixField020Subfield(field, subfield) {
      console.info(`fixField020Subfield ${subfield.code} '${subfield.value}'`); // eslint-disable-line no-console
      if (invalidISBN(subfield.value) || subfieldRequiresHyphenation(subfield)) {
        console.info(`  fixField020Subfield ${subfield.code} '${subfield.value}'`); // eslint-disable-line no-console
        // ISBN is valid but is missing hyphens
        const normalizedValue = normalizeIsbnValue(subfield.value);
        if (normalizedValue !== undefined) { // eslint-disable-line functional/no-conditional-statement
          subfield.value = normalizedValue; // eslint-disable-line functional/immutable-data
        } else if (subfield.code === 'a' && handleInvalid) { // eslint-disable-line functional/no-conditional-statement
          // $a => $z (bit overkill to add $z and remove $a instead of just renaming, but too lazy to fix/test thorougly)
          field.subfields.push({code: 'z', value: subfield.value}); // eslint-disable-line functional/immutable-data
          record.removeSubfield(subfield, field);
        }
      }
      return;

      function normalizeIsbnValue2(trimmedValue) {
        //const trimmedValue = trimISBN(value); // NB! This might lose information that should be stored in $q...
        const auditResult = ISBN.audit(trimmedValue);
        if (auditResult.validIsbn) {
          const parsedIsbn = ISBN.parse(trimmedValue);
          if (hyphenateISBN) { // eslint-disable-line functional/no-conditional-statement
            return trimmedValue.length === 10 ? parsedIsbn.isbn10h : parsedIsbn.isbn13h; // eslint-disable-line functional/immutable-data
          }
          // Just trim
          return trimmedValue.length === 10 ? parsedIsbn.isbn10 : parsedIsbn.isbn13; // eslint-disable-line functional/immutable-data
        }
        return undefined;
      }

      function normalizeIsbnValue(value) {
        const trimmedValue = value.replace(/^\s+/gu, '');
        if (trimmedValue.indexOf(' ') === -1) {
          return normalizeIsbnValue2(trimmedValue);
        }
        const [head] = trimmedValue.split(' ');
        // NB! We currently drop the tail part, as it prevents us from pairing doubles. Parametrize?
        return normalizeIsbnValue2(head);
      }
    }
  }
};
