/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda-related validators for marc-record-validate
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

/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'marc-record-validate',
      './validators/browser/legal-term',
      './validators/decomposer',
      './validators/double-commas',
      './validators/function-terms',
      './validators/ind1-uniq',
      './validators/sort-keywords',
      './validators/sort-tag'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('marc-record-validate'),
      require('./validators/decomposer'),
      require('./validators/double-commas'),
      require('./validators/function-terms'),
      require('./validators/ind1-uniq'),
      require('./validators/nodejs/legal-term'),
      require('./validators/sort-keywords'),
      require('./validators/sort-tag')
    );
  }

}(this, factory));

function factory()
{

  'use strict';

  var args = [];

  for (var i = 1; i < arguments.length; i++) {
    args.push(arguments[i]);
  }

  return arguments[0](args);

}
