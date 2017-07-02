/*
 * 
 * SubfieldEliminator.js - remove subfield a single with given content
 *
 * Copyright (c) Kansalliskirjasto 2015-2016
 * All Rights Reserved.
 *
 * Author(s): Nicholas Volk <nicholas.volk@helsinki.fi>
 *
 * NB! This is a bit lazy version: it removes only one subfield per call.
 */

define([
    "core/Validation",
    "core/RecordModel"
	], function (Validation, RecordModel) {
		"use strict";

		var DEBUG = 1;

	var targets = [
		{ field: '650', subfield:'2', value: '' },
	];


	function requiresAction(field) {
		var i, j;
		for ( i=0; i < targets.length; i++ ) {			
			if ( field.tag == targets[i].field ) { // && field.subfields.length == 1 ) {
				for ( j=field.subfields.length-1; j >= 0; j-- ) {
					var sf = field.subfields[j]
					if ( sf && sf.code == targets[i].subfield ) {
						if ( targets[i].value !== null ) {
							if ( targets[i].value === sf.content ) {
								return sf;
							}
						}
						else {
							if ( sf.content === null || sf.content === '' ) {
								return sf;
							}
						}
					}
				}
			}
		}
		return null;		
	}



	function validate(recordModel, field) {

		if ( !requiresAction(field) ) {
			return null;
		}

		var msg = "SubfieldEliminator: " + field.tag + " with value '" + RecordModel.fieldToString(field) + "' can be removed";

		return Validation.warning(msg, [{
			name: msg,
			description: msg
		}]);
    }

    function fix (action, recordModel, field, i) {
    	var sf = requiresAction(field);
		if ( sf ) {
			if ( field.subfields.length === 1 ) {
				if ( DEBUG ) {
					console.info("SubfieldEliminator.js: delete field "+field.tag);
					// return 1;
				}
				recordModel.deleteField(field);
				recordModel.trigger('change');
				return 1;
			}
			else {
				if ( DEBUG ) {
					console.info("SubfieldEliminator.js: delete subfield "+field.tag+sf.code
						+' '+sf.content);
					// return 1;
				}
				recordModel.deleteSubfield(field, sf);
				recordModel.trigger('change');
				return 1;
			}
		}
		return 0;	

    }

    Validation.registerValidatorBundle(
        "SubfieldEliminator",
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
