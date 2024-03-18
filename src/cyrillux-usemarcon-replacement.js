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
import {sortAdjacentSubfields} from './sortSubfields';


// import createDebugLogger from 'debug';
import {nvdebug} from './utils';

// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/punctuation2');

const description = 'Replacement for Cyrillux usemarcon rules';

const skipTags = ['001', '003', '010', '012', '014', '015', '016', '019', '025', '029', '032', '035', '036', '037', '038', '042', '049', '051', '061', '068', '071', '074', '079', '090', '091', '092', '094', '095', '096', '097', '099', '249', '350', '400', '574', '575', '577', '578', '589', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '653', '698', '741', '742', '744', '790', '841', '842', '843', '844', '845', '850', '852', '853', '854', '855', '858', '859', '863', '864', '865', '856', '857', '858', '876', '877', '878', '882', '886', '887', '888', '890', '899'];

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

    fixCountryCodes().fix(record); // 008/15-17
    // ADD 008/35-37 check

    // Field 028: use $b$a, not $a$b:
    const f028 = record.fields.filter(f => f.tag === '028');
    f028.forEach(f => sortAdjacentSubfields(f));

    fixField040(record); // $b 'swe' becomes 'mul'. As a side effect 33X$as are translated info Finnish, not Swedish! Ok in this domain!

    add336().fix(record);
    add337().fix(record);
    add338().fix(record);

    // Remove unwanted fields:
    record.fields = record.fields.filter(f => !skipTags.includes(f.tag)); // eslint-disable-line functional/immutable-data

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

export function fixLeader(record) {
  record.leader = `${record.leader.substring(0, 9)}a22${record.leader.substring(12, 18)}i${record.leader.substring(19, 20)}4500`; // eslint-disable-line functional/immutable-data
}
