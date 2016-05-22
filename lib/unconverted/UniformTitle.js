/*
 *
 * UniformTitle.js -- finmarc->marc21 bug fix for field 240
 * 
 * Copyright (c) Kansalliskirjasto 2014
 * All Rights Reserved.
 *
 * @author: Nicholas Volk, nicholas.volk@helsinki.fi
 *
 * MARC21-konversiossa väärin konvertoitu alkuteos 240 muutettava kentäksi 130,
 * kun teoksella ei ole 1xx-kentän tekijää.
 *
 * 240 10 -> 130 0#
 * 240 11 -> 130 1#
 * 240 12 -> 130 2#
 * 240 13 -> 130 3#
 * jne.
 *
 * NB! Saattaa rikkoa 245:n ensimmäisen validaattorin. Tälle on oma fikseri.
 *
 * TODO: 130:ssa pitäisi olla loppupiste mukana... Tämä on jo ajettu, joten tätä
 * ei ainakaan juuri nyt tehdä, koska testaaminen on vaikeaa jne.
 *
 * TODO: Siirrossa pitäisi teoriassa olla $$6:n tarkistus,
 * koska 130/240-880-linkitys menee rikki, mutta todellisuudessa tämä on niin
 * harvinainen, ettei tätä tarvitse huomioida (etenkin kun massa-ajo tällä on jo tehty).
 *
 * Test case(s): 120297 (Guinness book of records 1996), 120535
 *
 * Fixed: 000000618
 */
define([
	"core/Validation",
	"core/RecordModel",
	"core/L"
	], function (Validation, RecordModel, L) {
	"use strict";

	var RegExpDigit = /^[0-9]$/;

	var debug = 1;

	function _UT_proceed(recordModel, field) {
	// Palauttaa 1, jos muutettava tietue, muuten palautetaan 0.
	if ( field.tag == '240' &&
		field.indicator1 == '1' &&
		RegExpDigit.exec(field.indicator2) &&
		// Tietueessa ei ole 100- eikä 110-kenttää:
		!recordModel.getFieldByTag("100") &&
		!recordModel.getFieldByTag("110") ) {
		return 1;
	}
	return 0;
	}

	function validate(recordModel, field) {
	if ( !_UT_proceed(recordModel, field) ) { return null; }
	var msg = "(Uniform title) move field 240 to 130 (Finmarc->Marc21 conversion bug)";
	return Validation.warning(msg, [{
			name: "Replace field 240 with corresponding field 130.",
			description: "Replace"
			}]);
	
	}


	function fix (action, recordModel, field, i) {
		if ( _UT_proceed(recordModel, field) ) {
			if ( debug ) {
				console.info("UniformTitle 240 => 130\n " + field.tag + " "+
					RecordModel.fieldToString(field) + " =>");
			}
			field.tag = '130';
			field.indicator1 = field.indicator2;
			field.indicator2 = ' '; // '#' vai ' '?
			// Osakentät menevät oikein.

			// NB: kenttien sorttaus pitäisi laittaa uusiksi ainakin teoriassa...
			// Tosin välillä 130...240 ei tod.näk. ole muita kenttiä.
			// Tätä varten on toisia funktioita, joten ei sorttausta ei tehdä tässä.
			if ( debug ) {
				console.info(" "+field.tag+" "+RecordModel.fieldToString(field));
			}

			recordModel.trigger('change');
			return 1;
		}	
		return 0;
	}

	Validation.registerValidatorBundle(
		"UniformTitle",
		validate,
		fix,
		'field'); // pitääkö olla record? (pitää ehkä sortata tietue uudelleen...)

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
