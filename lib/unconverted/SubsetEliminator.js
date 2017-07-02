/*
 * SubsetEliminator.js - detect and remove fields that are subsets of "sister" fields
 *
 * Copyright (c) 2014 Kansalliskirjasto
 * All Rights Reserved.
 *
 * Author(s): Nicholas Volk (nicholas.volk@helsinki.fi)
 *
 *
 */

/*
Processing record 80702 
0:  ^_aDiss.^_cLinköpings univ.
1:  ^_aDiss.

Processing record 81052
0:  ^_aDiss.^_cStockholms univ.
1:  ^_aDiss.^_cStockholms universitet^_d1984.

Processing record 82164 
0:  ^_aDiss.^_cUniversitetet i Bergen^_d1993.
1:  ^_aDiss.^_d1993.


Processing record 82791 
0:  ^_aDiss.
1:  ^_aDiss.^_cJyväskylän yliopisto.^_9FENNI<KEEP>
2:  ^_aVäitösk. :^_cJyväskylän yliopisto,^_d1993.

* Tämä pitää tehdä uudelleen välille 1-80000...

*/
define([
    "core/Validation",
    "core/RecordModel"
    ], function (Validation, RecordModel) {
	"use strict";

	var debug = 1;

	var fieldSet = [ "502", '648', '650', '651', '653', '655' ];	
	//var fieldSet = [ "502", '648', '650', '651', '653', '655' ]; // , "506" ];
	// 650: asiasanamuutokset (nvolk: otin pois 12.12.2015)

	function skipField(field) {
		for (var i in field.subfields) {
			// Jos $5 KANTA tai $5 ISIL-TUNNUS niin pelataan varman päälle ja skipataan
			if ( field.subfields[i].code === '5' ) {
				return 1;
			}
			// Jos $9 .*<DROP> niin pelataan varman päälle ja skipataan
			if ( field.subfields[i].code === '9' && field.subfields[i].content.indexOf("<DROP>") >= 0 ) {
				return 1;
			}
		}
		return 0;
	}

	function isSubset(record, field) {
		// Returns 1 if the field is a subset of some other otherwise identical field, or
		// if field is identical with an earlier field.

		if ( fieldSet.indexOf(""+field.tag) === -1 ) {
			return 0;
		} 
		var fields = record.getFieldsByTag(field.tag);

		if ( fields.length < 1 ) {
			return 0;
		}

		// Etsi oman kentän sijainti
		var my_pos = -1;
		for ( var i=0; i < fields.length; i++ ) {
			if ( fields[i] === field ) {
				my_pos = i;
				break;
			}
		}

		var skipArr = [];
		for ( var i=0; i < fields.length; i++ ) {
			skipArr[i] = skipField(fields[i]);
		}

		for ( var i=0; i < fields.length; i++ ) {
			if ( i !== my_pos && !skipArr[i] ) {
				// Subset of another field
				if ( RecordModel.field1IsProperSubsetOfField2(field, fields[i]) ) {
					//console.info("hit1");
					//console.info(fields[i]);
					return fields[i];
				}
				// Identical with an earlier field
				else if ( i < my_pos && RecordModel.equalField(field, fields[i]) ) {
					//console.info("hit2");
					return fields[i];
				}
			}
		}
		
		return 0;
	}


	function validate(record, field) {

		if ( isSubset(record, field) ) {
			//console.info("SUBSET FOUND");
			var msg = "Removable subset: "+RecordModel.fieldToString(field);
			if ( debug ) { console.info(msg); }
			return Validation.warning(msg, [{
				name: msg,
				description: msg
			}]);
		}
	}

	function fix (action, record, field, i) {
		var parentField = isSubset(record, field);
		if ( parentField ) {
			if ( debug ) {
				console.info("SubsetEliminator.js: remove "+field.tag+" "+RecordModel.fieldToString(field)+"(has '"+RecordModel.fieldToString(parentField)+"')");
			}
			record.deleteField(field);
			record.trigger('change');
			return 1;
		}
		return 0;
    }


     Validation.registerValidatorBundle(
        "SubsetEliminator",
        validate,
        fix,
        'field');

});/**
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
