/*
 * IndicatorSubfield.js
 *
 * Copyright (c) 201x Kansalliskirjasto
 * All Rights Reserved.
 *
 * Mintun speksaama indikaattorien ja loppumerkkien välisten riippuvuuksien
 * validaattori
 */


define([
    "core/Validation",
    "core/L",
    "underscore"

    ], function (Validation,L,_) {
    
    var rules = {

        "650":{
            1:{ },
            2:{
                7: {mustHave:"2"}
            }
        },

    };

    function validate(recordModel, field, index) {

        if (field.type != 'datafield') return;
        
        var sfSequence = _.pluck(field.subfields,'code').join("");
        
        var rule = rules[field.tag];

        if (!rule) return;

        /* validate for indicators 1 and 2. */
        for (var ind = 1; ind <= 2; ind ++) {

            var myRules = rule[ind] || {};
            var myValue = field["indicator"+ind];
            var myRule = myRules[myValue] || {};

            if (myRule.mustHave && sfSequence.indexOf(myRule.mustHave) == -1)
                return Validation.error("If indicator " + ind + " is " +
                    myValue + " in field " + field.tag +
                    ", the field must contain subfield " +
                    myRule.mustHave + ".");

        }

    }

    function fix (action, record, field, i) {

    }

    Validation.registerValidatorBundle(
        "IndicatorSubfields",
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
