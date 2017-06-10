/*
008n ja 041n ensimmäisen kielikoodin täytyy olla sama. Poikkeuksen muodostaa koodi zxx: jos tietueen 008ssa on kielikoodi zxx (ei kielellistä sisältöä), tietueessa ei voi olla 041 a- eikä d-osakenttää.
*/
define([
    "core/Validation",
    ], function (Validation) {

    var REsubfieldCodesOfLanguagesIn041 = /[abdefghjkmn]/;
    var REzxxBad = /[ad]/;

    function validate(recordModel, field) {

        var recordType = recordModel.getRecordType();

        if (field.tag == '008') {

            var lang = getLang008(field.content);
            var lang041 = getLang041();

            if (lang == "zxx") return;

            if (!lang041) return Validation.error( "Language code \"" +
                lang + "\" must be repeated in first 041 field.");

            if (lang041 !== lang) return Validation.error( "Language code \"" +
                lang + "\" does not match " + lang041 + " in field 041." );

        } else if (field.tag == '041') {

            var lang008 = getLang008();

            if (lang008 != "zxx") return;

            for (var i in field.subfields) {

                if (REzxxBad.exec(field.subfields[i].code))
                    return Validation.error("041 mustn't contain subfields" +
                        " a or d if language code in 008 is zxx.");

            }

        } 

        return null;
        
        function getLang008(content) {

            if (content === undefined) {

                var field = recordModel.getFieldByTag("008");
                content = field ? field.content : "";

            }

            return content.substring(35,38);

        }

        function getLang041() {

            var fields = recordModel.getFieldsByTag("041");

            for (var i in fields) {

                var field = fields[i];

                for (var j in field.subfields) {

                    var sf = field.subfields[j];

                    if (REsubfieldCodesOfLanguagesIn041.exec(sf.code)) {

                        return sf.content;

                    }

                }

            }

        }

    }


    function fix () {

    }

    Validation.registerValidatorBundle(
        "LangCodesMatch",
        validate,
        fix,
        'field-global');

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
