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

/**
 * If FENNI low tag exists and there's no 042 $aFI-NL, add one.
 * See SYSHOI-4203 for details.
 **/
function factory(utils)
{

  'use strict';

  function isInvalid(record)
  {

    function checkLeader()
    {

      var bib_level;

      if (record.leader) {
        
        bib_level = record.leader.substring(7, 8);
        
        /**
        * @internal Is a prepublication record and bibliographic level is not 'c' (collection) or 'd' (subunit)
        **/
        return record.leader.value.substring(17, 18) !== '8' && bib_level !== 'c' && bib_level !== 'd';
        
      }

    }

    function check500()
    {
      return !record.fields.some(function(field) {
        return field.tag === '500' && field.subfields.some(function(subfield) {
          return subfield.value.indexOf('kirjaus') >= 0;
        });
      });
    }

    function check583()
    {
      return !record.fields.some(function(field) {
        return field.tag === '583' && field.subfields.some(function(subfield) {
          return subfield.value.indexOf('kirjaus') >= 0;
        });
      });
    }
    
    function check594()
    {
      return !record.fields.some(function(field) {
        return field.tag === '594' && field.subfields.some(function(subfield) {
          return subfield.value.indexOf('Pienpainatekokoelmassa') >= 0;
        });
      });
    }
    
    return record.fields.some(function(field) {
      
      var subfield_a, fields_042;
      
      if (field.tag === 'LOW') {
        
        subfield_a = shim_array.find(field.subfields, function(subfield) {
          return subfield.code === 'a';
        });
        
        if (subfield_a && subfield_a.value === 'FENNI' && !record.fields.some(function(field) {
          return field.tag === '042';
        })) {
          return checkLeader() && check500() && check583() && check594();
        }
      }

    });

  }

  return {
    validate: function(record)
    {
      return !isInvalid(record) ? [] : [{
        messages: [utils.validate.warning('Add 042##$afinb')]
      }];
    },
    fix: function(record)
    {
      
      var field_new;
      
      if (isInvalid(record)) {
        
        field_new = {
          tag: '042',
          ind1: ' ',
          ind2: ' ',
          subfields: [{
            code: 'a',
            value: 'finb'
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
