/*
*  cyrillux-usemarcon-replacement.js -- implement and improve https://github.com/NatLibFi/USEMARCON-Cyrillux/tree/master
*
* Author(s): Nicholas Volk <nicholas.volk@helsinki.fi>
*
*/

import {default as add336} from './addMissingField336';
import {default as add337} from './addMissingField337';
import {default as add338} from './addMissingField338';
import {default as fixCountryCodes} from './fix-country-codes';
import {default as fixLanguageCodes} from './fix-language-codes';
import {default as fixRelatorTerms} from './fixRelatorTerms';
import {default as fixIndicators} from './indicator-fixes';
import {default as fixPunctuation} from './punctuation2';
import {sortAdjacentSubfields} from './sortSubfields';


// import createDebugLogger from 'debug';
import {nvdebug} from './utils';

// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/punctuation2');

const description = 'Replacement for Cyrillux usemarcon rules';

// Extended original list with 541, 561, 562, 583, 584
const dropTags = ['001', '003', '010', '012', '014', '015', '016', '019', '025', '029', '032', '035', '036', '037', '038', '042', '049', '051', '061', '068', '071', '074', '079', '090', '091', '092', '094', '095', '096', '097', '099', '249', '350', '400', '411', '541', '561', '562', '574', '575', '577', '578', '583', '584', '589', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '653', '698', '741', '742', '744', '790', '841', '842', '843', '844', '845', '850', '852', '853', '854', '855', '858', '859', '863', '864', '865', '856', '857', '858', '876', '877', '878', '882', '886', '887', '888', '890', '899'];

