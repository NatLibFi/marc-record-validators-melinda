/*
 * FieldOrder.js - order fields based on their [0-9]{3} and/or [A-Z]{3}
 *
 * Copyright (c) 201x-2015 Kansalliskirjasto
 * All Rights Reserved.
 *
 * Author(s): Juho Vuori (original author?)
 *
 * The order of fields is defined in RecordModel.js function tagCmp.
 */
define([
    "core/Validation",
    "core/RecordModel"
    ], function (Validation, RecordModel) {
    "use strict";

    /**
     * Compares field to its previous field, and whines if they are in wrong order.
     * 
     * @param  RecordModel recordModel
     * @param  Object      field
     * @param  int         index
     * @return ValidationMessage
     */
    function validate(recordModel, field, index) {

        if ((index === 0) || (field.tag) === undefined) { return null; }

        var prev = getPreviousField(index);

        if (prev === null) return null;

        if (RecordModel.tagCmp (field.tag, prev.tag) >= 0) return null;

        var msg = "Field " + field.tag + " should be before " + prev.tag;

        return Validation.warning(msg, [{
                name: "Sort fields",
                description: "Sort fields of the record to preferred format"
            }]);

        function getPreviousField(index) { // non-recursive version
            while ( index > 0 ) {
                index--;
                var prevField = recordModel.getFieldByIndex(index);
                if ( prevField && prevField.tag !== undefined ) { return prevField; }
            }
            return null;
        }

        /*
        function getPreviousField(index) {

            if (index <= 0) return null;

            var field = recordModel.getFieldByIndex(index-1);   

            if (!field || field.tag === undefined) return getPreviousField(index - 1);

            return field;

        }
        */
        
    }

    function fix (action, record, field, i) {
        var fields = record.getFields();
        fields.sort(RecordModel.fieldCmp);
        record.setFields(fields, 0);
    }

    Validation.registerValidatorBundle(
        "FieldOrder",
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
