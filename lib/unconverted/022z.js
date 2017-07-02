/*
 * 022.js -- remove per. or (per.) from 022$$z
 * 
 * Copyright (c) Kansalliskirjasto 2014-2015
 * All Rights Reserved.
 *
 * @author: Nicholas Volk, nicholas.volk@helsinki.fi
 *
 * Modified from 020z.js on 2015-05-27. Fixed par->per on 2015-06-15.
 *
 */

define([
	"core/RecordModel",
	"core/Validation",
	], function (RecordModel, Validation) {

		var debug = 1;

		// Tämä lauseke edellyttää, että virh.-osaa edeltää jokin...
		var RegExpVirh= /^(.*[^ ])( *(\(per\.\)|per\.))$/i;

		function _hasExtraVirh(recordModel, field) {
			if ( field.tag === '022' ) {
				var subfield022z = recordModel.getSubfieldByCode(field,"z");
				if ( subfield022z ) {
					
					var result = RegExpVirh.exec(subfield022z.content);
					if ( result ) {
						console.info("022z CAND: "+subfield022z.content);
						return result;
					}
					else if ( subfield022z.content.indexOf('er') > 0 ) {
						console.info("TODO: FIX 022z "+subfield022z.content);
					}
				}
			}
			return null;
		}

		function validate(recordModel, field) {
			var results = _hasExtraVirh(recordModel, field);

			if ( results ) {
				var virh = results[2];
				var msg = 'Remove "'+ virh + '" from field '+field.tag+'$z.';

				if ( debug ) { console.info(msg); }

				return Validation.warning(msg, [{
					name: "Remove virh.",
					description: msg
				}]);
			}
		}


		function fix (action, recordModel, field, i) {
			//console.info("QualifyingInformation.fix()");
			var results = _hasExtraVirh(recordModel, field);
			if ( results ) {
				var z = recordModel.getSubfieldByCode(field,"z");
				if ( z ) {
					console.info(" Shorten 022$z to: "+results[1]);
					z.content = results[1]; // z-kentän sisältö ilman "(per.)"-osaa		
					recordModel.trigger('change');
					return 1;
				}
				
			}

			return 0;
		}

		Validation.registerValidatorBundle(
			"022z",
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
