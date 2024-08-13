//import {nvdebug} from './utils';

export function valueCarriesMeaning(tag, subfieldCode, value) {
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

export function normalizeForSamenessCheck(tag, subfieldCode, originalValue) {
  // NB! These work only for non-repeatable subfields!
  // Repeatable subfields are currently handled in mergeSubfields.js. Only non-repeatable subfields block field merge,
  // (This split is suboptiomal... Minimum fix: make this disctinction cleaner...)
  if (subfieldCode === 'a' && ['100', '600', '700', '800'].includes(tag)) {
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
  return originalValue.replace(/^([^,]+), ([^,]+)$/u, '$2 $1'); // eslint-disable-line prefer-named-capture-group
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
