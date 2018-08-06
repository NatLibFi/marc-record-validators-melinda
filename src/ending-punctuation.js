/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * MARC record validators used in Melinda
 *
 * Copyright (C) 2014-2018 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of marc-record-validators-melinda
 *
 * marc-record-validators-melinda program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * marc-record-validators-melinda is distributed in the hope that it will be useful,
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
 */

'use strict';
import {find, forEach} from 'lodash';

export default async function () {
		return {
		description:
			'Checks whether punctuation is valid',
		validate: async record => ({
			valid: validateCommas(record)
		})
	};

	////////////////////////////////////////////
	//This is used to validate record against configuration
	function validateCommas(record) {
		console.log("******************* Start *******************");
		// console.log("Record: ", record);
		var res = null,
			tag = null,
			valid = true,
			puncChar = null;

		if(!record.fields) return false;
		record.fields.forEach(field => {
			tag = parseInt(field.tag, 10);
			console.log("-----------------------");
			console.log("Field: ", field);

			//Find configuration object matching tag:
			res = find(confSpec, function(o) { return o.index === tag || (o.rangeStart <= tag && o.rangeEnd >= tag) })
			//Configuration not found, should not happen
			if(!res){ 
				valid = false;
				return false; 
			} 
			console.log("Punc rule: ", res.punc);
			console.log("----");
			
			//Field does not have subfields, no parsing to be done
			if(!field.subfields) return;
			field.subfields.forEach(subField => {
				console.log("subField: ", subField, " is not control field: ", isNaN(subField.code));
				if(isNaN(subField.code)){ //Not control field
					if(!subField.value) return; //Does not have value
					puncChar = validPuncStr.includes(subField.value.slice(-1)); //If string ends to punctuation char
					//((res.punc && !puncChar) || (!res.punc && puncChar)) ? valid = false : valid = true;
					
					if( (res.punc && !puncChar) || (!res.punc && puncChar)){
						//Insert punctuation repair here
						console.log("!!!! Invalid punctuation");
						valid = false;
					}else{
						console.log("Valid punctuation")
					}
				}
			})
		});
		console.log("***************** End: *****************");
		return valid;
	}
	////////////////////////////////////////////
}

const validPuncStr = '?"-!,)].';

