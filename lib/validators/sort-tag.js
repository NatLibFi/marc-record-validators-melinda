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
    define([
      'es6-shims/lib/shims/array',
      'es6-polyfills/lib/polyfills/object',
      'es6-polyfills/lib/polyfills/promise',
      'marc-record-validate/lib/utils'
    ],factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-shims/lib/shims/array'),
      require('es6-polyfills/lib/polyfills/object'),
      require('es6-polyfills/lib/polyfills/promise'),
      require('marc-record-validate/lib/utils')
    );
 }

}(this, factory));

function factory(shim_array, Object, Promise, utils)
{

  'use strict';

  return {
    name: 'sort-tag',
    factory: function(tag)
    {

      /**
       * Get optimal offset for inserting the fields. Calculated by finding the nearest tags (E.g. '500' fields should be between '400' and '650' fields). If there are fields with the target tag after the most optimal tag, add to the offset until the next tag
       **/
      function getOffset(record)
      {

        var offset,
        tag_numeric = Number(tag),        
        metadata = record.fields.slice().reverse().reduce(function(result, field) {

          var tag_numeric_field = Number(field.tag);

          if (field.tag === tag && !result.lastTagField) {
            return Object.assign(result, {
              lastTagField: field
            });
          } else if (!isNaN(tag_numeric) && !isNaN(tag_numeric_field) && (tag_numeric - tag_numeric_field) > 0) {
            return Object.assign(result, {
              precedingField: field
            });
          } else {
            return result;
          }

        }, {});


        if (Object.keys(metadata).length === 0) {
          offset = 0;
        } else {
          offset = record.fields.indexOf(metadata.precedingField ? metadata.precedingField : metadata.lastTagField);
          offset++;
          offset = offset > record.fields.length - 1 ? record.fields.length - 1 : offset;          
        }

        return offset;

      }

      function getFields(record)
      {

        var field_offset,
        fields = [],
        index_offset = getOffset(record);

        if (index_offset > 0) {

          field_offset = shim_array.find(record.fields.slice(0, index_offset).reverse(), function(field) {
            return field.tag !== tag;
          });
          
          if (field_offset) {
            fields = fields.concat(record.fields.slice(0, record.fields.indexOf(field_offset)).reverse().filter(function(field) {
              return field.tag === tag;
            }));
   
            field_offset = shim_array.find(record.fields.slice(index_offset), function(field) {
              return field.tag !== tag;
            });
            
            if (field_offset) {
              fields = fields.concat(record.fields.slice(record.fields.indexOf(field_offset)).filter(function(field) {
                return field.tag === tag;
              }));
            }

          }

        }
        
        return fields;
        
      }

      if (tag === undefined) {
        throw new Error('Tag is undefined');
      } else {
        return {
          validate: function(record)
          {
            return Promise.resolve(getFields(record).map(function(field) {
              return utils.validate.warning('Field is not in correct position', field);
            }));
          },
          fix: function(record)
          {
            return Promise.resolve(getFields(record).map(function(field) {
              
              var offset = getOffset(record) + 1;

              return utils.fix.moveField(record, field, offset);

            }));
          }
        };
      }

    }
  };

}
