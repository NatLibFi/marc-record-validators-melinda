// NB! This validator is build on code that merged two different records originally in marc-record-merge-reducers.
// The idea was to write a validator that can merge fields in one record. (This is a good idea at least for field tags /^[1678](00|10|11|30)$/.)
// As we don't want copypaste coding everything was moved here, and marc-record-merge-reducers exports mergeField() function.
// That function uses a lot of stuff that is meant for the two-record-merge case only. Thus the tests for this validator are pretty limited here,
// and the test coverage is low. The extensive set of tests in in marc-record-merge-reducers for this code.


//import createDebugLogger from 'debug';
import fs from 'fs';
import path from 'path';
import {mergeField} from './mergeField';
import {MarcRecord} from '@natlibfi/marc-record';
import {postprocessRecords} from './mergeOrAddPostprocess.js';

const description = 'Merge fields within record';


// const multimediaRegexp = /multimedia/ui;

const defaultConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'src', 'merge-fields', 'config.json'), 'utf8'));

export default function () {

  return {
    description, validate, fix
  };


  function mergeFieldsWithinRecord(record, config) {
    //const candFields = record.fields.toReversed(); // Node 20+ only! Filter via config?
    const fields = config && config.tagPattern ? record.get(config.tagPattern) : record.get(/^[1678](?:00|10|11|30)$/u);

    fields.reverse(); // eslint-disable-line functional/immutable-data
    const mergedField = fields.find(f => mergeField(record, record, f, config));
    if (!mergedField) {
      return;
    }
    record.removeField(mergedField);
    mergeFieldsWithinRecord(record, config);

  }

  function fix(record, config = undefined) {
    const config2 = config || defaultConfig;
    record.internalMerge = true; // eslint-disable-line functional/immutable-data
    mergeFieldsWithinRecord(record, config2);
    delete record.internalMerge; // eslint-disable-line functional/immutable-data
    // Remove deleted fields and field.merged marks:
    postprocessRecords(record, record);

    const res = {message: [], fix: [], valid: true};
    return res;
  }

  function validate(record, config) {
    //nvdebug(`VALIDATE ${description}...`);

    const nFields = record.fields.length;
    const clonedRecord = new MarcRecord(record, {subfieldValues: false});
    fix(clonedRecord, config);

    const nFields2 = clonedRecord.fields.length;
    if (nFields === nFields2) {
      return {message: [], valid: true};
    }

    const msg = `${description}: number of fields changes from ${nFields} to ${nFields2}`;
    return {message: [msg], valid: false};
  }

}

