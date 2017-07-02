/*
 * 
 * DoubleSubfieldEliminator.js - remove subfield double from a given field
 *
 * Copyright (c) Kansalliskirjasto 2015-2016
 * All Rights Reserved.
 *
 * Author(s): Nicholas Volk <nicholas.volk@helsinki.fi>
 *
 */

define([
    "core/Validation",
    "core/RecordModel"
	], function (Validation, RecordModel) {
		"use strict";

		var DEBUG = 1;

	var targets = [
		{ field: '650', subfield:'2' },
	];


	function requiresAction(field) {
		var i, j, k;
		for ( i=0; i < targets.length; i++ ) {			
			if ( field.tag == targets[i].field ) { // && field.subfields.length == 1 ) {
				for ( j=0; j < field.subfields.length-1; j++) {
					var sf1 = field.subfields[j];
					if ( sf1.code == targets[i].subfield ) {
						//console.info(" Looking at "+field.tag+"$"+sf1.code);
						for ( k = field.subfields.length-1; k > j; k-- ) {
							var sf2 = field.subfields[k];
							if ( sf1.code == sf2.code ) {
								//console.info("  Comparing '"+sf1.content+"' and '"+sf2.content+"'");
								if ( RecordModel.equalSubfield(sf1, sf2) ) {
									return sf2;
								}
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
    	var hits = 0;
		while ( sf ) {
			if ( DEBUG ) {
				console.info("DoubleSubfieldEliminator.js: delete subfield "+field.tag+"$"+sf.code
						+' '+sf.content);
			}
			field = recordModel.deleteSubfield(field, sf);
			recordModel.trigger('change');
			hits++;
			sf = requiresAction(field);
		}
		return hits;	

    }

    Validation.registerValidatorBundle(
        "DoubleSubfieldEliminator",
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
