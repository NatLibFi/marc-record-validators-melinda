/*
 *
 * BibliographicLevel.js
 *
 * Checks bibliographic level (leader byte 7) against 020 and 022
 *
 * Leader/7 == '(s|i)' => no 020
 * Leader/7 == '(m)' => no 020
 *
 *
 */

define([
    "core/Validation",
    "core/RecordModel"
    ], function (Validation, RecordModel) {
	"use strict";

	var UNEXPECTED020 = 1;
	var UNEXPECTED022 = 2; 

	function hasIssue(recordModel) {

		var leader = recordModel.getFieldByTag('LDR');
		if ( !leader ) { return 0; } // Big problem, but someone else's problem
		var c7 = leader.content.substring(7,8);
		//console.info(c7+" has issue?")
		if ( c7 == 's' || c7 == 'i'  ) {
			var f020 = recordModel.getFieldByTag('020');
			// 020#c could be legal, couldn't it?
			if ( f020 && recordModel.getSubfieldByCode(f020,"a") ) {
				return UNEXPECTED020;
			}
		}
		else if ( c7 == 'm' ) { // monograph
			var f022 = recordModel.getFieldByTag('022');
			if ( f022 ) { return UNEXPECTED022; }
		}
		else {
			console.info("skipping bibliographic level "+c7);
		}
		return 0;
	}

    function validate(recordModel, field) {
		var status = hasIssue(recordModel);
		var msg;
		if ( status == UNEXPECTED020 ) {
			msg = "Mismatch: Leader/07 (bibliographic level) has s or i, but ISBN exists as well";
			console.info(msg);
			return Validation.warning(msg, [{
				name: "Bibliographic level vs ISBN/020",
				description: msg}]);
		} else if ( status == UNEXPECTED022 ) {
			msg = "Mismatch: Leader/07 (bibliographic level) has m, but ISSN exists as well";
			console.info(msg);
			return Validation.warning(msg, [{
				name: "Bibliographic level vs ISSN/022",
				description: msg}]);
		}


    }



    function fix (action, recordModel, field, i) {
		// manual fix only?
    }



     Validation.registerValidatorBundle(
        "BibliographicLevel",
        validate,
        fix,
        'record');

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
