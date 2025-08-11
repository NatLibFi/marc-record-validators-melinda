/*
* stripPunctuation.js -- try and remove a marc field punctuation (based on and reverse of punctuation2.js)
*
* Author(s): Nicholas Volk <nicholas.volk@helsinki.fi>
*
*/

import {fieldGetFixedString, fieldNeedsModification, fieldStripPunctuation} from './punctuation2';
// import createDebugLogger from 'debug';
import {fieldToString, nvdebug} from './utils';

// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/punctuation2');

export default function () {
  return {
    description: 'Strip punctuation to data fields',
    validate, fix
  };

  function fix(record) {
    nvdebug('Strip punctuation to data fields: fixer');
    const res = {message: [], fix: [], valid: true};
    record.fields.forEach(f => fieldStripPunctuation(f)); // eslint-disable-line array-callback-return
    return res;
  }

  function validate(record) {
    nvdebug('Strip punctuation to data fields: validate');

    const fieldsNeedingModification = record.fields.filter(f => fieldNeedsModification(f, false));

    const values = fieldsNeedingModification.map(f => fieldToString(f));
    const newValues = fieldsNeedingModification.map(f => fieldGetFixedString(f, false));

    const messages = values.map((val, i) => `'${val}' => '${newValues[i]}'`);

    const res = {message: messages};

    res.valid = res.message.length < 1;
    return res;
  }
}
