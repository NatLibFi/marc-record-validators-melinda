/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Validate and fix MARC records
 *
 * Copyright (c) 2014-2016 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of marc-record-validate
 *
 * marc-record-validate is free software: you can redistribute it and/or modify
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
    define(['es6-polyfills/lib/polyfills/promise', 'marc-record-validate/lib/utils'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('es6-polyfills/lib/polyfills/promise'), require('marc-record-validate/lib/utils'));
  }

}(this, factory));

function factory(Promise, utils)
{

  'use strict';

  var MAP_CONVERSION = {
    /**
     * @internal Normalizations
     **/
    '‐': '-',
    '‑': '-',
    '‒': '-',
    '–': '-',
    '—': '-',
    '―': '-',    
    /**
     * @internal Precompose å, ä, ö, Å, Ä and Ö
     **/
    'å': 'å',
    'ä': 'ä',
    'ö': 'ö',
    'Å': 'Å',
    'Ä': 'Ä',
    'Ö': 'Ö',    
    /**
     * @internal Decompose everything else (list incomplete)
     **/
    'á': 'á',
    'à': 'à',
    'â': 'â',
    'ã': 'ã',
    'é': 'é',
    'è': 'è',
    'ê': 'ê',
    'ẽ': 'ẽ', 
    'ë': 'ë',
    'í': 'í',
    'ì': 'ì',
    'î': 'î',
    'ĩ': 'ĩ', 
    'ï': 'ï',
    'ñ': 'ñ',
    'ó': 'ó',
    'ò': 'ò',
    'ô': 'ô',
    'õ': 'õ',
    'ś': 'ś',
    'ú': 'ú',
    'ù': 'ù',
    'û': 'û',
    'ü': 'ü',
    'ũ': 'ũ',
    'ý': 'ý',
    'ỳ': 'ỳ',
    'ŷ': 'ŷ',
    'ỹ': 'ỹ', 
    'ÿ': 'ÿ',
    'Á': 'Á',
    'À': 'À',
    'Â': 'Â',
    'Ã': 'Ã',
    'É': 'É',
    'È': 'È',
    'Ê': 'Ê',
    'Ẽ': 'Ẽ', 
    'Ë': 'Ë',
    'Í': 'Í',
    'Ì': 'Ì',
    'Î': 'Î',
    'Ĩ': 'Ĩ', 
    'Ï': 'Ï',
    'Ñ': 'Ñ',    
    'Ó': 'Ó',
    'Ò': 'Ò',
    'Ô': 'Ô',
    'Õ': 'Õ',
    'Ś': 'Ś',
    'Ú': 'Ú',
    'Ù': 'Ù',
    'Û': 'Û',
    'Ũ': 'Ũ', 
    'Ü': 'Ü',
    'Ý': 'Ý',
    'Ỳ': 'Ỳ',
    'Ŷ': 'Ŷ',
    'Ỹ': 'Ỹ', 
    'Ÿ': 'Ÿ'
  },
  PATTERN = Object.keys(MAP_CONVERSION).reduce(function(result, key, index, list) {
    return index === list.length - 1 ? new RegExp(result + key + ')') : result + key + '|';
  }, '(');

  function convert(value)
  {
    return Object.keys(MAP_CONVERSION).reduce(function(result, key) {
      return result.indexOf(key) >= 0 ? result.replace(new RegExp(key, 'g'), MAP_CONVERSION[key]) : result;
    }, value);
  }

  function getFields(record)
  {
    return record.fields.filter(function(field) {
      if (field.hasOwnProperty('subfields')) {
        return field.subfields.some(function(subfield) {
          return PATTERN.test(subfield.value);
        });
      }
    });
  }

  return {
    name: 'decomposer',
    factory: function()
    {
      return {
        validate: function(record)
        {
          return Promise.resolve(getFields(record).map(function(field) {

            var codes = field.subfields
              .filter(function(subfield) {
                return PATTERN.test(subfield.value);
              })
              .map(function(subfield) {
                return subfield.code;
              });

            return utils.validate.warning('The following subfields are not properly decomposed: ' + codes.join(', '), field);

          }));
        },
        fix: function(record)
        {
          return Promise.resolve(getFields(record).map(function(field) {
            return utils.fix.modifySubfields(field, function(subfield) {
              if (PATTERN.test(subfield.value)) {
                subfield.value = convert(subfield.value);
              }
            });
          }));
        }
      };
    }
  };

}
