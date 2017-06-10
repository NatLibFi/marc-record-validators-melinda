/*
 * RemoveDuplicate500.js -- LINDA-3272: remove 500 if similar 550 or 588 exists
 * 
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * @author: Nicholas Volk <nicholas.volk@helsinki.fi>
 *
 * Test case 2563103:
 *
 *   500   L $$aKuvailun perusta: Nimeke nimiönäytöstä.
 *   588   L $$aKuvailun perusta: Nimeke nimiönäytöstä.
 *
 * Test case 3997889:
 *   500   L $$aKustantaja myöhemmin: Suomen lakimiesliitto - Finlands juristförbund r.y.
 *   550   L $$aKustantaja myöhemmin: Suomen lakimiesliitto - Finlands juristförbund r.y.$$9FENNI<KEEP>

 */

define([
	"core/RecordModel",
    "core/Validation"
	], function (RecordModel, Validation) {
	"use strict";

	var debug = 1;

	function containsField(recordModel, tag, content) {
		var fields = recordModel.getFieldsByTag(tag);
		for (var i in fields) {
			var field = fields[i];
			var content2 = RecordModel.fieldToString(field);
			if ( content == content2 ) {
				return 1;
			}
			// If 500's content is otherwise same but 500 lacks $9 tag (q&d version):
			var content_sep = content + "\x1F9";
			if ( content2.indexOf(content_sep) == 0 ) {
				return 1;
			}
		}
		return 0;
	}

	function needsAction(recordModel, field) {
		if ( field.tag != '500' ) { return 0; }

		var content = RecordModel.fieldToString(field);

		if ( containsField(recordModel, '550', content) ) { return 1; }
		if ( containsField(recordModel, '588', content) ) { return 1; }
		return 0;
	}	

    function validate(recordModel, field) {
		if ( needsAction(recordModel, field) ) {
			var msg = "Duplicate field 500 can be removed";

			return Validation.warning(msg, [{
				name: "Duplicate 500",
				description: msg
			}]);
		}
		return null;
    }



    function fix (action, record, field, i) {
		if ( needsAction(record, field) ) {
			if ( debug ) {
				console.info("RemoveDuplicate500.js: removed "+ RecordModel.fieldToString(field));
			}
			record.deleteField(field);
			record.trigger('change');
			return 1;
		}
		return 0;
    }

    Validation.registerValidatorBundle(
        "RemoveDuplicate500",
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
