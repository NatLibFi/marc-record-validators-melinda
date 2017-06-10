/*
 * SimpleReplacements.js - do search and replace for listed contents
 *
 * Copyright (c) Kansalliskirjasto 2014
 * All Rights Reserved.
 *
 * Author(s): Nicholas Volk <nicholas.volk@helsinki.fi>
 *
 * Does a simple replace from targets[index].from to targets[index].to
 * if field==targets[index].field and subfield==targets[index].subfield.
 *
 * Testikamaa (tuotanto): 47223
 * 
 * Testi 530: 004423561, 000928430, 202143
 *
 *
 * 2015-03-25
 * - Lisätty loppupisteet
 * - Lisätty tuki useammalle samannimiselle osakentälle samassa kentässä
 * - Lisätty funktioille pilkutustuki
 * - Loistava esimerkkitietue: 006205757
 *
 * 2015-05-26
 * - pitäisikö .to arvikka null tai '' poistaa? Pitäisi. Valitus lisätty fixer()-funktioon.
 */

define([
    "core/Validation"
	], function (Validation, L) {
		"use strict";

		var DEBUG = 1;

	var targets = [
		{ field: '020', subfield:'q', from:'nid', to:'nid.' }, // MM4 joulu 2015
		{ field: '020', subfield:'q', from:'sid', to:'sid.' }, // MM4 joulu 2015
		{ field: '020', subfield:'q', from:'(nid.)', to:'nid.' }, // MM4 joulu 2015
		{ field: '020', subfield:'q', from:'(sid.)', to:'sid.' }, // MM4 joulu 2015

		{ field: '336', subfield:'a', from:'text', to:'Text' }, // MM4 joulu 2015
		{ field: '336', subfield:'a', from:'teksti', to:'Teksti' }, // MM4 joulu 2015
		{ field: '336', subfield:'a', from:'tekst', to:'Tekst' }, // MM4 joulu 2015
		{ field: '336', subfield:'a', from:'Teksi', to:'Teksti' }, // MM4 joulu 2015
				
		{ field: '336', subfield:'a', from:'puhe', to:'Puhe' }, // MM4 joulu 2015

		{ field: '337', subfield:'a', from:'udio', to:'audio' }, // MM4 joulu 2015

	
		// BUGI: { field: '337', subfield:'a', from:'ingen medietyp.', to:'ingen medietyp' }, // MM4 joulu 2015
		// TODO: Näille ja muille voisi tehdä usean osakentän tarkistimen/korjaajan

		// { field: '650', subfield:'2', from:'argofors', to:'agrifors' }, // MM4 joulu 2015
		{ field: '650', subfield:'2', from:'agrofors', to:'agrifors' }, // MM4 joulu 2015
		{ field: '648', subfield:'2', from:'agrofors', to:'agrifors' }, // MM4 joulu 2015
		{ field: '651', subfield:'2', from:'agrofors', to:'agrifors' }, // MM4 joulu 2015
		{ field: '653', subfield:'2', from:'agrofors', to:'agrifors' }, // MM4 joulu 2015
		{ field: '655', subfield:'2', from:'agrofors', to:'agrifors' }, // MM4 joulu 2015

		// Massamuutokset I (joulu 2014/tammi 2015):
		{ field: '502', subfield:'a', from:'Väitösk.', to:'Diss.' }, // MM1
		{ field: '502', subfield:'a', from:'Akad. avh.', to:'Diss.' }, // MM1
		// Massamuutokset II:
		{ field: '530', subfield:'a', from:'Käytettävissä filmikortteina.', // MM2, LINDA-2778
			to:'Käytettävissä filmikortteina Kansalliskirjastossa.', keep:'FENNI<KEEP>' },
		// Massamuutokset III (korjaan vain yleisemmät, kirjainkokokomboja ym. piisaa):
		{ field: '509', subfield:'a', from:'Pro gradu -työ :', to:'Pro gradu -tutkielma :'}, // MM3
		{ field: '509', subfield:'a', from:'Pro gradu -työ', to:'Pro gradu -tutkielma'}, // MM3	
		{ field: '509', subfield:'a', from:'Pro gradu -työ.', to:'Pro gradu -tutkielma.'}, // MM3
		{ field: '509', subfield:'a', from:'pro gradu -työ :', to:'Pro gradu -tutkielma :'},
		{ field: '509', subfield:'a', from:'Pro gradu-työ :', to:'Pro gradu -tutkielma :'},

	];

	// Expand function terms (MM2 unless otherwise specified):
	var functions = [ { from: 'A', to: 'altto.'},
		{ from: 'anim.', to: 'animaattori.' },
		{ from: 'arr.', to: 'arrangör.' },
		{ from: 'B', to: 'basso.' },
		{ from: 'Bar', to: 'baritoni.' },
		{ from: 'dramat.', to: 'dramaturgi.' },
		{ from: 'esitt.', to: 'esittäjä.' },
		{ from: 'graaf.', to: 'graafikko.' },
		{ from: 'ill.', to: 'illustratör.' },
		{ from: 'joht.', to: 'johtaja.' },
		{ from: 'kert.', to: 'kertoja.' },
		{ from: 'kirj.', to: 'kirjoittaja.' },
		{ from: 'kok.', to: 'kokoaja.' },
		{ from: 'koreogr.', to: 'koreografi.' },
		// kuv. voi olla joko kuvaaja tai kuvittaja... Tälle on oma erillinen fikseri
		{ from: 'kuvatait.', to: 'kuvataiteilija.' },
		{ from: 'käsik.', to: 'käsikirjoittaja.' },
		{ from: 'käänt.', to: 'kääntäjä.' },
		{ from: 'lav.', to: 'lavastaja.' },
		{ from: 'leikk.', to: 'leikkaaja.' },
		{ from: 'näytt.', to: 'näyttelijä.' },
		{ from: 'ohj.', to: 'ohjaaja.' },
		{ from: 'opett.', to: 'opettaja.' },
		{ from: 'piirt.', to: 'piirtäjä.' },
		{ from: 'red.', to: 'redaktör.' },
		{ from: 'reg.', to: 'regissör.' },
		{ from: 'S', to: 'sopraano.' },
		{ from: 'san.', to: 'sanoittaja.' },
		{ from: 'suunn.', to: 'suunnittelija.' },
		{ from: 'säv.', to: 'säveltäjä.' },
		{ from: 'T', to: 'tenori.' },
		{ from: 'tanss.', to: 'tanssija.' },
		{ from: 'tanssi', to: 'tanssija.' }, // Oops, oli näin 6700000:n asti (poista MM5:ssä)
		{ from: 'toim.', to: 'toimittaja.' },
		{ from: 'tons.', to: 'tonsättare.' },
		{ from: 'transkr.', to: 'transkriboija.' },
		{ from: 'tuott.', to: 'tuottaja.' },
		{ from: 'valok.', to: 'valokuvaaja.' },
		{ from: 'äänit.', to: 'äänittäjä.' },
		{ from: 'övers.', to: 'översättare.' },
        // II massamuutos bug fix (tee kerran III:ssa ja poista):
		{ from: 'altto', to: 'altto.'},
		{ from: 'animaattori', to: 'animaattori.' },
		{ from: 'arrangör', to: 'arrangör.' },
		{ from: 'basso', to: 'basso.' },
		{ from: 'baritoni', to: 'baritoni.' },
		{ from: 'dramaturgi', to: 'dramaturgi.' },
		{ from: 'esittäjä', to: 'esittäjä.' },
		{ from: 'graafikko', to: 'graafikko.' },
		{ from: 'illustratör', to: 'illustratör.' },
		{ from: 'johtaja', to: 'johtaja.' },
		{ from: 'kertoja', to: 'kertoja.' },
		{ from: 'kirjoittaja', to: 'kirjoittaja.' },
		{ from: 'kokoaja', to: 'kokoaja.' },
		{ from: 'koreografi', to: 'koreografi.' },
		{ from: 'kuvaaja', to: 'kuvaaja.' },
		{ from: 'kuvittaja', to: 'kuvittaja.' },
		{ from: 'kuvataitaiteilija', to: 'kuvataiteilija.' },
		{ from: 'käsikirjoittaja', to: 'käsikirjoittaja.' },
		{ from: 'kääntäjä', to: 'kääntäjä.' },
		{ from: 'lavastaja', to: 'lavastaja.' },
		{ from: 'leikkaaja', to: 'leikkaaja.' },
		{ from: 'näyttelijä', to: 'näyttelijä.' },
		{ from: 'ohjaaja', to: 'ohjaaja.' },
		{ from: 'opettaja', to: 'opettaja.' },
		{ from: 'piirtäjä', to: 'piirtäjä.' },
		{ from: 'redaktör', to: 'redaktör.' },
		{ from: 'regissör', to: 'regissör.' },
		{ from: 'sopraano', to: 'sopraano.' },
		{ from: 'sanoittaja', to: 'sanoittaja.' },
		{ from: 'suunnittelija', to: 'suunnittelija.' },
		{ from: 'säveltäjä', to: 'säveltäjä.' },
		{ from: 'tenori', to: 'tenori.' },
		{ from: 'tanssija', to: 'tanssija.' },
		{ from: 'toimittaja', to: 'toimittaja.' },
		{ from: 'tonssättare', to: 'tonsättare.' },
		{ from: 'transkriboija', to: 'transkriboija.' },
		{ from: 'tuottaja', to: 'tuottaja.' },
		{ from: 'valokuvaaja', to: 'valokuvaaja.' },
		{ from: 'äänittäjä', to: 'äänittäjä.' }, 
		{ from: 'översättare', to: 'översättare.' }
	];

	if ( 1 ) {
		var i;
		for ( i=0; i < functions.length; i++ ) {
			var from = functions[i].from;
			var to = functions[i].to;		
			targets.push({ field: '100', subfield: 'e', from: from, to: to });
			targets.push({ field: '110', subfield: 'e', from: from, to: to });
			targets.push({ field: '600', subfield: 'e', from: from, to: to });
			targets.push({ field: '610', subfield: 'e', from: from, to: to });
			targets.push({ field: '700', subfield: 'e', from: from, to: to });
			targets.push({ field: '710', subfield: 'e', from: from, to: to });

			targets.push({ field: '111', subfield: 'j', from: from, to: to });
			targets.push({ field: '611', subfield: 'j', from: from, to: to });
			targets.push({ field: '711', subfield: 'j', from: from, to: to });

			// "valok.," => valokuvaaja
			if ( from.substr(-1) === "." ) {
				from += ",";
				if ( to.substr(-1) === '.' ) {
					to = to.slice(0, -1)+",";
				}

				targets.push({ field: '100', subfield: 'e', from: from, to: to });
				targets.push({ field: '110', subfield: 'e', from: from, to: to });
				targets.push({ field: '600', subfield: 'e', from: from, to: to });
				targets.push({ field: '610', subfield: 'e', from: from, to: to });
				targets.push({ field: '700', subfield: 'e', from: from, to: to });
				targets.push({ field: '710', subfield: 'e', from: from, to: to });

				targets.push({ field: '111', subfield: 'j', from: from, to: to });
				targets.push({ field: '611', subfield: 'j', from: from, to: to });
				targets.push({ field: '711', subfield: 'j', from: from, to: to });
			}
		}

		if ( 0 && DEBUG ) {
			for ( i=0; i < targets.length; i++ ) {
				var t = targets[i];
				console.info(t.field + t.subfield + "\t" + t.from + "\t" + t.to);
			}
		}
	}

	function requiresAction(recordModel, field) {
		var i;
		for ( i=0; i < targets.length; i++ ) {
			if ( field.tag == targets[i].field ) {
				//var sf = recordModel.getSubfieldByCode(field, targets[i].subfield);
				for (var j in field.subfields) {
					var sf = field.subfields[j];
					if ( sf && sf.content == targets[i].from ) {
						if ( targets[i].from !== targets[i].to) { // Just a sanity check
							if ( DEBUG ) {
								console.info("SimpleReplacements.js:\n" + targets[i].from + " => " + targets[i].to);
							}
							// Fine, if there's no KEEP:
							if ( !targets[i].keep ) {
								return i;
							}
							// Require KEEP:
							var sf9 = recordModel.getSubfieldByCode(field, '9');
							if ( sf9 ) {
								if ( sf9.content == targets[i].keep ) {
									if ( DEBUG ) {
										console.info("530 FENNI KEEP FOUND");
										//return i;
									}
									return i;
								}
							}
						}
					}
				}
			}
		}
		return -1;
	}

	function validate(recordModel, field) {
		var index = requiresAction(recordModel, field);
		
		if ( index === -1 ) { return null; }

		var msg = "SimpleReplacements.js, " + targets[index].field + targets[index].subfield +
			": '" + targets[index].from + "' => '" + targets[index].to + "'";

		return Validation.warning(msg, [{
			name: msg,
			description: msg
		}]);
    }

    function fix (action, recordModel, field, i) {
		var index = requiresAction(recordModel, field);
		if ( index >= 0 ) {
			//var sf = recordModel.getSubfieldByCode(field, targets[index].subfield);
			var n_fixes = 0;
			//console.info(field.subfields);
			for (var j in field.subfields) {

				var sf = field.subfields[j];
				if ( sf && sf.content == targets[index].from ) {
					if ( DEBUG ) {
						var sep = ( sf.content.indexOf(' ') === -1 ? "\n " : ' ');

						var msg = targets[index].field + targets[index].subfield +
							sep + "'" + targets[index].from + "'" +
							sep+"'" + targets[index].to + "'";
						console.info("SimpleReplacements.js: fix(): "+field.tag+msg);
					}
					if ( targets[index].to === null || targets[index].to === '' ) {
						console.info("TODO: remove subfield "+sf.content);
					}
					else {
						sf.content = targets[index].to;
						if ( n_fixes === 0 ) {
							recordModel.trigger('change');
						}
						n_fixes++;
					}
				}
			}
			return n_fixes;
		}

		return 0;
    }

    Validation.registerValidatorBundle(
        "SimpleReplacements",
        validate,
        fix,
        'field');

});/**
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
