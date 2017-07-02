/*
 *
 * 080udk -- remove "udk" from 080 $a
 * 
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * @author: Nicholas Volk, nicholas.volk@helsinki.fi
 */

define([
	"core/RecordModel",
	"core/Validation",
	"core/L",
	], function (RecordModel, Validation, L) {
		"use strict";

		var debug = 1;


		function cleanup(str) {
			str = str.replace(/([0-9]) ?UDK$/, '$1');
			str = str.replace(/^[Uu][Dd][Kk][:\.; ]*([0-9])/, '$1');
			return str;
		}

		function requiresAction(recordModel, field) {
			if ( field.tag !== '080' ) { return 0; }

			var a = recordModel.getSubfieldByCode(field, "a");

			if ( !a ) { return 0; }

			var after = cleanup(a.content);
			if ( after !== a.content ) {
				return 1;
			}
			// console.info("080$a '"+after+"' failed");
			return 0;
		}

		function validate(recordModel, field) {
			var result = requiresAction(recordModel, field);
			if ( !result ) { return null; }
		

			var msg = '080: removable UDK';

			return Validation.warning(msg, [{
				name: msg,
				description: msg
			}]);
		}


		function fix (action, recordModel, field, i) {
			var result = requiresAction(recordModel, field);
			if ( result ) {
				var a = recordModel.getSubfieldByCode(field,"a");
				var modified = cleanup(a.content);
				if ( a.content !== modified ) {
					if ( debug ) {
						console.info("080udk fixer: "+a.content+" => "+modified);
					}
					a.content = modified;
					recordModel.trigger('change');
					return 1;
				}
			}
			return 0;
		}

		Validation.registerValidatorBundle(
			"080udk",
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
