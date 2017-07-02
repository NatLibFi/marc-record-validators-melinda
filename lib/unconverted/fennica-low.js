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
    define(['@natlibfi/es6-shims/lib/shims/array', '@natlibfi/marc-record-validate/lib/utils'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('@natlibfi/es6-shims/lib/shims/array'), require('@natlibfi/marc-record-validate/lib/utils'));
  }

}(this, factory));

function factory(shim_array, utils)
{

  'use strict';

  function hasLowFenni(record)
  {
    return record.fields.some(function(field) {
      return field.tag === 'LOW' && field.subfields.some(function(subfield) {
        return subfield.code === 'a' && subfield.value === 'FENNI';
      });
    });
  }

  function hasInvalidLeader(record)
  {

    var encoding_level;

    if (record.leader) {

      encoding_level = record.leader.substring(17, 18);

      /**
       * @internal Encoding level is invalid if it's not full, prepublication, 'not applicable' or '^'
       **/
      return encoding_level !== ' ' && encoding_level !== '^' && encoding_level !== '8' && encoding_level !== 'z';

    }

  }

  function hasInvalid008(record)
  {
    
    var cataloging_source,
    field_008 = shim_array.find(record.fields, function(field) {
      return field.tag === '008';
    });

    if (field_008) {

      cataloging_source = field_008.value.substring(39, 40);

      return cataloging_source !== ' ' && cataloging_source !== '^' && cataloging_source !== '';
      
    }

  }
  
  return {
    validate: function(record)
    {

      var results = [];

      if (hasLowFenni(record)) {

        if (hasInvalidLeader(record)) {
          results.push({
            messages: [utils.validate.warning('Fix LDR/17')]
          });
        }

        if (hasInvalid008(record)) {
          results.push({
            tag: '008',
            messages: [utils.validate.warning('Fix 008/39')]
          });
        }

      }

      return results;

    },
    fix: function(record)
    {

      var field_008, value_new_leader, value_new_008,
      results = [];

      if (hasLowFenni(record)) {

        if (hasInvalidLeader(record)) {

          value_new_leader = record.leader.substring(0, 17) + '^' + record.leader.substring(18);

          results.push({
            modifications: [utils.fix.modifyLeader(record, value_new_leader)]
          });

 
        }

        if (hasInvalid008(record)) {

          field_008 = shim_array.find(record.fields, function(field) {
            return field.tag === '008';
          });
          
          value_new_008 = field_008.value.substring(0, 39) + '^' + field_008.value.substring(40);

          results.push({
            tag: '008',
            modifications: [utils.fix.modifyFieldValue(field_008, value_new_008)]
          });

          field_008.value = value_new_008;

        }

      }

      return results;

    }
  };

}
