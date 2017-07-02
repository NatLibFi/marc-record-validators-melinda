/*
 * 506a.js - detect and fix doubles such as ',' vs '--'
 *
 * Copyright (c) 2014 Kansalliskirjasto
 * All Rights Reserved.
 *
 * Author(s): Nicholas Volk (nicholas.volk@helsinki.fi)
 *
 * Täysin testaamaton. Pitäisi löytää jostain jokunen aito testitapaus.
 * 20636 (muistaakseni testi) näyttäisi olevan...
 */

define([
    "core/Validation",
    "core/RecordModel",
    "core/TagTable",
    "underscore"
    ], function (Validation, RecordModel, TagTable, _) {
	"use strict";

    function get506as(recordModel) {
		// 
		var fields = recordModel.getFieldsByTag('505');
		if ( !fields || fields.length < 2 ) { return null; }
		console.info("NV DEBUG: moniselitteinen 505");
		return fields;
	}

	function validate(recordModel) {
		var candFields = get506as(recordModel);
		if ( candFields ) {
			//console.info(candFields);
			var candSubfields = [];
			for ( var i=0; i < candFields.length; i++ ) {
				console.info(i+":"+RecordModel.fieldToString(candFields[i]));
				candSubfields[i] = ( recordModel.getSubfieldByCode(candFields[i], "a") || {}).content;
			}
			var msg = "Validate between:\n " + candSubfields.join("\n ");
			console.info(msg);
			return Validation.warning(msg);
		}
	}

    function fix () {

    }


     Validation.registerValidatorBundle(
        "506a",
        validate,
        fix,
        'record');

});/**
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
