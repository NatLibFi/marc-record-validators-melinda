define([
    "underscore",
    "core/Validation",
], function (_, Validation) {
    "use strict";

    var conf = {
        "130": "indicator1",
        "630": "indicator1",
        "730": "indicator1",
        "740": "indicator1",
        "222": "indicator2",
        "240": "indicator2",
        "242": "indicator2",
        "243": "indicator2",
        "245": "indicator2",
        "440": "indicator2",
        "830": "indicator2"
    };
    var okFilingRE = new RegExp('^[\\w]');

    function validate(recordModel, field) {

        var indicatorKey = conf[field.tag];

        if (indicatorKey !== undefined) {

            var skip = parseInt(field[indicatorKey]);

            if (skip) {

                var contents = _.pluck(field.subfields,'content');
                var asText = contents.join(" ");
                var filing = asText.substring(skip);
                var ok = okFilingRE.exec(filing) ? true : false;

                return {
                    type: ok ? "info" : "warning",
                    message: "Filing form: \"" + filing + "\""
                };

            }

        }

    }

    function fix () {

    }

    Validation.registerValidatorBundle(
        "NonFilingCharacters",
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
