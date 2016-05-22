/*
 * Leader19.js -- fix 000/19 value from 'r' to '^' 
 * 
 * Copyright (c) Kansalliskirjasto 2014
 * All Rights Reserved.
 *
 * @author: Nicholas Volk, nicholas.volk@helsinki.fi
 *
 * Fixed in the product environment: 000001912
 *

 *
 *
 */

define([
    "core/Validation"
	], function (Validation) {
	"use strict";

	var debug = 1;

	function needsFixing(field) {
		if ( field.tag != 'LDR' ) { return 0; }
		var c19 = field.content.substring(19,20);
		if ( c19 != 'r' ) { return 0; }
		return 1;
	}	

    function validate(recordModel, field) {
		if ( needsFixing(field) ) {
			var msg = "Leader/019 contains 'r', should be '^'";

			return Validation.warning(msg, [{
				name: "Finmarc->MARC21 000/19 bug fix",
				description: "Convert 000/19 from 'r' to '^'"
			}]);
		}
    }



    function fix (action, recordModel, field, i) {
		if ( needsFixing(field) ) {
			var old_content = field.content;
			field.content = field.content.substring(0,19) + '^' + field.content.substring(20);

			if ( debug ) {
				console.info("Leader/019:\n "+old_content + " =>\n " + field.content);
				recordModel.trigger('change');
			}

			recordModel.trigger('change');
			return 1;
		}
		return 0;
    }

    Validation.registerValidatorBundle(
        "Leader19",
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
    define(factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  }

}(this, factory));

function factory()
{

  'use strict';
