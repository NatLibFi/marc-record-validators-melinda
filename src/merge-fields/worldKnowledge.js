//import {nvdebug} from '../utils.js';
//import createDebugLogger from 'debug';

// NB! This file (or at least synonyms) should eventually be moved away from merge to '..'.

//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:worldKnowledge');
//const debugData = debug.extend('data');
//const debugDev = debug.extend('dev');


export function valueCarriesMeaning(tag, subfieldCode, value) {
  // Some data is pretty meaningless and as meaningless is pretty close to nothing, this meaningless data should no prevent merge.
  // The list below is incomples (swedish translations etc)
  if (tag === '260' || tag === '264') {
    // We drop these, instead of normalizing, as KV does not put this information in place...
    if (subfieldCode === 'a') {
      if (value.match(/^[^a-z]*(?:Kustannuspaikka tuntematon|S\.l)[^a-z]*$/ui)) {
        return false;
      }
    }
    if (subfieldCode === 'b') {
      if (value.match(/^[^a-z]*(?:Kustantaja tuntematon|S\.n)[^a-z]*$/ui)) {
        return false;
      }
    }
    return true;
  }
  return true;
}

const synonyms = [
  {tags: ['700', '710', '711', '730'], code: 'i', 'fin': 'Sisältää (ekspressio)', 'swe': 'Innehåller (uttryck)'},
  {tags: ['700', '710', '711', '730'], code: 'i', 'fin': 'Sisältää (teos)', 'swe': 'Innehåller (verk)'},
  {tags: ['700', '710', '711', '730'], code: 'l', 'fin': 'Englanti', 'swe': 'Engelska'},
  {tags: ['700', '710', '711', '730'], code: 'l', 'fin': 'Ruotsi', 'swe': 'Svenska'},
  {tags: ['700', '710', '711', '730'], code: 'l', 'fin': 'Suomi', 'swe': 'Finska'}
  // There might eventually be need for a list of terms is given language (eg. engl. paperback and softcover)
];

export function getSynonyms(term, tag = undefined, subfieldCode = undefined, preferredLanguage = undefined, ignoreCase = true, relevantLanguagesString = 'fin swe',) {
  if (!term) {
    return [];
  }
  //nvdebug(`WP1 CANDS: ${synonyms.length} FOR '${term}'`, debugDev);
  const relevantLanguges = relevantLanguagesString.split(/\s+/u);
  const normalizedTerm = ignoreCase ? term.toLowerCase() : term;
  const synonymsWithTag = tag ? synonyms.filter(s => s.tags.includes(tag)) : synonyms;
  if (synonymsWithTag.length === 0) {
    return [];
  }
  //nvdebug(`WP2 (FILTER ${tag}) CANDS: ${synonymsWithTag.length}`, debugDev);
  const synonymsWithTagAndCode = subfieldCode ? synonymsWithTag.filter(s => s.code === subfieldCode) : synonymsWithTag;
  //nvdebug(`WP3 (FILTER $${subfieldCode}) CANDS: ${synonymsWithTagAndCode.length}:\n${JSON.stringify(synonymsWithTagAndCode)}`, debugDev);
  const matchingSynonyms = synonymsWithTagAndCode.filter(s => termAndLangMatch(s));

  if (preferredLanguage && matchingSynonyms.length > 0) {
    //console.log(`USING PREFERRED LANG '${preferredLanguage}' for TERM '${term}':\n${JSON.stringify(matchingSynonyms)}`, debugDev);
    return matchingSynonyms.map(s => s[preferredLanguage]);
  }
  return matchingSynonyms;

  function termAndLangMatch(synonym) {
    if (relevantLanguges.includes('fin')) {
      if (ignoreCase && synonym.fin.toLowerCase() === normalizedTerm ) {
        return true;
      }
      if (!ignoreCase && synonym.fin === term) {
        return true;
      }
    }

    if (relevantLanguges.includes('swe')) {
      if (ignoreCase && synonym.swe.toLowerCase() === normalizedTerm ) {
        return true;
      }
      if (!ignoreCase && synonym.swe === term) {
        return true;
      }
    }
    return false;
  }
}

