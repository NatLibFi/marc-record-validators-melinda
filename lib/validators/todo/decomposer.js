/*
 * DeComposer.js -- Compose decomposed å, ä, ö and decompose other letters.
 * 
 * Copyright (c) Kansalliskirjasto 2015-2016
 * All Rights Reserved.
 *
 * @author: Nicholas Volk <nicholas.volk@helsinki.fi>
 *
 * NB! when adding stuff, store from-field both to pattern and conversions variables.
 */

define([
	"core/RecordModel",
    "core/Validation"
	], function (RecordModel, Validation) {
	"use strict";

	var debug = 1;
	// egrep "(‐|‑|‒|–|—|―)" alina0?.seq  |
	var pattern = /(å|ä|ö|Å|Ä|Ö|á|Á|à|À|â|Â|ã|Ã|é|É|è|È|ê|Ê|ẽ|Ẽ|ë|Ë|í|Í|ì|Ì|î|Î|ĩ|Ĩ|ï|Ï|ñ|Ñ|ó|Ó|ò|Ò|ô|Ô|õ|Õ|ś|Ś|ú|Ú|ù|Ù|û|Û|ũ|Ũ|ü|Ü|ỳ|Ỳ|ý|Ý|ŷ|Ŷ|ỹ|Ỹ|ÿ|Ÿ|‐|‑|‒|–|—|―)/;

	//var pattern = /(â|ê|î|ô|û|ŷ|Â|Ê|Î|Ô|Û|Ŷ)/;
	var conversions = [
		// normalizations:
		{ from:'‐', to:'-' },
		{ from:'‑', to:'-' },
		{ from:'‒', to:'-' },
		{ from:'–', to:'-' },
		{ from:'—', to:'-' },
		{ from:'―', to:'-' },
		
		// precompose å, ä, ö, Å, Ä and Ö
		{ from:'å', to:'å' },
		{ from:'ä', to:'ä' },
		{ from:'ö', to:'ö' },
		{ from:'Å', to:'Å' },
		{ from:'Ä', to:'Ä' },
		{ from:'Ö', to:'Ö' },
		
		// decompose everything else (list incomplete):
		{ from:'á', to:'á' },
		{ from:'à', to:'à' },
		{ from:'â', to:'â' },
		{ from:'ã', to:'ã' },

		{ from:'é', to:'é' },
		{ from:'è', to:'è' },
		{ from:'ê', to:'ê' },
		{ from:'ẽ', to:'ẽ' }, 
		{ from:'ë', to:'ë' },

		{ from:'í', to:'í' },
		{ from:'ì', to:'ì' },
		{ from:'î', to:'î' },
		{ from:'ĩ', to:'ĩ' }, 
		{ from:'ï', to:'ï' },

		{ from: 'ñ', to:'ñ' },

		{ from:'ó', to:'ó' },
		{ from:'ò', to:'ò' },
		{ from:'ô', to:'ô' },
		{ from:'õ', to:'õ' },

		{ from:'ś', to:'ś' },

		{ from:'ú', to:'ú' },
		{ from:'ù', to:'ù' },
		{ from:'û', to:'û' },
		{ from:'ü', to:'ü' },
		{ from:'ũ', to:'ũ' },

		{ from:'ý', to:'ý' },
		{ from:'ỳ', to:'ỳ' },
		{ from:'ŷ', to:'ŷ' },
		{ from:'ỹ', to:'ỹ' }, 
		{ from:'ÿ', to:'ÿ' },

		{ from:'Á', to:'Á' },
		{ from:'À', to:'À' },
		{ from:'Â', to:'Â' },
		{ from:'Ã', to:'Ã' },

		{ from:'É', to:'É' },
		{ from:'È', to:'È' },
		{ from:'Ê', to:'Ê' },
		{ from:'Ẽ', to:'Ẽ' }, 
		{ from:'Ë', to:'Ë' },

		{ from:'Í', to:'Í' },
		{ from:'Ì', to:'Ì' },
		{ from:'Î', to:'Î' },
		{ from:'Ĩ', to:'Ĩ' }, 
		{ from:'Ï', to:'Ï' },

		{ from: 'Ñ', to:'Ñ'},

		{ from:'Ó', to:'Ó' },
		{ from:'Ò', to:'Ò' },
		{ from:'Ô', to:'Ô' },
		{ from:'Õ', to:'Õ' },

		{ from:'Ś', to:'Ś' },

		{ from:'Ú', to:'Ú' },
		{ from:'Ù', to:'Ù' },
		{ from:'Û', to:'Û' },
		{ from:'Ũ', to:'Ũ' }, 
		{ from:'Ü', to:'Ü' },

		{ from:'Ý', to:'Ý' },
		{ from:'Ỳ', to:'Ỳ' },
		{ from:'Ŷ', to:'Ŷ' },
		{ from:'Ỹ', to:'Ỹ' }, 
		{ from:'Ÿ', to:'Ÿ' }

	];


	function composeAndDecompose(str) {
		var i;
		for ( i=0; i < conversions.length; i++ ) {
			var from = conversions[i].from;
			if ( str.indexOf(from) > -1 ) {
				var regex = new RegExp(from, 'g')
				var to = conversions[i].to;	
				str	= str.replace(regex, to);

			}
		}
		return str;
	}

	function needsAction(field) {
		for (var i in field.subfields) {
			var sf = field.subfields[i];
			var content = sf.content;
			//console.log(content);
			if ( pattern.test(content) ) { return sf; }
		}
		return null;
	}	

    function validate(recordModel, field) {
		var asf = needsAction(field);
		if ( asf ) {

			var msg = "Field "+field.tag+"$"+asf.code+" needs conversion ('"+asf.content+"')";

			return Validation.warning(msg, [{
				name: "(De)composition bug fix",
				description: msg
			}]);
		}
    }



    function fix (action, recordModel, field, i) {
		if ( needsAction(field) ) {
			var hits = 0;
			var originalFieldContents = RecordModel.fieldToString(field);
			for (var i in field.subfields) {
				var sf = field.subfields[i];
				var original_content = sf.content;
				var content = composeAndDecompose(original_content);
				if ( content !== original_content ) {
					field.subfields[i].content = content;
					hits++;
				}
			}

			if ( hits ) {
				if ( debug ) {
					console.info("DeComposer.js: "+field.tag+" changed from '"+originalFieldContents+
						"' to '" + RecordModel.fieldToString(field));
				}
				recordModel.trigger('change');
				return 1;
			}
		}
		return 0;
    }

    Validation.registerValidatorBundle(
        "DeComposer",
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
