/*
*  cyrillux-usemarcon-replacement.js -- implement and improve https://github.com/NatLibFi/USEMARCON-Cyrillux/tree/master
*
* Author(s): Nicholas Volk <nicholas.volk@helsinki.fi>
*
*/

import clone from 'clone';
import {MarcRecord} from '@natlibfi/marc-record';
import {default as fix33X} from './fix-33X.js';
import {default as add041} from './addMissingField041.js';
import {default as add336} from './addMissingField336.js';
import {default as add337} from './addMissingField337.js';
import {default as add338} from './addMissingField338.js';
import {default as fixCountryCodes} from './fix-country-codes.js';
import {default as fixLanguageCodes} from './fix-language-codes.js';
import {default as fixRelatorTerms} from './fixRelatorTerms.js';
import {default as fixIndicators} from './indicator-fixes.js';
import {default as fixPunctuation} from './punctuation2.js';
import {default as fixQualifyingInformation} from './normalize-qualifying-information.js';
import {sortAdjacentSubfields} from './sortSubfields.js';

// import createDebugLogger from 'debug';
import {fieldHasSubfield, nvdebug, recordRemoveValuelessSubfields, recordToString, removeSubfield} from './utils.js';

// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/punctuation2');

const description = 'Replacement for Cyrillux usemarcon rules';

// Extended original list with 541, 561, 562, 583, 584
// 017, 044... et al are LL additions from 2019 (via USEMARCON-RDA)
const dropTags = ['001', '003', '010', '012', '014', '015', '016', '017', '019', '025', '029', '032', '035', '036', '037', '038', '042', '044', '049', '051', '061', '068', '071', '074', '079', '090', '091', '092', '094', '095', '096', '097', '099', '249', '261', '262', '350', '400', '411', '541', '561', '562', '574', '575', '577', '578', '583', '584', '589', '590', '591', '592', '593', '594', '595', '596', '597', '598', '599', '653', '698', '741', '742', '744', '751', '761', '790', '841', '842', '843', '844', '845', '850', '852', '853', '854', '855', '858', '859', '863', '864', '865', '866', '867', '868', '876', '877', '878', '882', '886', '887', '888', '890', '899'];


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

  function realFixNonAleph(record) {
    if (isAlephRecord(record)) {
      return;
    }

    // Update LDR/17 to '4'
    record.leader = `${record.leader.substring(0, 17)}4${record.leader.substring(18, 24)}`;

    // Remove unwanted fields:
    record.fields = record.fields.filter(f => !dropTags.includes(f.tag));

    removeSubfield(record, '020', 'c');

    // Remove 084 fields that don't have $2 ykl (based on USEMARCON-RDA/bw_rda_kyril.rul code by LL 2019)
    record.fields = record.fields.filter(f => f.tag !== '084' || f.subfields.some(sf => sf.code === '2' && sf.value === 'ykl'));

    fieldSpecificStuff(record.fields);

    function fieldSpecificStuff(fields) {
      const [field, ...rest] = fields;

      if (field === undefined) {
        return;
      }

      removeOwnershipSubfield5(field);
      removeFromOldCatalog(field); // Remove LoC phrase "[from old catalog]" from srings
      translateFieldToFinnish(field);

      return fieldSpecificStuff(rest);
    }

    fixField040(record); // All $b values are changed to 'mul'. As a side effect 33X$b=>$a mappings are in Finnish! Ok in this domain!

    fieldSpecificStuff2(record.fields);

    function fieldSpecificStuff2(fields) {
      const [field, ...rest] = fields;

      if (field === undefined) {
        return;
      }

      removeSubfieldH(field); // NB! Do this only after 33X creation, as 245$h might be useful there!

      field100eKirjoittaja(field);

      function field100eKirjoittaja(f) { // LL 2019 USEMARCON-RDA rule
        if (f.tag === '100' && !fieldHasSubfield(f, 'e') && record.isBK()) {
          f.subfields = [{code: 'e', value: 'kirjoittaja.'}, ...f.subfields];
          sortAdjacentSubfields(f);
          // Punctuation will be done later on...
          return;
        }
      }

      field260To264s(field, record);

      // NB! 300 (before or after 33X creation?)
      field410To490And810(field, record);
      field440To490And830(field, record);
      // handle505(field); // not applying them usemarcon-cyrillux rules for field 505 as I can't understand their motivation.
      return fieldSpecificStuff2(rest);
    }

  }

  function realFixAll1(record) {
    fixLeader(record); // Fix defaults, esp. LDR/18=i

    fixCountryCodes().fix(record); // 008/15-17
    fixLanguageCodes().fix(record); // 008/35-37 AND 041 (note that all relevant subfield codes are fixed, not just $a)

    recordRemoveValuelessSubfields(record);

    // Field 028: use $b$a, not $a$b:
    const f028 = record.fields.filter(f => f.tag === '028');
    f028.forEach(f => sortAdjacentSubfields(f));

    add041().fix(record);

  }

  function realFixAll2(record) {
    fixQualifyingInformation().fix(record); // 015, 020, 024 and 028

    // Cyrillux specific code might change 040$b and thus affect these rules:
    fixRelatorTerms().fix(record);
    fix33X().fix(record); // 33X$a => 33X$a$b$2
    add336().fix(record);
    add337().fix(record);
    add338().fix(record);

    // The fixer below implements Cyrillux rules such as 245I1 | 245I1  | If (Exists(@100) Or Exists(@110) Or Exists(@111) Or Exists(@130)) Then '1' Else '0' and plenty of other good stuff:
    fixIndicators().fix(record);

    fixPunctuation().fix(record);
  }

  function realFix(record) {
    realFixAll1(record);

    realFixNonAleph(record);

    realFixAll2(record);

    const res = {message: [], fix: [], valid: true};
    return res;
  }

  // Validation is currently done in subparts
  function validate(record) {
    nvdebug(`${description}: validate`);
    const originalString = recordToString(record);
    const clonedRecord = new MarcRecord(record, {subfieldValues: false});
    realFix(clonedRecord);
    const modifiedString = recordToString(clonedRecord);

    if (originalString === modifiedString) {
      return {message: [], valid: true};
    }

    return {message: ['Record changed'], valid: false}; // Less than descriptive but will do...

  }
}

