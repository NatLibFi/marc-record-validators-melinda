export default function (tagPattern) {
  if (tagPattern instanceof RegExp) {
    return {
      description:
        'Handles data fields that only differ in the first indicator',
      validate,
      fix
    };
  }

  throw new Error('No tagPattern provided');

  function validate(record) {
    const invalid = iterateFields(record)
      .find(obj => obj.validation === true);
    return invalid ? {valid: false, messages: [`Multiple ${invalid.obj.tag} fields which only differ in the first indicator`]} : {valid: true, messages: []};
  }

  function fix(record) {
    iterateFields(record)
      .filter(item => item.validation === false)
      .map(({validation, ...item}) => item) // eslint-disable-line no-unused-vars
      .forEach(field => record.removeField(field));
  }

  function iterateFields(record) {
    return record.fields.map(obj => ({validation: matches(obj, record.fields), obj}));
  }

  function matches(field, fields) {
    return tagPattern.test(field.tag) && field.ind1 === ' ' && hasDuplicate(field, fields);
  }

  function hasDuplicate(fieldA, fields) {
    return fields.some(fieldB => fieldA !== fieldB &&
      fieldA.tag === fieldB.tag &&
      fieldA.ind1 !== fieldB.ind1 &&
      fieldA.subfields.length === fieldB.subfields.length &&
      fieldA.subfields.every(aSf => fieldB.subfields.some(bSf => aSf.code === bSf.code && aSf.value === bSf.value)));
  }
}
