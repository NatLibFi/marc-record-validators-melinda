import createDebugLogger from 'debug';
const debug = createDebugLogger('@natlibfi/melinda-marc-record-merge-reducers:mergeConstraints');
//const debugData = debug.extend('data');
const debugDev = debug.extend('dev');

// Specs: https://workgroups.helsinki.fi/x/K1ohCw (though we occasionally differ from them)...

// "key" is an unique key that must match (be absent or exist+be identical) in both.
// "paired" refers to a field that must either exist in both or be absent in both (negative XOR). Typically it's not defined.
// NB: key+paired with identical values is an attempt to prevent copy for (ET) fields, and to force separate fields on (T) fields.
// NB! If base has eg. no 264, two+ 264 fields can be copied from the source.

// NB! not all X00 fields have, say, $x subfield. However, we can still share them...
// $h is non-1XX?, $i is 7XX only, $w is 8XX only...
const keyX00 = 'abcjloqrtuwx'; // Shared: $abcdefg...
const keyX10 = 'abcdfghlnoprstuwx';
const keyX11 = 'acdefghlnpqstuwx';
const keyX30 = 'adfghklmnoprstvwxyz';

const mergeConstraints = [
  {'tag': '010', 'required': 'a', 'key': 'a'},
  {'tag': '013', 'required': 'a', 'key': 'a'}, // We have 2 instances in Melinda...
  {'tag': '015', 'required': 'a', 'key': 'a'},
  {'tag': '016', 'required': 'a', 'key': 'a2'},
  {'tag': '017', 'required': 'a', 'key': 'a'},
  {'tag': '018', 'required': 'a', 'key': 'a'},
  {'tag': '020', 'required': '', 'paired': 'a', 'key': 'a'}, // NB! how to handle $z-only cases? 'required-fallback'='z'?
  {'tag': '022', 'required': '', 'paired': 'a', 'key': 'alz'},
  {'tag': '024', 'required': '', 'paired': 'a', 'key': 'ad'},
  {'tag': '025', 'required': 'a', 'key': 'a'},
  {'tag': '026', 'required': 'a', 'key': 'a'},
  {'tag': '027', 'required': 'a', 'key': 'a'}, // on tuolla pari $z:ää
  {'tag': '028', 'required': 'a', 'key': 'ab'},
  {'tag': '030', 'required': 'a', 'key': 'a'},
  {'tag': '031', 'required': '', 'key': 'abcegmnopr2'}, // mites tämmöisen käytännössä avaimettoman klaarais? TODO: tests
  {'tag': '032', 'required': 'a', 'key': 'ab'},
  {'tag': '033', 'required': 'a', 'key': 'abcp0123'}, // 0,1% are without $a. Ignore them for now.
  {'tag': '034', 'required': 'ab', 'key': 'abcdefghjkmnprstxyz0123'},
  {'tag': '035', 'required': '', 'key': 'az'},
  {'tag': '036', 'required': 'a', 'key': 'a'},
  {'tag': '037', 'required': 'b', 'key': 'ab'},
  {'tag': '039', 'required': 'a'},
  {'tag': '040', 'required': '', 'key': ''},
  {'tag': '041', 'required': '', 'paired': '2', 'key': ''}, // Don't put $2 in 'key'! hasCommonNominator() would get into trouble with it...
  {'tag': '042', 'required': 'a', 'key': ''}, // NB: preprocessor hacks applied
  {'tag': '043', 'required': 'a', 'key': 'abc'},
  {'tag': '044', 'required': '', 'key': 'abc', 'paired': 'abc'},
  {'tag': '045', 'required': '', 'key': 'abc', 'paired': 'abc'}, // (ET) // 045 is problematic either-$a or $b or $c...
  {'tag': '046', 'required': 'a', 'key': 'abcdejklmnop', 'paired': 'abcdejklmnop'},
  {'tag': '047', 'required': 'a', 'key': 'a2'},
  {'tag': '048', 'required': '', 'paired': 'ab', 'key': 'ba'},
  {'tag': '049', 'required': '', 'key': 'abcd'},
  {'tag': '050', 'required': 'a', 'key': 'ab13'},
  {'tag': '051', 'required': 'a', 'key': 'abc'}, // 2021-08-27: only one field in the whole Melinda
  {'tag': '052', 'required': 'a', 'key': 'abd'},
  {'tag': '055', 'required': 'a', 'key': 'ab'},
  {'tag': '060', 'required': 'a', 'key': 'ab'},
  {'tag': '061', 'required': 'a', 'paired': 'b', 'key': 'abc'},
  {'tag': '066', 'required': 'c'},
  {'tag': '070', 'required': 'a', 'key': 'ab'},
  {'tag': '071', 'required': 'a', 'paired': 'abc', 'key': 'abc'}, // N=3
  {'tag': '072', 'required': 'a', 'key': 'ax'},
  {'tag': '074', 'required': '', 'paired': 'a', 'key': 'az'},
  {'tag': '080', 'required': 'a', 'paired': 'bx', 'key': 'abx'},
  {'tag': '082', 'required': 'a', 'paired': 'b', 'key': 'abmq2'},
  {'tag': '083', 'required': 'a', 'paired': 'b', 'key': 'abmqy'},
  {'tag': '084', 'required': 'a', 'paired': 'b2', 'key': 'abq2'},
  {'tag': '085', 'required': '', 'paired': 'abcfrstuvwyz', 'key': 'abcfrstuvwxyz'},
  {'tag': '086', 'required': '', 'paired': 'a', 'key': 'a'},
  {'tag': '088', 'required': '', 'paired': 'a', 'key': 'a'},
  // NB! 100, 110 and 111 may have title parts that are handled elsewhere
  {'tag': '100', 'required': 'a', 'paired': 't', 'key': keyX00},
  {'tag': '110', 'required': 'a', 'paired': 'bt', 'key': keyX10},
  {'tag': '111', 'required': 'a', 'paired': 't', 'key': keyX11},
  // NB! 130 has no name part, key is used for title part
  {'tag': '130', 'required': 'a', 'key': keyX30},
  {'tag': '210', 'required': 'a', 'key': 'ab'},
  {'tag': '222', 'required': 'a', 'key': 'ab'},
  {'tag': '240', 'required': 'a', 'key': 'adfghklmnoprs'},
  {'tag': '242', 'required': 'a', 'key': 'abchnpy'},
  {'tag': '243', 'required': 'a', 'key': 'adfghklmnoprs'},
  {'tag': '245', 'required': 'a', 'key': 'abcghnps', 'paired': 'abnps'},
  {'tag': '246', 'required': 'a', 'key': 'abfnp'},
  {'tag': '247', 'required': 'a', 'key': 'abfnpx'},
  {'tag': '250', 'required': 'a', 'key': 'ab'},
  {'tag': '251', 'required': 'a', 'key': 'a'},
  {'tag': '254', 'required': 'a', 'key': 'a'},
  {'tag': '255', 'required': 'a', 'key': 'abcdefg', 'paired': 'abcdefg'},
  {'tag': '256', 'required': 'a', 'key': 'a'},
  {'tag': '257', 'required': 'a', 'key': 'a'},
  {'tag': '258', 'required': 'a', 'key': 'a'}, // Melinda: N=1
  //{'tag': '260', 'required': '', 'paired': 'abcefg', 'key': 'abcefg'},
  {'tag': '260', 'required': '', 'key': 'abcefg'},
  {'tag': '263', 'required': 'a', 'key': 'a'},
  //{'tag': '264', 'required': '', 'paired': 'abc', 'key': 'abc'}, // NB "S.l." normalizations?" not implemented
  {'tag': '264', 'required': '', 'key': 'abc'}, // NB "S.l." normalizations?" not implemented
  // SKIP TAG 270 ON PURPOSE! Melinda's N=43.
  {'tag': '300', 'required': 'a', 'key': 'abcefg'},
  {'tag': '306', 'required': 'a', 'key': 'a'},
  // SKIP TAG 307 ON PURPOSE! N=0
  {'tag': '310', 'required': 'a', 'key': 'ab'},
  {'tag': '321', 'required': 'a', 'key': 'ab'},
  {'tag': '335', 'required': 'a', 'key': 'ab'}, // Melinda N=1 (a test field). M might increase?
  {'tag': '336', 'required': 'b2', 'key': 'ab2'}, // MET-88: don't merge different $a subfields
  {'tag': '337', 'required': 'b2', 'key': 'ab2'}, // MET-88: don't merge different $a subfields
  {'tag': '338', 'required': 'b2', 'key': 'ab2'}, // / MET-88: don't merge different $a subfields
  {'tag': '340', 'required': '', 'paired': 'abcdefghijkmnop', 'key': 'abcdefghijkmnop'},
  {'tag': '341', 'required': '', 'paired': 'abcde', 'key': 'abcde'}, // NEW! Starting to appear!
  {'tag': '342', 'required': '', 'paired': 'abcdefghijklmnopqrstuvw', 'key': 'abcdefghijklmnopqrstuvw'}, // SKIP 342. NOT SEEN!
  {'tag': '343', 'required': '', 'paired': 'abcdefghi', 'key': 'abcdefghi'}, // SKIP 343.
  {'tag': '344', 'required': '', 'paired': 'abcdefgh', 'key': 'abcdefgh'},
  {'tag': '345', 'required': '', 'paired': 'abcd', 'key': 'abcd'},
  {'tag': '346', 'required': '', 'paired': 'ab', 'key': 'ab'},
  {'tag': '347', 'required': '', 'paired': 'abcdef', 'key': 'abcdef'},
  {'tag': '348', 'required': '', 'paired': 'ab', 'key': 'ab'},
  {'tag': '348', 'required': '', 'paired': 'abc', 'key': 'abc'},
  {'tag': '351', 'required': '', 'paired': 'abc', 'key': 'abc'},
  {'tag': '352', 'required': '', 'paired': 'abcdefgiq', 'key': 'abcdefgiq'},
  {'tag': '355', 'required': '', 'paired': 'abcdefghj', 'key': 'abcdefghj'},
  {'tag': '357', 'required': 'a', 'key': 'abcg'},
  {'tag': '362', 'required': 'a', 'key': 'az'},
  {'tag': '363', 'required': '', 'paired': 'abcdefghijklmuv', 'key': 'abcdefghijklmuv'},
  {'tag': '365', 'required': 'b', 'paired': 'abcdefghijkm', 'key': 'abcdefghijkm'}, // N=0
  {'tag': '366', 'required': '', 'paired': 'abcdefgjkm', 'key': 'abcdefgjkm'},
  {'tag': '370', 'required': '', 'paired': 'cfgistuv', 'key': 'cfgistuv'},
  {'tag': '377', 'required': '', 'paired': 'al', 'key': 'al'},
  {'tag': '380', 'required': 'a', 'key': 'a'},
  {'tag': '381', 'required': 'auv', 'key': 'auv'},
  {'tag': '382', 'required': ''},
  {'tag': '383', 'required': 'abcde', 'key': 'abcde'},
  {'tag': '384', 'required': 'a', 'key': 'a'},
  {'tag': '385', 'required': 'a', 'paired': 'abmn', 'key': 'abmn'},
  {'tag': '386', 'required': 'a', 'paired': 'abmn', 'key': 'abmn'},
  {'tag': '388', 'required': 'a', 'key': 'a'},
  {'tag': '490', 'required': 'a', 'key': 'axvl'},
  {'tag': '500', 'required': 'a', 'key': 'a'},
  {'tag': '501', 'required': 'a', 'key': 'a'},
  {'tag': '502', 'required': 'a', 'key': 'abcdgo'},
  {'tag': '504', 'required': 'a', 'paired': 'ab', 'key': 'ab'},
  {'tag': '505', 'required': '', 'paired': 'agrtu', 'key': 'agrtu'},
  {'tag': '506', 'required': 'a', 'paired': '', 'key': 'abcdefgqu'},
  {'tag': '507', 'required': 'a', 'paired': 'ab', 'key': 'ab'},
  {'tag': '508', 'required': 'a', 'key': 'a'},
  {'tag': '509', 'required': 'a', 'key': 'acd'},
  {'tag': '510', 'required': 'a', 'key': 'abcx'},
  {'tag': '511', 'required': 'a', 'key': 'a'},
  {'tag': '513', 'required': '', 'paired': 'ab', 'key': 'ab'},
  {'tag': '514', 'required': '', 'paired': 'abcdefghijkmuz', 'key': 'abcdefghijkmuz'},
  {'tag': '515', 'required': 'a', 'key': 'a'},
  {'tag': '518', 'required': '', 'paired': 'adop', 'key': 'adop'},
  {'tag': '520', 'required': 'a', 'paired': 'abc', 'key': 'abc'},
  {'tag': '521', 'required': 'a', 'paired': 'ab', 'key': 'ab'},
  {'tag': '522', 'required': 'a', 'key': 'a'},
  {'tag': '524', 'required': 'a', 'key': 'a'},
  {'tag': '525', 'required': 'a', 'key': 'a'},
  {'tag': '526', 'required': 'a', 'paired': 'abcdi', 'key': 'abcdi'},
  {'tag': '530', 'required': 'a', 'paired': 'abcd', 'key': 'abcd'},
  {'tag': '532', 'required': 'a', 'key': 'a'},
  {'tag': '533', 'required': 'a', 'paired': 'abcdefmn7', 'key': 'abcdefmn7'},
  {'tag': '534', 'required': '', 'paired': 'abcempt', 'key': 'abcempt'},
  {'tag': '535', 'required': '', 'paired': 'abcdg', 'key': 'abcdg'},
  {'tag': '536', 'required': '', 'paired': 'abcdefgh', 'key': 'abcdefgh'},
  {'tag': '538', 'required': 'a', 'paired': 'aiu', 'key': 'aiu'},
  {'tag': '540', 'required': '', 'paired': 'abcdfgqu', 'key': 'abcdfgqu'},
  {'tag': '541', 'required': '', 'paired': 'abcdefhno', 'key': 'abcdefhno'},
  {'tag': '542', 'required': '', 'paired': 'abcdfghijklmopqrsu', 'key': 'abcdfghijklmopqrsu'},
  {'tag': '544', 'required': '', 'paired': 'abcden', 'key': 'abcden'},
  {'tag': '545', 'required': '', 'paired': 'abu', 'key': 'abu'},
  {'tag': '546', 'required': '', 'paired': 'ab', 'key': 'ab'},
  {'tag': '547', 'required': 'a', 'key': 'a'},
  {'tag': '550', 'required': 'a', 'key': 'a'},
  {'tag': '552', 'required': '', 'paired': 'abcdefghijklmnopuz', 'key': 'abcdefghijklmnopuz'},
  {'tag': '555', 'required': 'a', 'paired': 'abcdu', 'key': 'abcdu'},
  {'tag': '556', 'required': 'a', 'key': 'az'},
  {'tag': '561', 'required': 'a', 'key': 'au'},
  {'tag': '562', 'required': '', 'paired': 'abcde', 'key': 'abcde'},
  {'tag': '563', 'required': 'a', 'key': 'au'},
  {'tag': '565', 'required': '', 'paired': 'abc', 'key': 'abc'},
  {'tag': '567', 'required': '', 'paired': 'ab', 'key': 'ab'},
  {'tag': '580', 'required': 'a', 'key': 'a'},
  {'tag': '581', 'required': 'a', 'key': 'a'},
  {'tag': '583', 'required': '', 'paired': 'abcdefhijklnou', 'key': 'abcdefhijklnou'},
  {'tag': '584', 'required': '', 'paired': 'ab', 'key': 'ab'},
  {'tag': '585', 'required': 'a', 'key': 'a'},
  {'tag': '586', 'required': 'a', 'key': 'a'},
  {'tag': '588', 'required': 'a', 'key': 'a'},
  {'tag': '590', 'required': ''},
  {'tag': '591', 'required': ''},
  {'tag': '592', 'required': ''},
  {'tag': '593', 'required': ''},
  {'tag': '594', 'required': ''},
  {'tag': '595', 'required': ''},
  {'tag': '596', 'required': ''},
  {'tag': '597', 'required': ''},
  {'tag': '598', 'required': ''},
  {'tag': '599', 'required': ''},
  {'tag': '600', 'required': 'a', 'paired': 'tvxyz', 'key': keyX00},
  {'tag': '610', 'required': 'a', 'paired': 'btvxyz', 'key': keyX10},
  {'tag': '611', 'required': 'a', 'paired': 'tvxyz', 'key': keyX11},
  {'tag': '630', 'required': 'a', 'paired': 'atvxyz', 'key': keyX30},
  // NB! 700, 710 and 711 may have title parts that are handled elsewhere
  {'tag': '647', 'required': 'a', 'paired': 'avxyz', 'key': 'acdgvxyz02'},
  {'tag': '648', 'required': 'a', 'paired': 'avxyz', 'key': 'avxyz02'},
  {'tag': '650', 'required': 'a', 'paired': 'abcdegvxyz', 'key': 'abcdegvxyz20'},
  {'tag': '651', 'required': 'a', 'paired': 'aegvxyz', 'key': 'aegvxyz20'},
  {'tag': '653', 'required': 'a', 'paired': 'a', 'key': 'a'}, // this is interesting as a can be repeated
  {'tag': '654', 'required': '', 'paired': 'abcevxyz'},
  {'tag': '655', 'required': 'a', 'paired': 'abcvxyz', 'key': 'avxyz20'},
  {'tag': '656', 'required': 'a', 'paired': 'akvxyz'}, // N=0
  {'tag': '657', 'required': 'a', 'paired': 'avxyz'}, // N=0
  {'tag': '658', 'required': 'a', 'paired': 'abcd'}, // N=0
  {'tag': '662', 'required': '', 'paired': 'abcdefgh'}, // N=0
  {'tag': '688', 'required': 'a'}, // N=0
  {'tag': '700', 'required': 'a', 'paired': 't', 'key': keyX00}, // h/i/m/o/r/s/x are missing from 100
  {'tag': '710', 'required': 'a', 'paired': 'bt', 'key': keyX10}, // h/j/m/o/r/s/x are missing from 110
  {'tag': '711', 'required': 'a', 'paired': 'cdeflns', 'key': keyX11}, // h/i/s/x are missing from 711
  {'tag': '720', 'required': 'a', 'key': 'a'},
  // NB! 730 has no name part, key is used for title part
  {'tag': '730', 'required': 'a', 'key': keyX30}, // NB: 130->730 magic subfields might not agree...
  {'tag': '740', 'required': 'a', 'key': 'ahnp'},
  {'tag': '751', 'required': 'a', 'key': 'a'}, // N=11, kaikissa pelkkä $a
  {'tag': '752', 'required': '', 'key': 'abcdefgh'}, // N=12234
  {'tag': '753', 'required': '', 'key': 'abc'},
  {'tag': '754', 'required': '', 'key': 'acdxz'}, // N=3
  {'tag': '758', 'required': 'a', 'key': 'ai'}, // N=1

  {'tag': '760', 'required': 'tw', key: 'twxy'},
  {'tag': '762', 'required': 't', key: 'abcdhmstxy'},
  {'tag': '765', 'required': 't', key: 'abcdhmrstuwxyz'},
  {'tag': '767', 'required': 't', key: 'abcdhmrstuwxyz'},
  {'tag': '770', 'required': 't', 'paired': 'ruxyz', key: 'abcdhmrstuwxyz'},
  {'tag': '772', 'required': 't', key: 'abcdhmrstuwxyz'},
  {'tag': '773', 'required': 'w', key: 'wgq'}, // Kirjavälitys should not have any component parts. However, this need to be re-thought...
  // Currently we (appently) drop fields that don't contain 773$w...
  {'tag': '774', 'required': '', 'paired': 'nruxyz', 'key': 'npqrstrxyz'},
  {'tag': '775', 'required': '', 'paired': 'ruxyz', 'key': 'abcdefhmstuxyz'},
  {'tag': '776', 'required': '', 'paired': 'ruxyz', 'key': 'abcdhmsuwxyz'},
  {'tag': '777', 'required': '', 'paired': 'ruxyz', 'key': 'abcdhmstuxyz'},
  {'tag': '780', 'required': '', 'paired': 'ruxyz', 'key': 'abcdhmstuxyz'},
  {'tag': '785', 'required': '', 'paired': 'uxyz', 'key': 'abcdhmstuxyz'},
  {'tag': '786', 'required': '', 'paired': 'abcrstuxyz', 'key': 'abcdhijmprstuxyz4'},
  {'tag': '787', 'required': '', 'paired': 'abcdhmstuxyz4'},
  {'tag': '788', 'required': '', 'paired': 'stx', 'key': 'abdestx'},
  {'tag': '800', 'required': 'a', 'paired': 't', 'key': keyX00},
  {'tag': '810', 'required': 'a', 'paired': 'bt', 'key': keyX10},
  {'tag': '811', 'required': 'a', 'paired': 't', 'key': keyX11},
  {'tag': '830', 'required': 'a', 'key': keyX30},
  {'tag': '840', 'required': 'a'},
  {'tag': '841', 'required': 'a'},
  {'tag': '842', 'required': 'a'},
  {'tag': '843', 'required': 'a'},
  {'tag': '844', 'required': 'a'},
  {'tag': '845', 'required': 'a'},
  {'tag': '850', 'required': 'a', 'key': 'a'},
  {'tag': '852', 'required': 'a'}, // HMM... we might want to reconsider this...
  {'tag': '853', 'required': 'a'},
  {'tag': '854', 'required': 'a'},
  {'tag': '855', 'required': 'a'},
  {'tag': '856', 'required': 'u', 'paired': 'u', 'key': 'opuw23'}, // 856 is built around $u...
  {'tag': '863', 'required': 'a'},
  {'tag': '864', 'required': 'a'},
  {'tag': '865', 'required': 'a'},
  {'tag': '866', 'required': 'a'},
  {'tag': '867', 'required': 'a'},
  {'tag': '868', 'required': 'a'},
  {'tag': '876', 'required': 'a'},
  {'tag': '877', 'required': 'a'},
  {'tag': '878', 'required': 'a'},
  {'tag': '880', 'required': '', 'paired': 'a', 'key': 'abcdefghijklmnopqrstuvwxyz'},
  {'tag': '881', 'required': ''},
  {'tag': '882', 'required': ''},
  {'tag': '883', 'required': ''},
  {'tag': '884', 'required': '', 'paired': 'agkq'},
  {'tag': '885', 'required': ''},
  {'tag': '886', 'required': ''},
  {'tag': '887', 'required': ''},
  {'tag': '900', 'required': ''},
  {'tag': '901', 'required': ''},
  {'tag': '910', 'required': ''},
  {'tag': '935', 'required': 'a', 'key': 'az'}, // Fono information at least
  {'tag': '940', 'required': ''},
  {'tag': '946', 'required': 'a', 'key': 'abfnp'}, // Copied from 246. However, final version might contain some elements from field 245 as well
  {'tag': '960', 'required': ''},
  {'tag': '973', 'required': 'w', 'key': 'w'}, // Viola multi-hosts
  {'tag': '995', 'required': ''},
  {'tag': 'CAT', 'required': ''},
  {'tag': 'LOW', 'required': ''},
  {'tag': 'SID', 'required': ''}
];

function constraintToValue(tagsConstraints, constraintName) {
  if (constraintName in tagsConstraints) {
    return tagsConstraints[constraintName];
  }
  return null; // NB! "" might mean "apply to everything" (eg. 040.key) while null means that it is not applied.
}

export function getMergeConstraintsForTag(tag, constraintName) {
  const tagsConstraintsArray = mergeConstraints.filter(entry => tag === entry.tag);
  if (tagsConstraintsArray.length === 0) {
    debugDev(`WARNING\tNo key found for ${tag}. Returning NULL!`);
    return null;
  }
  // NB! should we support multiple contains for a field? Eg. 505$a vs 505($tg)+
  if (tagsConstraintsArray.length > 1) { // eslint-disable-line functional/no-conditional-statements
    debugDev(`WARNING\tMultiple values for '${constraintName}' (N=${tagsConstraintsArray.length}) found in ${tag}. Using first values.`);
  }
  return constraintToValue(tagsConstraintsArray[0], constraintName);
}
