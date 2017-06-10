/*
 * SuspiciousUTF8 -- locate (and fix?) suspicious-looking UTF-8 stuff
 * 
 * Copyright (c) Kansalliskirjasto 2014
 * All Rights Reserved.
 *
 * @author(s): Nicholas Volk, nicholas.volk@helsinki.fi
 *
 * TODO: test case? proper corruption detection! This is really quick and dirty
 */

define([
    "core/Validation"
	], function (Validation, L) {

	var checkList = JSON.parse('[{"tag":"650", "subfields": ["a"]}]');

	var corrupted = JSON.parse('[{"wrong":"Ã¤", "right":"ä"}, {"wrong":"Ã¶", "right":"ö"}]');


	function hasCorruption(str) {
		for ( var i=0; i < corrupted.length; i++ ) {
			if ( str.indexOf(corrupted[i].wrong) > -1 ) {
				return 1;
			}
		}
		return 0;
	}
		

    function validate(recordModel, field) {
		for ( var i=0; i < checkList.length; i++) {
			var target = checkList[i];
			if ( field.tag == target.tag ) {
				for ( var j = 0; j < target.subfields.length; j++ ) {
					var subfieldCode = target.subfields[j];
					var subfield =recordModel.getSubfieldByCode(field, subfieldCode);
					// The list is far from conclusive
					// ä = 'Ã¤', ö = 'Ã¶''
					if ( subfield && hasCorruption(subfield.content) ) {

						var msg = "Suspicious (corrupted UTF-8?) " +target.tag+subfieldCode+": '" + subfield.content+"'";
						msg += "(might be: '" + fix2(subfield.content+"')");
						return Validation.warning(msg, [{
							name: "UTF-8-ify "+target.tag+subfieldCode,
							description: "UTF-8-ify "+target.tag+subfieldCode
						}]);
					}
				}
			}
		}
		return null;

    }

    function fix2(str) {
		for ( var i=0; i < corrupted.length; i++ ) {
			str = str.replace(corrupted[i].wrong, corrupted[i].right);
		}
		return str;
    }


    function fix (action, recordModel, field, field_idx) {
		var mods = 0;
		for ( var i=0; i < checkList.length; i++) {
			var target = checkList[i];
			if ( field.tag == target.tag ) {
				for ( var j = 0; j < target.subfields.length; j++ ) {
					var subfieldCode = target.subfields[j];
					var subfield =recordModel.getSubfieldByCode(field, subfieldCode);
					// The list is far from conclusive
					// ä = 'Ã¤', ö = 'Ã¶''
					if ( subfield ) { // kai tänne tulee vain ihan oikeita kenttiä
						subfield.content = fix2(subfield.content);
						recordModel.trigger('change');
					}
				}
			}
		}
    }

    Validation.registerValidatorBundle(
        "SuspiciousUTF8",
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
