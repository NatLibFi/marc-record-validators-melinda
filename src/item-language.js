import {loadModule as loadCLD} from 'cld3-asm';
import LanguageCodes from 'langs';
import createDebugLogger from 'debug';

export default async function (tagPattern, treshold = 0.9) {
  const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/item-language');
  const cldFactory = await loadCLD();

  if (tagPattern instanceof RegExp) {
    return {
      description:
      'Handles invalid/missing item language code',
      validate,
      fix
    };
  }

  throw new Error('No tagPattern provided');

  async function validate(record) {
    const results = await checkLanguage(record);

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

  async function fix(record) {
    const results = await checkLanguage(record);

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

  async function checkLanguage(record) {
    const text = getText(record);
    const langCode = getLanguageCode(record);

    const Identifier = cldFactory.create();

    if (text.length === 0) {
      Identifier.dispose();
      return {failed: true, currentCode: langCode};
    }

    try {
      const results = await Identifier.findLanguage(text);
      Identifier.dispose();

      if (results.is_reliable) {
        if (results.probability >= treshold) {
          return {
            detected: get2TLangCode(results.language),
            currentCode: langCode
          };
        }

        return {
          currentCode: langCode,
          suggested: [get2TLangCode(results.language)]
        };
      }

      return {failed: true, currentCode: langCode};
    } catch (err) {
      /* istanbul ignore next: How to cause errors? */
      try {
        Identifier.dispose();
      } catch (err2) {
        debug(`Got error disposing identifier: ${err2 instanceof Error ? err2.stack : err2}`);
      }

      /* istanbul ignore next: How to cause errors? */
      throw err instanceof Error ? err : new Error(err.message);
    }

    function getText(record) {
      return record.get(tagPattern).reduce((acc, field) => {
        const fieldText = field.subfields.find(sf => sf.code === 'a').value;
        return `${acc}${fieldText}`;
      }, '');
    }

    function getLanguageCode(record) {
      const [f008] = record.get(/^008$/u);

      if (f008) {
        const code = f008.value.slice(35, 38);
        if ((/^[a-z][a-z][a-z]$/u).test(code) && code !== 'zxx') {
          return code;
        }
      }

      const [f041] = record.get(/^041$/u);

      if (f041) {
        const code = f041.subfields.find(sf => sf.code === 'a').value;
        return code;
      }
    }

    function get2TLangCode(code) {
      return LanguageCodes.where('1', code)['2T'];
    }
  }
}
