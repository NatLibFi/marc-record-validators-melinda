/*
 *
 * FunctionTerms.js - Post-RDA conversion fix for messed-up function terms.
 *
 * Copyright (c) Kansalliskirjasto 2016
 * All Rights Reserved.
 *
 * @author: Tuomo Virolainen, tuomo.virolainen@helsinki.fi
 *
 */

define([
	"core/RecordModel",
	"core/Validation",
	"core/L",
	], function (RecordModel, Validation, L) {
		"use strict";

		var debug = 1;
    
    var replacements = {
      "respondenttiti": "respondentti",
      "EsopraanoItenoritenori": "esittäjä",
      "sopraanoÄV": "säveltäjä",
      "JOHtenori": "johtaja",
      "ohj": "ohjaaja",
      "alttouthor": "kirjoittaja",
      "aut": "kirjoittaja",
      "säv": "säveltäjä",
      "sitt": "esittäjä",
      "PIalttoNO": "piano",
      "sopraanoOV": "sovittaja",
      "puv": "puvustaja",
      "utg": "utgivare",
      "kust": "kustantaja",
      "ään": "äänittäjä",
      "VIULU": "viulu",
      "sopraanoalttoN": "sanoittaja",
      "toim": "toimittaja",
      "tejuontajaeet": "tehosteet",
      "tenoriOIM": "toimittaja",
      "esit": "esittäjä",
      "bassoalttoR": "baritoni",
      "leik": "leikkaaja",
      "sopraanoELLO": "sello",
      "NÄYtenoritenori": "näyttelijä",
      "eesittäjä": "esittäjä",
      "tenoriranslator": "kääntäjä",
      "HUILU": "huilu",
      "Ktenori": "kontratenori",
      "KLalttoRINEtenoritenoriI": "klarinetti",
      "sopraanoäv": "säveltäjä",
      "URUtenori": "urut",
      "kijroittaja": "kirjoittaja",
      "CEMbassoalttoLO": "cembalo",
      "KItenorialttoRaltto": "kitara",
      "KÄYRÄtenoriORVI": "käyrätorvi",
      "alttoLtenoritenoriOVIULU": "alttoviulu",
      "OPEtenoritenori": "opettaja",
      "sopraanoUOM": "suomentaja",
      "KUVItenoritenorialttoJaltto": "kuvittaja",
      "HalttoRPPU": "harppu"
    };

    var functionTermFields = {
      "100": "e",
      "110": "e",
      "111": "j",
      "600": "e",
      "610": "e",
      "611": "j",
      "700": "e",
      "710": "e",
      "711": "j"
    };
    
    function removePunctuation(str) {
      return str.replace(/[.,:;!?]/g, '').trim();
    }

    function requiresAction(RecordModel, field) {
      if (! (field.tag in functionTermFields ) ) { return 0; }
      
      var sftag = functionTermFields[field.tag];

      if (! RecordModel.getSubfieldByCode(field, sftag) ) { return 0; }

      var found = 0;
      
      field.subfields.forEach(function(subf) {
        var normalizedContent = removePunctuation(subf.content);
        if (normalizedContent in replacements) {
          if (debug) {
            console.log(field.tag + " $" + subf.code + ": Virheellinen funktiotermi: " + subf.content);
          }
          found = 1;
        }
      });

      return found;
    }

    function validate(recordModel, field) {
      var result = requiresAction(recordModel, field);
      if (result) {
        var msg = (field.tag + ": Virheellinen funktiotermi: " + RecordModel.fieldToString(field));
        return Validation.warning(msg, 
          [
             {
              name: msg,
              description: msg + " " + RecordModel.fieldToString(field)
            }
          ]
        );
      }
      return null;
    }

    function fix(action, recordModel, field, i) {
      var result = requiresAction(recordModel, field);
      if (result) {
        for (var x = 0; x < field.subfields.length; x++) {
          if (field.subfields[x].code === functionTermFields[field.tag]) {
            var tag = field.tag;
            var sfcontent = removePunctuation(field.subfields[x].content);
            var from = new RegExp(sfcontent, "g");
            var to = replacements[sfcontent];
            if (functionTermFields[tag] === field.subfields[x].code && sfcontent in replacements) {
              field.subfields[x].content = field.subfields[x].content.replace(from, to);
              if (debug) {
                console.info("Fixed a messed-up function term: " + sfcontent + " => " + to);
              }
            }
          }
        }
        recordModel.trigger("change");
        return 1;
      }
      return 0;
    }

		Validation.registerValidatorBundle(
			"FunctionTerms",
			validate,
			fix,
			'field');
});
