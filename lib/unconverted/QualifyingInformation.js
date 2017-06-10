/*
 *
 * QualifyingInformation.js -- move qualifying information to the right place
 * 
 * Copyright (c) Kansalliskirjasto 2014
 * All Rights Reserved.
 *
 * @author: Nicholas Volk, nicholas.volk@helsinki.fi
 *
 * Standardinumeron perässä suluissa olevat määreet siirretään uuteen
 * osakenttään q ja sulkumerkit poistetaan. Kentät ovat 020, 024, 028.
 * NB! "(sid.)" triggers a "trailing period" warning. (a bug in there?)
 *
 * Entäs "(virh.)" z-osakentän lopussa: "951-867-004-3 (virh.)"
 *
 * Testitietue 005666633
 * 
 * NB! c-osakenttä (hinta) ei estä poistoa (hyväksytetty UI:lla).
 * (Toisenlainen näkymys: http://www.loc.gov/marc/umb/um07to10.html):
 *
 * Testattu:
 * 000000012 (020:n poisto kokonaan)
 * 000000086 (sulkuosan siirto a:sta q:hun (*2))
 * 000000156 (020:n siirto a:sta q:hun (z on) ja a:n poisto)
 *
 * 2015-03-10: säännöllinen lauseke ja koodi korjattu kattamaan tapaus "ISBN (sid.) :".
 * Test caset 2160307 ja 109698 (ei isbn:ää) ok (korjattu II/2160225)
 */

define([
	"core/RecordModel",
	"core/Validation",
	"core/L",
	], function (RecordModel, Validation, L) {
		"use strict";

		var debug = 1;


		//var RegExpQualifyingInformation = /^((.*\S) *)?\((.*)\)$/;
		var RegExpQualifyingInformation = /^((.*\S) *)?\((.*)\)( :)?$/;

		function _QI_proceedAndGetParts(recordModel, field) {
			if ( field.tag == '020' || field.tag == '024' || field.tag == '028' ) {
				var a = recordModel.getSubfieldByCode(field,"a");
				if ( a ) {
					return RegExpQualifyingInformation.exec(a.content);	
				}
			}
			return null;
		}

		function validate(recordModel, field) {
			var results = _QI_proceedAndGetParts(recordModel, field);
			if ( !results ) { return null; }
		
			var myQualifyingInformation = results[3];
		
			var msg = '';


			if ( results[2] === undefined &&
				// !recordModel.getSubfieldByCode(field, "c") &&
				!recordModel.getSubfieldByCode(field, "z") ) {
				msg += "No ISBN and no #z. The field " + field.tag + "/" + RecordModel.fieldToString(field) + " can/should be deleted!";
				return Validation.warning(msg, [{
					name: "Delete "+field.tag,
					description: "Delete "+field.tag+" from the record"
				}]);	
			}


			// Sanity check: If subfield #q already exists, just give guidance.
			if ( recordModel.getSubfieldByCode(field,"q") ) {
				msg += 'Qualifying information "' + myQualifyingInformation + '" in field ' + field.tag + "#a belongs to a subfield #q. As #q already exists, you need to fix this manually.";
				return Validation.warning(msg);	
			}

			msg = 'Qualifying information "' + myQualifyingInformation + '" in field ' + field.tag + "#a.";

			// Default behavior: offer to fix it:
			msg += " Move it to a new subfield q.";

			//L.info(msg);
			return Validation.warning(msg, [{
				name: "Move qualifying information to #q",
				description: "Move qualifying information from "+field.tag+"#a to #q"
			}]);
		}


		function fix (action, recordModel, field, i) {
			//console.info("QualifyingInformation.fix()");
			var results = _QI_proceedAndGetParts(recordModel, field);
			if ( results ) {
				var a = recordModel.getSubfieldByCode(field,"a");
				if ( a ) {
					if ( results[2] === undefined ) { // a-kentän uusi sisältö on tyhjä (results[4] on irrelevantti)
						if ( recordModel.getSubfieldByCode(field, "z")  ) {
							console.info("Qualifiying information.js, fix():");
							console.info(" "+RecordModel.fieldToString(field)+" =>");
							recordModel.deleteSubfield(field, a);
							field.subfields.push(recordModel.createSubfield("q", results[3])); // "sid." tms.
							console.info(" "+RecordModel.fieldToString(field));
						} else {

							console.info("Qualifiying information.js, fix(): Delete "+field.tag);
							recordModel.deleteField(field);
						}
					} else {
						console.info("Qualifiying information.js, fix():");
						console.info(" "+RecordModel.fieldToString(field)+" =>");
						a.content = results[2]; // a-kentän sisältö ilman "(sid.)"-osaa
						if ( results[4] !== undefined ) {
							a.content += results[4]; // Lisää loppuun " :"
						}
						field.subfields.push(recordModel.createSubfield("q", results[3])); // "sid." tms.
						console.info(" "+RecordModel.fieldToString(field));
					}		
					recordModel.trigger('change');
					return 1;
				}
			}
			return 0;
		}

		Validation.registerValidatorBundle(
			"QualifyingInformation",
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
