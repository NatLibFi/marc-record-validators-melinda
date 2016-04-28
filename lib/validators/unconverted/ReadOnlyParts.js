/*
 * www.kansalliskirjasto.fi/extra/marc21/LOPPUPISTEET.pdf
 */


define([
    "core/Validation",
    "core/TagTable"
    ], function (Validation,TagTable) {
        "use strict";
    
    function validate(recordModel, field, index) {

        var initial = {};
        var i;
        
        if (field.type != 'controlfield') return;
        
        var initialFields = recordModel.get('_initialFields');
        for (i in initialFields) {
            initial = initialFields[i];
            if (initial.tag == field.tag) break;
        }

        if (initial.tag != field.tag) { initial = {content:""}; }

        var positions = TagTable.getFieldStructPositions(
            recordModel.getDialect(),
            recordModel.getRecordType(),
            field.tag,
            field._format);

        for (i in positions) {

            var pos = positions[i];

            if (!pos.readOnly) { continue; }

            if (pos.ignoreValue) { continue; }

            var end = pos.charPos + pos.length;
            var initialPart = initial.content.substring(pos.charPos,end);
            var cur = field.content.substring(pos.charPos,end);

            if (initialPart != cur) {

                var msg = "Read only part " + pos.charPos + "-" + end +
                    " changed from " + initialPart;
                var actions = [{
                    name: "Revert",
                    action: i,
                    description: "Change read-only part back to original."
                }];

                return Validation.error(msg,actions);

            }

        }

    }


    function fix (action, recordModel, field, index) {

        var positions = TagTable.getFieldStructPositions(
            recordModel.getDialect(),
            recordModel.getRecordType(),
            field.tag,
            field._format);

        var pos = positions[action];
        var initial = recordModel.get('_initialFields')[index];
        var end = pos.charPos + pos.length;
        field.content = field.content.substring(0,pos.charPos) +
            initial.content.substring(pos.charPos,end) +
            field.content.substring(end);
        recordModel.replaceField(field);

    }

    Validation.registerValidatorBundle(
        "ReadOnlyParts",
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
