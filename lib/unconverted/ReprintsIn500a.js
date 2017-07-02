/*
 * ReprintsIn506a.js - detect and fix doubles such as ',' vs '--'
 *
 * Copyright (c) 2014 Kansalliskirjasto
 * All Rights Reserved.
 *
 * Author(s): Nicholas Volk (nicholas.volk@helsinki.fi)
 *
 * Täysin testaamaton. Pitäisi löytää jostain jokunen aito testitapaus.
 * TODO: Etsi tuotannosta ja kopioi tänne...
 * Pohjaa suoraviivaisesti 506a:han.
 * Mites muut osakentät vaikuttaa tähän?
 *

 * Enemmän tietoa > vähemmän tietoa
 *
 * 70577
 * 1. p. 1973.
 * 2. uud. p. 1975.
 * Lisäpainokset: 1. p. 1975. - 3. p. 1978.
 * Lisäpainokset: 3. p. 1978.
 * Lisäpainokset: Uud. p. 1975. - 2. uud. p. 1975.
 * Lisäpainokset: [Lisäp.] 1977.
 *
 * Näistä ainakin "Lisäpainokset: 1. p. 1975. - 3. p. 1978." sisältää kohdan
 * "Lisäpainokset: 3. p. 1978.".
 *
 * 72761
 * Lisäpainokset: Repr. 1962.
 * Lisäpainokset: Repr. 1953. - Repr. 1962. 
 *
 * 74701 
 * Lisäpainokset: 12. p. 1993. - 13. muuttum. p. 1994. - 14 muuttum. p. 1995.
 * Lisäpainokset: 12. p. 1993. - 13. muuttum. p. 1994. - 15. muuttum. p. 1996.
 * Lisäpainokset: 12. uppl. 1993. - 13. uppl. 1994. - 14. uppl. 1995. - 15. oförändr. uppl. 1996.
 * Lisäpainokset: 13. muuttum. p. 1994.
 * Otatieto ; 464.


 * Monikielisyyksiä *
 ********************
 * 
 * TODO: tuplien poisto. Järjestys? Esim. suomi > ruotsi > englanti > saksa
 *
 * 71774
 * 1. p. 1948
 * 1. uppl. 1948
 * Lisäpainokset: 3. p. 1998.
 * Lisäpainokset: 3. uppl. 1998.
 *
 * 73017 *
 * Lisäpainokset: Lisäp. 1970.
 * Lisäpainokset: Repr. 1970.
 *
 * 71235
 * 2. p. 1976.
 * Lisäpainokset: [Lisäp.] 1992.
 * Lisäpainokset: [Repr.] 1992.
 *
 * 73017
 * Lisäpainokset: Lisäp. 1970.
 * Lisäpainokset: Repr. 1970.

 * Erilaiset erottimet ', ' vs '--' *
 ************************************
 * 72083 (ainoa tunnettu case), joka sekään ei toimi, koska Univ. != University
 * Based on author's thesis (Ph. D.), Harvard Univ., 1972.
 * Based on author's thesis (Ph. D.)--Harvard University, 1972.

 * Mintun sinänsä pätevä ajatus oli koota kaikki lisäpainokset yhteen.
 * Ei tosin ihan triviaalia tiputtaa palasia, joku " - " toimii usein erottimena...
 * Ja miten suhtaudutaan KEEPiin?

 *
 */

define([
    "core/Validation",
    "core/RecordModel"
    ], function (Validation, RecordModel) {

    function getLisapainokset(recordModel) {
		var fields = recordModel.getFieldsByTag('500');
		var lisapainokset = [];
		if ( !fields || fields.length < 2 ) { return null; }
		console.info("Multiple 500 fields");
		for ( var i=0; i < fields.length ; i++ ) {
			var f500a = recordModel.getSubfieldByCode(fields[i],"a");
			if ( f500a && f500a.content.indexOf("Lisäpainokset: ") === 0 ) {
				lisapainokset.push(fields[i]);
			}
		}
		if ( lisapainokset.length < 2 ) { return null; }
		console.info("NV DEBUG: moniselitteinen 500");
		return lisapainokset;
	}

	function validate(recordModel) {
		var candFields = getLisapainokset(recordModel);
		if ( candFields ) {
			var candSubfields = [];
			for ( var i=0; i < candFields.length; i++ ) {
				candSubfields[i] = recordModel.getSubfieldByCode(candFields[i],"a").content;
			}
			var msg = "Validate between:\n" + candSubfields.join("\n");
			console.info(msg);
			return Validation.warning(msg);
		}
	}

    function fix (action, record, field, i) {
		var candFields = getLisapainokset(record);
		for ( var i=0; i+1 < candFields.length; i++ ) {
			for ( var j=i+1; j < candFields.length; j++ ) {
				// jos fuusioituvat, niin merkitse tuhottavaksi...
				// Mites 500#9 FENNI<KEEP> vaikuttaa?
			}
		}
		// tuhoa tuhottavaksi merkityt
    }


     Validation.registerValidatorBundle(
        "ReprintsIn500a",
        validate,
        fix,
        'record');

});/**
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
