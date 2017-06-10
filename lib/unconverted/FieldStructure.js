/*
 * FieldStructure.js 
 * 
 * Copyright (c) 201x Kansalliskirjasto
 * All Rikghts Reserved.
 *
 * Auhtor: Juho?
 *
 * Nvolk's notes: todo: figure out what this script does. Validation only.
 */
define([
    "core/Validation",
    "core/RecordModel",
    "core/TagTable"
    ], function (Validation, RecordModel, TagTable) {


    function validate(recordModel, field) {

        var recordType = recordModel.getRecordType();
        var dialect = recordModel.getDialect();
        var i;

        if (field.type == 'garbage') {

            return Validation.error( "\"" +
                field.content + "\" is not valid MARC21");

        } 
        
        if (!TagTable.validTag(dialect,recordType,field.tag)) {

            return Validation.error(field.tag + " is not a valid tag");

        }

        if (field.type == 'controlfield') {

            var struct = TagTable.getFieldStructure(dialect,recordType,
                field.tag,field._format);
            var l = struct.length;
            var positions = struct.positions || {};

            if (l !== undefined && field.content.length != l)
                return Validation.error( "This field should be " + l +
                    " characters long, not " + field.content.length +
                    ".");

            for (i in positions) {

                var pos = positions[i];
                var myValue = field.content.substring(
                    pos.charPos,pos.charPos + pos.length);
                var menu = TagTable.getMenuAt(dialect,recordType,
                    field.tag,field._format,pos.charPos);
                myValue = stripTailEmpties(myValue,RecordModel.emptyChar);

                if (!menu || menu[myValue]) continue;

                var msg = "\"" + myValue +
                    "\" is not allowed at character position " + pos.charPos;

                return Validation.error(msg);

            }

        } else {

            var subfieldInfo = TagTable.getSubfieldInfo(
                dialect,recordType,field.tag);

            for (i in field.subfields) {

                var code = field.subfields[i].code;

                if (subfieldInfo[code] === undefined) {

                    return Validation.error(code +
                        " is not a valid subfield for field " +
                        field.tag);

                }

            }

        }

        for (var ind = 1; ind <= 2 ; ind ++) {

            var d = TagTable.getIndicatorDescriptions(
                dialect,recordType,field.tag,ind);
            var val = TagTable.normalizeIndicatorValue(
                ind == 1 ? field.indicator1 : field.indicator2);

            if (val && d.values[val] === undefined) return Validation.error(
                "\"" + val + "\" is not a valid value for indicator " +
                ind + " here.");

        }

        return null;

    }

    function fix () {

    }

    function stripTailEmpties(s,emptyChar) {

        while (s.length > 1 && s[s.length-1] == emptyChar) {

            s = s.substring(0,s.length-1);

        }

        return s;

    }

    Validation.registerValidatorBundle(
        "FieldStructure",
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
