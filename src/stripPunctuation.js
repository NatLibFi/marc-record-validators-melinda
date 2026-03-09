/*
* stripPunctuation.js -- try and remove a marc field punctuation (based on and reverse of punctuation2.js)
*
* Author(s): Nicholas Volk <nicholas.volk@helsinki.fi>
*
*/

import {fieldGetFixedString, fieldNeedsModification, fieldStripPunctuation} from './punctuation2.js';
import createDebugLogger from 'debug';

import {fieldToString, nvdebug} from './utils.js';

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/punctuation2');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

const description =  'Strip punctuation in data fields';

export default function () {
  return {
    description: description,
    validate, fix
  };

  function fix(record) {
    nvdebug(`${description}: fixer`, debugDev);
    const res = {message: [], fix: [], valid: true};
    record.fields.forEach(f => fieldStripPunctuation(f));
    return res;
  }

  function validate(record) {
    nvdebug(`${description}: validate`, debugDev);

    const fieldsNeedingModification = record.fields.filter(f => fieldNeedsModification(f, false));

    const values = fieldsNeedingModification.map(f => fieldToString(f));
    const newValues = fieldsNeedingModification.map(f => fieldGetFixedString(f, false));

    const messages = values.map((val, i) => `'${val}' => '${newValues[i]}'`);

    const res = {message: messages};

    res.valid = res.message.length < 1;
    return res;
  }
}
