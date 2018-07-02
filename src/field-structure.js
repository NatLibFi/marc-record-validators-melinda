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
import {filter, forEach} from 'lodash';

export default async function (config) {
	// console.log("-------------------------------------------");
	// console.log("config: ", typeof config, " | ", config)
	if (!Array.isArray(config)) {
		throw new Error('Configuration array not provided');
	}

	configValid(config);

	return {
		description:
			'Checks whether the configured field-specific objects are valid in the record',
		validate: async record => ({
			valid: recordMatchPattern(record)
		})
	};

	//This checks that configuration is valid
	function configValid(config) {
		var excluded = [];
		config.forEach(obj => {
			excluded = []; //Validate fields: check that they are valid to confSpec (exists, correct data type), concat excluded elements
			Object.keys(obj).forEach(function(key) {
				if(!confSpec[key]) throw new Error('Configuration not valid - unidentified value: ' + key);
				if(confSpec[key].type === RegExp && !(obj[key] instanceof RegExp)
					|| confSpec[key].type === Boolean && !(obj[key] instanceof Boolean) ) throw new Error('Configuration not valid - invalid data type for: ' + key);
				if(confSpec[key].excl) excluded = excluded.concat(confSpec[key].excl);
			})

			//Check that no excluded elements are in use
			Object.keys(obj).forEach(function(key) {
				if(excluded.includes(key)) throw new Error('Configuration not valid - excluded element');
			})
		});
	}

	//This is used to validate record against config
	function recordMatchPattern(record) {
		//Parse trough every configuration object
		return config.every( confObj => {
			//Find all record objects matchin configuration object
			return record.get(confObj.tag).every( recordSubObj => { 
				//Validate check that every configuration field exists in record and matches configuration
				return Object.keys(confObj).every(confField => { 

					//Check that configuration field exists in record object
					if(!recordSubObj[confField]){
						console.log("!!! RecordSubObj not found: ", confField); 
						return false;
					} 

					//If configuration field is RegExp, test that record field matches it (leader, tag, valuePattern, ind*)
					if(confObj[confField] instanceof RegExp){
							return confObj[confField].test(recordSubObj[confField]);
					}
					
					else if(confField === 'strict'){
						console.log("Strict (boolean)");
					}
					
					//Check that subfield maxOccurence is not exceeded
					else if(confField === 'subfields'){
						var isValid = true;
						forEach(confObj[confField], function(val, key){
							if(filter(recordSubObj[confField], {code: key}).length > val.maxOccurrence) isValid=false;
						});
						return isValid;
					}
					
					else if(confField === 'dependencies'){
						console.log("Dependencies (Array)");
					}
					
					else{
						console.log("!!! Configuration field not identified: ", recordSubObj[confField], " | ", typeof recordSubObj[confField]);
						return false;
					}
				});
			});
		});
	}
}

//Configuration specification
const confSpec = {
	leader: { // Description: Leader pattern
		type: RegExp,
		excl: [
			'tag', 'valuePattern', 'subfields', 'ind1', 'ind2'
		]
	},
	tag: { // Description: Field tag pattern
 		type: RegExp
	},
	valuePattern:{ // Description: Pattern to which the field's value must match against
		type: RegExp,
		excl: [
			'leader', 'subfields', 'ind1', 'ind2'
		]
	},
	ind1: { // Description: Indicator-specific configuration object
		type: RegExp, //Array<Indicator>
		excl: [
			'leader', 'value'
		]
	},
	ind2: { // Description: Indicator-specific configuration object
		type: RegExp, //Array<Indicator>
		excl: [
			'leader', 'value'
		]
	},
	strict: { // Description: Only the specified subfields are allowed if set to true. Defaults to false.
		type: Boolean,
		excl: [
			'leader', 'valuePattern'
		]
	},
	subfields: { // Description: Subfields configuration
		type: Object, //Object<String, Subfield> (Keys are subfield codes)
		contains: [
			'String', 'subfieldSpec'
		],
		excl: [
			'leader', 'value'
		]
	},
	dependencies: { // Description: Dependencies configuration
		type: Array, //Array<Dependency>
		contains: 'dependencySpec'
	}
};

//Subfiled specification
const subSpec = {
	pattern: { // Description: Pattern to which the subfield's value must match against
		type: RegExp
	},
	required: { // Description: Whether the subfield is mandatory or not. Defaults to false
		type: Boolean
	},
	maxOccurrence: { // Description: Maximum number of times this subfield can occur. Defaults to unlimited if omitted. The value 0 means that the subfield cannot exist.
		type: Number
	}
}

//Dependency specification
const depSpec = {
	tag:{ // Description: Field tag pattern
		type: RegExp
	},
	ind1: { // Description: Pattern to which the indicator must match against
		type: RegExp,
		excl: [
			'value'
		]
	},
	ind2: { // Description: Pattern to which the indicator must match against
		type: RegExp,
		excl: [
			'value'
		]
	},
	valuePattern: { // Description: Pattern to which the field's value must match agains
		type: RegExp,
		excl: [
			'subfields', 'ind1', 'ind2'
		]
	},
	subfields: { // Description: An object with subfield codes as keys and RegExp patterns as values. The subfield value must this pattern.
		type: Object[String, RegExp],
		mandatory: false
	}
}