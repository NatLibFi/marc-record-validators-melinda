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

function factory(Promise, shim_array, utils)
{

  'use strict';

  var PATTERN_PUNCTUATION = '[.,:;!?]',
  FUNCTION_TERM_MAP = {
    'respondenttiti': 'respondentti',
    'EsopraanoItenoritenori': 'esittäjä',
    'sopraanoÄV': 'säveltäjä',
    'JOHtenori': 'johtaja',
    'ohj': 'ohjaaja',
    'alttouthor': 'kirjoittaja',
    'aut': 'kirjoittaja',
    'säv': 'säveltäjä',
    'sitt': 'esittäjä',
    'esitt': 'esittäjä',
    'PIalttoNO': 'piano',
    'sopraanoOV': 'sovittaja',
    'puv': 'puvustaja',
    'utg': 'utgivare',
    'kust': 'kustantaja',
    'ään': 'äänittäjä',
    'VIULU': 'viulu',
    'sopraanoalttoN': 'sanoittaja',
    'toim': 'toimittaja',
    'tejuontajaeet': 'tehosteet',
    'tenoriOIM': 'toimittaja',
    'esit': 'esittäjä',
    'bassoalttoR': 'baritoni',
    'leik': 'leikkaaja',
    'sopraanoELLO': 'sello',
    'NÄYtenoritenori': 'näyttelijä',
    'eesittäjä': 'esittäjä',
    'tenoriranslator': 'kääntäjä',
    'HUILU': 'huilu',
    'Ktenori': 'kontratenori',
    'KLalttoRINEtenoritenoriI': 'klarinetti',
    'sopraanoäv': 'säveltäjä',
    'URUtenori': 'urut',
    'kijroittaja': 'kirjoittaja',
    'CEMbassoalttoLO': 'cembalo',
    'KItenorialttoRaltto': 'kitara',
    'KÄYRÄtenoriORVI': 'käyrätorvi',
    'alttoLtenoritenoriOVIULU': 'alttoviulu',
    'OPEtenoritenori': 'opettaja',
    'sopraanoUOM': 'suomentaja',
    'KUVItenoritenorialttoJaltto': 'kuvittaja',
    'HalttoRPPU': 'harppu'
  },
  TAG_SUBFIELD_MAP = {
    '100': 'e',
    '110': 'e',
    '111': 'j',
    '600': 'e',
    '610': 'e',
    '611': 'j',
    '700': 'e',
    '710': 'e',
    '711': 'j'
  };

  function normalizeValue(value) {
    return value.replace(new RegExp(PATTERN_PUNCTUATION), '').trim();
  }

  function getFields(record) {
    return record.fields.filter(function(field) {
      if (TAG_SUBFIELD_MAP.hasOwnProperty(field.tag) && field.hasOwnProperty('subfields')) {
        return field.subfields.some(function(subfield) {

          var value_normalized;

          if (subfield.code === TAG_SUBFIELD_MAP[field.tag]) {
            value_normalized = normalizeValue(subfield.value);
            return FUNCTION_TERM_MAP.hasOwnProperty(value_normalized);
          }
        });
      }
    });
  }

  return {
    name: 'function-terms',
    factory: function() {
      return {
        validate: function(record) {
          return Promise.resolve(getFields(record).map(function(field) {
            return utils.validate.warning('Invalid function term in ' + field.tag + '$' + TAG_SUBFIELD_MAP[field.tag], field);
          }));
        },
        fix: function(record) {
          return Promise.resolve(getFields(record).map(function(field) {
            // var oldField = JSON.parse(JSON.stringify(field));
            // field.subfields = field.subfields.map(function(sf) {
            //   var normalized = normalizeValue(sf.value);
            //   var vals = Object.keys(FUNCTION_TERM_MAP);
            //   console.log(vals)
            //   console.log(normalized)
            //   if (sf.code === TAG_SUBFIELD_MAP[field.tag]) {
            //     sf.value = FUNCTION_TERM_MAP[normalized];
            //   }
            //   return sf;
            // });
            // return {
            //   type: "modifyField",
            //   old: oldField,
            //   new: field
            // };

            return utils.fix.modifySubfields(field, function(subfield) {
              if (subfield.code === TAG_SUBFIELD_MAP[field.tag]) {
                var normalized = normalizeValue(subfield.value);
                subfield.value = subfield.value.replace(new RegExp(subfield.value, 'g'), FUNCTION_TERM_MAP[subfield.value]);
              }
            });
          }));
        }
      };
    }
  };

}
