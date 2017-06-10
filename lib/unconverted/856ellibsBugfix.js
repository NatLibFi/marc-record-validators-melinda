/*
 *
 * 856ellibsEbrary.js -- lisää $5 tarvittaessa
 * 
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * @author: Nicholas Volk <nicholas.volk@helsinki.fi>
 *
 *
 */

define([
	"core/RecordModel",
	"core/Validation",
	"core/L",
	], function (RecordModel, Validation, L) {
		"use strict";

		var debug = 1;

		function needsFixing(recordModel, field) {
			if ( field.tag !== '856' ) { return 0; }

			var sfuobj = recordModel.getSubfieldByCode(field,"u");
			if ( !sfuobj ) { return 0; }

			if ( sfuobj.content.indexOf('ellibs') === -1 ) { return 0; }
			if ( sfuobj.content.indexOf('piki') === -1 ) { return 0; }

			var sf5obj = recordModel.getSubfieldByCode(field,"5");
			if ( !sf5obj ) { return 0; }
			if ( sf5obj.content !== 'HELKA' ) { return 0; }
			return 1;
		}

		function validate(recordModel, field) {
			if ( !needsFixing(recordModel, field) ) { return null; }

			var msg = "856$5: HELKA => PIKI";		

			return Validation.warning(msg, [{
					name: msg,
					description: msg
			}]);

		}


		function fix (action, recordModel, field, i) {
			if ( needsFixing(recordModel, field) ) {
				var sf5obj = recordModel.getSubfieldByCode(field,"5");
				if ( sf5obj ) {
					console.info("856ellibsEbrary.fix() HELKA => PIKI");
					sf5obj.content = 'PIKI';
				}
				recordModel.trigger('change');
				return 1;
			}
			return 0;
		}

		Validation.registerValidatorBundle(
			"856ellibsBugfix",
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
    define(factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  }

}(this, factory));

function factory()
{

  'use strict';
