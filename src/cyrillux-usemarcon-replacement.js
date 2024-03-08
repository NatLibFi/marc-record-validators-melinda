/*
* stripPunctuation.js -- try and remove a marc field punctuation (based on and reverse of punctuation2.js)
*
* Author(s): Nicholas Volk <nicholas.volk@helsinki.fi>
*
*/

import {default as add336} from './addMissingField336';
import {default as add337} from './addMissingField337';
import {default as add338} from './addMissingField338';


// import createDebugLogger from 'debug';
import {nvdebug} from './utils';

// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/punctuation2');

const description = 'Replacement for Cyrillux usemarcon rules';
export default function () {
  return {
    description, fix, validate
  };

  function fix(record) {
    nvdebug(`${description}: fix`);
    add336().fix(record);
    add337().fix(record);
    add338().fix(record);
    const res = {message: [], fix: [], valid: true};
    return res;
  }

  // Validation is currently done in subparts
  function validate() {
    nvdebug(`${description}: validate (void)`);
    // Should this do everything and then produce diff etc?
    const res = {message: [], fix: [], valid: true};
    return res;
  }

}
