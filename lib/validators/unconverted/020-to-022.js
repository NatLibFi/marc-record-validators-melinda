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
    define(['marc-record-validate/lib/utils'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('marc-record-validate/lib/utils'));
  }

}(this, factory));

function factory(utils)
{

  'use strict';
  
  var regexp_issnish = /^[0-9]{4}\-?[0-9][0-9][0-9][0-9X]$/;
  
  function getFields(record)
  {
    return record.fields.filter(function(field) {

      var subfield_a;

      if (field.tag === '020') {

        subfield_a = shim_array.find(field.subfields, function(subfield) {
          return subfield.code === 'a';
        });

        return subfield_a && regexp_issnish.test(subfield_a.value);

      }

    });
  }

  return {
    validate: function(record)
    {
      return getFields(record).map(function(field) {
        return {
          tag: field.tag,
          messages: [utils.validate.warning('Move ISSN to 022')]
          }]
        };
      });
    },
    fix: function(record)
    {
      return getFields(record).map(function(field) {

        var modifications = [];

        /**
         * @internal Erroneous ISSN is more likely to occur than a canceled one
         **/
        var subfield = shim_array(field.subfields, function(subfield) {
          return subfield.code === 'z';
        });

        if (subfield) {
          modifications.push(utils.fix.modifySubfieldCode(subfield, 'y'));
        }

        subfield = shim_array(field.subfields, function(subfield) {
          return subfield.code === 'q';
        });

        if (subfield) {
          modifications.push(utils.fix.removeSubfield(field, subfield));
        }

        modifications.push(utils.fix.modifyFieldTag(field, '022'));

        return {
          tag: field.tag,
          modifications: modifications
        };

      });
    }
  };

}
