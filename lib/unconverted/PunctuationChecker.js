/*
 * 
 * PuctuationChecker.js - do search and replace for listed fields
 *
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * Author(s): Nicholas Volk <nicholas.volk@helsinki.fi>
 *
 * Test cases(s) (production): 555, 915
 */

define([
    "core/Validation"
	], function (Validation, L) {
		"use strict";

		var DEBUG = 1;
		var initialized = 0;
	var targets = [
		{ field: '130', subfield:'a', nextSubfield: null, punc: '.', coolers: '?!' },
		//{ field: '245', subfield:'a', nextSubfield: 'b', punc: ' :' }, // untested demo 
	];


	function requiresAction(field) {
		var i;
		for ( i=0; i < targets.length; i++ ) {
			var target = targets[i];			
			if ( field.tag == target.field ) {
				for (var j=0; j<field.subfields.length; j++) {
					var sf = field.subfields[j];
					if ( sf && sf.code == target.subfield ) {
						var nsf = ( j+1 < field.subfields.length ? field.subfields[j+1].code : null );
						if ( nsf === target.nextSubfield ) {
							var punc = target.punc;

							var end = sf.content.slice(-punc.length);
							if ( end === punc ) { // on jo
								return null;	
							}
							// Coolerit eivät triggeroi validaattoria.
							// (Yleensä ne ovat muita välimerkkejä.)
							if ( target.coolers && target.coolers.indexOf(end) >= 0 ) {
								return null;
							}
							return sf;
						}
					}
				}
			}
		}
		return null;		
	}



	function validate(recordModel, field) {
		//if ( !initialized ) { initialize(); }
		var subfield = requiresAction(field);
		if ( !subfield ) { return null; }

		var msg = "PunctuationChecker.js, " + field.tag+subfield.code+" requires (correct) punctuation, has " + subfield.content;

		return Validation.warning(msg, [{
			name: msg,
			description: msg
		}]);
    }

    function fix (action, recordModel, field, i) {
		var n_fixes = 0;
		for (var j=0; j<field.subfields.length; j++) {
			for ( i=0; i < targets.length; i++ ) {
				if ( field.tag == targets[i].field ) {				
					var sf = field.subfields[j];
					if ( sf && sf.code == targets[i].subfield ) {
						var nsf = ( j+1 < field.subfields.length ? field.subfields[j+1].code : null );
						if ( nsf === targets[i].nextSubfield ) {
							var punc = targets[i].punc;
							var end = sf.content.slice(-punc.length);
							if ( end !== targets[i].punc ) {
								var lastChar = sf.content.slice(-1);
								if ( /^[A-ZÅÄÖa-zåäö0-9]$/.test(lastChar) ) {
									sf.content += punc;
									recordModel.trigger('change');
									n_fixes++;
									if ( DEBUG ) {
										console.info("PunctuationChecker.js, "+field.tag+"$"+sf.code+" added punc to "+sf.content);
									}
								}
								else {
									if ( DEBUG ) {
										console.info("PunctuationChecker.js: dared not to fix "+sf.content);
									}
								}
							}
						}
					}
				}
			}
		}
		return n_fixes;
    }

    Validation.registerValidatorBundle(
        "PunctuationChecker",
        validate,
        fix,
        'field');

});/**
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
