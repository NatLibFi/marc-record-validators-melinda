/*
 * Leader10.js -- fix 000/11 (subfield code count) value to '2' 
 * 
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * @author: Nicholas Volk <nicholas.volk@helsinki.fi>
 *
 * (Modified from Leader10.js)
 *
 *
./0060/006010300.seq,v:006010325 LDR   L ^^^^^nas^a^^001453i^4500
./0060/006097100.seq,v:006097147 LDR   L 00000nas^a^^^^^^^4i^4500

 */

define([
    "core/Validation"
	], function (Validation) {
	"use strict";

	var debug = 1;

	function needsFixing(field) {
		if ( field.tag != 'LDR' ) { return 0; }
		var c11 = field.content.substring(11,12);
		if ( c11 != '2' ) { return 1; }
		return 0;
	}	

    function validate(recordModel, field) {
		if ( needsFixing(field) ) {
			var c11 = field.content.substring(11,12);
			var msg = "Leader/11 contains '"+c11+"', should be '2'";

			return Validation.warning(msg, [{
				name: "Finmarc->MARC21 000/11 bug fix",
				description: "Convert 000/11 from '"+c11+"' to 'a'"
			}]);
		}
		return null;
    }



    function fix (action, recordModel, field, i) {
		if ( needsFixing(field) ) {
			var old_content = field.content;
			field.content = field.content.substring(0,11) + '2' + field.content.substring(12);

			if ( debug ) {
				console.info("fix Leader/11:\n "+old_content + " =>\n " + field.content);
				recordModel.trigger('change');
			}
			recordModel.trigger('change');
			return 1;
		}
		return 0;
    }

    Validation.registerValidatorBundle(
        "Leader11",
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
