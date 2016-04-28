define([
    "core/Validation",
    ], function (Validation) {

    function validate(recordModel, field) {

        if (recordModel.get('unsaved')) {

            return {
                type: "operational",
                message: "Record contains unsaved changes.",
                actions: [{
                    name: "Revert changes",
                    description: "Change document back to original."
                }]
            };

        } 
        
        return null;

    }

    function fix (action,recordModel,field,i) {

        recordModel.setFields(recordModel.get('_initialFields'), 1);

    }

    Validation.registerValidatorBundle(
        "DirtyIndicatory",
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