export default function () {
  return {
    description, fix, validate
  };

  function fix(record) {
    nvdebug(`${description}: fix`);
    realFix(record);
    const res = {message: [], fix: [], valid: true};
    return res;
  }

  function realFix(record) {
    // Fix leader: standard fixes + update LDR/17 to '4'
    fixLeader(record);
    record.leader = `${record.leader.substring(0, 17)}4${record.leader.substring(18, 24)}`; // eslint-disable-line functional/immutable-data

    // Remove unwanted fields:
    record.fields = record.fields.filter(f => !dropTags.includes(f.tag)); // eslint-disable-line functional/immutable-data

    record.fields.forEach(f => fieldSpecificStuff(f));

    function fieldSpecificStuff(field) {
      removeOwnershipSubfield5(field);
      removeFromOldCatalog(field); // Remove LoC phrase "[from old catalog]" from strings
    }

    fixCountryCodes().fix(record); // 008/15-17
    fixLanguageCodes().fix(record); // 008/35-37 AND 041 (note that all relevant subfield codes are fixed, not just $a)

    // Field 028: use $b$a, not $a$b:
    const f028 = record.fields.filter(f => f.tag === '028');
    f028.forEach(f => sortAdjacentSubfields(f));

    fixField040(record); // $b 'swe' becomes 'mul'. As a side effect 33X$as are translated info Finnish, not Swedish! Ok in this domain!

    fixRelatorTerms().fix(record);

    add336().fix(record);
    add337().fix(record);
    add338().fix(record);

    record.fields.forEach(f => fieldSpecificStuff2(f));

    function fieldSpecificStuff2(field) {
      remove245H(field); // after 33X creation
      // We apparently strip $h from these as well:
      // NB! 246$h and 247$h (+ punctuation rules)
      // NB! 740$h, 7[678[0-9]$h is removed as well, I think...

      field260To264(field);
      // NB! 300
      // NB! 410 to 490
      // NB! 430 to 490 *and* 830
      // NB! 505 has some wierd rules...

    }

    // Cyrillux rules such as 245I1 | 245I1  | If (Exists(@100) Or Exists(@110) Or Exists(@111) Or Exists(@130)) Then '1' Else '0'
    // and plenty of other good stuff:
    fixIndicators().fix(record);

    fixPunctuation().fix(record);

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

function fixField040(record) {
  const f040 = record.fields.filter(f => f.tag === '040');

  const subfieldsBE = [
    {code: 'b', value: 'mul'},
    {code: 'e', value: 'rda'}
  ];

  // Add 040 if there isn't one:
  if (f040.length === 0) {
    const data = {tag: '040', ind1: ' ', ind2: ' ', subfields: subfieldsBE};

    record.insertField(data);
    return;
  }

  f040.forEach(f => fixField040Subfields(f));

  function fixField040Subfields(field) {
    field.subfields = field.subfields.filter(sf => !['b', 'e'].includes(sf.code)); // eslint-disable-line functional/immutable-data
    field.subfields.push(subfieldsBE[0]); // eslint-disable-line functional/immutable-data
    field.subfields.push(subfieldsBE[1]); // eslint-disable-line functional/immutable-data
    sortAdjacentSubfields(field); // put $b and $e to their proper places
  }

}

export function removeFromOldCatalog(field) {
  // See https://catalog.loc.gov/vwebv/ui/en_US/htdocs/help/faqs.html for motivation
  field.subfields?.forEach(sf => removeFromOldCatalogFromSubfield(sf));

  function removeFromOldCatalogFromSubfield(subfield) {
    if (!subfield.value.includes('[from old catalog]')) {
      return;
    }
    subfield.value = subfield.value.replace(/ *\[from old catalog\]/gui, ''); // eslint-disable-line functional/immutable-data
  }
}

function remove245H(field) {
  if (!field.subfields || field.tag !== '245') {
    return;
  }
  const filteredFields = field.subfields.filter(sf => sf.code !== 'h');
  if (filteredFields.length > 0) {
    field.subfields = filteredFields; // eslint-disable-line functional/immutable-data
    return;
  }

}

export function removeOwnershipSubfield5(field) {
  if (!field.subfields || field.subfields.length === 0) {
    return;
  }
  const remainingSubfields = field.subfields.filter(sf => sf.code !== '5');
  if (remainingSubfields.length === 0) { // sanity check/robustness
    return;
  }
  field.subfields = remainingSubfields; // eslint-disable-line functional/immutable-data
}

export function fixLeader(record) {
  record.leader = `${record.leader.substring(0, 9)}a22${record.leader.substring(12, 18)}i${record.leader.substring(19, 20)}4500`; // eslint-disable-line functional/immutable-data
}

export function field260To264(field) {
  // As per my quick reading of usemarcon-cyrillux
  if (field.tag !== '260') {
    return;
  }
  field.tag = '264'; // eslint-disable-line functional/immutable-data
  field.ind1 = ' '; // eslint-disable-line functional/immutable-data
  field.ind2 = setInd2(); // eslint-disable-line functional/immutable-data

  // NB! Usemarcon does not handle 260$e$f$g => 264$a$b$c, so I'm not botherin with it either... (However, we could check our merge reducer code...)

  function getCopyrightYear(string) {
    if (string.match(/^(?:\[?[Ccp]|[^0-9]*(?:cop|©|℗))[^0-9]+(?:1[789][0-9][0-9]|20[0-2][0-9])[^0-9]*$/u)) {
      return string.replace(/[^0-9]/ug, '');
    }
    return false;
  }

  function setInd2() {
    if (field.subfields?.some(sf => sf.code === 'c' && getCopyrightYear(sf.value))) {
      return '4';
    }
    return '1';
  }

  field.subfields?.forEach(sf => field260To264Normalization(sf));

  function field260To264Normalization(subfield) {
    subfield.value = field260To264Normalization2(subfield); // eslint-disable-line functional/immutable-data
  }

  function field260To264Normalization2(subfield) {
    if (subfield.code === 'a') {
      return subfield.value.replace('S.l.', 'Kustannuspaikka tuntematon').replace(/\[[Ss]\. ?l\.\]/u, '[kustannuspaikka tuntematon]');
    }
    if (subfield.code === 'b') {
      return subfield.value.replace(/\[[Ss]\. ?n\.\]/u, '[kustantaja tuntematon]');
    }
    if (subfield.code === 'c') {
      const year = getCopyrightYear(subfield.value);
      if (year) {
        const c = subfield.value.match(/(?:^p|℗)/u) ? 'p' : 'c';
        if (subfield.value.includes('[')) {
          return `${c}[${year}]`;
        }
        return `${c}${year}`;
      }
      return subfield.value.replace(/\[[Ss]\. ?a\.\]/u, '[julkaisuaika tuntematon]');
    }
    return subfield.value;
  }
}
