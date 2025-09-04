/**
 * This validator de-duplicates identical fields in a record.
 */

import {MarcRecord} from '@natlibfi/marc-record';

export default function () {
  return {
    description: 'Handles identical duplicate in record fields',
    validate,
    fix
  };

  function validate(record) {
    const uniq = uniqWith(record.fields);
    const valid = uniq.length === record.fields.length;
    const messages = record.fields.filter(tag => !uniq.includes(tag))
      .map(obj => `Field ${obj.tag} has duplicates`);

    return valid ? {valid, messages: []} : {valid, messages};
  }

  function fix(record) {
    record.fields
      .filter(tag => !uniqWith(record.fields).includes(tag))
      .forEach(tag => record.removeField(tag));
  }

  function uniqWith(fields) {
    return fields.reduce((uniq, field) => {
      if (!uniq.some(f => MarcRecord.isEqual(f, field))) {
        uniq.push(field);
      }

      return uniq;
    }, []);
  }
}
