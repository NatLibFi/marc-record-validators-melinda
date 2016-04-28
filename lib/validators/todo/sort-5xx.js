/* jshint node:true */
/*
 * Sort5XX.js - sord records with unsorted 5XX fields.
 *
 * Copyright (c) 2015 Kansalliskirjasto.
 * All Rights Reserved.
 *
 * For each 5XX field compare tag with previous tag.
 * If previous tag should come earlier, then sort the *whole* record.
 *
 * Uh, same record (different fields) can trigger sorting multiple times.
 * Variable prev001 handles that.
 *
 * Author(s): Nicholas Volk (nicholas.volk@helsinki.fi)
 *
 * Test record (production): 301
 */

 dont_use_this_anymore(); // global sorting will be done to all modified records...

define([
	"core/Validation",
	"core/RecordModel"
	], function (Validation, RecordModel) {
	"use strict";

	var debug = 1;

    var prev001 = null;

	function _getPreviousField(recordModel, index) {
		// Not sure why we have the loop. The original gPF() had (recursive version of) it.
		while ( index > 0 ) {
			index--;
			var prevField = recordModel.getFieldByIndex(index);
			if ( prevField && prevField.tag !== undefined ) { return prevField; }
		}
		return null;
	}

	function _getNextField(recordModel, index) {
		// Simplified version. I'm not too interested in having the loop.
		index++;
		var nextField = recordModel.getFieldByIndex(index);
		if ( nextField && nextField.tag !== undefined ) { return nextField; }
		return null;
	}

	function needsFixing(recordModel, field, index) {
		if ( field.tag === undefined || isNaN(field.tag) ) { return 0; }

		var new001 = recordModel.getFieldByTag('001');
/* Tällainen virhe ollaan nähty pari kertaa:

Processing record 3953869
error: [TypeError: Cannot read property 'type' of undefined] TypeError: Cannot read property 'type' of undefined
    at Object.equalField (/home/nvolk/git5/luettelointi/ui/core/RecordModel.js:912:18)
    at needsFixing (/home/nvolk/git5/luettelointi/ui/validators/Sort5XX.js:51:31)

Sama tietue menee tosin ok seuraavalla yrityksellä...
*/
		if ( !new001 ) {
			//console.info("001 is "+new001); // undefined?
			if ( !prev001 ) {
				return 0;
			}
		}
		if ( prev001 && new001 && RecordModel.equalField(prev001, new001) ) {
			return 0;
		}

		if ( Math.floor(parseInt(field.tag) / 100) != 5 ) {  return 0; }

		var prev = _getPreviousField(recordModel, index);
		if (prev !== null && RecordModel.fieldCmp(prev, field) > 0 ) {
			if ( debug ) { console.info(field.tag + " vs " + prev.tag + " (TEST1)"); }
			return 1;
		}

		var next = _getNextField(recordModel, index);
		if (next !== null && RecordModel.fieldCmp(field, next) > 0 ) {
			if ( debug ) { console.info(field.tag + " vs " + next.tag + " (TEST2)"); }
			return 1;
		}

		return 0;
	}


	function validate(recordModel, field, index) {
		if ( !needsFixing(recordModel, field, index) ) { return null; }

		return Validation.warning("Sort the whole record as there are unordered 5XXs", [{
				name: "Sort record",
				description: "Sort the whole record as there are unordered 5XXs"
			}]);

	}



	function fix (action, record, field, i) {

		if ( needsFixing(record, field, i) ) {
			var new001 = record.getFieldByTag('001');
			// Vaihda kentän ja sitä edeltävän kentän paikkaa..			
			if ( debug ) {
				console.info("Sort5XX.js, fix(): sort the whole record");
			}

			var fields = record.getFields();
			//fields.sort(fieldCmp);
			fields.sort(RecordModel.fieldCmp);
			record.setFields(fields, 0);

			record.trigger('change');
			prev001 = new001;
			return 1;
		}
		return 0;
	}


	Validation.registerValidatorBundle(
		"Sort5XX",
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
