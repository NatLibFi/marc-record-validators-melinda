define([
    "core/Validation",
    "core/TagTable"
    ], function (Validation, TagTable) {

    function validate(recordModel, field, index) {

        var desc = TagTable.getTag(
            recordModel.getDialect(),recordModel.getRecordType(),field.tag);

        if (desc.repeatable !== false) return; // also skip undefineds

        var fields = recordModel.getFieldsByTag(field.tag);

        if (fields.length > 1) return Validation.error(
            'This field is not repeatable.');

    }

    function fix (action, record, field, i) {


    }

    Validation.registerValidatorBundle(
        "NonRepeatableFields",
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
