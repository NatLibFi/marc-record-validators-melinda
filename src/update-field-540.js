//import createDebugLogger from 'debug';
import {fieldToString} from './utils';

// Note that https://github.com/NatLibFi/marc-record-validators-melinda/blob/master/src/unicode-decomposition.js contains
// similar functionalities. It's less generic and lacks diacritic removal but has it advantages as well.

//const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge-reducers/reducers/normalize-utf-diacritics');

// See also https://github.com/NatLibFi/marc-record-validators-melinda/blob/master/src/unicode-decomposition.js .
// It uses a list of convertable characters whilst this uses a generic stuff as well.
// It handles various '.' and '©' type normalizations as well.
// NB! This version has minor bug/feature issue regarding fixComposition()

// Author(s): Nicholas Volk
export default function () {

  return {
    description: 'Validator for field 540 (modernization as per MELKEHITYS-2431)',
    validate, fix
  };

  function fix(record) {
    const fixedFields = getFieldsThatUseOldFormat(record, true);

    const fixedFieldsAsStrings = fixedFields.map(f => fieldToString(f));

    return {message: [], fix: fixedFieldsAsStrings, valid: true};
  }

  function validate(record) {
    const yeOldeFields = getFieldsThatUseOldFormat(record, false);
    if (yeOldeFields.length === 0) {
      return {'message': [], 'valid': true};
    }
    const messages = yeOldeFields.map(f => fieldToString(f));

    return {'message': messages, 'valid': false};
  }

}


const licences = [
  {'license': 'CC BY 4.0', 'url': 'https://creativecommons.org/licenses/by/4.0/deed.fi'},
  {'license': 'CC BY-NC 4.0', 'url': 'https://creativecommons.org/licenses/by-nc/4.0/deed.fi'},
  {'license': 'CC BY-NC-ND 4.0', 'url': 'https://creativecommons.org/licenses/by-nc-nd/4.0/deed.fi'},
  {'license': 'CC BY-NC-SA 4.0', 'url': 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fi'},
  {'license': 'CC BY-ND 4.0', 'url': 'https://creativecommons.org/licenses/by-nd/4.0/deed.fi'},
  // {'license': 'CC0 1.0', 'url': ' https://creativecommons.org/publicdomain/zero/1.0/deed.fi' }, // not seen/unused
  {'license': 'Public domain', 'url': 'https://creativecommons.org/publicdomain/mark/1.0/deed.fi'}
];

function findSubfieldIndex(field, subfield) {
  subfield.nvtmp = 1; // eslint-disable-line functional/immutable-data
  const index = field.subfields.findIndex(sf => sf.nvtmp === 1);
  delete subfield.nvtmp; // eslint-disable-line functional/immutable-data
  return index;
}

function validLicenseInSubfieldC(subfieldC, license) {
  if (subfieldC.code !== 'c') {
    return false;
  }
  //nvdebug(`Compare ${subfieldC.value} vs ${license.license}`);
  return license.license === subfieldC.value;
}

function validUrlInSubfieldU(subfieldU, license) {
  if (subfieldU.code !== 'u') {
    return false;
  }
  //nvdebug(`Compare ${subfieldU.value} vs ${license.url}`);
  return license.url === subfieldU.value;
}


function fixC(field, subfieldC) {
  // MELINDA-2431_
  subfieldC.code = 'f'; // eslint-disable-line functional/immutable-data
  const index = findSubfieldIndex(field, subfieldC);
  field.subfields.splice(index + 1, 0, {'code': '2', 'value': 'cc'}); // eslint-disable-line functional/immutable-data
}

function fieldHasOldCcLicense(field, fix) {
  if (field.tag !== '540') {
    return false;
  }
  //nvdebug(`NORM 540: ${fieldToString(field)}`);
  const validLicense = licences.find(license => field.subfields.some(sf => validLicenseInSubfieldC(sf, license)) && field.subfields.some(sf => validUrlInSubfieldU(sf, license)));
  if (!validLicense) {
    return false;
  }
  //nvdebug(` Found valid license`);
  if (fix) { // eslint-disable-line functional/no-conditional-statements
    const subfieldsC = field.subfields.filter(sf => validLicenseInSubfieldC(sf, validLicense));
    subfieldsC.forEach(c => fixC(field, c));
  }

  return true;
}


function getFieldsThatUseOldFormat(record, fix) {
  // NB! $2 is used in fields 257, 38X etc. However, these were not requested, so I'll skip them here in the first version.
  return record.fields.filter(f => fieldHasOldCcLicense(f, fix));
}

