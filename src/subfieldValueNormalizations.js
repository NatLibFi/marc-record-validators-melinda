//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldHasSubfield, fieldToString, getCatalogingLanguage} from './utils.js';
import {fieldFixPunctuation} from './punctuation2.js';
import {fieldGetUnambiguousTag} from './subfield6Utils.js';

// NB! You should probably run punctuation fixes after this validator!

// Author(s): Nicholas Volk
export default function () {

  return {
    description: 'Fix various subfield internal values',
    validate, fix
  };

  function fix(record) {
    const catLang = getCatalogingLanguage(record, 'fin');
    const res = {message: [], fix: [], valid: true};

    record.fields.forEach(field => {
      normalizeSubfieldValues(field, catLang);
    });

    // message.valid = !(message.message.length >= 1);
    return res;
  }

  function validate(record) {
    const catLang = getCatalogingLanguage(record, 'fin');
    const res = {message: []};

    record.fields.forEach(field => {
      validateField(field, res, catLang);
    });

    res.valid = !(res.message.length >= 1);
    return res;
  }

  function validateField(field, res, catLang) {
    if (!field.subfields) {
      return;
    }
    const orig = fieldToString(field);

    const normalizedField = normalizeSubfieldValues(clone(field), catLang);
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`'${orig}' requires subfield internal mods/normalization`);
      return;
    }
    return;
  }
}


function handleInitials(value, subfieldCode, field) {
  // MRA-267/273
  if (field.ind1 === '1' && subfieldCode === 'a' && ['100', '600', '700', '800'].includes(field.tag) && !fieldHasSubfield(field, '0')) {
    // Fix MRA-267/273 (partial): Handle the most common case(s). (And extend them rules later on if the need arises):
    // No longest initial sequence I've seen is six (in a Sri Lankan name).
    for (var i=0; i < 6 && initialsInRow(value); i++) {
      // NB: Regexp has ','. Everything before it belongs to the surname. Everything after it is free game.
      value = value.replace(/(,.*) ([A-Z]|Å|Ö|Ö)\.([A-Z]|Å|Ö|Ö)/u, '$1 $2. $3');
    }
  }

  return value;

  function initialsInRow(str) {
    // initial space confirms us that it's an initial
    return str.match(/ (?:[A-Z]|Å|Ä|Ö)\.(?:[A-Z]|Å|Ä|Ö)/u);
  }
}

function getNormalizedValue(subfield, field, catLang) {
  return handleFikt(uppercaseLanguage(handleMovies(handleInitials(subfield.value, subfield.code, field))));

  function handleFikt(value) {
    if (subfield.code !== 'c' || field.tag !== '600') {
      return value;
    }

    return wrapFiktiivinenHahmo(expandFikt(value));

    function wrapFiktiivinenHahmo(value) {
      if (value.includes('(')) { // Some kind of parentheses already found -> nothing to do here
        return value;
      }
      if (value.match(/^(?:fiktiivinen hahmo|fiktiv gestalt|fiktiivinen yhteisö)[,.]?$/u)) {
        // Hope that some other module handles punctuation, if needed:
        return `(${value.replace(/[.,]$/u, '')})`;
      }
      return value;
    }

    // wrap text around parentheses
    function expandFikt(value) {
      if (field.ind1 === '3') { // Not handling "fiktiivinen yhteisö" at the moment
        return value;
      }

      if (value.match(/\bfikt\.?(?:$|[,)])/u) && !value.match(/fikt.*fikt/ui)) {
        // NB! Dot '.' in 'fikt.' might also be punctuation as well. Run punctuation2 fixer after this fixer!
        if (catLang === 'fin') {
          return value.replace(/\bfikt\./u, 'fiktiivinen hahmo');
        }
        if (catLang === 'swe') {
          return value.replace(/\bfikt\./u, 'fiktiv gestalt');
        }
      }
      return value;
    }

  }

  function handleMovies(value) {
    if (subfield.code === 'a' && ['130', '630', '730'].includes(field.tag)) {
      // MRA-614: "(elokuva, 2000)" => "(elokuva : 2000)""
      return value.replace(/\((elokuva), (19[0-9][0-9]|20[0-2][0-9])\)/u, '($1 : $2)');
    }
    return value;
  }


  function uppercaseLanguage(value) { // Part of MET-549
    const relevantTags = ['130', '240', '243', '600', '610', '611', '630', '700', '710', '711', '730', '800', '810', '811', '830'];

    if (subfield.code !== 'l') {
      return value;
    }
    const targetTag = tagForUppercasing();
    if (relevantTags.includes(targetTag)) {
      const newValue = `${value[0].toUpperCase()}${value.slice(1)}`;
      if (newValue !== value) {
        fieldFixPunctuation(field); // Rather hackily try to fix prev punc on the fly
        return newValue;
      }
    }

    function tagForUppercasing() {
      return field.tag === '880' ? fieldGetUnambiguousTag(field) : field.tag;
    }

    return value;
  }
}

function normalizeSubfieldValues(field, catLang) {
  if (!field.subfields) {
    return field;
  }
  field.subfields.forEach((subfield, index) => {
    if (!field.subfields[index].value) {
      return;
    }
    field.subfields[index].value = getNormalizedValue(subfield, field, catLang);
  });
  return field;
}
