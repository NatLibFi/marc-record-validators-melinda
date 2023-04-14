import {parseString} from 'xml2js';
import fetch from 'node-fetch';

export default function ({endpoint, prefixPattern, fields}) {
  if (typeof endpoint === 'string' && prefixPattern instanceof RegExp && typeof fields === 'object') {
    return {
      description: 'Checks if Melinda entity references are resolvable',
      validate
    };
  }

  throw new Error('Error in validation parameters');

  async function validate(record) {
    const validateResult = await validateRecord(record);
    return validateResult;
  }

  function validateRecord(record) {
    const removedPrefixes = [];

    // Filter matching field keys from record.fields
    const subfields = record.fields.reduce((prev, current) => {
      Object.keys(fields).forEach(key => {
        if (key === current.tag) { // eslint-disable-line functional/no-conditional-statements
          prev.push(current); // eslint-disable-line functional/immutable-data
        }
      });
      return prev;
    }, []);

    // Filter matching objects from subfields
    const matchingTags = [...subfields].reduce((prev, current) => {
      Object.keys(fields).forEach(key => {
        if (key === current.tag) { // eslint-disable-line functional/no-conditional-statements
          current.subfields.filter(item => {
            if (Object.values(fields[key]).filter(value => value === item.code)[0]) { // eslint-disable-line functional/no-conditional-statements
              prev.push({tag: current.tag, code: item.code, value: item.value}); // eslint-disable-line functional/immutable-data
            }

            return prev;
          });
        }
      });
      return prev;
    }, []);

    // Matching prefixPattern is removed from object value field.
    matchingTags.forEach(obj => {
      if (prefixPattern.test(obj.value)) { // eslint-disable-line functional/no-conditional-statements
        obj.value = obj.value.replace(prefixPattern, ''); // eslint-disable-line functional/immutable-data
        removedPrefixes.push(obj); // eslint-disable-line functional/immutable-data
      }
    });
    return resolveValidation(removedPrefixes);
  }

  function resolveValidation(removedPrefixes) {
    // If matching prefixPatterns found make an API call
    if (removedPrefixes.length > 0) {
      return validateMatchingTags(removedPrefixes).then(result => result);
    }

    return {valid: true, messages: []};
  }

  async function validateMatchingTags(tags) {
    const resolved = await Promise.all(tags.map(obj => getData(obj.value).then(valid => ({valid, ...obj}))));

    if (resolved.every(value => value.valid === true)) {
      return {valid: true, messages: []};
    }

    return {valid: false, messages: resolved.map(obj => `Field ${obj.tag}$${obj.code} with value ${obj.value} is not resolvable`)};
  }

  async function getData(recID) {
    const queryParam = '?operation=searchRetrieve&maximumRecords=2&version=1&query=rec.id=';

    const response = await fetch(`${endpoint}${queryParam}${recID}`);

    const xml = await response.text();

    return new Promise(resolve => {
      parseString(xml, (err, result) => {
        const record = result['zs:searchRetrieveResponse']['zs:records'].slice(-1)?.[0];
        const position = parseInt(record?.['zs:record'].slice(-1)?.[0]['zs:recordPosition'][0], 10);
        resolve(position === 1 && !err);
      });
    });
  }
}
