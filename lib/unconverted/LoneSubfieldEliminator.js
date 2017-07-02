/*
 * 
 * LoneSubfieldEliminator.js - remove field with given lone subfield
 *
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * Author(s): Nicholas Volk <nicholas.volk@helsinki.fi>
 *
 * 
 * Test case: 100007
 */

define([
    "core/Validation",
    "core/RecordModel"
	], function (Validation, RecordModel) {
		"use strict";

		var DEBUG = 1;

	var targets = [
		{ field: '022', subfield:'2', value: 'a' },
	];


	function requiresAction(field) {
		var i;
		for ( i=0; i < targets.length; i++ ) {			
			if ( field.tag == targets[i].field && field.subfields.length == 1 ) {
				var sf = field.subfields[0];
				if ( sf && sf.code == targets[i].subfield ) {
					if ( targets[i].value !== null ) {
						if ( targets[i].value === sf.content ) {
							return 1;
						}
					}
					else {
						if ( sf.content === null || sf.content === '' ) {
							return 1;
						}
					}
				}
			}
		}
		return 0;		
	}



	function validate(recordModel, field) {

		if ( !requiresAction(field) ) {
			return null;
		}

		var msg = "LoneSubfieldEliminator: " + field.tag + " with value '" + RecordModel.fieldToString(field) + "' can be removed";

		return Validation.warning(msg, [{
			name: msg,
			description: msg
		}]);
    }

    function fix (action, recordModel, field, i) {
		if ( requiresAction(field) ) {
			if ( DEBUG ) {
				console.info("LoneSubfieldEliminator.js: delete field "+field.tag);
				// return 1;
			}
			recordModel.deleteField(field);
			recordModel.trigger('change');
			return 1;
		}
		return 0;
    }

    Validation.registerValidatorBundle(
        "LoneSubfieldEliminator",
        validate,
        fix,
        'field');

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
