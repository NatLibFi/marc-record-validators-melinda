/*
 * Leader09.js -- fix 000/09 value from '#' to 'a' 
 * 
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * @author: Nicholas Volk <nicholas.volk@helsinki.fi>
 *
 * (Modiefied from Leader19.js)
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
		var c09 = field.content.substring(9,10);
		if ( c09 != 'a' ) { return 1; }
		return 0;
	}	

    function validate(recordModel, field) {
		if ( needsFixing(field) ) {
			var c09 = field.content.substring(9,10);
			var msg = "Leader/09 contains '"+c09+"', should be 'a'";

			return Validation.warning(msg, [{
				name: "Finmarc->MARC21 000/09 bug fix",
				description: "Convert 000/09 from '"+c09+"' to 'a'"
			}]);
		}
    }



    function fix (action, recordModel, field, i) {
		if ( needsFixing(field) ) {
			var old_content = field.content;
			field.content = field.content.substring(0,9) + 'a' + field.content.substring(10);

			if ( debug ) {
				console.info("Leader/09:\n "+old_content + " =>\n " + field.content);
			}
			recordModel.trigger('change');
			return 1;
		}
		return 0;
    }

    Validation.registerValidatorBundle(
        "Leader09",
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
