/*
 * Checks for authorized forms
 *
 */


define([
    "core/Validation",
    "core/TagTable",
    "mustache",
    "jquery",

    ], function (Validation,TagTable,Mustache,$) {

    var template = ' Try {{#results}}<a href="{{uri}}">{{label}}</a>' +
        '{{^last}}, {{/last}}{{/results}}' +
        '{{#more}}, <a href="{{link}}">...</a>{{/more}}';
    var cached = {};
    var onkiURL = "/onki/";
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
        var sf = (recordModel.getSubfieldByCode(field,"a") || {}).content;
        var maxI = recordModel.getFields().length;

        if (!onkiTags[tag]) return;

        // search from cache
        for ( var key in cached ) {

            var c = cached[key];

            if (c && c.tag == tag && c.sf == sf) return c.res;

        }

        var res = validate (recordModel, field, index, function (res) {

            cached[index] = { tag: tag, sf: sf, res: res };
            cb(res);

        });

        if (res) return res;


    }

    function validate(recordModel, field, index, cb) {

        var sf2 = recordModel.getSubfieldByCode(field,"2");
        var sfa = recordModel.getSubfieldByCode(field,"a");

        if (!sf2 || !sfa) return;

        if (sf2.content != "ysa") return;

        var url = onkiURL + "api/v2/http/onto/ysa/search";
        $.get(url,{'q':sfa.content,'h':5})
            .done( function (data) {

                var result = Validation.warning;
                var html;
                var msg = "";

                if (data.results.length === 0) {

                    msg = "\"" + sfa.content + "\" is not a \"" +
                        sf2.content + "\" term.";

                } else {

                    data.more = data.metadata.moreHitsAmount > 0 ?
                        [{link: "http://onki.fi/fi/browser/search?q=" +
                            encodeURIComponent(sfa.content) + "&os=" +
                            sf2.content}]:
                        false;

                    for (var i = 0; i < data.results.length; i++) {

                        data.results[i].last = (i == data.results.length - 1);

                    }

                    var exact = (data.results[0].label == sfa.content);

                    if (exact) {

                        /*
                        var r = data.results[0];
                        msg = "Valid " + sf2.content + " term.";
                        html = " <a href=\"" + r.uri + "\">" + r.label + "</a>";
                        result = Validation.info;
                        */
                        result = function () { return null; };

                    } else {

                        msg = "Not a correct " + sf2.content + " term.";
                        html = Mustache.render(template,data);

                    }
                }

                cb(result(msg,undefined,html));

            } )
            .error( function () {
                cb(Validation.warning("Error while querying ONKI."));
            } );

        return Validation.pending("Validating...");

    }

    function fix (action, recordModel, field, index) {

    }

    Validation.registerValidatorBundle(
        "Authority",
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
