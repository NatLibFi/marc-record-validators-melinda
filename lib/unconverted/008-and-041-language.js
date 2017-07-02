/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Validate and fix MARC records
 *
 * Copyright (c) 2014-2017 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of @natlibfi/marc-record-validate
 *
 * @natlibfi/marc-record-validate is free software: you can redistribute it and/or modify
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
      '@natlibfi/es6-polyfills/lib/polyfills/object',
      '@natlibfi/marc-record-validate/lib/utils'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('@natlibfi/es6-polyfills/lib/polyfills/object'),
      require('@natlibfi/marc-record-validate/lib/utils')
    );
  }

}(this, factory));

function factory(Object, proto, utils)
{

  'use strict';

  var LANGUAGE_SUBFIELD_CODES_041 = [
    'a',
    'b',
    'd',
    'e',
    'f',
    'g',
    'h',
    'j',
    'k',
    'm',
    'n'
  ],
  LANGUAGE_CODES_MAP = {
    'cam': 'khm',
    'esk': 'ypk',
    'esp': 'epo', // esperanto
    'eth': 'gez', // ethiopian
    'far': 'fao', // fääri
    'fri': 'fry', // (länsi-)friisi
    'gae': 'gla', // gaeli
    'gag': 'glg', // galicia
    'gal': 'orm', // oromo
    'gua': 'grn', // guarani
    'int': 'ina', // interlingua
    'iri': 'gle', // oromo
    'kus': 'kos', // kosrae
    'lan': 'oci', // oksitaani
    'lap': 'smi', // saame, määrittelmätön murre
    'max': 'glv', // manx
    'mla': 'mlg', // malagassi
    'mol': 'rum', // moldova/romania (poliittiset syyt)
    'sao': 'smo', // samoa
    'scc': 'srp', // serbia
    'scr': 'hrv', // kroatia
    'sho': 'sna', // shona
    'snh': 'sin', // sinhalese
    'sso': 'sot', // sotho
    'swz': 'ssw', // swazi
    'tag': 'tgl', // tagalog
    'taj': 'tgk', // tadzikki
    'tar': 'tat', // tataari
    'tru': 'chk', // truk/chuuk
    'tsw': 'tsn' // tswana 
  };

  /**
   * @todo NB! We could also check whether language code is legal, and, if not:
   * 008: convert to '   '
   * 041: remove field
   **/
  function getFields(record)
  {
    return record.fields.filter(function(field) {
      if (field.tag === '008') {

        return LANGUAGE_CODES_MAP.hasOwnProperty(field.value.substring(35, 38));        

      } else if (field.tag === '041') {

        return field.subfields.some(function(subfield) {
          return SUBFIELD_CODES_LANGUAGE_041.indexOf(subfield.code) >= 0 && LANGUAGE_CODES_MAP.hasOwnProperty(subfield.value);
        });

      }
    });
  }

  return {
    validate: function(record)
    {
      return getFields(record).map(function(field) {
        return {
          tag: field.tag,
          messages: [utils.validate.warning('Language code should be modified')]
        };
      });
    },
    fix: function(record)
    {

      function fix008(field)
      {

        var lang_code = field.value.substring(35, 38),
        lang_code_new = LANGUAGE_CODES_MAP[lang_code];

        return {
          tag: field.tag,
          modifications: [utils.fix.modifyFieldValue(field, field.value.substring(0, 35) + lang_code_new + field.value.substring(38))]
        };

      }

      function fix041(field)
      {

        var modifications = [];
        
        field.subfields.forEach(function(subfield) {
          if (LANGUAGE_SUBFIELD_CODES_041.indexOf(subfield.code) >= 0 && LANGUAGE_CODES_MAP.hasOwnProperty(subfield.value)) {           
            modifications.push(utils.fix.modifySubfieldValue(subfield, LANGUAGE_CODES_MAP[subfield.value]));            
          }
        });

        return {
          tag: field.tag,
          modifications: modifications
        };

      }

      return getFields(record).map(function(field) {
        return field.tag === '008' ? fix008(field) : fix041(field);
      });

    }
  };

}
