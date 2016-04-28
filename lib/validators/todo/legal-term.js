/*
 * LegalTerm.js - check that 650#2 exists
 * 
 * Copyright (c) Kansalliskirjasto 2014
 * All Rights Reserved.
 *
 * @author: Nicholas Volk, nicholas.volk@helsinki.fi
 *
 * Checks YSA, Allars, Musa and Cilla before moving to 653.
 * 
 * TODO: test case? 165, 2560, 2588
 *
 * Test case (production): 2521,
 *   5339 (sekä YSAan siirrettävä että kokonaan puuttuva),
 *   300294 (sanasto puuttuu, lisäksi osakenttä #x) (653 lisältää liikaa kamaa...)
 *   304748
 *   313016
 *
 *  8241: example fix, sekä asiasanaston lisäys osakenttään 2, että 650=>653
 * (tulee "virheitä", kuten tässä motivation)
 *
 * NB! Kannassa "Motivation", po. "motivation"
 * NB! Jostain w-osakentästä tulee loppupisteellisiä 653:ia.
 *
 * 
 */

define([
	"core/RecordModel",
	"core/Validation",
	( typeof window === "undefined" && typeof global === 'object' ? "http" : "jquery" ),
	], function (RecordModel, Validation, $) {

	"use strict";

	var cache = {};
	var debug = 1;

	// map 650 subfields to 653 second indicator
	var extraFields = [ { field : "b", indicator : '0' },
		{ field : "c", indicator : '5' },
		{ field : "d", indicator : '4' },

		{ field : "e", indicator : '0' },
		{ field : "v", indicator : '0' },
		{ field : "x", indicator : '0' },
		{ field : "y", indicator : '4' },
		{ field : "z", indicator : '5' } ];

	function dataLoader(cb) {
        return function(res) {
            var data = "";
            res.on('data', function(chunk) {
                data += chunk;
            });

            res.on('end',function() {
                cb(data);
            });
        };
    }

	function needsLexicon(recordModel, field) {
		// (relevantti) asiasana
		if ( field.tag == '650' ) {
			// Käyttää indikaattorissa speksattua asiasanastoa
			if ( field.indicator2 == '7' ) {
				// Asiasanaston *pitäisi olla* speksattu osakentässä #2, mutta merkintä puuttuu:
				var sf = recordModel.getSubfieldByCode(field,"2");
				if ( !sf ) {
					return 1;
				}
			}
		}
		return 0;
	}

	function getTermThatNeedsLexicon(recordModel, field) {
		// Asiasanan 650 toisen indikaattorin arvo '7' kertoo, että asiasanasto on speksattu osakentässä #2
		if ( needsLexicon(recordModel, field) ) {
			// Term exists:
			var sf = recordModel.getSubfieldByCode(field,"a");
			if ( !sf || !sf.content ) { return null; }
			return sf.content;
		}
		return null;
	}

	function getLexicon(term) {
		for ( var key in cache ) {
			var c = cache[key];
			if ( c && c.term == term ) { return c.lexicon; }
		}
		return null;
	}


	// These subfields are supported by 650, but not by 653
	function hasSubfieldBCDEVXZ(recordModel, field) {
		// TODO: [b-z] laitetaan 653a:han ja sille samat 6&8, [034] jätetään pois
		for ( var i=0; i < extraFields.length ; i++ ) {
			if ( recordModel.getSubfieldByCode(field, extraFields[i].field) ) { return 1; }
		}
		return 0;
	}

	function generateValidationMessage(recordModel, field, term, lexicon) {
		var msg = "Indicator 2 in field 650 has value 7. However, subfield #2 (lexicon name) is missing.";
		if ( lexicon == "/dev/null") {
			msg += " Move term to 653.";

			if ( hasSubfieldBCDEVXZ(recordModel, field) ) {
				msg += " Process subfields bcdevxz as well!";
			}
			return Validation.warning(msg, [{
				name: "Move field 650 to 653.",
				description: msg
			}]);
		}
		else {
			msg = " Term '"+term+"' belongs to "+lexicon+".";
			return Validation.warning(msg, [{
				name: "Add term '"+term+"' to "+lexicon,
				description: msg
			}]);
		}
	}

	function cachedValidate(recordModel, field, index, outerCb) {
		var term = getTermThatNeedsLexicon(recordModel, field);
		if ( !term ) { return null; }

		// return cached value, if available:
		for ( var key in cache ) {
			var c = cache[key];
			if ( c && c.term == term ) {
				if ( debug ) {
					console.info("CACHED "+term);
				}
				return c.result;
			}
		}

		var res = validate(recordModel, field, index, function (res, lex) {
			if ( lex != "/dev/null" ) {
				if ( debug ) {
					console.info("2CACHE "+term+", "+lex+", "+ res);
				}
				cache[index] = { term: term, lexicon: lex, result: res };
			}
			outerCb(res);
		});

		if (res) return res;
	}

	function validate(recordModel, field, index, innerCb) {
		var term = getTermThatNeedsLexicon(recordModel, field);
		if ( !term ) { return null; }
		var hostname = "api.finto.fi";
		var path = "/rest/v1/ysa/lookup?lang=fi&label="+encodeURIComponent(term);
		var getOptions = {
			agent: false,
			host : hostname,
			path : path,
			method: 'GET',
		};

		// NB: variable '$' is actually http, not jQuery object!
		$.get(getOptions, dataLoader(function(data) {
			if ( data.indexOf("{") === 0 ) {
				innerCb(Validation.warning("term found in ysa: "+term), "ysa");
			}
			else {
				getOptions.path = "/rest/v1/allars/lookup?lang=sv&label="+encodeURIComponent(term);
				$.get(getOptions, dataLoader(function(data) {
					if ( data.indexOf("{") === 0 ) {
						innerCb(Validation.warning("term found in allars: "+term), "allars");
					}
					else {
						getOptions.path = "/rest/v1/musa/lookup?lang=fi&label="+encodeURIComponent(term);
						$.get(getOptions, dataLoader(function(data) {
							if ( data.indexOf("{") === 0 ) {
								innerCb(Validation.warning("term found in musa: "+term), "musa");
							}
							else {
								getOptions.path = "/rest/v1/musa/lookup?lang=sv&label="+encodeURIComponent(term);
								$.get(getOptions, dataLoader(function(data) {
									if ( data.indexOf("{") === 0 ) {
										innerCb(Validation.warning("in cilla: "+term), "cilla");
									}
									else {
										var msg = "ONKI unknown error:\n"+data;
										if ( data.indexOf("404 ") === 0 ) {
											msg = term + " not found anywhere, move it to 653";
										}
										if ( debug ) {
											console.info(msg);
										}
										innerCb(Validation.error(msg), "/dev/null");
									}
								}));
							}
						}));
					}
				}));
			}
		}));

		return Validation.pending("Validating ONKI...");
	}



	function fix (action, record, field, i) {
		function fieldCmp (f1,f2) { return RecordModel.fieldCmp(f1, f2); }

		console.info("LegalTerm.js, fix(action, record, field, "+i+")");
		if ( needsLexicon(record, field) ) {
			
			//console.info(record._ids);
			//console.info(field);

			// Modify the current field.
			// (NB! We do not (re-)sort the record here!)
			var log = '';
			var log2 = '';
			if ( debug ) {
				log = "LegalTerm.js, fix():\n " + field.tag + " " + RecordModel.fieldToString(field) + "\n";
			}

			var term = getTermThatNeedsLexicon(record, field);
			if ( !term ) { return 0; }
			var lexicon = getLexicon(term);
			if ( lexicon ) {
				field.subfields.push(record.createSubfield("2", lexicon)); 
				log2 += "LegalTerm.js: sanastotunnus "+lexicon+" lisätty";
			}
			else {

				// Äh, jos tän loppuosan siirtää for-silmukan edelle, 650/653 jää 650:aan...
				log2 += "Moved original 650 to 653: "+RecordModel.fieldToString(field)+"\n";
	

				field.tag = '653';
				field.indicator2 = '0';

				//var field2 = record.getFieldBy_id(field._id);
				//if ( field2 == field ) { console.info("HIT"); }

				//console.info(field);

				// There's a bunch of subfields that 650 has but 653 doesn't...

				// 313016 contains two z-subfields
				for ( var i=0; i < extraFields.length; ) {
					//console.info(i+":"+(field?"YES":"NO"));
					var sfcode = extraFields[i].field;
					//console.info("650: Looking for subfield "+extraFields[i].field);
					var sf = record.getSubfieldByCode(field, sfcode);
					if ( sf ) {
						//var field2 = record.getFieldBy_id(field._id);
						//if ( field2 == field ) { console.info("HIT"); }

						if ( debug ) {
							log2 += "LegalTerm.js, fix(): add "+sf.content+" to a new 653 0"+extraFields[i].indicator+"#a\n";
						}
						var subfields = [ record.createSubfield('a', sf.content) ];
						var newField = record.addDataField('653', '0', extraFields[i].indicator, subfields);
						if ( debug && newField ) {
							log2 += "LegalTerm.js: Added 653 "+ RecordModel.fieldToString(newField)+"\n";
							log2 += "LegalTerm.js: Deleted subfield "+sfcode+"\n";
						}
						//console.info(i+sfcode+":"+(field?"YES":"NO"));
						field = record.deleteSubfield(field, sf);
					}
					else {
						i++;
					}
				}

				// 650 => 653 saattaa aiheuttaa sorttaustarpeen...
				var fields = record.getFields();
				fields.sort(fieldCmp);
				record.setFields(fields, 0);
			
			}
			if ( debug ) {
				log += log2;
				console.info(log);
			}


			record.trigger('change');
			return 1;
		}


		return 0;
	}

	Validation.registerValidatorBundle(
		"LegalTerm",
		cachedValidate,
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
