/* jshint node:true */
/*
 * KeywordSorter.js - sort 650 (and other?) fields according to the Lexicon.
 *
 * Copyright (c) 2014 Kansalliskirjasto.
 * All Rights Reserved.
 *
 * Author(s): Nicholas Volk (nicholas.volk@helsinki.fi)
 *
 * Sort 650 fields on the basis of lexicon (indicator2=7). Put YSA first, Allars second,
 * and the rest in alphabetical order. We might do other fields (other than 650) as well
 * in the future.
 * 
 * We could also sort key words alphabetically in each lexicon here.
 * Already supported by the code, but currently always inactive.
 * We don't dare to do it as some orders are meaningful. (Ulla, Minttu)
 *
 * NB! To sort 650's all the other fields will be sorted as well.
 */

define([
	"core/Validation",
	"core/RecordModel"
	], function (Validation, RecordModel) {
	"use strict";

	var debug = 1;

	var keywordSortTags = {
		//"648" : true,
		"650" : true,
		//"651" : true,
		//"654" : true,
		//"655" : true,
		//"656" : true,
		//"657" : true,
		//"658" : true,
		//"662" : true,
	};

	// legal indicator2 values [0-7] in their preference order
	// ind2 value 7 comes first, then the rest...
	var asiasanasto650_i2s = [ '7', '0', '1', '2', '3', '4', '5', '6' ];

	var warn_once = [];

	function lexiconNameValue(field) {
		// return value: the smaller, the better
		var sf2 = RecordModel.getSubfieldByCode(field,"2");
		if ( !sf2 ) { return 10000; } // Big Bad Number
		if ( sf2.content == 'ysa') { return 1; }
		if ( sf2.content == 'allars') { return 2; }
		if ( sf2.content == 'musa') { return 3; }
		if ( sf2.content == 'cilla') { return 4; }
		if ( !warn_once[sf2.content] ) {
			warn_once[sf2.content] = 1;
			if ( debug ) {
				// console.info("KeywordSorter: lexicon "+sf2.content+" has no priority. Using alphabetical order.");
			}
		}
		return 9999; 
	}

/*
	function fieldCompare(f1, f2) {
		// we hope that f1.tag == f2.tag (typically 650)
		var tmp1 = asiasanasto650_i2s.indexOf(f1.indicator2);
		var tmp2 = asiasanasto650_i2s.indexOf(f2.indicator2);
		// Illegal indicator2 (should be handled by someone else):
		if ( tmp1 == -1 || tmp2 == -1 ) { return 0; }

		// Different indicator2:
		if ( tmp1 < tmp2 ) { return -1; }
		if ( tmp1 > tmp2 ) { return 1; }

		// Different subfield 2:
		tmp1 = lexiconNameValue(f1);
		tmp2 = lexiconNameValue(f2);

		if ( tmp1 < tmp2 ) { return -1; }
		if ( tmp1 > tmp2 ) { return 1; }

		// Alphabetically sort keywords (subfield #a):
		if ( 0 ) {
			// Järjestys saattaa olla merkitsevä.
			// Tosin loadit rikkovat järjestystä, jne.
			tmp1 = RecordModel.getSubfieldByCode(f1,"a");
			tmp2 = RecordModel.getSubfieldByCode(f2,"a");
			if ( tmp1 < tmp2 ) { return -1; }
			if ( tmp1 > tmp2 ) { return 1; }
		}

		return 0;
	}
*/

	function _getPreviousField(recordModel, index) { // non-recursive version
		while ( index > 0 ) {
			index--;
			var prevField = recordModel.getFieldByIndex(index);
			if ( prevField && prevField.tag !== undefined ) { return prevField; }
		}
		return null;
	}

	function needsFixing(recordModel, field, index) {
		if ( field.tag === undefined ) { return 0; }

		if (!keywordSortTags[field.tag]) { return 0; }

		var prev = _getPreviousField(recordModel, index);

		if (prev === null) return 0;

		// Laita 655-650 menemään oikein, eli tätä ei saa käyttää:
		// if (prev.tag == field.tag) { return 0; }

		if ( RecordModel.fieldCmp(prev, field) <= 0 ) { return 0; }

		return 1;
	}


	function validate(recordModel, field, index) {
		if ( !needsFixing(recordModel, field, index) ) { return null; }

		var prev = _getPreviousField(recordModel, index);
		var tmp1sfa = recordModel.getSubfieldByCode(field,"a");
		var tmp1sf2 = recordModel.getSubfieldByCode(field,"2");
		var tmp2sfa = recordModel.getSubfieldByCode(prev,"a");
		var tmp2sf2 = recordModel.getSubfieldByCode(prev,"2");

		var msg = "Field " + field.tag + " " + ( tmp1sfa ? tmp1sfa.content : '' ) + "/" +
		( tmp1sf2 ? tmp1sf2.content : "IND2=" + field.indicator2 ) +
		" should be before " + prev.tag + " " + ( tmp2sfa ? tmp2sfa.content : '' ) + "/" +
		( tmp2sf2 ? tmp2sf2.content : "IND2=" + prev.indicator2 );
		return Validation.warning(msg, [{
				name: "Sort keywords",
				description: "Sort keywords (field "+field.tag+") (and everything else) to preferred order"
			}]);

	}



	function fix (action, record, field, i) {
		/*
		function fieldCmp (f1,f2) {
			if ( f1.tag == f2.tag && keywordSortTags[f1.tag] ) {
				return fieldCompare(f1, f2);
			}
			return RecordModel.fieldCmp(f1,f2);
		}
*/
		if ( needsFixing(record, field, i) ) {
			// Vaihda kentän ja sitä edeltävän kentän paikkaa..			
			if ( debug ) {
				console.info("KeywordSorter.js, fix(): sort the whole record");
			}

			var fields = record.getFields();
			//fields.sort(fieldCmp);
			fields.sort(RecordModel.fieldCmp);
			record.setFields(fields, 0);

			record.trigger('change');
			return 1;
		}
		return 0;
	}


	Validation.registerValidatorBundle(
		"KeywordSorter",
		validate,
		fix,
		'field-global');

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