function fixField040(record) {
  const f040 = record.get('040');

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
    field.subfields = field.subfields.filter(sf => !['b', 'e'].includes(sf.code));
    field.subfields.push(subfieldsBE[0]);
    field.subfields.push(subfieldsBE[1]);
    sortAdjacentSubfields(field); // put $b and $e to their proper places
  }

}

export function removeFromOldCatalog(field) {
  if (!field.tag.match(/^(?:240|65[0135]|[1678](?:00|10|11|30))$/u)) {
    return;
  }
  // See https://catalog.loc.gov/vwebv/ui/en_US/htdocs/help/faqs.html for motivation
  field.subfields?.forEach(sf => removeFromOldCatalogFromSubfield(sf));

  function removeFromOldCatalogFromSubfield(subfield) {
    if (!subfield.value.includes('[from old catalog]')) {
      return;
    }
    subfield.value = subfield.value.replace(/ *\[from old catalog\]/gui, '');
  }
}

function removeSubfieldH(field) {
  if (!field.subfields || !['245', '246', '247', '740', '760', '762', '765', '767', '770', '772', '773', '774', '775', '776', '777', '780', '785', '786', '787', '788'].includes(field.tag)) {
    return;
  }

  const filteredFields = field.subfields.filter(sf => sf.code !== 'h');
  if (filteredFields.length > 0) {
    field.subfields = filteredFields;
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
  field.subfields = remainingSubfields;
}

export function fixLeader(record) {
  record.leader = `${record.leader.substring(0, 9)}a22${record.leader.substring(12, 18)}i${record.leader.substring(19, 20)}4500`;
}

function field410To490And810(field, record) { // might be generic... if so, move to utils...
  if (field.tag !== '410') {
    return;
  }

  const field810 = clone(field);

  field.tag = '490';
  field.ind1 = '1';
  field.ind2 = ' ';
  sortAdjacentSubfields(field);
  // 490: Fix punctuation elsewhere. (Note that the current support is lagging...)


  field810.tag = '810';
  field810.ind2 = ' ';
  // 810: Fix punctuation elsewhere. (Note that the current support is lagging...)
  record.insertField(field810);
}

function field440To490And830(field, record) { // might be generic... if so, move to utils...
  if (field.tag !== '440') {
    return;
  }

  const field830 = clone(field);

  field.tag = '490';
  field.ind1 = '1';
  field.ind2 = ' ';
  // 490: Fix punctuation elsewhere. (Note that the current support is lagging...)
  field830.tag = '830';
  // 830: Fix punctuation elsewhere. (Note that the current support is lagging...)
  record.insertField(field830);
}

function isAlephRecord(record) {
  // Records that are already in Aleph are not processed as aggressively as genuinely new ones:
  return record.fields.some(field => ['CAT', 'LKR', 'LOW', 'SID'].includes(field.tag));
}

function field260To264s(field, record) { // might be generic... if so, move to utils...
  // As per my quick reading of usemarcon-cyrillux
  if (field.tag !== '260') {
    return;
  }

  createCopyright264Field(field);

  field.tag = '264';
  field.ind1 = ' ';
  field.ind2 = '1';

  // NB! Usemarcon does not handle 260$e$f$g => 264$a$b$c, so I'm not botherin with it either... (However, we could check our merge reducer code...)

  function getCopyrightYear(string) {
    if (string.match(/^(?:\[?[Ccp]|[^0-9]*(?:cop|©|℗))[^0-9]*(?:1[789][0-9][0-9]|20[0-2][0-9])[^0-9]*$/u)) {
      return string.replace(/[^0-9]/ug, '');
    }
    return false;
  }

  field.subfields?.forEach(sf => field260To264Normalization(sf));

  function field260To264Normalization(subfield) {
    subfield.value = field260To264Normalization2(subfield);
  }

  function createCopyright264Value(field) {
    // Extract/split copyright year to a separate field:
    const [c] = field.subfields.filter(sf => sf.code === 'c');
    if (!c) {
      return undefined;
    }
    const copyrightYear = getCopyrightYear(c.value);
    if (!copyrightYear) {
      return undefined;
    }
    const copType = c.value.match(/(?:^\[?p|℗)/u) ? '℗' : '©';
    const returnValue = c.value.includes('[') ? `[${copType}${copyrightYear}]` : `${copType}${copyrightYear}`;
    // Moidy the original value:
    c.value = `[${copyrightYear}]`;
    return returnValue;
  }

  function createCopyright264Field(field) {
    const c = createCopyright264Value(field);
    if (!c) {
      return undefined;
    }
    const data = {'tag': '264', 'ind1': ' ', 'ind2': '4', 'subfields': [{'code': 'c', 'value': c}]};
    record.insertField(data);
  }

  function field260To264Normalization2(subfield) {
    if (subfield.code === 'a') {
      return subfield.value.replace(/\b[Ss]\. ?l\./u, 'Kustannuspaikka tuntematon');
    }
    if (subfield.code === 'b') {
      return subfield.value.replace(/\b[Ss]\. ?n\./u, 'kustantaja tuntematon');
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
      return subfield.value.replace(/\b[Ss]\. ?a\./u, 'julkaisuaika tuntematon');
    }
    return subfield.value;
  }


}

/*
function handle505(field) {
  if (field.tag !== '505') {
    return;
  }
  // Don't know how/why usemarcon-cyrillux is so sure about ind1...
  field.ind1 = '0';
  // usemarcon-cyrillux drops irrelevant subfields, so we do the same. However, we have included some control subfields in the kept side:
  const keptSubfields = field.subfields.filter(sf => ['a', 'g', 'r', 't', 'u', '6', '8', '9'].includes(sf.code));

  if (keptSubfields.some(sf => ['a', 'g', 'r', 't', 'u'].includes(sf.code))) {
    field.subfields = keptSubfields;
    return;
  }
}
*/

function translateFieldToFinnish(field) {
  if (!['020', '300'].includes(field.tag)) {
    return;
  }
  field.subfields?.forEach(sf => translateSubfieldToFinnish(sf));

  function translateSubfieldToFinnish(subfield) {
    if (field.tag === '020' && ['a', 'q', 'z'].includes(subfield.code)) {
      subfield.value = finnishTranslationsAndMappings(expandFinnishAbbreviations(expandSwedishAbbreviations(expandEnglishAbbreviations(subfield.value))));
      return;
    }
    if (field.tag === '300') {
      subfield.value = finnishTranslationsAndMappings(expandFinnishAbbreviations(expandSwedishAbbreviations(expandEnglishAbbreviations(subfield.value))));
      return;
    }
  }
}

function expandEnglishAbbreviations(value) {
  return value.replace(/\bbk\.\b/gui, 'book').
    replace(/chiefly col\./ui, 'chiefly color').
    replace(/col\. ill\./ui, 'color illustrations').
    replace(/diagrs\./ui, 'diagrams').
    replace(/\bhbk\.\b/gui, 'hardcover').replace(/\bhbk\b/gui, 'hardcover'). // expand to MTS-compliant form
    replace(/\b1 hr\./gui, '1 hour').
    replace(/\bhr\./gui, 'hours').
    replace(/\bill\./gui, 'illustrated'). // or illustrations (or Swedish "illustrerad" or...)
    replace(/\billus\./gui, 'illustrated'). // or illustrations
    replace(/incl\./gui, 'includes').
    replace(/fold\.? maps/gui, 'folded maps').
    // replace(/\bmin\./gu, 'minutes').
    // replace(/\bmin\b/gu, 'minutes').
    replace(/\bp\.\b/gui, 'pages').replace(/\bp\b/gu, 'pages').
    replace(/\bpbk\.\b/gui, 'paperback').replace(/\bpbk\b/gui, 'paperback'). // expand to MTS-compliant form
    replace(/\bpdf\b/gui, 'PDF').
    replace(/\bports\./gui, 'portraits').
    replace('sd., col.', 'sound, color').
    replace(/ *\((?:chiefly col\.|chiefly color|some col[s.])\)/gui, '').
    replace(/\b1 hr\./gui, '1 hour');
}

function expandFinnishAbbreviations(value) {
  return value.replace(/\bcn\. /gu, 'noin ').
    // replace(/\bmin\./gu, 'minuuttia').
    // replace(/\bmin\b/gu, 'minuuttia').
    replace(/\bnid\./gu, 'nidottu').replace(/\bnid\b/gui, 'nidottu').
    replace(/\bsid\./gu, 'sidottu').replace(/\bsid\b/gui, 'sidottu').
    replace(/\bverkkojulk\.\b/gu, 'verkkojulkaisu').replace(/\bverkkojulk\b/gu, 'verkkojulkaisu').
    replace(/^\(([^)]+)\)$/u, '$1');
  // <- removal of brackets above could use a better location
}

function expandSwedishAbbreviations(value) {
  return value.replace(/\bca\. /gu, 'circa ').
    replace(/\bhft\./gui, 'häftad').replace(/\bhft\b/gui, 'häftad');
  // replace(/\bmin\./gu, 'minuter').
  // replace(/\bmin\b/gu, 'minuter');
}

function finnishTranslationsAndMappings(value) {
  return value.replace('analog', 'analoginen').
    replace('approximately', 'noin').
    replace('audio discs', 'äänilevyä').
    replace('black and white', 'mustavalkoinen').
    replace(/\bbilaga\b/gui, 'liite').
    replace(/\bbilagor\b/gui, 'liitettä').
    // https://github.com/NatLibFi/USEMARCON-BOOKWHERE-RDA/blob/master/bw_rda_kyril.rul#L365
    replace(/(\b1\]?) с\./gui, '$1 sivu').
    replace(/(\d\]?) с\./gui, '$1 sivua').
    replace(/(\d) см/gui, '$1 cm').

    replace(/\bcharts\b/gui, 'kaavioita').
    replace('chiefly color illustrations', 'pääosin värikuvitettu').
    replace('chiefly', 'pääosin').
    replace(/\bcirca\b/gui, 'noin').
    replace(/coil[- ]?bound/gui, 'kierreselkä').
    replace('color illustrations', 'värikuvitus').
    replace(/comb[- ]?bound/gui, 'kierreselkä').
    replace(/\bdigital\b/gui, 'digitaalinen').
    replace(/\belectronic book\b/gui, 'verkkoaineisto').
    replace('(flera nummersviter)', '(useita numerointijaksoja)').
    replace(/\bfolded sheet\b/gui, 'taitelehti').
    replace(/\bfärgillustratione[nr]\b/gui, 'värikuvitus').
    replace(/\bhard(?:back|cover)\b/gui, 'kovakantinen').
    replace(/\bhours\b/gui, 'tuntia').
    replace(/\bi flera nummersviter/gui, 'useina numerointijaksoina').
    replace('illustrated', 'kuvitettu').
    replace(/illustrations?\b/gui, 'kuvitettu'). // Based on usemacron-bookwhere (NB! usemarcon-cyrillux had kuvitus/kuvitettu)
    replace(/\binbunden\b/gui, 'kovakantinen'). // swe
    replace(/\binsert\b/gui, 'liite').
    replace(/\binserts\b/gui, 'liitteitä').
    replace(/\bin various pagings/gui, 'useina numerointijaksoina').
    replace('leaves of plates', 'kuvalehteä').
    replace(/\bljudskiva\b/gui, 'äänilevy').
    replace(/\bljudskivor\b/gui, 'äänilevyä').
    replace(/\bmap\b/gui, 'kartta').
    replace(/\bmaps\b/gui, 'karttoja'). // or karttaa?
    replace('minutes', 'minuuttia').
    replace('mjuka pärmar', 'pehmeäkantinen').
    replace('online resource', 'verkkoaineisto').
    replace('onlineresurs', 'verkkoaineisto').
    replace('onumrerade', 'numeroimatonta').
    replace('pages of plates', 'kuvalehteä').
    replace(/\bpages\b/gui, 'sivua').
    replace(/\bpaperback\b/gui, 'pehmeäkantinen'). // MTS alt
    replace(/\bSeiten\b/gu, 'sivua').
    replace(/\bsoftcover\b/gui, 'pehmeäkantinen'). // MTS pref
    replace('sound, color', 'äänellinen, värillinen').
    replace('sound cassettes', 'äänikasettia').replace('sound cassette', 'äänikasetti').
    replace('sound discs', 'äänilevyä').replace(/sound disc\b/gui, 'äänilevy').
    replace(/(?:spiral[- ]?bound|spiralrygg)/gui, 'kierreselkä').
    replace('svartvit', 'mustavalkoinen').
    replace('unnumbered', 'numeroimatonta').
    replace('(various pagings)', '(useita numerointijaksoja)').
    replace(/\bverkkojulkaisu\b/gui, 'verkkoaineisto').
    replace('videodiscs', 'videolevyä').
    replace('videodisc', 'videolevy').
    replace(/\b1 hour\b/gui, '1 tunti');

}
