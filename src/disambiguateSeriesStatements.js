import createDebugLogger from 'debug';
import {fieldToString, nvdebug, subfieldToString} from './utils';
import {MARCXML} from '@natlibfi/marc-record-serializers';
import {Error} from '@natlibfi/melinda-commons';
import clone from 'clone';
import {default as createNatlibfiSruClient} from '@natlibfi/sru-client';
import {fieldFixPunctuation} from './punctuation2';

//const {default: createNatlibfiSruClient} = natlibfiSruClient;

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:disambiguateSeriesStatements');

const ELECTRONIC = 1;
const PRINTED = 2;
const NEITHER_OR_UNKNOWN = 0;
const SRU_API_URL = 'https://sru.api.melinda.kansalliskirjasto.fi/bib';

// Author(s): Nicholas Volk
export default function () {
  const sruClient = createSruClient(SRU_API_URL);

  return {
    description: 'Disambiguate between printed and electonic series statements (490 with multiple $xs)',
    validate, fix
  };

  async function fix(record) {
    const recordType = getRecordType(record);

    const relevantFields = getRelevantFields(record.fields);
    const message = await fix490x(recordType, relevantFields, true);

    return {message, fix: [], valid: true};
  }

  async function validate(record) {
    const recordType = getRecordType(record);

    const relevantFields = getRelevantFields(record.fields);
    const message = await fix490x(recordType, relevantFields, false);

    return {message, valid: message.length === 0};
  }


  function getValidIssnSubfields(field) {
    const subfields = field.subfields?.filter(sf => sf.code === 'x' && sf.value.match(/^[0-9]{4}-[0-9][0-9][0-9][0-9Xx][^0-9Xx]*$/u));
    return subfields;
  }

  function isRelevantField(field) {
    if (field.tag !== '490') {
      return false;
    }
    return getValidIssnSubfields(field).length > 1;
  }

  function getRelevantFields(fields) {
    return fields.filter(f => isRelevantField(f));
  }

  async function fix490x(recordType, fields, reallyFix, message = []) {

    if (recordType === NEITHER_OR_UNKNOWN) {
      return message;
    }
    const [currField, ...remainingFields] = fields;

    if (!currField) {
      return message;
    }

    const validXs = getValidIssnSubfields(currField);

    const deletableXs = await getRemovableSubfields(validXs, recordType);

    if (deletableXs.length === 0 || deletableXs.length === validXs.length) {
      return fix490x(recordType, remainingFields, reallyFix, message);
    }

    const deletableStrings = deletableXs.map(sf => subfieldToString(sf));
    nvdebug(`Field has removable ISSNS: '${deletableStrings.join(', ')}`, debug);

    // fixer:
    if (reallyFix) {
      currField.subfields = currField.subfields.filter(sf => !deletableStrings.includes(subfieldToString(sf)));
      fieldFixPunctuation(currField);
      return fix490x(recordType, remainingFields, reallyFix, message);
    }
    // validators:
    const clonedField = clone(currField);
    const originalString = fieldToString(clonedField);
    clonedField.subfields = clonedField.subfields.filter(sf => !deletableStrings.includes(subfieldToString(sf)));

    const newMessage = `Replace '${originalString}' with '${fieldToString(clonedField)}'`;

    return fix490x(recordType, remainingFields, reallyFix, [...message, newMessage]);
  }

  async function getRemovableSubfields(validXs, recordType, removables = []) {
    const [currSubfield, ...remainingXs] = validXs;

    if (!currSubfield) {
      return removables;
    }

    const isRemoveable = await isRemovableSubfield(currSubfield, recordType);
    if (isRemoveable) {
      return getRemovableSubfields(remainingXs, recordType, [...removables, currSubfield]);
    }
    return getRemovableSubfields(remainingXs, recordType, removables);
  }

  async function isRemovableSubfield(subfield, recordType) {
    //console.info(` isRemovableField() in...`); // eslint-disable-line no-console
    const issn = subfield.value.substring(0, 9); // Strip punctuation (ISSN consists of nine letter, eg. "1234-5678")

    //console.info(` got ISSN ${issn}`); // eslint-disable-line no-console
    const issnRecords = await issnToRecords(issn);
    //console.info(` ISSN returned ${issnRecords.length} record(s)`); // eslint-disable-line no-console

    // !isMismatchingRecord !== isMatchingRecord as NEITHER_OR_UNKNOWN record type is neutral. Thus double negative "not mismatch". Sorry about that.
    if (issnRecords.some(r => !isMismatchingRecord(r))) {
      return false;
    }
    return true;

    function isMismatchingRecord(r) {
      const issnRecordType = getRecordType(r);
      if (issnRecordType === NEITHER_OR_UNKNOWN) {
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

  function getRecordType(record) {
    const f337 = record.get('337');
    if (f337.length !== 1) {
      return NEITHER_OR_UNKNOWN;
    }

    const b = f337[0].subfields.filter(sf => sf.code === 'b');
    if (b.length !== 1) {
      return NEITHER_OR_UNKNOWN;
    }

    if (b[0].value === 'c') {
      return ELECTRONIC;
    }

    if (b[0].value === 'n') {
      return PRINTED;
    }

    return NEITHER_OR_UNKNOWN;
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
        promises.push(MARCXML.from(xmlString, noValidation));
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

