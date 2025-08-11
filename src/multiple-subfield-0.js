// import createDebugLogger from 'debug';
// import clone from 'clone';
// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:multiple-subfield-0');

import {fieldHasSubfield, fieldToString} from './utils';

const asteriNamePrefixes = ['(FI-ASTERI-N)', '(FIN11)', 'http://urn.fi/URN:NBN:fi:au:finaf:', 'https://urn.fi/URN:NBN:fi:au:finaf:'];

export default function () {

  return {
    description: 'If Asteri subfield $0 is found, remove non-Asteri $0 subfields',
    validate, fix
  };

  function fix(record) {
    function fixField(field) {
      const removableSubfields = fieldGetDeletableSubfields(field);
      removableSubfields.forEach(sf => record.removeSubfield(sf, field));
    }

    const res = {message: [], fix: [], valid: true};

    const relevantFields = getRelevantFields(record);

    relevantFields.forEach(field => fixField(field));

    // message.valid = !(message.message.length >= 1);
    return res;
  }

  function validate(record) {
    function validateField(field) {
      const relevantSubfields = fieldGetDeletableSubfields(field);
      if (relevantSubfields.length === 0) {
        return 'TROUBLE';
      }
      return `Field '${fieldToString(field)}' contains deletable $0 subfield(s): ${relevantSubfields.map(sf => sf.value).join(', ')}`;
    }
    const relevantFields = getRelevantFields(record);
    const messages = relevantFields.map(field => validateField(field));
    const res = {message: messages};
    res.valid = !(res.message.length >= 1);
    return res;
  }

  function fieldGetSubfields(field, code) {
    return field.subfields.filter(sf => sf.code === code);
  }

  function isDeletableNamePartID(value) {
    // List here $0s that always refer to name part, and to never to title part
    if (value.match(/(?:isni|orcid)/ui)) {
      return true;
    }
    return false;
  }

  function isAsteriNameId(value) { // This is true if have a valid Asteri entry (nine digits etc)
    const nineDigitTail = value.slice(-9);
    if (!(/^[0-9]{9}$/u).test(nineDigitTail)) {
      return false;
    }
    // Normalize prefix:
    const currPrefix = value.slice(0, -9);

    if (asteriNamePrefixes.includes(currPrefix)) {
      return true;
    }
    return false;
  }

  function neverDropThisID(value) {
    if (isAsteriNameId(value)) {
      return true;
    }

    const prefixes = ['(FIN', '(FI-'];
    if (prefixes.some(prefix => value.startsWith(prefix))) {
      return true;
    }

    return false;
  }


  function fieldHasTitlePart(field) {
    if (['600', '610', '700', '710', '800', '810'].includes(field.tag)) {
      if (fieldHasSubfield(field, 't')) {
        return true;
      }
    }
    return false;
  }

  function fieldGetDeletableSubfields(field) {
    const subfield0s = fieldGetSubfields(field, '0');

    if (subfield0s.length < 2) {
      return []; // We have nothing to delete
    }

    // Field must contain non-Asteri subfields and Asteri subfiels.
    const nonAsteriNameSubfields = subfield0s.filter(sf => !isAsteriNameId(sf.value));
    if (nonAsteriNameSubfields.length === 0 || nonAsteriNameSubfields.length === subfield0s.length) {
      return [];
    }

    const suspiciousSubfields = nonAsteriNameSubfields.filter(sf => !neverDropThisID(sf.value));

    // Field has deletable name part $0s:
    const otherKnownNamePartIdentifiers = suspiciousSubfields.filter(sf => isDeletableNamePartID(sf.value));

    if (fieldHasTitlePart(field)) {
      return otherKnownNamePartIdentifiers;
    }

    return suspiciousSubfields;
  }

  function fieldIsRelevant(field) {
    const subfields = fieldGetDeletableSubfields(field);
    return subfields.length > 0;
  }

  function getRelevantFields(record) {
    return record.fields.filter(field => field.subfields && fieldIsRelevant(field));
  }
}
