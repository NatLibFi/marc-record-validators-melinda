//import createDebugLogger from 'debug';
import {fieldToString} from './utils';

//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/update-field-540');

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
  {'license': 'CC BY-SA 4.0', 'url': 'https://creativecommons.org/licenses/by-sa/4.0/deed.fi'},
  {'license': 'CC0 1.0', 'url': 'https://creativecommons.org/publicdomain/zero/1.0/deed.fi'}, // not seen/unused
  {'license': 'Public domain', 'url': 'https://creativecommons.org/publicdomain/mark/1.0/deed.fi'}
];

function findSubfieldIndex(field, subfield) {
  subfield.nvtmp = 1;
  const index = field.subfields.findIndex(sf => sf.nvtmp === 1);
  delete subfield.nvtmp;
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
  subfieldC.code = 'f';
  const index = findSubfieldIndex(field, subfieldC);
  field.subfields.splice(index + 1, 0, {'code': '2', 'value': 'cc'});
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
  if (fix) {
    const subfieldsC = field.subfields.filter(sf => validLicenseInSubfieldC(sf, validLicense));
    subfieldsC.forEach(c => fixC(field, c)); // eslint-disable-line array-callback-return
  }

  return true;
}


function getFieldsThatUseOldFormat(record, fix) {
  return record.fields.filter(f => fieldHasOldCcLicense(f, fix));
}