//Configuration specification
const confSpec = [
	{ // 010-035	EI	 
		rangeStart: 10,
		rangeEnd: 35,
		index: null,
		punc: false,
		special: null
	},{ //	036	KYLLÄ	vain osakentän $b jälkeen
		rangeStart: null,
		rangeEnd: null,
		index: 36,
		punc: true,
		special: "vain osakentän $b jälkeen"
	},{ //	037-050	EI	 
		rangeStart: 37,
		rangeEnd: 50,
		index: null,
		punc: false,
		special: null
	},{ //	051	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 51,
		punc: true,
		special: null
	},{ //	052-09X	EI
		rangeStart: 52,
		rangeEnd: 99,
		index: null,
		punc: false,
		special: null
	},{ //	100	KYLLÄ
		rangeStart: null,
		rangeEnd: null,
		index: 100,
		punc: true,
		special: null
	},{ //	110	KYLLÄ
		rangeStart: null,
		rangeEnd: null,
		index: 110,
		punc: true,
		special: null
	},{ //	111	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 111,
		punc: true,
		special: null
	},{ //	130	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 130,
		punc: true,
		special: null
	},{ //	210	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 210,
		punc: false,
		special: null
	},{ //	222	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 222,
		punc: false,
		special: null
	},{ //	240	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 240,
		punc: false,
		special: null
	},{ //	242	KYLLÄ	Jos viimeinen osakenttä on $y, piste on ennen sitä
		rangeStart: null,
		rangeEnd: null,
		index: 242,
		punc: true,
		special: "Jos viimeinen osakenttä on $y, piste on ennen sitä"
	},{ //	243	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 243,
		punc: false,
		special: null
	},{ //	245	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 245,
		punc: true,
		special: null
	},{ //	246-247	EI	 
		rangeStart: 246,
		rangeEnd: 247,
		index: null,
		punc: false,
		special: null
	},{ // 	250	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 250,
		punc: true,
		special: null
	},{ //	254-258	KYLLÄ	 
		rangeStart: 254,
		rangeEnd: 258,
		index: null,
		punc: true,
		special: null
	},{ //	260	KYLLÄ	Pääsääntö: $a : $b, $c. Tarkista eri poikkeukset ja välimerkitys MARC 21 Full -versiosta
		rangeStart: null,
		rangeEnd: null,
		index: 260,
		punc: true,
		special: "Pääsääntö: $a : $b, $c. Tarkista eri poikkeukset ja välimerkitys MARC 21 Full -versiosta"
	},{ //	263	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 263,
		punc: false,
		special: null
	},{ //	264	KYLLÄ	Tarkista poikkeukset MARC 21 -sovellusohjeesta
		rangeStart: null,
		rangeEnd: null,
		index: 264,
		punc: true,
		special: "Tarkista poikkeukset MARC 21 -sovellusohjeesta"
	},{ //	270	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 270,
		punc: false,
		special: null
	},{ //	300	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 300,
		punc: false,
		special: null
	},{ //	306	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 306,
		punc: false,
		special: null
	},{ //	307	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 307,
		punc: true,
		special: null
	},{ //	310	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 310,
		punc: false,
		special: null
	},{ //	321	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 321,
		punc: false,
		special: null
	},{ //	336-338	EI	 
		rangeStart: 336,
		rangeEnd: 338,
		index: null,
		punc: false,
		special: null
	},{ //	340	KYLLÄ	Vain joidenkin osakenttien jälkeen. Tarkista osakentät MARC 21 Full -versiosta
		rangeStart: null,
		rangeEnd: null,
		index: 340,
		punc: true,
		special: null
	},{ //	342	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 342,
		punc: false,
		special: null
	},{ //	343	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 343,
		punc: true,
		special: null
	},{ //	344-348	EI	 
		rangeStart: 344,
		rangeEnd: 348,
		index: null,
		punc: false,
		special: null
	},{ //	351-352	KYLLÄ	 
		rangeStart: 351,
		rangeEnd: 352,
		index: null,
		punc: true,
		special: null
	},{ //	355	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 355,
		punc: false,
		special: null
	},{ //	357	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 357,
		punc: false,
		special: null
	},{ //	362	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 362,
		punc: true,
		special: null
	},{ //	363	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 363,
		punc: false,
		special: null
	},{ //	365-366	EI	 
		rangeStart: 365,
		rangeEnd: 366,
		index: null,
		punc: false,
		special: null
	},{ //	370	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 370,
		punc: false,
		special: null
	},{ //	377	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 377,
		punc: false,
		special: null
	},{ //	380-388	EI	 
		rangeStart: 380,
		rangeEnd: 388,
		index: null,
		punc: false,
		special: null
	},{ //	490	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 490,
		punc: false,
		special: null
	},{ //	500-509	KYLLÄ	 
		rangeStart: 500,
		rangeEnd: 509,
		index: null,
		punc: true,
		special: null
	},{ //	510	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 510,
		punc: false,
		special: null
	},{ //	511-518	KYLLÄ	 
		rangeStart: 511,
		rangeEnd: 518,
		index: null,
		punc: true,
		special: null
	},{ //	520	KYLLÄ	Jos viimeinen osakenttä on $u, piste on ennen sitä
		rangeStart: null,
		rangeEnd: null,
		index: 520,
		punc: true,
		special: null
	},{ //	521-526	KYLLÄ	 
		rangeStart: 521,
		rangeEnd: 526,
		index: null,
		punc: true,
		special: null
	},{ //	530	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 530,
		punc: true,
		special: null
	},{ //	533-534	KYLLÄ	 
		rangeStart: 533,
		rangeEnd: 534,
		index: null,
		punc: true,
		special: null
	},{ //	535-536	EI	 
		rangeStart: 535,
		rangeEnd: 536,
		index: null,
		punc: false,
		special: null
	},{ //	538	KYLLÄ	Jos viimeinen osakenttä on $u, piste on ennen sitä
		rangeStart: null,
		rangeEnd: null,
		index: 538,
		punc: true,
		special: null
	},{ //	540-541	KYLLÄ	 
		rangeStart: 540,
		rangeEnd: 541,
		index: null,
		punc: true,
		special: null
	},{ //	542	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 542,
		punc: false,
		special: null
	},{ //	544-547	KYLLÄ	 
		rangeStart: 544,
		rangeEnd: 547,
		index: null,
		punc: true,
		special: null
	},{ //	550	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 550,
		punc: true,
		special: null
	},{ //	552	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 552,
		punc: true,
		special: null
	},{ //	555-556	KYLLÄ	 
		rangeStart: 555,
		rangeEnd: 556,
		index: null,
		punc: true,
		special: null
	},{ //	561-563	KYLLÄ	 
		rangeStart: 561,
		rangeEnd: 563,
		index: null,
		punc: true,
		special: null
	},{ //	565	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 565,
		punc: false,
		special: null
	},{ //	567	KYLLÄ osakentän $a jälkeen, EI muiden osakenttien jälkeen
		rangeStart: null,
		rangeEnd: null,
		index: 567,
		punc: true,
		special: "KYLLÄ osakentän $a jälkeen, EI muiden osakenttien jälkeen"
	},{ //	580-581	KYLLÄ	 
		rangeStart: 580,
		rangeEnd: 581,
		index: null,
		punc: true,
		special: null
	},{ //	583	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 583,
		punc: false,
		special: null
	},{ //	584-585	KYLLÄ	 
		rangeStart: 584,
		rangeEnd: 585,
		index: null,
		punc: true,
		special: null
	},{ //	586	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 586,
		punc: false,
		special: null
	},{ //	588	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: null,
		punc: true,
		special: null
	},{ //	59X	EI	 
		rangeStart: 590,
		rangeEnd: 599,
		index: null,
		punc: false,
		special: null
	},{ //	600	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 600,
		punc: true,
		special: null
	},{ //	610	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 610,
		punc: true,
		special: null
	},{ //	611	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 611,
		punc: true,
		special: null
	},{ //	630	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 630,
		punc: true,
		special: null
	},{ //	647-651	 	EI suomalaisten sanastojen termeihin, muihin sanaston käytännön mukaan, yleensä KYLLÄ
		rangeStart: 647,
		rangeEnd: 651,
		index: null,
		punc: false,
		special: null
	},{ //	653	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 653,
		punc: false,
		special: null
	},{ //	654-662	 	EI suomalaisten sanastojen termeihin, muihin sanaston käytännön mukaan, yleensä KYLLÄ
		rangeStart: 654,
		rangeEnd: 662,
		index: null,
		punc: false,
		special: null
	},{ //	69X	EI	 
		rangeStart: 690,
		rangeEnd: 699,
		index: null,
		punc: false,
		special: null
	},{ //	700	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 700,
		punc: true,
		special: null
	},{ //	710	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 710,
		punc: true,
		special: null
	},{ //	711	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 711,
		punc: true,
		special: null
	},{ //	720	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 720,
		punc: false,
		special: null
	},{ //	730	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 730,
		punc: true,
		special: null
	},{ //	740	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 740,
		punc: true,
		special: null
	},{ //	751	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 751,
		punc: false,
		special: null
	},{ //	752	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 752,
		punc: true,
		special: null
	},{ //	753	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 753,
		punc: false,
		special: null
	},{ //	754	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 754,
		punc: true,
		special: null
	},{ //	758	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 758,
		punc: false,
		special: null
	},{ //	760-787	 	KYLLÄ osakentän $a jälkeen, EI muiden osakenttien jälkeen
		rangeStart: 760,
		rangeEnd: 787,
		index: null,
		punc: true,
		special: null
	},{ //	800	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 800,
		punc: true,
		special: null
	},{ //	810	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 810,
		punc: true,
		special: null
	},{ //	811	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 811,
		punc: true,
		special: null
	},{ //	830	KYLLÄ	 
		rangeStart: null,
		rangeEnd: null,
		index: 830,
		punc: true,
		special: null
	},{ //	850	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 850,
		punc: false,
		special: null
	},{ //	852	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 852,
		punc: false,
		special: null
	},{ //	856	EI	 
		rangeStart: null,
		rangeEnd: null,
		index: 856,
		punc: false,
		special: null
	},{ //	880	Samoin kuin vastaavat kentät	 
		rangeStart: null,
		rangeEnd: null,
		index: 880,
		punc: null,
		special: null
	},{ //	882-887	EI	 
		rangeStart: 882,
		rangeEnd: 887,
		index: null,
		punc: false,
		special: null
	},{ //	9XX	EI	 
		rangeStart: 900,
		rangeEnd: 999,
		index: null,
		punc: false,
		special: null
	}
]