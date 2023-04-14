import ISBN from 'isbn3';
import validateISSN from '@natlibfi/issn-verify';

// handleInvalid: move invalid 020$a to 020$z, and invalid 022$a to 022$y
export default ({hyphenateISBN = false, handleInvalid = false} = {}) => {
  return {
    validate, fix,
    description: 'Validates ISBN and ISSN values'
  };

  function stringHasSpace(str) {
    return str.indexOf(' ') > -1;
  }

  function trimSpaces(value) {
    return value.replace(/^\s+/u, '').replace(/\s+$/u, '').replace(/\s+/gu, ' ');
  }

  function isMultiWord(inputString) {
    const trimmedString = trimSpaces(inputString);
    return stringHasSpace(trimmedString);
  }

  function getFirstWord(inputString) {
    const trimmedString = trimSpaces(inputString);
    const arr = trimmedString.split(' ');
    return arr[0];
  }

  function invalidISBN(isbn) {
    const isbnOnly = getFirstWord(isbn);
    const auditedIsbn = ISBN.audit(isbnOnly);
    return !auditedIsbn.validIsbn;
  }

  function invalidSubfield(subfield) {
    if (subfield.code !== 'a') {
      return false;
    }
    return invalidISBN(subfield.value) || isMultiWord(subfield.value);
  }


  function invalidField020(field) {
    if (field.subfields && field.subfields.some(sf => invalidSubfield(sf))) {
      return true;
    }
    return false;
  }

  function subfieldsIsbnRequiresHyphenation(subfield) {
    if (!hyphenateISBN || !['a', 'z'].includes(subfield.code)) {
      return false;
    }

    const isbn = getFirstWord(subfield.value);
    if (subfield.code === 'a') {
      return requiresHyphenation(isbn);
    }

    // $z is a bit hacky: hyphenation is required only iff valid and no '-' chars
    if (isbn.indexOf('-') > -1) {
      return false;
    }
    return !invalidISBN(isbn);

    function requiresHyphenation(isbn) {
      if (!hyphenateISBN) {
        return false;
      }
      // Handle old notation such as "978-952-396-001-5 (nid.)"
      const isbn2 = getFirstWord(isbn);

      if (invalidISBN(isbn2)) {
        return false;
      }

      const parsedIsbn = ISBN.parse(isbn2);
      // Return true only if existing ISBN is a valid and hyphenated 10 or 13 digit ISBN:
      return !(isbn2 === parsedIsbn.isbn10h || isbn2 === parsedIsbn.isbn13h);
    }
  }

  function getRelevantFields(record) {
    //return record.get(/^(?:020|022)$/u).filter(field => {
    return record.fields.filter(field => {
      if (!field.subfields) {
        return false;
      }
      // Check ISBN:
      if (field.tag === '020') {
        if (invalidField020(field)) { // checks multiwordness
          return true;
        }
        return fieldsIsbnRequiresHyphenation(field);
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

    function fieldsIsbnRequiresHyphenation(field) {
      return field.subfields && field.subfields.some(sf => subfieldsIsbnRequiresHyphenation(sf));
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
    const fields = getRelevantFields(record);

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
          const subfieldZ = field.subfields.find(sf => sf.code === 'z');
          if (subfieldZ) {
            return {name: 'ISBN (subfield Z)', value: subfieldZ.value};
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
    getRelevantFields(record).forEach(field => {
      if (field.tag === '020') {
        field.subfields.forEach(subfield => fixField020Subfield(field, subfield));
        return;
      }
      // 022 ISSN:
      const subfield = field.subfields.find(sf => sf.code === 'a' || sf.code === 'l');
      if (subfield && handleInvalid) { // eslint-disable-line functional/no-conditional-statements
        // $a/$l => $y (bit overkill to add $z and remove $a/$l instead of just renaming)
        field.subfields.push({code: 'y', value: subfield.value}); // eslint-disable-line functional/immutable-data
        record.removeSubfield(subfield, field);
      }
    });


    function fixField020Subfield(field, subfield) {
      split020A(); // subfield and field are in the scope
      addHyphens(subfield);
      handleInvalidIsbn(field, subfield); // remove 020$a, add 020$z, Do this last, as it uses deletion
      return;

      function addHyphens(subfield) {
        if (!subfieldsIsbnRequiresHyphenation(subfield)) {
          return;
        }
        // ISBN is valid but is missing hyphens
        const normalizedValue = normalizeIsbnValue(subfield.value);
        if (normalizedValue !== undefined) { // eslint-disable-line functional/no-conditional-statements
          subfield.value = normalizedValue; // eslint-disable-line functional/immutable-data
        }
      }

      function handleInvalidIsbn(field, subfield) {
        if (subfield.code !== 'a' || !handleInvalid) {
          return;
        }
        const head = getFirstWord(subfield.value);
        if (!invalidISBN(head)) {
          return;
        }
        // $a => $z (bit overkill to add $z and remove $a instead of just renaming, but too lazy to fix/test thorougly)
        field.subfields.push({code: 'z', value: subfield.value}); // eslint-disable-line functional/immutable-data
        record.removeSubfield(subfield, field);
      }

      function split020A() {
        // Move non-initial words from $a to $q:
        if (subfield.code !== 'a') {
          return;
        }
        const value = trimSpaces(subfield.value);
        const position = value.indexOf(' ');
        if (position === -1) {
          return;
        }
        const head = getFirstWord(value);
        if (invalidISBN(head)) { // Don't split, if first word ain't ISBN
          return;
        }
        const tail = value.substring(position + 1);
        subfield.value = head; // eslint-disable-line functional/immutable-data
        field.subfields.push({code: 'q', value: tail}); // eslint-disable-line functional/immutable-data
      }

      function normalizeIsbnValue(value) {
        const trimmedValue = getFirstWord(value);
        //const trimmedValue = trimISBN(value); // NB! This might lose information that should be stored in $q...
        const auditResult = ISBN.audit(trimmedValue);
        if (!auditResult.validIsbn) {
          return undefined;
        }
        const numbersOnly = trimmedValue.replace(/[^0-9Xx]+/ug, '');
        const parsedIsbn = ISBN.parse(trimmedValue);
        if (hyphenateISBN) { // eslint-disable-line functional/no-conditional-statements
          return numbersOnly.length === 10 ? parsedIsbn.isbn10h : parsedIsbn.isbn13h; // eslint-disable-line functional/immutable-data
        }
        return numbersOnly.length === 10 ? parsedIsbn.isbn10 : parsedIsbn.isbn13; // eslint-disable-line functional/immutable-data
      }
    }
  }
};
