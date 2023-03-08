// import createDebugLogger from 'debug';
// import clone from 'clone';
// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:normalizeIdentifiers');

import {fieldHasSubfield, fieldToString} from './utils';

const asteriPrefixes = ['(FI-ASTERI-N)', '(FIN11)', 'http://urn.fi/URN:NBN:fi:au:finaf:', 'https://urn.fi/URN:NBN:fi:au:finaf:'];

export default function () {

  return {
    description: 'If Asteri subfield $0 is found, remove non-Asteri $0 subfields',
    validate, fix
  };

  function fix(record) {
    function removeNonAsteriSubfields(field) {
      const removableSubfields = getDeletableSubfields(field.subfields);
      removableSubfields.forEach(sf => record.removeSubfield(sf, field));
    }

    const res = {message: [], fix: [], valid: true};

    const relevantFields = getRelevantFields(record);

    relevantFields.forEach(field => removeNonAsteriSubfields(field));

    // message.valid = !(message.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validate(record) {
    const relevantFields = getRelevantFields(record);
    const messages = relevantFields.map(field => `Contains deletable $0 subfield(s): ${fieldToString(field)}`);
    const res = {message: messages};
    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function fieldGetSubfields(field, code) {
    return field.subfields.filter(sf => sf.code === code);
  }

  function isAsteriId(value) {
    const nineDigitTail = value.slice(-9);
    if (!(/^[0-9]{9}$/u).test(nineDigitTail)) {
      return false;
    }
    // Normalize prefix:
    const currPrefix = value.slice(0, -9);

    if (asteriPrefixes.includes(currPrefix)) {
      return true;
    }
    return false;
  }

  function getAsteriSubfields(subfields) {
    return subfields.filter(sf => isAsteriId(sf.value));
  }


  function getDeletableSubfields(subfields) {
    return subfields.filter(sf => sf.code === '0' && isDeletableId(sf.value));

    function isDeletableId(value) {
      if (isAsteriId(value)) {
        return false;
      }
      // Bit lazy here, but it's easy to edit, and this should be good enough for proof-of-concept at least
      if (value.match(/(?:isni|orcid)/ui)) {
        return true;
      }
      // Currently default to false, and delete only specified values
      return false;
    }
  }

  function fieldHasTitlePart(field) {
    if (['600', '610', '700', '710', '800', '810'].includes(field.tag)) {
      if (fieldHasSubfield(field, 't')) {
        return true;
      }
    }
    return false;
  }

  function fieldIsRelevant(field) {
    const subfield0s = fieldGetSubfields(field, '0');
    if (subfield0s.length < 2) {
      return false;
    }
    const asteriSubfields = getAsteriSubfields(subfield0s);
    if (asteriSubfields.length < 1) {
      return false;
    }

    // $0 might refer to name part or title part. If title part is present, don't remove...
    if (fieldHasTitlePart(field)) {
      return false;
    }


    const deletableSubfields = getDeletableSubfields(subfield0s);
    return deletableSubfields.length > 0;
  }

  function getRelevantFields(record) {
    return record.fields.filter(field => field.subfields && fieldIsRelevant(field));
  }
}
