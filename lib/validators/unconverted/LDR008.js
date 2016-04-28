/*
 * LDR008.js 
 *
 * Author: Juho?
 *
 * Checks that type of record LDR/6 and bibliographic level LDR/7 haven't changed.
 *
 */
define([
    "core/Validation",
    "core/RecordModel",
    "core/TagTable",
    "underscore"
    ], function (Validation, RecordModel, TagTable, _) {


    function validate(recordModel) {

        var recordType = recordModel.getRecordType();
        var dialect = recordModel.getDialect();

        var currentLDR = recordModel.getFieldByTag('LDR');
        var initialLDR = _.find(
            recordModel.get('_initialFields'),
            function (f) { return f.tag =='LDR'; } );

        if (!currentLDR || !initialLDR) return;
            
        var currentFormat = currentLDR.content.substring(6,8);
        var initialFormat = initialLDR.content.substring(6,8);

        if (currentFormat == initialFormat) return;
        // This is wrong! Validation should not do anything!
        return Validation.warning( "Record format has been changed from " +
            initialFormat + " to " + currentFormat +
            ". Ensure that 008 is still valid.");

    }

    function fix (action, record, field, i) {

    }

    Validation.registerValidatorBundle(
        "LDR008",
        validate,
        fix,
        'record');

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
