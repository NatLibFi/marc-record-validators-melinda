/*
 *
 * DoubleCommas.js -- Post-RDA-conversion fixer: fix double commas from field 700 
 * where subfield $e is repeated three times
 * 
 * Copyright (c) Kansalliskirjasto 2016
 * All Rights Reserved.
 *
 * @author: Tuomo Virolainen <tuomo.virolainen@helsinki.fi>
 *
 * Test case 000150760:
 * 700 1  
 *     a Laaksonen, Petri,
 *     d 1962-,
 *     e esittäjä,
 *     e taiteilija,,
 *     e säveltäjä.
 * 
 * Others: 000260675, 000474116, 000152866
 */

define([
  "core/RecordModel",
  "core/Validation",
  "core/L",
  ], function (RecordModel, Validation, L) {
    "use strict";

    var debug = 1;

    function requiresAction(recordModel, field) {
      if ( field.tag !== "700" ) { return 0; }

      if (!recordModel.getSubfieldByCode(field, "e")) { return 0; }

      var found = 0;

      field.subfields.forEach(function(subf) {
        if (subf.code === "e") {
          if (subf.content.indexOf(',,') > -1) {
            if (debug) {
              console.log("Tuplapilkku 700$e-kentässä: " + subf.content);
            }
            found = 1;
          }
        }
      });

      return found;
    }

    function validate(recordModel, field) {
      var result = requiresAction(recordModel, field);  
      if (result) {
        var msg = "700: trailing double comma at subfield $e";

        return Validation.warning(msg, [{
          name: msg,
          description: msg + " "  + RecordModel.fieldToString(field)  
        }]);
      }
      return null;
    }


    function fix (action, recordModel, field, i) {
      var result = requiresAction(recordModel, field);
      if (result) {

        for (var i = 0; i < field.subfields.length; i++) {
          if (field.subfields[i].code === "e" && field.subfields[i].content.indexOf(',,') > -1) {
              field.subfields[i].content = field.subfields[i].content.replace(',,', ',');
          }
        }

        if (debug) {
          console.info("DoubleCommas done");
        }
        recordModel.trigger("change");
        return 1;
      }
      return 0;
    }

    Validation.registerValidatorBundle(
      "DoubleCommas",
      validate,
      fix,
      "field");
});
