// Fix country codes in 008/15-17
//
// This is proto. Extend later...
//
// Author(s): Nicholas Volk

//import createDebugLogger from 'debug';
//import {fieldToString, nvdebug} from './utils.js';


export default function () {

  return {
    description: 'Fix deprecated country codes',
    validate, fix
  };

  function fix(record) {
    //nvdebug(`FIX ME`);
    const res = {message: [], fix: [], valid: true};

    const [field008] = record.get('008');
    if (!field008) {
      return res;
    }

    fixCountryCode(field008);

    return res;
  }

  function validate(record) {
    const res = {message: [], valid: true};

    const [field008] = record.get('008');

    if (!field008) {
      return res;
    }

    const originalCountryCode = getCountryCodeFromField008(field008);
    const modifiedCountryCode = deprecatedCountryCodeToCurrentCountryCode(originalCountryCode);
    if (originalCountryCode === modifiedCountryCode) {
      return res;
    }

    res.message.push(`Modify 008/15-17: '${originalCountryCode}' => '${modifiedCountryCode}'`);

    res.valid = false;
    return res;
  }

  function fixCountryCode(field008) {
    const originalCountryCode = getCountryCodeFromField008(field008);
    const modifiedCountryCode = deprecatedCountryCodeToCurrentCountryCode(originalCountryCode);
    if (originalCountryCode !== modifiedCountryCode && modifiedCountryCode.length === 3) {
      field008.value = `${field008.value.substring(0, 15)}${modifiedCountryCode}${field008.value.substring(18)}`;
      return;
    }
  }

  function getCountryCodeFromField008(field) {
    return field.value.substring(15, 18); // return 008/15-17
  }

  function deprecatedCountryCodeToCurrentCountryCode(countryCode) {
    if (countryCode === 'air') { // Armenia
      return 'ai ';
    }
    if (countryCode === 'ajr') { // Azerbaidzan
      return 'aj ';
    }
    // Australia
    if (['aca', 'qua', 'tma', 'vra', 'wea', 'xga', 'xna', 'xoa', 'xra'].includes(countryCode)) {
      return 'at ';
    }

    // Canada
    if (['abc', 'bcc', 'cn ', 'mbc', 'nfc', 'nkc', 'nsc', 'ntc', 'nuc', 'onc', 'pic', 'quc', 'snc', 'ykc'].includes(countryCode)) {
      return 'xxc';
    }
    // Great Britain:
    if (['enk', 'nik', 'stk', 'uik', 'uk ', 'wlk'].includes(countryCode)) {
      return 'xxk';
    }
    // United States:
    if (['aku', 'alu', 'aru', 'azu', 'cau', 'cou', 'ctu', 'dcu', 'deu', 'flu', 'gau', 'hiu', 'iau', 'idu', 'ilu', 'inu', 'kgr', 'ksu', 'kyu', 'lau', 'mau', 'mdu', 'meu', 'miu', 'mnu', 'mou', 'msu', 'mtu', 'nbu', 'ncu', 'nhu', 'nju', 'nmu', 'nvu', 'nyu', 'ohu', 'oku', 'oru', 'pau', 'riu', 'scu', 'sdu', 'tnu', 'txu', 'us ', 'utu', 'vau', 'vtu', 'wau', 'wiu', 'wvu', 'wyu'].includes(countryCode)) {
      return 'xxu';
    }
    return countryCode;
  }

}
