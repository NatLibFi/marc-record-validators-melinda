/*
 *
 * 245indicator1.js -- chech and fix 245's indicator 1
 * 
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * @author: Nicholas Volk, nicholas.volk@helsinki.fi
 *
 * Jos joku kentistä 100, 110, 111 tai 130 löytyy, niin indikaattori on 1, muuten 0.
 *
 *
 * Tested! Test cases: 200013 (1=>0), 200091 (0=>1)
 * 
 */

define([
	"core/RecordModel",
	"core/Validation",
	"core/L",
	], function (RecordModel, Validation, L) {
		"use strict";

		var debug = 1;

		var heading_fields_1XX = [ '100', '110', '111', '130' ];

		function _has_heading(record) {
			var i;
			for ( i=0; i < heading_fields_1XX.length; i++ ) {
				var fields = record.getFieldsByTag(heading_fields_1XX[i]);
				if ( fields.length > 0 ) {
					return 1;
				}
			}
			return 0;
		}

		function _needsAction(record, field) {
			if ( field.tag == '245' ) {
				var has1XX = _has_heading(record);

				if ( field.indicator1 == '1' && !has1XX ) {
					return 1;
				}
				if ( field.indicator1 == '0' && has1XX ) {
					return 1;
				}
			}
			return 0;
		}

		function validate(recordModel, field) {

			if ( _needsAction(recordModel, field) ) {
				var msg;

				if ( field.indicator1 === '1' ) {
					msg="245: change ind1 from 1 to 0.";
					return Validation.warning(msg, [{
						name: msg,
						description: msg
					}]);
				}

				msg="245: change ind1 from 0 to 1.";
				return Validation.warning(msg, [{
					name: msg,
					description: msg
				}]);
			}

		}


		function fix (action, recordModel, field, i) {
			if ( _needsAction(recordModel, field) ) {
				if ( field.indicator1 == '1') {
					field.indicator1 = '0';
				}
				else {
					field.indicator1 = '1'; 
				}
				if ( debug ) {
					console.info("FIX: 245 ind1 to "+field.indicator1);
				}
				recordModel.trigger('change');
				return 1;
			}
			return 0;
		}

		Validation.registerValidatorBundle(
			"245indicator1",
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
