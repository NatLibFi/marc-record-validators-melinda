/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Validate and fix MARC records
 *
 * Copyright (c) 2014-2016 University Of Helsinki (The National Library Of Finland)
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
      'es6-polyfills/lib/polyfills/promise',
      'es6-shims/lib/shims/array',
      'marc-record-validate/lib/utils'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-shims/lib/shims/array'),
      require('marc-record-validate/lib/utils')
    );
  }

}(this, factory));

function factory(Promise, shim_array, utils)
{

  'use strict';
  
  var MAP_TAG_PREFERENCE = {
    '650': {
      ind2: ['7', '0', '1', '2', '3', '4', '5', '6'],
      lexicon: ['ysa', 'allars', 'musa', 'cilla']
    }
  };

  return {
    name: 'sort-keywords',
    factory: function(tag)
    {

      /**
       * Return fields that should be located before previous similar fields
       **/
      function getFields(record)
      {
        return record.fields.filter(function(field) {
          return field.tag === tag && typeof getNewPosition(record, field) === 'number';
        });
      }

      /**
       * - Field's ind2 is preferred over the the other field's ind2
       * - Both fields's ind2 have the value '2'
       *   - If the field has subfield '2' but the other field doesn't
       *   - If the field's lexicon (From subfield '2') is preferred over the other field's lexicon
       **/
      function getNewPosition(record, field_a)
      {

        function getLexicon(field)
        {
          
          var subfield = shim_array.find(field.subfields, function(subfield) {
            return subfield.code === '2';
          });
          
          return subfield ? subfield.value : undefined;

        }

        var index_new;

        record.fields.some(function(field_b, index) {
          
          var lexicon_a, lexicon_b, difference;
          
          if (field_b.tag === tag) {
            if (field_a === field_b) {
              return 1;
            } else {
              
              difference = MAP_TAG_PREFERENCE[tag].ind2.indexOf(field_a.ind2) - MAP_TAG_PREFERENCE[tag].ind2.indexOf(field_b.ind2);

              if (difference < 0) {
                index_new = index;
                return 1;
              } else if (difference === 0 && field_a.ind2 === '7') {         
      
                lexicon_a = getLexicon(field_a);
                lexicon_b = getLexicon(field_b);
                
                if (lexicon_a && !lexicon_b) {
                  index_new = index;
                  return 1;
                } else if (MAP_TAG_PREFERENCE[tag].lexicon.indexOf(lexicon_a) < MAP_TAG_PREFERENCE[tag].lexicon.indexOf(lexicon_b)) {
                  index_new = index;
                  return 1;
                }
                
              }
              
            }
          }

        });

        return index_new;

      }

      if (!MAP_TAG_PREFERENCE.hasOwnProperty(tag)) {
        throw new Error("Tag '" + tag + "' is not supported");
      } else {
        return {
          validate: function(record)
          {
            return Promise.resolve(getFields(record).map(function(field) {
              return utils.validate.warning('Keyword field is not in correct position', field);
            }));
          },
          fix: function(record)
          {

            var modifications = [];

            getFields(record).forEach(function(field) {
              
              var index_new = getNewPosition(record, field);

              modifications.push(utils.fix.moveField(record, field, index_new));
              
            });

            return Promise.resolve(modifications);

          }
        };
      }
    }
  };

}
