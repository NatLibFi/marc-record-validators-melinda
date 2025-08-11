import {MarcRecord} from '@natlibfi/marc-record';

export default function (tagPattern) {
  return {
    description:
      'Handles field ordering',
    validate,
    fix: async record => ({
      fix: await sort(record, tagPattern)
    })
  };

  function validate(record, tagPattern) {
    return MarcRecord.isEqual(record.fields, sort(record.fields, tagPattern)) ? {valid: true, messages: []} : {valid: false, messages: ['Fields are in incorrect order']};
  }

  function sort(record, tagPattern) {
    if (tagPattern) {
      return sortPatternFields(record, tagPattern);
    }

    return sortFields(record);
  }
}

function sortPatternFields(record, tagPattern) {
  const matchingTags = record.fields.map(field => tagPattern.some(pattern => pattern.test(field.tag)) ? field : null).filter(tag => tag);
  const sortedArray = sortFields(record.fields);
  const fixedArray = sortedArray.filter(field => !tagPattern.some(pattern => pattern.test(field.tag)));
  fixedArray.splice(index(sortedArray, tagPattern), 0, ...matchingTags);
  record.fields = fixedArray;
}

function sortFields(fields) {
  return [...fields].sort((a, b) => {
    if (a.tag > b.tag) {
      return 1;
    }
    if (b.tag > a.tag) {
      return -1;
    }
    return 0;
  });
}

function index(fields, tagPattern) {
  return fields.findIndex(field => tagPattern.some(pattern => pattern.test(field.tag)));
}
