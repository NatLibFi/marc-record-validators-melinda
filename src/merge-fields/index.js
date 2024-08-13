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
    const candFields = record.fields.toReversed(); // Filter via config?
    const mergedField = candFields.find(f => mergeField(record, record, f, config));
    if (!mergedField) {
      return;
    }
    record.removeField(mergedField);
    mergeFieldsWithinRecord(record, config);
  }

  function fix(record, config = undefined) {
    const config2 = config || defaultConfig;
    mergeFieldsWithinRecord(record, config2);
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

