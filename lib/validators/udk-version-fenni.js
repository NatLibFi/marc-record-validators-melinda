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
 * This validator adds checks UDK-fields (080) and add a version definition
 * to them, if necessary.
 *
 * The logic is this:
 *
 * If the record has a field 080 containing subfield $9 FENNI<KEEP> but not subfield $2,
 * a subfield $2 containing specifying the UDC version is added.
 *
 * If the record is about a serial (content type is as, is, es, gs, ms, os, ai),
 *
 * => 080 $2 1974/fin/finuc-s
 *
 * If the type is something else:
 *
 * => 080 $2 1974/fin/fennica
 *
 */
/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      '@natlibfi/es6-polyfills/lib/polyfills/promise',
      '@natlibfi/es6-shims/lib/shims/array',
      '@natlibfi/marc-record-validate/lib/utils'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('@natlibfi/es6-polyfills/lib/polyfills/promise'),
      require('@natlibfi/es6-shims/lib/shims/array'),
      require('@natlibfi/marc-record-validate/lib/utils')
    );
  }

}(this, factory));

function factory(Promise, shim_array, utils) {

  'use strict';

  // Values for leader positions 06-07 that determine whether the record is
  // a serial of some kind.
  var RECORD_TYPES = ['as', 'is', 'es', 'gs', 'ms', 'os', 'ai'];

  function getFields(record) {
    return record.fields.filter(function(field) {
      return field.tag === '080' && field.hasOwnProperty('subfields')
        && !field.subfields.some(function(subfield) {
          return subfield.code === '2';
        })
        && field.subfields.some(function(subfield) {
          return subfield.code === '9' && subfield.value === 'FENNI<KEEP>';
        });
    });
  }

  return {
    name: 'udk-version-fenni',
    factory: function() {
      return {
        validate: function(record) {
          return Promise.resolve(getFields(record).map(function(field) {
            return utils.validate.warning('Missing UDK version definition in field 080 at', field);
          }));
        },
        fix: function(record) {
          return Promise.resolve(getFields(record).map(function(field) {
            let newSubfield = {
              code: '2',
              value: ''
            };
            newSubfield.value = RECORD_TYPES.includes(record.leader.slice(6,8)) ? '1974/fin/finuc-s' : '1974/fin/fennica';
            let rest = field.subfields.splice(field.subfields.indexOf({
              code: '9',
              value: 'FENNI<KEEP>'
            }));
            field.subfields.push(newSubfield);
            rest.forEach(function(sf) {
              field.subfields.push(sf);
            });
            return {
              type: 'addSubfield',
              field: JSON.parse(JSON.stringify(field)),
              subfield: JSON.parse(JSON.stringify(newSubfield))
            };
          }));
        }
      };
    }
  };

}
