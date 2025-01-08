import createDebugLogger from 'debug';
import {fieldHasSubfield, fieldToString, nvdebug} from './utils';
import {MARCXML} from '@natlibfi/marc-record-serializers';
import {Error} from '@natlibfi/melinda-commons';
import {default as createNatlibfiSruClient} from '@natlibfi/sru-client';

//const {default: createNatlibfiSruClient} = natlibfiSruClient;

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:disambiguate-series-statements');

const ELECTRONIC = 1;
const PRINTED = 2;
const UNDEFINED = 0;
const SRU_API_URL = 'https://bib-sru.melinda.kansalliskirjasto.fi/prv';

// Author(s): Nicholas Volk
export default function () {
  const sruClient = createSruClient(SRU_API_URL);

  return {
    description: 'Disambiguate between printed and electonic series statements (field 490)',
    validate, fix
  };

  async function fix(record) {
    //console.log(`fix(record)`); // eslint-disable-line no-console
    const deletableFields = await getDeletableFields(record);

    const deletableFieldsAsStrings = deletableFields.map(f => fieldToString(f));

    deletableFields.forEach(nf => nvdebug(`TODO: remove field '${fieldToString(nf)}'`, debug));

    deletableFields.forEach(f => record.removeField(f));

    return {message: [], fix: deletableFieldsAsStrings, valid: true};
  }

  async function validate(record) {
    const deletableFields = await getDeletableFields(record);

    if (deletableFields.length === 0) {
      return {'message': [], 'valid': true};
    }

    const deletableFieldsAsStrings = deletableFields.map(f => fieldToString(f));

    return {'message': deletableFieldsAsStrings, 'valid': false};
  }

  async function getDeletableFields(record) {
    const recordType = getRecordType(record);
    //console.info(`getDeletableFields(record), type: ${recordType}`); // eslint-disable-line no-console
    if (recordType === UNDEFINED) {
      return [];
    }

    const seriesStatements = record.get('490').filter(f => fieldHasSubfield(f, 'x'));

    //console.info(`N STATEMENTS=${seriesStatements.length}`); // eslint-disable-line no-console
    if (seriesStatements.length < 2) {
      return [];
    }

    const deletableFields = await getDeletableSeriesStatementFields(recordType, seriesStatements);
    // Delete something if and only if we keep something as well:
    if (deletableFields.length < seriesStatements.length) {
      return deletableFields;
    }

    return [];
  }

  async function getDeletableSeriesStatementFields(recordType, seriesStatementFields, deletableFields = []) {
    //console.info(`getDeletableSeriesStatementFields(), N CANDS=${seriesStatementFields.length}`); // eslint-disable-line no-console

    if (seriesStatementFields.length === 0) {
     //console.info(` DONE`); // eslint-disable-line no-console
      return deletableFields;
    }

    const [currStatementField, ...rest] = seriesStatementFields;

    const removeMe = await isRemovableField(currStatementField);
    //console.info(` ${removeMe ? 'REMOVE' : 'KEEP'}: ${fieldToString(currStatementField)}`); // eslint-disable-line no-console

    const deletableFields2 = removeMe ? [...deletableFields, currStatementField] : deletableFields;

    const result = await getDeletableSeriesStatementFields(recordType, rest, deletableFields2);
    return result;

    async function isRemovableField(seriesStatementField) {
      //console.info(` isRemovableField() in...`); // eslint-disable-line no-console
      const issn = getIssn(seriesStatementField);
      if (!issn) {
        return false;
      }
      //console.info(` got ISSN ${issn}`); // eslint-disable-line no-console
      const issnRecords = await issnToRecords(issn);
      //console.info(` ISSN returned ${issnRecords.length} record(s)`); // eslint-disable-line no-console
      // TEE: konvertoi tietueet objekteiksi!
      if (issnRecords.some(r => !isMismatchingRecord(r))) {
        return false;
      }

      return true;
    }

    function isMismatchingRecord(r) {
      const issnRecordType = getRecordType(r);
      if (issnRecordType === UNDEFINED) {
        return false;
      }
      return issnRecordType !== recordType;
    }
  }

  async function issnToRecords(issn) {
    //console.log('issnToRecords() in...'); // eslint-disable-line no-console
    const records = await search(sruClient, `bath.issn=${issn}`);
    //console.log(`ISSN2RECORDS got ${records.length} record(s)!`); // eslint-disable-line no-console
    return records;
  }

  function getIssn(field) {
    // Assume that this is a field 490.
    // Return value in first $x subfield:
    const x = field.subfields.find(sf => sf.code === 'x');
    if (x) {
      return x.value;
    }
    return undefined;
  }

  function getRecordType(record) {
    const f337 = record.get('337');
    if (f337.length !== 1) {
      return UNDEFINED;
    }

    const b = f337[0].subfields.filter(sf => sf.code === 'b');
    if (b.length !== 1) {
      return UNDEFINED;
    }

    if (b[0].value === 'c') {
      return ELECTRONIC;
    }

    if (b[0].value === 'n') {
      return PRINTED;
    }

    return UNDEFINED;
  }

}

// All the code below is copypasted from melinda-ui-artikkelit project file src/services/sruServices/sruClient.js

export function createSruClient(sruApiUrl) {

  const sruClientOptions = {
    url: sruApiUrl,
    recordSchema: 'marcxml',
    retrieveAll: false,
    maxRecordsPerRequest: 100
  };

  return createNatlibfiSruClient(sruClientOptions);
}


/*******************************************************************************/
/* Search and retrieve (copypaste from melinda-ui-artikkelit)                  */

export function search(sruClient, query, one = false) {

  return new Promise((resolve, reject) => {
    const promises = [];

    const noValidation = {
      fields: false,
      subfields: false,
      subfieldValues: false
    };

    // console.info(`SRU query: $${searchUrl}`);

    sruClient.searchRetrieve(query)
      .on('record', xmlString => {
        promises.push(MARCXML.from(xmlString, noValidation)); // eslint-disable-line functional/immutable-data
      })
      .on('end', async () => {
        try {

          if (promises.length > 0) {

            if (one) {
              const [firstPromise] = promises;
              const firstRecord = await firstPromise;
              return resolve(firstRecord);
            }

            const records = await Promise.all(promises);
            return resolve(records);
          }
          reject(new Error(404, 'No records found with search and retrieve'));

        } catch (error) {
          reject(error);
        }
      })
      .on('error', error => {
        reject(error);
      });
  });
}

