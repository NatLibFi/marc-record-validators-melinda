/*
 *
 * 856ellibsEbrary.js -- lisää $5 tarvittaessa
 * 
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * @author: Nicholas Volk <nicholas.volk@helsinki.fi>
 *
 *
 */

define([
	"core/RecordModel",
	"core/Validation",
	"core/L",
	], function (RecordModel, Validation, L) {
		"use strict";

		var debug = 1;

		function get5(recordModel, field) {
			if ( field.tag !== '856' ) { return 0; }

			var sf5obj = recordModel.getSubfieldByCode(field,"5");
			if ( sf5obj ) { return 0; }


			var sfuobj = recordModel.getSubfieldByCode(field,"u");
			if ( !sfuobj ) { return 0; }

			var sfu = sfuobj.content;

			if ( sfu.indexOf('ellibs') > -1 ) {
				if ( debug ) { console.info('Ellibs 856: has $u, might need$5: '+RecordModel.fieldToString(field)); }

				// "$5 HELKA", jos osakentän $u linkissä "lib=31&" tai "library=31&" tai "/hy/"
				if ( sfu.indexOf('lib=31&') > -1 || sfu.indexOf('library=31&') > -1 || sfu.indexOf('/hy/') > -1 ) {
					return 'HELKA';
				}
				// "$5 TAMK", jos osakentän $u linkissä "lib=130&" tai "library=130&" tai "lib=10077&" tai "library=10077"
				if ( sfu.indexOf('lib=130&') > -1 || sfu.indexOf('library=130&') > -1 ||
					sfu.indexOf('lib=10077&') > -1 || sfu.indexOf('library=10077&') > -1 ) { 
					return 'TAMK';
				}
				// "$5 JOSKU", jos osakentän $u linkissä "lib=11777&" tai "library=11777&"
				if ( sfu.indexOf('lib=11777&') > -1 || sfu.indexOf('library=11777&') > -1 ) { 
					return 'JOSKU';
				}
				// "$5HAMK", jos osakentän $u linkissä "lib=79&" tai "library=79&"
				if ( sfu.indexOf('lib=79&') > -1 || sfu.indexOf('library=79&') > -1 ) { 
					return 'HAMK';
				}
				// "$5 JYKDO", jos osakentän $u linkissä "lib=10078&" tai "library=10078&"
				if ( sfu.indexOf('lib=10078&') > -1 || sfu.indexOf('library=10078&') > -1 ) { 
					return 'JYKDO';
				}
				// "$5 PIKI", jos osakentän $u "/piki/"
				if ( sfu.indexOf('/piki/') > -1 ) {
					return 'HELKA';
				}
			}
			else if ( sfu.indexOf('ebrary') > -1 ) {
				if ( debug ) { console.info('Ebrary 856: has $u, might need$5: '+RecordModel.fieldToString(field)); }
				// $5 HELKA, jos osakentän  $u linkissä on "/lib/helsinki/"
				if ( sfu.indexOf('/lib/helsinki/') > -1 ) {
					return 'HELKA';
				}
				// $5 TRITO, jos osakentän $u linkissä on "/lib/novia/"
				if ( sfu.indexOf('/lib/novia/') > -1 ) {
					return 'TRITO';
				}
				// $5 OAMK, jos osakentän $u linkissä on "/lib/oamk/"
				if ( sfu.indexOf('/lib/oamk/') > -1 ) {
					return 'OAMK';
				}
				// $5 DIAK, jos osakentän $u linkissä on "/lib/diak/"
				if ( sfu.indexOf('/lib/diak/') > -1 ) {
					return 'DIAK';
				}
				// $5 HANNA, jos osakentän $u linkissä on "/lib/hanken/"
				if ( sfu.indexOf('/lib/hanken/') > -1 ) {
					return 'HANNA';
				}
				// $5 JOSKU, jos osakentän $u linkissä on "/lib/joensuu/"
				if ( sfu.indexOf('/lib/joensuu/') > -1 ) {
					return 'JOSKU';
				}
				// $5 JYKDO, jos osakentän $u linkissä on "/lib/jyvaskyla/"
				if ( sfu.indexOf('/lib/jyvaskyla/') > -1 ) {
					return 'JYKDO';
				}
				// $5 VOLTE, jos osakentän $u linkissä on "/lib/tukkk/"
				if ( sfu.indexOf('/lib/tukkk/') > -1 ) {
					return 'VOLTE';
				}
				// $5 HAMK, jos osakentän $u linkissä on "/lib/hamk/"
				if ( sfu.indexOf('/lib/hamk/') > -1 ) {
					return 'HAMK';
				}
				// $5 AURA, jos osakentän $u linkissä on "/lib/turkuamk/"
				if ( sfu.indexOf('/lib/turkuamk/') > -1 ) {
					return 'AURA';
				}
				// $5 TUTCA, jos osakentän $u linkissä on "/lib/ttyk/"
				if ( sfu.indexOf('/lib/ttyk/') > -1 ) {
					return 'TUTCA';
				}
			}
			return null;
		}

		function validate(recordModel, field) {
			var sf5 = get5(recordModel, field);
			if ( !sf5 ) { return null; }	
			
			var msg = "856: lisää $5 " + sf5;		

			return Validation.warning(msg, [{
					name: msg,
					description: msg
			}]);

		}


		function fix (action, recordModel, field, i) {
			console.info("856ellibsEbrary.fix()");
			var content = get5(recordModel, field);
			if ( content ) {
				field.subfields.push(recordModel.createSubfield("5", content)); 
				recordModel.trigger('change');
				return 1;
			}
			return 0;
		}

		Validation.registerValidatorBundle(
			"856ellibsEbrary",
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
