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

function factory(shim_array, utils)
{

  'use strict';
  
  var regexp_qualifying_information = /^((.*\S) *)?\(([^)]*)$/;
  
  function getFields(record)
  {
    return record.fields.filter(function(field) {

      var subfield_a, subfield_q;

      if (field.tag === '020') {
        
        subfield_q = shim_array.find(field.subfields, function(subfield) {
          return subfield.code === 'q';
        });
        
        if (subfield_q && subfield_q.value.indexOf(')') >= 0) {
          
          subfield_a = shim_array.find(field.subfields, function(subfield) {
            return subfield.code === 'a';
          });
          
          return subfield_a && regexp_qualifying_information.test(subfield_a.value);
          
        }

      }

    });
  }
  
  return {
    validate: function(record)
    {
      return getFields(record).map(function(field) {
        
        var messages = [],
        subfield_a = shim_array.find(field.subfields, function(subfield) {
          return subfield.code === 'a';
        }),
        message = 'Move qualifying information to $q. ', 
        matches = regexp_qualifying_information.exec(subfield_a.value);
        
        if (!matches[2] && field.subfields.some(function(subfield) {
          return subfield.code === 'z';
        })) {
          messages.push(utils.validate.warning('Delete ' + field.tag + ' from the record'));
        }
        
        /**
         * @internal We only move '('
         **/
        message += matches[3] === undefined || matches[3] === '' ? 'Move "(" from $a to $q' : 'Move ' + matches[3] + ' "(" from $a to $q';
        
        messages.push(utils.validate.warning(message));

        return {
          tag: field.tag,
          messages: messages
        };

      });                                      
    },
    fix: function(record)
    {
      return getFields(record).map(function(field) {

        var subfield_a, subfield_q, subfield_z,
        modifications = [],
        matches = regexp_qualifying_information.exec(subfield_a.value);
        
        if (matches) {

          subfield_a = shim_array.find(field.subfields, function(subfield) {
            return subfield.code === 'a';
          });
          subfield_q = shim_array.find(field.subfields, function(subfield) {
            return subfield.code === 'q';
          });
          
          if (subfield_a && subfield_q) {
            
            /**
             * @internal $a is empty
             **/
            if ( matches[2] === undefined ) {

              if (shim_array.find(field.subfields, function(subfield) {
                return subfield.code === 'z';
              })) {
                modifications.push(utils.fix.removeSubfield(field, subfield_a));
              } else {
                modifications.push(utils.fix.removeField(record, field));
              }

              /**
               * @internal Value of $a without '(sid.)'
               **/
            } else {
              modifications.push(utils.fix.modifySubfieldValue(subfield_a, matches[2]));
            }
            
            if (matches[3] === undefined || matches[3] === '') {
              modifications.push(utils.fix.modifySubfieldValue(subfield_q, '(' + subfield_q.value));
            } else {
              modifications.push(utils.fix.modifySubfieldValue(subfield_q, matches[3] + '(' + subfield_q.value));
            }
            
          }

        }

        return {
          tag: field.tag,
          modifications: modifications
        };

      });
    }
  };

}
