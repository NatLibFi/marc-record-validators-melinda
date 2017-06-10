/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda-related validators for marc-record-validate
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
    define(['es6-polyfills/lib/polyfills/promise', 'marc-record-validate/lib/utils'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('es6-polyfills/lib/polyfills/promise'), require('marc-record-validate/lib/utils'));
  }

}(this, factory));

function factory(Promise, utils)
{

  'use strict';

  return {
    name: 'ind1-uniq',
    factory: function(tag)
    {

      function getFields(record)
      {
        
        function fieldsEqualWithoutInd1(a, b)
        {
          return a.ind2 === b.ind2 && (a.hasOwnProperty('value') && a.value === b.value || a.subfields.every(function(subfield_a) {
            return b.subfields.some(function(subfield_b) {
              return subfield_a.code === subfield_b.code && subfield_a.value === subfield_b.value;
            });
          }));
        }

        return record.fields.filter(function(field) {
          return field.tag === tag && field.ind1 === ' ' && record.fields.some(function(field_sibling) {
            return field_sibling.tag === tag && (field_sibling.ind1 === '1' || field_sibling.ind1 === '0') && fieldsEqualWithoutInd1(field, field_sibling);
          });
        });

      }

      if (typeof tag !== 'string') {
        throw new Error('Tag is not defined or is not a string');
      } else {
        return {
          validate: function(record)
          {
            return Promise.resolve(getFields(record).map(function(field) {
              return utils.validate.warning(tag + ': Remove almost duplicate', field);
            }));
          },
          fix: function(record)
          {
            return Promise.resolve(getFields(record).map(function(field) {
              return utils.fix.removeField(record, field);
            }));
          }
        };        
      }

    }
  };

}
