/*
 * FormOfItem.js -- fix 008/23 from 'r' to '|'
 * 
 * Copyright (c) Kansalliskirjasto 2014
 * All Rights Reserved.
 *
 * @author(s): Nicholas Volk, nicholas.volk@helsinki.fi
 *
 * Worked in product environment 000000454
 */

define([
    "core/Validation"
	], function (Validation, L) {
	"use strict";

	var debug = 1;

    function _FOI_fixable(recordModel, field) {
		if ( field.tag != '008' ) { return 0; }
		if ( !field.content ) { return 0; }	// 4888839 was corrupted and caused a crash here...
		var foi = field.content.substring(23,24);
		if ( foi != 'r' ) { return 0; }
		return 1;
    }

    function validate(recordModel, field) {
		if ( !_FOI_fixable(recordModel, field) ) { return null; }
		// TODO: pitäisi tarkistaa päteekö tämä kaikille materiaalityypeille!
		// Luulisin, että ei... -nv
		//alert("Tarkista: Tehdäänkö kaikille tyypeille?");
		var msg = "008/023 contains 'r', should be '|'";
		return Validation.warning(msg, [{
			name: "Finmarc->MARC21 008/23 bug fix",
			description: "Convert 008/23 from 'r' to '|'"
		}]);
    }



    function fix (action, recordModel, field, i) {
		if ( _FOI_fixable(recordModel, field) ) { 
			var old_content = field.content;
			field.content = field.content.substring(0,23) + '|' + field.content.substring(24);
			if ( debug ) {
				console.info("008/023:\n "+old_content + " =>\n " + field.content);
				recordModel.trigger('change');
			}
			return 1;
		}
		return 0;
    }

    Validation.registerValidatorBundle(
        "FormOfItem",
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
