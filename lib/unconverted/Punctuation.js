/*
 * Punctuation.js - handling of trailing periods
 *
 * Copyright (c) 201x-2014 Kansalliskirjasto
 * All Rights Reserved.
 *
 * Author(s): ?
 *
 * Refer to www.kansalliskirjasto.fi/extra/marc21/LOPPUPISTEET.pdf
 *
 * 
 */


define([
    "core/Validation",
    "core/L",
    "underscore"
    ], function (Validation,L,_) {
    "use strict";

    var punctuationRules = {
        "010" : noPunctuation,
        "013" : noPunctuation,
        "015" : noPunctuation,
        "016" : noPunctuation,
        "017" : noPunctuation,
        "018" : noPunctuation,
        "020" : noPunctuation,
        "022" : noPunctuation,
        "024" : noPunctuation,
        "025" : noPunctuation,
        "026" : noPunctuation,
        "027" : noPunctuation,
        "028" : noPunctuation,
        "030" : noPunctuation,
        "031" : noPunctuation,
        "032" : noPunctuation,
        "033" : noPunctuation,
        "034" : noPunctuation,
        "035" : noPunctuation,
        "036" : afterb,
        "037" : noPunctuation,
        "038" : noPunctuation,
        "039" : noPunctuation,
        "040" : noPunctuation,
        "041" : noPunctuation,
        "042" : noPunctuation,
        "043" : noPunctuation,
        "044" : noPunctuation,
        "045" : noPunctuation,
        "046" : noPunctuation,
        "047" : noPunctuation,
        "048" : noPunctuation,
        "049" : noPunctuation,
        "050" : noPunctuation,
        "051" : withPeriod,
        "052" : noPunctuation,
        "055" : noPunctuation,
        "060" : noPunctuation,
        "061" : noPunctuation,
        "066" : noPunctuation,
        "070" : noPunctuation,
        "071" : noPunctuation,
        "072" : noPunctuation,
        "074" : noPunctuation,
        "080" : noPunctuation,
        "082" : noPunctuation,
        "083" : noPunctuation,
        "084" : noPunctuation,
        "085" : noPunctuation,
        "086" : noPunctuation,
        "088" : noPunctuation,
        "100" : before0to5,
        "110" : before0to5,
        "111" : before0to5,
        "130" : before0to5,
        "210" : noPunctuation,
        "222" : noPunctuation,
        "240" : noPunctuation,
        "242" : beforeyiflast,
        "243" : noPunctuation,
        "245" : alsoafterpunctuation,
        "246" : noPunctuation,
        "247" : noPunctuation,
        "250" : withPeriod,
        "254" : withPeriod,
        "255" : withPeriod,
        "256" : withPeriod,
        "257" : withPeriod,
        "258" : withPeriod,
        "260" : acolonbcommacperiod,
        "263" : noPunctuation,
        "270" : noPunctuation,
        "300" : withPeriod,
        "306" : noPunctuation,
        "307" : withPeriod,
        "310" : noPunctuation,
        "321" : noPunctuation,
        "336" : presumablyNoPunctuation,
        "337" : presumablyNoPunctuation,
        "340" : withPeriod,
        "342" : noPunctuation,
        "343" : withPeriod,
        "351" : withPeriod,
        "352" : withPeriod,
        "355" : noPunctuation,
        "357" : noPunctuation,
        "362" : withPeriod,
        "363" : noPunctuation,
        "365" : noPunctuation,
        "366" : noPunctuation,
        "490" : noPunctuation,
        "500" : before5iflast,
        "501" : before5iflast,
        "502" : withPeriod,
        "504" : withPeriod,
        "505" : withPeriod,
        "506" : before5iflast,
        "507" : withPeriod,
        "508" : withPeriod,
        "509" : withPeriod,
        "510" : noPunctuation,
        "511" : withPeriod,
        "513" : withPeriod,
        "514" : withPeriod,
        "515" : withPeriod,
        "516" : withPeriod,
        "518" : withPeriod,
        "520" : beforeuiflast,
        "521" : withPeriod,
        "522" : withPeriod,
        "524" : withPeriod,
        "525" : withPeriod,
        "526" : before5iflast,
        "530" : withPeriod,
        "533" : before7iflast,
        "534" : withPeriod,
        "535" : noPunctuation,
        "536" : noPunctuation,
        "538" : beforeuiflast,
        "540" : before5iflast,
        "541" : before5iflast,
        "542" : noPunctuation,
        "544" : withPeriod,
        "545" : withPeriod,
        "546" : withPeriod,
        "547" : withPeriod,
        "550" : withPeriod,
        "552" : withPeriod,
        "555" : withPeriod,
        "556" : withPeriod,
        "561" : before5iflast,
        "562" : before5iflast,
        "563" : before5iflast,
        "565" : noPunctuation,
        "567" : withPeriod,
        "580" : withPeriod,
        "581" : withPeriod,
        "583" : noPunctuation,
        "584" : before5iflast,
        "585" : before5iflast,
        "586" : noPunctuation,
        "590" : noPunctuation,
        "591" : noPunctuation,
        "592" : noPunctuation,
        "593" : noPunctuation,
        "594" : noPunctuation,
        "595" : noPunctuation,
        "596" : noPunctuation,
        "597" : noPunctuation,
        "598" : noPunctuation,
        "599" : noPunctuation,
        "600" : withPeriod,
        "610" : withPeriod,
        "611" : withPeriod,
        "630" : withPeriod,
        "648" : nothingToFinnishVocabularies,
        "650" : nothingToFinnishVocabularies,
        "651" : nothingToFinnishVocabularies,
        "653" : noPunctuation,
        "654" : nothingToFinnishVocabularies,
        "655" : nothingToFinnishVocabularies,
        "656" : nothingToFinnishVocabularies,
        "657" : nothingToFinnishVocabularies,
        "658" : nothingToFinnishVocabularies,
        "662" : nothingToFinnishVocabularies,
        "700" : before0to5,
        "710" : before0to5,
        "711" : before0to5,
        "720" : noPunctuation,
        "730" : before0to5,
        "740" : before5iflast,
        "752" : before2,
        "751" : noPunctuation,
        "753" : noPunctuation,
        "754" : before2,
        "760" : iflastisa,
        "762" : iflastisa,
        "765" : iflastisa,
        "767" : iflastisa,
        "770" : iflastisa,
        "772" : iflastisa,
        "773" : iflastisa,
        "774" : iflastisa,
        "775" : iflastisa,
        "776" : iflastisa,
        "777" : iflastisa,
        "780" : iflastisa,
        "785" : iflastisa,
        "786" : iflastisa,
        "787" : iflastisa,
        "800" : before0to5,
        "810" : before0to5,
        "811" : before0to5,
        "830" : before0to5,
        "850" : noPunctuation,
        "852" : noPunctuation,
        "856" : noPunctuation,
        "882" : noPunctuation,
        "880" : dependsonlinking,
        "886" : noPunctuation,
        "887" : noPunctuation,
        "901" : presumablyNoPunctuation,
        "995" : presumablyNoPunctuation,
        "CAT" : noPunctuation,
        "LOW" : noPunctuation,
        "SID" : noPunctuation,
    };


    function fixable(field) {
        if (field.type != 'datafield') { return 0; }
        
        if (field.subfields.length < 1) { return 0; }

        return 1;
    }
    
    function validate(recordModel, field, index) {

        if ( !fixable(field) ) { return; }

        var rule = punctuationRules[field.tag];

       if (!rule) {
            
            var msg = "Punctuation rules for field " + field.tag +
                " are not defined.";
            L.info(msg);

            return;

        }

        /*
        return validateByRule(rule,recordModel,field,index);

    }

    function validateByRule(rule, recordModel, field, index) {
*/
        var sfSequence = _.pluck(field.subfields,'code').join("");
        var lastSF = field.subfields[field.subfields.length-1];

        var last = lastSF.content;
        var options = {
            sfSequence : sfSequence,
            recordModel : recordModel,
            field : field,
            lastSF: lastSF,
            last: last,
            index: index
        };

        return rule(options);

    }

    function withPeriod(opts) {

        if (!hasTrailingCharOrSo(opts.last,".")) return Validation.warning(
            'There should be a trailing period(.) here.');

    }

    function withPeriodAtSubfield(sfIndex,opts) {

        var mySF = opts.field.subfields[sfIndex];
        var myContent = mySF.content;

        if (!hasTrailingCharOrSo(myContent,".")) return Validation.warning(
            'There should be a trailing period(.) at subfield ' +
            mySF.code + '.');

    }

    function noPunctuation(opts) {

        if (hasTrailingChar(opts.last,".")) return Validation.warning(
            'There should not be a trailing period(.) here.');

    }

    function presumablyNoPunctuation(opts) {

        // These fields are not listed in documentation,
        // but are presumed to be like this.

        return noPunctuation(opts);

    }

    function beforeyiflast(opts) {
        
        return potentiallybeforesubfield('y',opts);
        
    }

    function before5iflast(opts) {
        
        return potentiallybeforesubfield('5',opts);
        
    }

    function beforeuiflast(opts) {
        
        return potentiallybeforesubfield('u',opts);
        
    }

    function before7iflast(opts) {
        
        return potentiallybeforesubfield('7',opts);
        
    }

    function potentiallybeforesubfield(code,opts) {
        
        if (opts.lastSF.code == code) {

            return withPeriodAt(second2Last,opts);

        } else {

            return withPeriod(opts);

        }

    }

    function before2(opts) {

        return beforesubfields('2',opts);

    }

    function before0to5(opts) {

        return beforesubfields('012345',opts);

    }

    function beforesubfields(codes,opts) {

        var trailingPeriodAt = -1;

        for (var i = opts.sfSequence.length - 1; i > 0; i--) {

            if (codes.indexOf(opts.sfSequence[i]) != -1)
                trailingPeriodAt = i-1;

        }

        // If no proper place for trailing period was found, say nothing
        if (trailingPeriodAt == -1) return null;

        return withPeriodAtSubfield(trailingPeriodAt,opts);
        
    }

    function dependsonlinking(opts) {
        
        var lIndex = opts.sfSequence.indexOf('6');
        var l = opts.field.subfields[lIndex];

        if (!l) return Validation.warning(
            "Cannot figure out field linking from subfield 6.");

        var effectiveTag = l.content.substring(0,3);
        var rule = punctuationRules[effectiveTag];

        return validateByRule(rule,opts.recordModel,opts.field,opts.index);
        
    }

    var termsPunctuation = {
        ysa:false,
        gsafd:true,
    };

    function nothingToFinnishVocabularies(opts) {
        
        var sf2 = opts.recordModel.getSubfieldByCode(opts.field,"2");

        if (!sf2) return Validation.info(
            "Term source code (subfield 2) not specified." +
            " There should be a trailing period(.) for most common" +
            " foreign vocabularies.");
        
        var hasPeriod = termsPunctuation[sf2.content];

        if (hasPeriod === undefined) return Validation.info(
            "Term source code " + sf2.content + " not recognised." +
            " There should be a trailing period(.) for most common" +
            " foreign vocabularies.");

        for (var i in opts.field.subfields) {

            var sf = opts.field.subfields[i];

            if (sf.code == "2") continue;

            if (hasPeriod && !hasTrailingChar(sf.content,".")) {

                return Validation.warning(
                    "There should be a trailing period(.) for " +
                    sf2.content + " terms.");

            } else if (!hasPeriod && hasTrailingChar(sf.content,".")) {

                return Validation.warning(
                    "There should not be a trailing period(.) for " +
                    sf2.content + " terms.");

            }

        }


    }

    function iflastisa(opts) {
        
        if (opts.sfSequence[opts.sfSequence.length-1] == "a")
            return withPeriod(opts);
        
    }

    function afterb(opts) {

        for (var i in opts.field.subfields) {

            var sf = opts.field.subfields[i];
            if (sf.code == "b" && !hasTrailingCharOrSo(sf.content,"."))
                return Validation.warning(
                    "Subfield b should have trailing period (.)");
        }
        
    }

    function alsoafterpunctuation(opts) {
        
        // Should check for other 245 punctuation rules.

        if (!hasTrailingChar(opts.last,".")) return Validation.warning(
            'There should be a trailing period(.) in 245, also after other punctuations.');
        
    }

    function acolonbcommacperiod(opts) {
        
        // only cover the standard case
        if (opts.sfSequence != "abc") return;

        if (!hasTrailingChar(opts.field.subfields[0].content,":"))
            return Validation.warning(
                "Subfield \"a\" should have a trailing colon (:)");

        if (!hasTrailingChar(opts.field.subfields[1].content,","))
            return Validation.warning(
                "Subfield \"b\" should have a trailing comma (,)");

        if (!hasTrailingCharOrSo(opts.field.subfields[2].content,"."))
            return Validation.warning(
                "Subfield \"c\" should have a trailing period (.)");

    }

    function hasTrailingCharOrSo (s, ch) {

        var orSo = "!\"#%$&/()=<>[]{},.:;-*'";
        var last = s[s.length-1];

        return (last == ch) || (orSo.indexOf(last) != -1);

    }

    function hasTrailingChar (s, ch) { return s[s.length-1] == ch; }

    function fix (action, record, field, i) {


    }

    Validation.registerValidatorBundle(
        "Punctuation",
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
