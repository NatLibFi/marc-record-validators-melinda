import {francAll} from 'franc';

import createDebugLogger from 'debug';
import {nvdebug} from './utils.js';

// NB! Should we support 041$d? (Audio books use it, don't they?)

export default async function (tagPattern, threshold = 0.9) {
  const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/item-language');

  if (tagPattern instanceof RegExp) {
    return {
      description:
      'Handles invalid/missing item language code',
      validate,
      fix
    };
  }

  throw new Error('No tagPattern provided');

  function validate(record) {
    const results = checkLanguage(record);

    if (results.failed) {
      return {valid: Boolean(results.currentCode), messages: ['Language detection failed']};
    }

    if (results.detected) {
      if (results.detected !== results.currentCode) {
        return {valid: false, messages: [`Item language code is invalid. Correct language code: ${results.detected}`]};
      }

      return {valid: true};
    }

    if (results.suggested) {
      return {valid: Boolean(results.currentCode), messages: [`Item language code is invalid. Current code: ${results.currentCode}, suggestions: ${results.suggested.join()}`]};
    }
  }

  function fix(record) {
    const results = checkLanguage(record);

    if (results.suggested && results.currentCode) {
      return;
    }

    if (results.failed && !results.currentCode) {
      return;
    }

    if (results.detected && results.detected !== results.currentCode) {
      const f008 = record.get(/^008$/u).shift();

      if (f008) {
        const start = f008.value.slice(0, 35);
        const end = f008.value.slice(38);
        f008.value = `${start}${results.detected}${end}`;
      }

      const f041 = record.get(/^041$/u).shift();

      if (f041) {
        const subfield = f041.subfields.find(sf => sf.code === 'a');

        if (subfield) {
          subfield.value = results.detected;
        } else {
          f041.subfields.push({code: 'a', value: results.detected});
          f041.subfields.sort((a, b) => {
            if (a.code < b.code) {
              return -1;
            }

            if (a.code > b.code) {
              return 1;
            }

            return 0;
          });
        }
      } else {
        record.insertField({tag: '041', ind1: ' ', ind2: ' ', subfields: [
          {
            code: 'a',
            value: results.detected
          }
        ]});
      }
    }
  }

  function checkLanguage(record) {
    const text = getText(record);
    const langCode = getLanguageCode(record);

    // We don't want to change these no matter what the abstract says.
    if (['mul', 'sgn', 'und', 'zxx'].includes(langCode)) {
      return {failed: true, currentCode: langCode};
    }

    if (text.length === 0) {
      return {failed: true, currentCode: langCode};
    }

    const results = francAll(text);

    const [francLang, probability] = results[0];

    nvdebug(`FRANC ${langCode}/${threshold} vs ${francLang}/${probability}`, debug);

    if (francLang === 'und') { // franc returns ['und', 1.0] for failure!
      return {failed: true, currentCode: langCode};
    }

    if (probability >= threshold) {
      return {
        detected: francLang,
        currentCode: langCode
      };
    }

    if (probability > 0.0) {
      return {
        currentCode: langCode,
        suggested: [francLang]
      };
    }

    return {failed: true, currentCode: langCode};

    function getText(record) {
      return record.get(tagPattern).reduce((acc, field) => {
        const fieldText = field.subfields.find(sf => sf.code === 'a').value;
        return `${acc}${fieldText}`;
      }, '');
    }


    function isValidLanguageCode(code) {
      if (!(/^[a-z][a-z][a-z]$/u).test(code)) {
        return false;
      }
      return true;
    }

    function getLanguageCode(record) {
      const [f008] = record.get(/^008$/u);

      if (f008) {
        const code = f008.value.slice(35, 38);
        if(isValidLanguageCode(code)) {
          return code;
        }
      }

      const [f041] = record.get(/^041$/u);

      if (f041) {
        const subfield = f041.subfields.find(sf => ['a'].includes(sf.code) && isValidLanguageCode(sf.value)); // sami languages are not supported by franc, so don't worry about smi/sme logic.
        if (!subfield) {
          return undefined;
        }
        return subfield.value;
      }
      return undefined;
    }
  }
}