export function getSynonym(tag, subfieldCode, originalValue) {
  const finnishForm = getSynonyms(originalValue, tag, subfieldCode, 'fin');
  if (finnishForm.length === 1) {
    //nvdebug(`FINNISH FORM FOR ${tag}$${subfieldCode}: '${finnishForm[0]}'`, debugDev);
    return finnishForm[0];
  }
  return originalValue;
}

export function normalizeForSamenessCheck(tag, subfieldCode, originalValue) {
  // NB! These work only for non-repeatable subfields!
  // Repeatable subfields are currently handled in mergeSubfields.js. Only non-repeatable subfields block field merge,
  // (This split is suboptiomal... Minimum fix: make this distinction cleaner...)

  //nvdebug(`TRYING TO DO ${tag}$${subfieldCode} '${originalValue}'`, debugDev);
  originalValue = getSynonym(tag, subfieldCode, originalValue);

  if (subfieldCode === 'a' && ['100', '600', '700', '800'].includes(tag)) { // "Etunimi Sukunimi"...
    return normalizePersonalName(originalValue);
  }

  // NB! originalValue should already be lowercased, stripped on initial '[' chars and postpunctuation.
  if (tag === '250' && subfieldCode === 'a') {
    return normalizeEditionStatement(originalValue);
  }

  // 506 - Restrictions on Access Note (R), $a - Terms governing access (NR)
  if (tag === '506' && subfieldCode === 'a') {
    return normalize506a(originalValue);
  }

  if (tag === '534' && subfieldCode === 'p') {
    return normalizeOriginalVersionNoteIntroductoryPhrase(originalValue);
  }

  return originalValue;
}


function normalizePersonalName(originalValue) {
  // Use more readable "Forename Surname" format in comparisons:
  return originalValue.replace(/^([^,]+), ([^,]+)$/u, '$2 $1');
}

const sallittu506a = ['sallittu kaikenikäisille', 'sallittu', 's']; // downcased, without punctuation
function normalize506a(originalValue) {
  if (sallittu506a.includes(originalValue)) {
    return sallittu506a[0];
  }
  return originalValue;
}

const introductoryPhrasesMeaning1 = ['alkuperäinen', 'alkuperäisen julkaisutiedot', 'alun perin julkaistu', 'alunperin julkaistu'];
function normalizeOriginalVersionNoteIntroductoryPhrase(originalValue) {
  // MELKEHITYS-1935-ish:
  if (introductoryPhrasesMeaning1.includes(originalValue)) {
    return introductoryPhrasesMeaning1[0];
  }

  return originalValue;
}

function normalizeEditionStatement(originalValue) {
  const value = originalValue;

  // As normalization tries to translate things info Finnish, use this for similarity check only!
  if (value.match(/^[1-9][0-9]*(?:\.|:a|nd|rd|st|th) (?:ed\.?|edition|p\.?|painos|uppl\.?|upplagan)[.\]]*$/ui)) {
    const nth = value.replace(/[^0-9].*$/u, '');
    return `${nth}. painos`;
  }

  // Quick and dirty fix for
  if (value.match(/^[1-9][0-9]*(?:\.|:a|nd|rd|st|th)(?: förnyade|,? rev\.| uud\.| uudistettu) (?:ed\.?|edition|p\.?|painos|uppl\.?|upplagan)[.\]]*$/ui)) {
    const nth = value.replace(/[^0-9].*$/u, '');
    return `${nth}. uudistettu painos`;
  }

  if (value.match(/^(?:First|Första|Ensimmäinen) (?:ed\.?|edition|p\.?|painos|uppl\.?|upplagan)[.\]]*$/ui)) {
    return `1. painos`;
  }

  if (value.match(/^(?:Andra|Second|Toinen) (?:ed\.?|edition|p\.?|painos|uppl\.?|upplagan)[.\]]*$/ui)) {
    return `2. painos`;
  }

  if (value.match(/^(?:Kolmas|Third|Tredje) (?:ed\.?|edition|p\.?|painos|uppl\.?|upplagan)[.\]]*$/ui)) {
    return `3. painos`;
  }

  if (value.match(/^(?:Fourth|Fjärde|Neljäs) (?:ed\.?|edition|p\.?|painos|uppl\.?|upplagan)[.\]]*$/ui)) {
    return `4. painos`;
  }

  return originalValue;
}
