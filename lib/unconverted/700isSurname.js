/*
 *
 * 700isSurname.js -- change indicator 1 from 0 to 1, if $a looks like a surname
 * 
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * @author: Nicholas Volk, nicholas.volk@helsinki.fi
 *
 * Test record (production): 372
 *
 */

define([
	"core/RecordModel",
	"core/Validation",
	"core/L",
	], function (RecordModel, Validation, L) {
		"use strict";

		var debug = 1;

		var re = /[a-zåäö], [A-ZÅÄÖ]/;

		function needsFixing(recordModel, field) {
			if ( field.tag == '700' && field.indicator1 == '0' ) {
				var sf = recordModel.getSubfieldByCode(field,"a");
				if ( sf && sf.content.match(re) ) { return 1; }
			}
			return 0;
		}

		function validate(recordModel, field) {
			if ( !needsFixing(recordModel, field) ) {
				return null;
			}

			var sf = recordModel.getSubfieldByCode(field,"a");
			var msg = sf.content + " is not a forename. Changing ind1 from 0 to 1.";
			return Validation.warning(msg, [{
				name: "Fix 700 ind 1: 0 => 1",
				description: msg
			}]);
		}


		function fix (action, recordModel, field, i) {
			if ( needsFixing(recordModel, field) ) {
				field.indicator1 = '1';
				recordModel.trigger('change');
				if ( debug ) {
					console.info("700isSurname.fixer(): ind1 changed to 1");
				}
				return 1;
			}
			return 0;
		}

		Validation.registerValidatorBundle(
			"700isSurname",
			validate,
			fix,
			'field');
});


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
    define(factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  }

}(this, factory));

function factory()
{

  'use strict';
