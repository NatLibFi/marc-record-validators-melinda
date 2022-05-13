export default function (tagPatterns) {
  if (Array.isArray(tagPatterns)) {
    return {
      description:
        'Checks whether the configured fields are present in the record',
      validate
    };
  }

  throw new Error('No tag pattern array provided');

  function validate(record) {
    const missingFields = tagPatterns.map(pattern => {
      const result = record.fields.find(field => pattern.test(field.tag));
      return result ? undefined : pattern;
    });
    const isEmpty = missingFields.every(index => index === undefined);
    let errorMessage = ['The following tag patterns are not present in the record tag field: ']; // eslint-disable-line functional/no-let
    errorMessage = errorMessage.concat(missingFields).join(' ');

    return isEmpty ? {valid: true, messages: []} : {valid: false, messages: [errorMessage]};
  }
}
