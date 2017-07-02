/*
 * 020.js -- remove virh. or (virh.) from 020$$z, also check that either $a or $z present
 * 
 * Copyright (c) Kansalliskirjasto 2014
 * All Rights Reserved.
 *
 * @author: Nicholas Volk, nicholas.volk@helsinki.fi
 *
 *
 * 'X (virh.)'' => 'X': 200164 
 *
 * ei a, ei z: 20165
 *
 * 2015-05-26: lisätty isojen kirjainten tuki /i
 */

define([
	"core/RecordModel",
	"core/Validation",
	], function (RecordModel, Validation) {

		var debug = 1;

		// Tämä lauseke edellyttää, että virh.-osaa edeltää jokin...
		var RegExpVirh= /^(.*[^ ])( *(\(felakt\.\)|\(felaktigt\)|\(virh\.\)|virh\.))$/i;

		function _hasExtraVirh(recordModel, field) {
			if ( field.tag === '020' ) {
				var subfield020z = recordModel.getSubfieldByCode(field,"z");
				if ( subfield020z ) {
					var result = RegExpVirh.exec(subfield020z.content);
					if ( result ) {
						console.info("020z CAND: "+subfield020z.content);
						return result;
					}
				}
			}
			return null;
		}

		function _noANorZ(recordModel, field) {
			if ( field.tag === '020' ) {
				var subfield020z = recordModel.getSubfieldByCode(field,"z");
				if ( !subfield020z ) {
					var subfield020a = recordModel.getSubfieldByCode(field,"a");
					if ( !subfield020a ) {
						return 1;
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

			if ( _noANorZ(recordModel, field) ) {
				var content = RecordModel.fieldToString(field);
				var msg = 'Remove 020 (no $$a not $$z): "'+content+'"';
				if ( debug ) { console.info(msg); }
				return Validation.warning(msg, [{
					name: "Remove 020",
					description: msg
				}]);	
			}
			return null;		

		}


		function fix (action, recordModel, field, i) {
			//console.info("QualifyingInformation.fix()");
			var results = _hasExtraVirh(recordModel, field);
			if ( results ) {
				if ( field.tag === '020') {
					var z = recordModel.getSubfieldByCode(field,"z");
					if ( z ) {
						// Aargh! Tämä luki ekat 18[0-9]{5} tietuetta väärin
						// console.info(" Shorten "+field.tag+"#z to: "+results[1]);
						console.info(" Shorten "+field.tag+"$z to: "+results[1]);
						z.content = results[1]; // z-kentän sisältö ilman "(virh.)"-osaa		
						recordModel.trigger('change');
						return 1;
					}
				}
			}

			if ( _noANorZ(recordModel, field) ) {
				if ( debug ) {
					console.info("Remove 020 (no $a nor $z)");
				}
				recordModel.deleteField(field);
				recordModel.trigger('change');
				return 1;
			}
			return 0;
		}

		Validation.registerValidatorBundle(
			"020z",
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
