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
 * A one-off thing: return lost link fields (773) to sub-records from a file.
 */
/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      '@natlibfi/es6-polyfills/lib/polyfills/promise',
      '@natlibfi/es6-shims/lib/shims/array',
      '@natlibfi/marc-record-validate/lib/utils',
      'request',
      'fs'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('@natlibfi/es6-shims/lib/shims/array'),
      require('@natlibfi/marc-record-validate/lib/utils'),
      require('request'),
      require('fs')
    );
  }

}(this, factory));

function factory(Promise, shim_array, utils, request, fs) {

  'use strict';

  function parseField(field) {
    return {
      tag: field.slice(10,13),
      ind1: field.slice(13,14),
      ind2: field.slice(14,15),
      subfields: field.split("$$")
      .slice(1)
      .filter(item => item.length > 1)
      .map(item => {
        return { "code": item.slice(0,1), "value": item.slice(1) };
      })
    }
  }

  function getLink(id) {
    return new Promise((resolve, reject) => {
      request(`http://replikointi-kk.lib.helsinki.fi/cvs/${id}`, (err, resp, body) => {
        if (err) reject(err);
        const re = new RegExp(`${id} 773.*<`);
        let result = re.exec(body);
        result = result[0].split("<")[0];
        resolve(result);
      });
    });
  }

  function hasNo773(record) {
    return record.fields.filter(function(field) {
      return field.tag === "773";
    }).length === 0;
  }

  return {
    name: 'return-link-fields',
    factory: function() {
      return {
        validate: function(record) {
          let results = hasNo773(record) ? [utils.validate.warning('Record has no 773 field')] : [];
          return Promise.resolve(results);
        },
        fix: function(record) {
          let id = record.fields.filter(function(field) {
            return field.tag === '001';
          })[0].value;

          return Promise.resolve(getLink(id).then(function(res) {
            let newField = parseField(res);
            record.appendField(newField);
            console.log(record.toString());
            console.log(JSON.stringify(record));
            return [{
              type: 'addField',
              field: JSON.parse(JSON.stringify(newField))}
            ];
          }));
        }
      };
    }
  };
}
