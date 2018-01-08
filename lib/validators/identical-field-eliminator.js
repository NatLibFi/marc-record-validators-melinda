/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * Melinda-related validators for @natlibfi/marc-record-validate
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

/**
 * This validator de-duplicates identical fields in a record.
 */

/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define(['@natlibfi/es6-polyfills/lib/polyfills/promise', '@natlibfi/marc-record-validate/lib/utils'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('@natlibfi/es6-polyfills/lib/polyfills/promise'), require('@natlibfi/marc-record-validate/lib/utils'));
  }

}(this, factory));

function factory(Promise, utils) {

  'use strict';

  function hasDuplicates(record, field) {
     return record.fields
      .filter(function(f) {
        return JSON.stringify(field) === JSON.stringify(f);
      })
      .length > 1;
  }

  function getFields(record) {
    return record.fields.filter(function(field) {
      return hasDuplicates(record, field);
    });
  }

  return {
    name: 'identical-field-eliminator',
    factory: function() {
      return {
        validate: function(record) {
          return Promise.resolve(getFields(record).map(function(field) {
              /**
               * Since each field that has a duplicate generates a warning,
               * each pair of duplicate fields generates two identical
               * warnings.
               */
              const fieldCopy = JSON.parse(JSON.stringify(field));
              return utils.validate.warning('Field has an identical duplicate in record', fieldCopy);
            }
          ));
        },
        fix: function(record) {
          return Promise.resolve(record.fields.map(function(field) {
            if (hasDuplicates(record, field)) {
              return utils.fix.removeField(record, field);
            }
          }));
        }
      };
    }
  };
}
