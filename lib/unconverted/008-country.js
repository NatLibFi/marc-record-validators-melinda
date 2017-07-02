/**
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
    define(['@natlibfi/es6-polyfills/lib/polyfills/object', '@natlibfi/marc-record-validate/lib/utils'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('@natlibfi/es6-polyfills/lib/polyfills/object'), require('@natlibfi/marc-record-validate/lib/utils'));
  }

}(this, factory));

function factory(Object, utils)
{

  'use strict';

  var COUNTRY_CODES_MAP = {
    'abc': 'xxc', // Alberta => Canada
    'ac ': 'at ', // Ashmore- ja Cartiersaaret => Australia
    'aca': 'at ', // Australian Capital Territory
    'air': 'ai ', // Armenia
    'ajr': 'ar ', // Azerbaizan
    'aku': 'xxu', // alaska, us
    'alu': 'xxu', // alabama, us
    'aru': 'xxu', // arkansas, us
    'azu': 'xxu', // arizona, us
    'bcc': 'xxc', // brittiläinen columbia, canada
    'bwr': 'bw ', // valkovenäjä
    'cau': 'xxu', // kalifornia, us
    'cn ': 'xxc', // canada
    'cou': 'xxu', // colorado, us
    'cp ': 'gb ', // canton ja enderbury => kiribati
    // 'cs ' ei osata pilkkoa tsekiksi ja slovakiaksi
    'ctu': 'xxu', // connecticut, us
    'cz ': 'pn ', // canal zone, panama
    'dcu': 'xxu', // district of columbia
    'deu': 'xxu', // delaware
    // eritreaa ei osata irroittaa etiopiasta
    'enk': 'xxk', // englanti, GB
    'err': 'er ', // SNT Viro
    'flu': 'xxu', // FLorida, US
    'gau': 'xxu', // Georgia, US
    'ge ': 'gw ', // Itä-Saksa => Saksa
    // gn: ei osata pilkkoa kiribatin ja tuvalun välillä
    'gsr': 'gs ', // Georgia (SNT)
    'hiu': 'xxu', // Havaiji, US
    'hk ': 'cc ', // Hong Kong => Kiina
    'iau': 'xxu', // Iowa, US
    'idu': 'xxu', // Idaho, US
    'ilu': 'xxu', // Illinois, US
    'inu': 'xxu', // Indiana, US
    // iu: israel tai syyria, ei voi tietää
    // iw: israel tai jordania, ei voi tietää
    'jm ': 'no ', // Jan Mayen, Norja
    'kgr': 'kg ', // Kirgisia
    'ksu': 'xxu', // Kansas, US
    'kyu': 'xxu', // Kentucky, US
    'kzr': 'kz ', // Kazakstan
    'lau': 'xxu', // Louisiana
    'lir': 'li ', // Liettua
    'ln ': 'gb ', // Eteläisen linesaaret/Kiribati
    'lvr': 'lv ', // Latvia
    'mau': 'xxu', // Massachusetts, US
    'mbc': 'xxc', // Manitoba, CAN
    'mdu': 'xxu', // Maryland, US
    'meu': 'xxu', // Maine
    'mh ': 'cc ', // Macao => Kiina
    'miu': 'xxu', // Michigan, US
    'mnu': 'xxu', // Minnesota, US
    'mou': 'xxu', // Missouri, US
    'msu': 'xxu', // Missisippi, US
    'mtu': 'xxu', // Montana, US
    'mvr': 'mv ', // Moldova
    'nbu': 'xxu', // Nebraska
    'ncu': 'xxu', // North Carolina
    'ndu': 'xxu', // North Dakota
    'nfc': 'xxc', // Newfloundland and Labrador
    'nhu': 'xxu', // New Hampshire
    'nik': 'xxk', // Northern Ireland
    'nju': 'xxu', // New Jersey
    'nku': 'xxu', // New Brunswick
    'nm ': 'nw ', // Northern Mariana Islands
    'nmu': 'xxu', // New Mexico
    'nsc': 'xxc', // Nova Scotia
    'ntc': 'xxc', // North West Territories
    'nuc': 'xxc', // Nunavut
    'nvu': 'xxu', // Nevada, US
    'nyu': 'xxu', // New York, US
    'ohu': 'xxu', // Ohio, US
    'oku': 'xxu', // Oklahoma, US
    'onc': 'xxc', // Ontario, Canada
    'oru': 'xxu', // Oregon, US
    'pau': 'xxu', // Pennsylvania, US
    'pic': 'xxc', // Prince Edward Island, CAN
    'pt ': 'io ', // Portugalin Timor => Indonesia
    'qea': 'at ', // Queensland, Australia
    'qec': 'xxc', // Quebec, Canada
    'riu': 'xxu', // Rhode Island, US
    'rur': 'ru ', // Russia
    'ry ': 'ja ', // Et. Riukiu-saaret, Japani
    'sb ': 'no ', // Huippuvuoret, Norja
    'scu': 'xxu', // Etelä-Carolina, US
    'sdu': 'xxu', // Etelä-Dakota, US
    'sk ': 'ii ', // Sikkim, Intia
    'snc': 'xxc', // Sascatchewan, Canada
    'stk': 'xxk', // Skotlanti
    'sv ': 'ho ', // Swan-saaret, Honduras
    'tar': 'ta ', // tadzikistan
    'tkr': 'tk ', // turkmenistan
    'tma': 'at ', // Tasmania, Australia
    'tnu': 'xxu', // Tennessee, US
    // tt => xe, fm, nw, pw
    'txu': 'xxu', // Teksas, US
    'ui ': 'uik', // Brit. saaret
    'uk ': 'xxk', // United Kingdom
    'unr': 'un ', // Ukraina
    'urr': 'xxr', // Neukkula (molemmat wanhentuneet)
    'us ': 'xxu', // US
    'utu': 'xxu', // Utah, US
    'uzr': 'uz ', // Uzbekistan
    'vau': 'xxu', // Virginia
    'vn ': 'vm ', // Pohjois-Vietnam => Vietnam
    'vra': 'at ', // Victoria, Australia
    'vs ': 'vm ', // Etelä-Vietnam => Vietnam
    'vtu': 'xxu', // Vermont, US
    'wau': 'xxu', // Washington, US
    'wb ': 'gw ', // West Berlin, Germany
    'wea': 'at ', // West Australia => Australia
    'wiu': 'xxu', // Wisconsin, US
    'wlk': 'xxu', // Wales, UK
    'wvu': 'xxu', // West Virginia, US
    'wyu': 'xxu', // Wyoming, US
    'xga': 'at ', // Korallimeren saaret, Australia
    // xi => xd/am
    'xna': 'at ', // NSW, Australia
    'xoa': 'at ', // Pohj.-Territorio, Australia
    'xra': 'at ', // South Australia
    // xxr => ai/aj/gs/kz...
    'ykc': 'xxc', // Yokon, Canada
    'ys ': 'ye ' // Yemen
    // yu => rb/mo
  };

  function getFields(record)
  {    
    return record.fields.filter(function(field) {

      var country_code;

      if (field.tag === '008') {
        country_code = field.value.substring(15, 18);
        return COUNTRY_CODES_MAP.hasOwnProperty(country_code);
      }

    });
  }

  return {
    validate: function(record)
    {
      return getFields(record).map(function(field) {        
        return {
          tag: field.tag,
          messages: [utils.validate.warning('Language code should be modified in 008/15-17')]
        };
      });
    },
    fix: function(record) {
      return getFields(record).map(function(field) {

        var country_code = field.value.substring(15,18),
        value = field.value.substring(0, 15) + COUNTRY_CODES_MAP[country_code] + field.value.substring(18);

        return {
          tag: field.tag,
          modifications: [utils.fix.modifyFieldValue(field, value)]
        };
        
      });
    }
  };

}
