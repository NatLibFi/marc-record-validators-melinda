/*
 * YearsMatch.js - compare year information in 008 and 260. Validation only.
 *
 * Copyright (c) 201x Kansalliskirjasto
 * All Rights Reserved.
 * 
 * Author(s): Juho?
 *
 */
define([
    "core/Validation",
    ], function (Validation) {

    var REyear = /[0-9]{4}/;

    function validate(recordModel, field) {

        if (field.tag == '260') {
            var f008 = recordModel.getFieldByTag("008");

            if (!f008) return;

            var year1 = f008.content.substring(7,11);
            var year2 = f008.content.substring(11,15);

            for (var i in field.subfields) {

                var sf = field.subfields[i];
                
                if (sf.code != "c") continue;

                var myYears = sf.content.match(REyear);

                if (!myYears) return Validation.warning(
                    "No valid year recognised in subfield c");

                for (var j = 0; j < myYears.length; j++) {
                    
                    if (year1 == myYears[j] || year2 == myYears[j]) continue;

                    return Validation.warning("Year " + myYears[j] +
                        " in subfield c was not found in control" +
                        " field 008.");

                }

            }

        } 

        return null;
        
    }


    function fix () {

    }

    Validation.registerValidatorBundle(
        "YearsMatch",
        validate,
        fix,
        'field-global');

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
