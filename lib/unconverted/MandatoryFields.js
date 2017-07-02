define([
    "core/Validation",
    "core/TagTable",
    "underscore"
    ], function (Validation, TagTable, _) {

    function validate(recordModel) {

        var tags = TagTable.getMandatoryTags(
            recordModel.getDialect(), recordModel.getRecordType());
        var missing = _.filter(tags, function (tag) {

            return recordModel.getFieldByTag(tag) === undefined;

        });

        if (missing.length > 0) {
            
            var joined = missing.join(", ");
            var mstr = (missing.length > 1 ? "fields " : "field ") + joined;

            return Validation.error("Record does not contain mandatory " +
                mstr);

        }

    }

    function fix (action, record, field, i) {

    }

    Validation.registerValidatorBundle(
        "MandatoryFields",
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
