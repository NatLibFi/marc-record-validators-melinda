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

  var MISSING_MISSING_MEDIA_TYPE_STRING_STRING = 'ingen medietyp',
  regexp = /^[Ii].* [Mm]/;
  
  function getFields(record)
  {
    return record.fields.filter(function(field) {

      var subfield_a;

      if (field.tag === '337') {

        subfield_a = shim_array.find(field.subfields, function(subfield) {
          return subfield.code === 'a';
        });

        return subfield_a && subfield.value !== MISSING_MEDIA_TYPE_STRING && regexp.test(subfield_a.value);

      }

    });
  }


  return {
    validate: function(record) {
      return getFields(record).map(function(field) {
        return {
          tag: field.tag,
          messages: [utils.validate.warning("Fix $a '" + MISSING_MEDIA_TYPE_STRING + "'")]
        };
      });
    },
    fix: function(record) {
      return getFields(record).map(function(field) {
        
        var subfield = shim_array.find(field.subfields, function(subfield) {
          return subfield.code === 'a';
        });

        return {
          tag: field.tag,
          modifications: [utils.fix.modifySubfieldValue(subfield, MISSING_MEDIA_TYPE_STRING)]
        };

      });
    }
  };

}
