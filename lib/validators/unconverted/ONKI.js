/*
 * Onki.js -- checks terms from Onki/Finto.
 *
 * Copyright (c) Kansalliskirjasto
 * All Rights Reserved.
 *
 * Authors: Juho? (initial author),
 *          Nicholas Volk <nicholas.volk@helsinki.fi> (current maintainer)
 *
 * NB! We had/have some kind of a socket problem here, when going through tens of keywords asyncronously.
 */


define([
    "core/Validation",
    "core/TagTable",
    "mustache",

    ( typeof window === "undefined" && typeof global === 'object' ? "http" : "jquery" ),
    ], function (Validation,TagTable,Mustache,$) {
        "use strict";

/*
    var template = ' Try {{#results}}<a href="{{uri}}">{{label}}</a>' +
        '{{^last}}, {{/last}}{{/results}}' +
        '{{#more}}, <a href="{{link}}">...</a>{{/more}}';
        */
    var cached = {};
    //var onkiURL = "/onki/";
    var onkiTags = {
        "648" : true,
        "650" : true,
        "651" : true,
        "654" : true,
        "655" : true,
        "656" : true,
        "657" : true,
        "658" : true,
        "662" : true,
    };

    function cachedValidate(recordModel, field, index, cb) {

        var tag = field.tag;

        if (!onkiTags[tag]) return;

        var sf = (recordModel.getSubfieldByCode(field,"a") || {}).content;


        // search from cache
        for ( var key in cached ) {

            var c = cached[key];

            if (c && c.tag == tag && c.sf == sf) return c.res;

        }

        var res = validate (recordModel, field, index, function (res) {

            cached[index] = { tag: tag, sf: sf, res: res };
            cb(res);

        });

        console.info("NVV");
        console.info("RES");
        if (res) return res;


    }

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

    function validate(recordModel, field, index, cb) {
        var sf2 = recordModel.getSubfieldByCode(field,"2");

        if ( !sf2 || sf2.content != "ysa") { return; }

        var sfa = recordModel.getSubfieldByCode(field,"a");

        if (!sfa) return;


        //onkiURL = "http://onki.fi/key-58b159a541ffe839d5372cb57e7faa9d/"; // 
        //var url = onkiURL + "api/v2/http/onto/ysa/search";
        var url = "http://api.finto.fi/rest/v1/ysa/lookup"; // ?lang=fi"; // &label=j%C3%A4ljittely

        console.info("ONKI.js validate("+url+"\t"+sfa.content+")");

        var onOff = 0;

        if ( typeof window === "undefined" && typeof global === 'object' ) { // NodeJS
            var hostname = "api.finto.fi";
            var path = "/rest/v1/ysa/lookup?lang=fi&label="+encodeURIComponent(sfa.content);
            var getOptions = {
                agent: false,
                //hostname : hostname,
                host : hostname,
                //port: port,  // 8992,
                path : path,
                method: 'GET',
            };

            // NB: variable '$' is actually http, not jQuery object!
            $.get(getOptions, dataLoader(function(data) {
                if ( data === "" ) {
                    console.info("NO ONKI INPUT");
                    cb(Validation.warning("ONKI returns empty string"));
                }
                else if ( data.indexOf("{") === 0 ) {
                    console.info("ONKI hit "+sfa.content);
                    cb(null);
                }
                else {
                    var msg = "ONKI unknown error:\n"+data;
                    if ( data.indexOf("404 ") === 0 ) {
                        msg = "\"" + sfa.content + "\" is not a \"" + sf2.content + "\" term.";
                    }
                    console.info(msg);
                    cb(Validation.error(msg));
                }

            }));
        }
        else {
            $.get(url,{'label':sfa.content,'lang':'fi'})
                .done(function (data) {
                    console.info("CB(null)");
                    cb(null);

            } )
            .error( function (jqXHR, textStatus, errorThrown) {
                console.info("RACE2");
                if ( jqXHR.responseText === "404 Not Found : Could not find label '"+sfa.content+"'" ) {
                    var msg = "\"" + sfa.content + "\" is not a \"" + sf2.content + "\" term.";
                    console.info("onki CB(error)");  
                    cb(Validation.error(msg));
                }
                else {
                    // default failure:
                    console.info("onki CB(warning)");
                    cb(Validation.warning("Error while querying ONKI for "+sfa.content+". "+errorThrown +":"+textStatus+"\n"+jqXHR.responseText));
                }
            } );
        }
            /*
        if ( onOff ) {
            console.info("AJAX Async");
            $.ajaxSetup({async: true});
        }
        */
        console.info("RACE1");
        //console.info("nvtest"+sfa.content);
        return Validation.pending("Validating ONKI...");

    }

    function fix (action, recordModel, field, index) {
        // Korjata ei osata.
        // Poistaminen vs korjaus, mahdotonta sanoa.
        // Ei siis tehdä mitään.
        // Joku ISO/UTF8-tarkistus voisi tulla kyseeseen, mutta kannattaisi ehkä 
        // tehdä jossain toisessa validaattorissa. 
    }

    Validation.registerValidatorBundle(
        "ONKI",
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
