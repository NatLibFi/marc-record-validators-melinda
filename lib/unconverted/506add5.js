/*
 *
 * 506add5.js -- lisää $5 tarvittaessa
 * 
 * Copyright (c) Kansalliskirjasto 2015
 * All Rights Reserved.
 *
 * @author: Nicholas Volk <nicholas.volk@helsinki.fi>
 *
 *
 */

define([
	"core/RecordModel",
	"core/Validation",
	"core/L",
	], function (RecordModel, Validation, L) {
		"use strict";

		var debug = 1;

		var relevantSubstrings = [
{ substr:'PIKI-kirjastokortilla', owner:'PIKI' },
{ substr:'Oamkin verkon koneissa', owner:'OAMK' },
{ substr:'Hankens bibliotek och i Tritonia', owner:'HANNA TRITO' },
{ substr:'Hanken network', owner:'HANNA' },
{ substr:'Vaasan ammattikorkeakoulun verkossa', owner:'TRITO' },
{ substr:'Jyväskylän yliopiston kirjaston asiakkaat', owner:'JYKDO' },
{ substr:'Turun yliopiston verkossa', owner:'VOLTE' },
{ substr:'Tilastokirjastossa', owner:'TILDA' },
{ substr:'Terveystieteiden keskuskirjaston', owner:'HELKA' },
{ substr:'Oulun yliopiston verkon', owner:'OULA' },
{ substr:'SAMK:n kirjaston', owner:'SAMK' },
{ substr:'Tritonian rekisteröityneet', owner:'TRITO' },
{ substr:'eduskunnan verkossa', owner:'SELMA' },
{ substr:'Humanistisen ammattikorkeakoulun', owner:'HURMA' },
{ substr:'University of Turku local network', owner:'VOLTE' },
{ substr:'domänen abo.fi', owner:'ALMA' },
{ substr:'HY-verkossa', owner:'HELKA' },
{ substr:'HUMAKin kirjaston', owner:'HURMA' },
{ substr:'Kuopion yliopiston', owner:'JOSKU' },
{ substr:'Metropolian verkossa', owner:'METRO' },
{ substr:'Samkin verkossa', owner:'SAMK' },
{ substr:'HUMAKin opiskelijoilla', owner:'HURMA' },
{ substr:'Tritonia', owner:'TRITO' },
{ substr:'Helsingin yliopiston verkossa', owner:'HELKA' },
{ substr:'Vaasan ammattikorkeakoulun verkossa', owner:'TRITO' },
{ substr:'HY ja HYKS', owner:'HELKA' },
{ substr:'Vaasan yliopiston verkossa', owner:'TRITO' },
{ substr:'Tritonias', owner:'TRITO' },
{ substr:'Tritonian', owner:'TRITO' },
{ substr:'Rovaniemen ammattikorkeakoulun', owner:'JUOLU' },
{ substr:'Eduskunnan verkossa', owner:'SELMA' },
{ substr:'Viikin tiedekirjaston', owner:'HELKA' },
{ substr:'KTAMK:n kuntayhtymän', owner:'JUOLU' },
{ substr:'TAMKin kirjaston', owner:'TAMK' },
{ substr:'Aalto-yliopiston tunnuksilla', owner:'ALLI' },
{ substr:'Lappian', owner:'JUOLU' }
];
		function get5(recordModel, field) {
			if ( field.tag !== '506' ) { return 0; }
			var sf5 = recordModel.getSubfieldByCode(field,"5");
			if ( sf5 ) { return null; }

			var sfa= recordModel.getSubfieldByCode(field,"a");
			if ( !sfa ) { return null; }

			var content = sfa.content;

			var i;
			for ( i=0; i < relevantSubstrings.length; i++ ) {
				if ( content.indexOf(relevantSubstrings[i].substr) >= 0 ) {
					return relevantSubstrings[i].owner;
				}
			}

			return null;
		}

		function validate(recordModel, field) {
			var sf5 = get5(recordModel, field);
			if ( !sf5 ) { return null; }	
			
			var msg = "506: lisää $5 "+sf5 +" kohteelle " + RecordModel.fieldToString(field);		

			return Validation.warning(msg, [{
					name: msg,
					description: msg
			}]);

		}


		function fix (action, recordModel, field, i) {
			
			var content = get5(recordModel, field);
			if ( content ) {
				var contents = content.split(' '); // voi olla monta kenttää
				var i;
				var hits = 0;
				for ( i=0; i < contents.length; i++) {
					if ( contents[i] ) {
						if ( debug ) { console.info("506add5.fix() add $5 "+contents[i]); }
						hits++;
						field.subfields.push(recordModel.createSubfield("5", contents[i]));
					}
				}
				if ( hits ) {					
					recordModel.trigger('change');
				}
				return 1;
			}
			return 0;
		}

		Validation.registerValidatorBundle(
			"506add5",
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
