/*
 *
 * 561add5.js -- lisää $5 tarvittaessa
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

		var libraryCodes = [ 'H', 'TYL', 'H3', 'Hk', 'Hhu38', 'Hh', 'Ht', 'Hhmus', 'Hc'];

		function get5(recordModel, field) {
			if ( field.tag !== '561' ) { return 0; }
			// We could check that Helka's LOW tag exists.
			// Won't bother: it wasn't asked..
			var sf5 = recordModel.getSubfieldByCode(field,"5");
			if ( sf5 ) { return 0; }

			var sfa= recordModel.getSubfieldByCode(field,"a");
			if ( !sfa ) { return 0; }

			var content = sfa.content;
			//console.info("CON '"+content+"'");
			if ( content.indexOf("Musikaliska sällskapet i Åbo") === 0 ) { return 'ALMA'; }
			if ( content.indexOf("Lyc: ") === 0 ) { return 'VOLTE'; } // 412335

			if ( content === "Gatchina Palace, St. Petersburg." ) { return 'HELKA'; } // 1090164
			if ( content === "Korff, Johann Albrecht von." ) { return 'HELKA'; } // 1090164
			if ( content.slice(-6) === '(JAPA)' || content.slice(-7) === '(JAPA).' ) { return 'VIOLA'; }

			var i;
			for ( i=0; i < libraryCodes.length; i++ ) {
				//if ( content === libraryCodes[i] ) { return 'HELKA'; }

				// $a subfield begins with appropriate library code:
				if ( content.indexOf(libraryCodes[i]+" ") === 0 ) { // 35022
					return 'HELKA';
				}
				if ( content.indexOf(libraryCodes[i]+":") === 0 ) { // 25474
					return 'HELKA';
				}
				var str = "("+libraryCodes[i]+")";
				if ( (content.lastIndexOf(str)) + str.length == content.length ) {
					return 'HELKA';
				}
				str = "("+libraryCodes[i]+")."; // 129347
				if ( (content.lastIndexOf(str)) + str.length == content.length ) {
					return 'HELKA';
				}
		
			}

			return null;
		}

		function validate(recordModel, field) {
			var res = get5(recordModel, field);
			if ( !res) { return null; }	
			
			var msg = "561: Add $5 "+res+" to " + RecordModel.fieldToString(field);		

			return Validation.warning(msg, [{
					name: msg,
					description: msg
			}]);

		}


		function fix (action, recordModel, field, i) {
			var res = get5(recordModel, field);
			if ( res ) {
				if ( debug ) { console.info("561add5.js fixer: Add $5 " +res+ " to " + RecordModel.fieldToString(field)); }
				field.subfields.push(recordModel.createSubfield("5", res));
				recordModel.trigger('change');
				return 1;
			}
			return 0;
		}

		Validation.registerValidatorBundle(
			"561add5",
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
