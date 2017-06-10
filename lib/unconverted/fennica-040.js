/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Validate and fix MARC records
 *
 * Copyright (c) 2014-2017 University Of Helsinki (The National Library Of Finland)
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
    define(['es6-shims/lib/shims/array', 'marc-record-validate/lib/utils'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('es6-shims/lib/shims/array'), require('marc-record-validate/lib/utils'));
  }

}(this, factory));

/**
 * If FENNI low tag exists and there's no 040 $aFI-NL, add one.
 *
 *  See SYSHOI-4203 for details.
 **/
function factory(shim_array, utils)
{

  'use strict';

  function isInvalid(record)
  {
    return record.fields.some(function(field) {
      
      var subfield_a, fields_040;

      if (field.tag === 'LOW') {

        subfield_a = shim_array.find(field.subfields, function(subfield) {
          return subfield.code === 'a';
        });

        /**
         * @internal Skip prepublication records
         **/
        if (subfield_a && subfield_a.value === 'FENNI' && (!record.leader || record.leader.value.substring(17, 18) !== '8')) {

          return !record.fields.some(function(field2) {
            return field2.tag === '040';
          });
        }

      }
    });
  }
  
  return {
    validate: function(record)
    {
      return !isInvalid(record) ? [] : [{
        messages: [utils.validate.warning('Add 040$a FI-NL'), utils.validate.warning('Fix 040')]
      }];
    },
    fix: function(record)
    {  

      var field_new;

      if (isInvalid(record)) {

        field_new = {
          tag: '040',
          ind1: ' ',
          ind2: ' ',
          subfields: [{
            code: 'a',
            value: 'FI-NL'
          }]
        };
        
        return [{
          modifications: [utils.fix.addField(record, field_new)]
        }];
        
      } else {
        return [];
      }
      
    }
  };

}
