//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldHasSubfield, fieldToString} from './utils';


// Author(s): Nicholas Volk
export default function () {

  return {
    description: 'Fix various subfield internal values',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};

    record.fields.forEach(field => {
      normalizeSubfieldValues(field);
    });

    // message.valid = !(message.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validate(record) {
    const res = {message: []};

    record.fields.forEach(field => {
      validateField(field, res);
    });

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validateField(field, res) {
    if (!field.subfields) {
      return;
    }
    const orig = fieldToString(field);

    const normalizedField = normalizeSubfieldValues(clone(field));
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`'${orig}' requires subfield internal mods/normalization`); // eslint-disable-line functional/immutable-data
      return;
    }
    return;
  }
}


function handleInitials(value, subfieldCode, field) {
  // MRA-267/273
  /* eslint-disable */
  if (field.ind1 === '1' && subfieldCode === 'a' && ['100', '600', '700', '800'].includes(field.tag) && !fieldHasSubfield(field, '0')) {
    // Fix MRA-267/273 (partial): Handle the most common case(s). (And extend them rules later on if the need arises):
    // No longest initial sequence I've seen is six (in a Sri Lankan name).
    for (var i=0; i < 6 && initialsInRow(value); i++) {
      // NB: Regexp has ','. Everything before it belongs to the surname. Everything after it is free game.
      value = value.replace(/(,.*) ([A-Z]|Å|Ö|Ö)\.([A-Z]|Å|Ö|Ö)/u, '$1 $2. $3');
    }
  }

  return value;

  /* eslint-enable */
  function initialsInRow(str) {
    // initial space confirms us that it's an initial
    return str.match(/ (?:[A-Z]|Å|Ä|Ö)\.(?:[A-Z]|Å|Ä|Ö)/u);
  }

}
function getNormalizedValue(subfield, field) {
  /* eslint-disable */
  let value = subfield.value;
  value = handleInitials(value, subfield.code, field);


  if (subfield.code === 'a' && ['130', '630', '730'].includes(field.tag)) {
    // MRA-614: "(elokuva, 2000)" => "(elokuva : 2000)""
    return value.replace(/\((elokuva), (19[0-9][0-9]|20[0-2][0-9])\)/u, '($1 : $2)'); // eslint-disable-line prefer-named-capture-group
  }

  // Part of MET-549: Uppercase language (punctuation is handled elsewhere):
  if (subfield.code === 'l' && ['130', '240', '243', '600', '610', '611', '630', '700', '710', '711', '730', '800', '810', '811', '830']) {
    return `${value[0].toUpperCase()}${value.slice(1)}`;
  }
  /* eslint-enable */
  return value;
}

function normalizeSubfieldValues(field) {
  if (!field.subfields) {
    return field;
  }
  field.subfields.forEach((subfield, index) => {
    field.subfields[index].value = getNormalizedValue(subfield, field); // eslint-disable-line functional/immutable-data
  });
  return field;
}
