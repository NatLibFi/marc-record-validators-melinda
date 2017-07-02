define([
    "jquery",
    "core/Validation",
    "core/RecordModel"
    ], function ($, Validation, RecordModel) {
    "use strict";

    /**
     * Checks record against aleph x-server
     *
     * NOTE! CHK-DOC function will save the record, if there are no errors
     * 
     * @param  RecordModel recordModel
     * @param  Object      field
     * @param  int         index
     * @return ValidationMessage
     */
    function validate(recordModel, field, index, cb) {
    
        window.recordModel = recordModel;
        console.log("ding");
        setTimeout(function() {
            //cb(Validation.warning("Error while querying Aleph."));
            cb(null);
      
        }, 1000);
        
        return Validation.pending("Validating...");
    }

    function convertToAlephXML(xml) {

        var e = $(xml).find('controlfield[tag="001"]').get(0);

        if (!e) return xml;

        var l = e.textContent.length;

        if (l != 13) throw 'Invalid bib id length (' + l + ')';

        e.textContent = e.textContent.substring(4);

        return xml;
        
    }


    function fix (action, record, field, i) {

    }

    Validation.registerValidatorBundle(
        "AlephCheck",
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
