/*
 * Identifiers.js -
 *
 * Copyright (c) 201x Kansalliskirjasto
 * All Rights Reserved.
 *
 * Validate ISBN and ISSN. Currently does minimal form validation, but
 * it could check the owner of the identifiers, etc also.
 *
 * Author: Juho Vuori, juho.vuori@helsinki.fi
 */


define([
    "core/Validation",
    "core/TagTable"
    ], function (Validation,TagTable) {

    
    var cached = {};

    var identifierTags = {
        '020': validateISBN,
        '022': validateISSN,
    };

    function cachedValidate(recordModel, field, index, cb) {

        var tag = field.tag;
        var sf = (recordModel.getSubfieldByCode(field,"a") || {}).content;
        var maxI = recordModel.getFields().length;

        if (!identifierTags[tag]) return;

        // search from cache
        for ( var key in cached ) {

            var c = cached[key];

            if (c && c.tag == tag && c.sf == sf) return c.res;

        }

        var res = validate (recordModel, field, index, function (res) {

            cached[index] = { tag: tag, sf: sf, res: res };
            cb(res);

        });

        if (res) return res;


    }

    function validate(recordModel, field, index, cb) {

        var sf = recordModel.getSubfieldByCode(field,"a");
        var f = identifierTags[field.tag];

        if (!sf || !f) return;

        return f(sf,cb);
        
    }

    function getDigits(s) {

        return s.replace(/[^0-9X]/g,"");

    }

    function validateISBN(sf,cb) {

        var s = getDigits(sf.content);
        var sum;

        if (s.length == 10) {

            sum = myChecksum(s);

            if (sum == s[9]) return;

            return Validation.error("ISBN checksum \"" + s[9] + "\" is wrong," +
                " should be " + sum);
            
        } else if (s.length == 13) {

            sum = myChecksum(s, true);

            if (sum == s[12]) return;

            return Validation.error("ISBN checksum \"" + s[12] + "\" is wrong," +
                " should be " + sum);

        } else {

            return Validation.error("Not a valid 10 or 13 digit ISBN: '"+sf.content+"'");
        }

    }

    function validateISSN(sf,cb) {

        var s = getDigits(sf.content);

        if (s.length == 8) {

            var sum = myChecksum(s);

            if (sum == s[7]) return;

            return Validation.error("ISSN checksum \"" + s[7] + "\" is wrong," +
                    " should be " + sum);
            
        } else {

            return Validation.error("Not a valid 8 digit ISSN.");

        }

    }

    function myChecksum(s,isbn13) {

        var l = s.length;
        var sum = 0;

        for (var i = 0; i < l - 1; i++) {

            var weight = isbn13 ? (i%2 ? 3 : 1) : l - i;
            sum = sum + weight * parseInt(s[i]);

        }

        if (isbn13) {
            
            sum = sum % 10;
            sum = sum ? 10 - sum : 0;

        } else {

            sum = sum % 11;
            sum = sum ? 11 - sum : 0;
            sum = sum == 10 ? 'X' : sum;

        }

        return sum;

    }

    function fix (action, recordModel, field, index) {

    }

    Validation.registerValidatorBundle(
        "Identifiers",
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
