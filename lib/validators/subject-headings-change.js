/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * Melinda-related validators for @natlibfi/marc-record-validate
 *
 * Copyright (c) 2014-2017 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of marc-record-validators-melinda
 *
 * marc-record-validators-melinda is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 **/

/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      '@natlibfi/es6-polyfills/lib/polyfills/promise',
      '@natlibfi/es6-shims/lib/shims/array',
      '@natlibfi/marc-record-validate/lib/utils'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('@natlibfi/es6-shims/lib/shims/array'),
      require('@natlibfi/marc-record-validate/lib/utils')
    );
  }

}(this, factory));

function factory(Promise, shim_array, utils) {

  'use strict';

  const CHANGED_HEADING_MAPS = [
    {
      'CODE': 'ysa',
      'CHANGES': {
        'marsut': 'marsu',
        'sähkökirjat': 'e-kirjat',
        'avioerolapset': 'erolapset',
        'goodwill': 'liikearvo',
        'linnunrata': 'Linnunrata',
        'isokuovi': 'kuovi',
        'valtimonkovetustauti': 'valtimonkovettumistauti',
        'vapaa-aikatilat': 'vapaa-ajan tilat',
        'projektijohtajat': 'projektipäälliköt',
        'eteläkaukasialaiset kielet': 'kartvelilaiset kielet',
        'koilliskaukasialaiset kielet': 'dagestanilaiset kielet',
        'Dublin Core (formaatti)': 'Dublin Core',
        'Z39.50 (standardi)': 'Z39.50',
        'Midi (standardi)': 'MIDI',
        'POSIX (standardi)': 'POSIX',
        'CGI (standardi)': 'CGI',
        'SyncML (standardi)': 'SyncML',
        'brandit': 'brändit',
        'Brandit': 'brändit',
        'corporate governance': 'omistajaohjaus',
        'lingua franca': 'lingua francat',
        'qi gong': 'qigong',
        'uniaattikirkot': 'idän katoliset kirkot',
        'hokemat': 'lorut',
        'kodin teknologia': 'kodintekniikka',
        'myanmarilaiset': 'burmalaiset',
        'näyttökokeet': 'näytöt (tutkintosuoritukset)',
        'yhteiskunnallinen kehitys': 'yhteiskuntakehitys',
        'vedenpuute': 'vesipula',
        'vaatetussuunnittelu': 'vaatesuunnittelu',
        'vaatetussuunnittelijat': 'vaatesuunnittelijat',
        'törmäys': 'törmäykset',
        'kuormituskokeet': 'rasituskokeet',
        'osallistuva suunnittelu': 'osallistava suunnittelu',
        'nimikortit': 'käyntikortit',
        'seemiläis-haamilaiset kielet': 'afroaasialaiset kielet',
        'lapsikeskeisyys': 'lapsilähtöisyys',
        'seurakunta': 'seurakunnat',
        'antropologinen lääketiede': 'lääketieteellinen antropologia',
        'elinkaarianalyysi': 'elinkaariarviointi',
        'dissosiaatiohäiriö': 'dissosiaatiohäiriöt',
        'uskonpuhdistus': 'reformaatio',
        'uskonpuhdistusaika': 'reformaation aika',
        'nettivalvonta': 'verkkovalvonta',
        'häkkilinnut': 'lemmikkilinnut',
        'urheilutuomarit': 'tuomarit (kilpailut)',
        'Brittein saaret': 'Britteinsaaret',
        'Kanarian saaret': 'Kanariansaaret',
        'Karjalan kannas': 'Karjalankannas',
        'Šanghai': 'Shanghai',
        'skeittaus': 'rullalautailu',
        'tyyli': 'tyylit',
        'uudenaikaistuminen': 'modernisaatio',
        'palosuoja-aineet': 'palonestoaineet'
      }
    },
    {
      'CODE': 'allars',
      'CHANGES': {

      }
    }

  ];

  const TAG_SUBFIELD_MAP = {
    '650': ['a', 'b', 'c', 'x'],
    '651': ['a', 'b', 'c', 'x']
  };

  function normalizeValue(value) {
    // None yet.
    return value;
  }

  function getFields(record) {
    return record.fields.filter(function(field) {
      if (TAG_SUBFIELD_MAP.hasOwnProperty(field.tag) && field.hasOwnProperty('subfields')) {

        /**
         * Return true if an object in CHANGED_HEADING_MAPS matches the field.
         * An object matches, if:
         * 1) the code in $2 matches the spec object's CODE property
         * 2) a subject heading in some of the subfields listed in TAG_SUBFIELD_MAP
         *    is found as a key in the said object's CHANGED property.
         */
        return CHANGED_HEADING_MAPS.some( (SPEC) => {
          return field.subfields.some( (sf) => {
            return SPEC.CHANGES.hasOwnProperty(normalizeValue(sf.value)) &&
              SPEC.CODE === field.subfields.filter( (sf) => sf.code === "2")[0].value &&
              TAG_SUBFIELD_MAP[field.tag].indexOf(sf.code) > -1;
          });

        });
      }
    });
  }

  return {
    name: 'subject-headings-change',
    factory: function() {
      return {
        validate: function(record) {
          return Promise.resolve(getFields(record).map(function(field) {
            return utils.validate.warning('Obsolete subject heading in field ' + field.tag, field);
          }));
        },
        fix: function(record) {
          return Promise.resolve(getFields(record).map(function(field) {
            // E.g. 'ysa'
            const vocabularyCode = field.subfields.filter( (sf) => sf.code === "2")[0].value;
            const vocabularySpec = CHANGED_HEADING_MAPS.filter( spec => spec.CODE === vocabularyCode)[0];
            const KEEPS = field.subfields.filter( (subf) => subf.value === "FENNI<KEEP>");
            return utils.fix.modifySubfields(field, function(subfield) {
              if (TAG_SUBFIELD_MAP[field.tag].indexOf(subfield.code) > -1 && vocabularySpec) {
                const newValue = vocabularySpec.CHANGES[normalizeValue(subfield.value)];
                if (newValue) {
                  subfield.value = newValue;
                  /**
                   * If the field contains $9FENNI<KEEP>, add a field 901 $b SISKUV $c X $5 FENNI
                   */
                  console.log("HELL YEAH!")
                  console.log("Tässä KEEPIT:")
                  if (KEEPS) {
                    console.log("JÄTTEKNULLA")
                  }
                }
              }
            });
          }));
        }
      };
    }
  };
}
