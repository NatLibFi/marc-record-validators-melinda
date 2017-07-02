/*
 *
 * 020x2X.js -- change final x to X in an ISBN
 * 
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * @author: Nicholas Volk <nicholas.volk@helsinki.fi>
 * with load of open source (MIT) stuff from https://code.google.com/p/isbnjs/...
 *
 * TODO 020$a with value "123456789x :""
 */

define([
	"core/RecordModel",
	"core/Validation",
	"core/L",
	], function (RecordModel, Validation, L) {
		"use strict";


    var targets = [
      { field: '020', subfield:'a' },
      { field: '020', subfield:'z' },
      { field: '765', subfield:'z' },
      { field: '767', subfield:'z' },
      { field: '770', subfield:'z' },
      { field: '772', subfield:'z' },
      { field: '773', subfield:'z' },
      { field: '774', subfield:'z' },
      { field: '775', subfield:'z' },
      { field: '776', subfield:'z' },
      { field: '780', subfield:'z' },
      { field: '785', subfield:'z' },
      { field: '786', subfield:'z' },
      { field: '787', subfield:'z' },
    ];


		var debug = 1;

		
    var isbnish = /^([0-9]\-?){9}([0-9]\-?[0-9]\-?[0-9]\-?)?x$/;
    var isbnish020a = /^([0-9]\-?){9}([0-9]\-?[0-9]\-?[0-9]\-?)?x :$/;


		function requiresAction(recordModel, field, fieldCode, subfieldCode) {
			if ( field.tag !== fieldCode ) { return 0; }
			var sf = recordModel.getSubfieldByCode(field, subfieldCode);
			if ( !sf ) { return 0; }
			if ( isbnish.exec(sf.content) ) {
          return 1;
      }

      if ( field.tag === '020' && sf.code === 'a' && isbnish020a.exec(sf.content) ) {
        //console.info("potential 020a: "+sf.content);
        var lhs = sf.content.substring(0, sf.content.indexOf(" :"));
        //console.info("potential 020a: '"+lhs+"'");
        if ( isbnish.exec(lhs) ) {

          return 1;
        }
      }
			return 0;
		}

		function validate(recordModel, field) {
      var i = 0;
      for (i=0; i < targets.length; i++) {
        var result = requiresAction(recordModel, field, targets[i].field, targets[i].subfield);	
        if ( result ) {
          var msg = field.tag + " ISBN 'x' => 'X'";
          return Validation.warning(msg, [{
            name: msg,
            description: msg
          }]);
        }
      }
      return null;
    }


		function fix (action, recordModel, field, i) {
      var i = 0;
      var hits = 0;
      for (i=0; i < targets.length; i++) {
				var result = requiresAction(recordModel, field, targets[i].field, targets[i].subfield);
				if ( result ) {
          hits++;
					var sf = recordModel.getSubfieldByCode(field, targets[i].subfield);

          var replacement = sf.content.replace('x', 'X');

					if ( debug ) {
            console.info("020x2X fixer: " + field.tag + targets[i].subfield +
                ": muuta x X:ksi '" + RecordModel.fieldToString(field)+"'");    
					}
					sf.content = replacement;
				}
			}
			if ( hits ) { recordModel.trigger('change'); }
			return hits;
		}

		Validation.registerValidatorBundle(
			"020x2X",
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
