/*
 * ExpandFunctionKuv.js -- Expand "kuv." as "kuvittaja."" or "kuvaaja.""
 * 
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * @author: Nicholas Volk, nicholas.volk@helsinki.fi
 *
 * 219816: kuv => kuvittaja works
 * 6205757: kuv => kuvaaja exception works
 *
 * 2015-03-25: added final '.'-magic.
 *
 *
 * Näiden kahden virheen korjaaminen tuskin maksaa vaivaa (niin harvinaisia, että korjaa käsin nopeammin):
 * TODO: lisää pilkkutuki useammalle e-osakentälle (tee vain jos aito esimerkki tulee vastaan)
 * TODO: lisää useamman osakentän tuki (tee vain jos aito case tulee vastaan)
 */

define([
	"core/RecordModel",
	"core/Validation",
	], function (RecordModel, Validation) {
		var debug = 1;

		var fields = [  { f: '100', sf: 'e'},
			{ f: '110', sf: 'e'},
			{ f: '600', sf: 'e'},
			{ f: '610', sf: 'e'},
			{ f: '700', sf: 'e'},
			{ f: '710', sf: 'e'},
			{ f: '111', sf: 'j'},
			{ f: '611', sf: 'j'},
			{ f: '711', sf: 'j'}
		];

		function requiresAction(record, field) {
			var i;
			for ( i=0; i < fields.length; i++ ) {
				if ( fields[i].f == field.tag ) {
					var sf = record.getSubfieldByCode(field, fields[i].sf);
					if ( sf && sf.content === "kuv.") {
						return i;
					}
				}
			}
			return -1;
		}




		function isKuvaaja(record) {
			var f007 = record.getFieldByTag('007');
			if ( f007 ) {
				var c0 = f007.content.substring(0,1);
				if ( c0 === 'm' || c0 === 'v' ) {
					return 1;
				}
			}
			return 0;
		}


		function validate(recordModel, field) {
			var result = requiresAction(recordModel, field);
			if ( result >= 0 ) {
				var kuv = "kuvittaja.";
				if ( isKuvaaja(recordModel ) ) { kuv = "kuvaaja."; }
				msg = "Normalize kuv. from "+field.tag+ " to "+kuv;
				if ( debug) { console.info(msg); }
				return Validation.warning(msg, [{
					name: msg,
					description: msg
				}]);

			}
			return null;
		}


		function fix (action, recordModel, field, i) {
			var result = requiresAction(recordModel, field);
			if ( result >= 0 ) {
				var sf = recordModel.getSubfieldByCode(field,fields[result].sf);
				var kuv = "kuvittaja.";
				if ( isKuvaaja(recordModel ) ) { kuv = "kuvaaja."; }
				if ( debug ) { console.info("ExpandFunctionKuv: kuv => " +kuv); }
				sf.content = kuv;
				recordModel.trigger('change');
				return 1;
			}

			return 0;
		}

		Validation.registerValidatorBundle(
			"ExpandFunctionKuv",
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
