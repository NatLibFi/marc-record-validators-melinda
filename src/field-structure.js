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
			valid: recordMatchesConfig(record, config, false)
		})
	};


	//This checks that configuration is valid
	function configValid(config) {
		var excluded = [];
		config.forEach(obj => {
			excluded = []; //Validate fields: check that they are valid to confSpec (exists, correct data type), concat excluded elements
			
			forEach(obj, function(val, key){
				configMatchesSpec(val, key, confSpec)

				//Concat all excluded elements to array
				if(confSpec[key].excl) excluded = excluded.concat(confSpec[key].excl);
			});

			//Check that no excluded elements are in use
			forEach(obj, function(val, key) {
				if(excluded.includes(key)) throw new Error('Configuration not valid - excluded element');
			})
		});
	};

	//Recursive validator
	function configMatchesSpec(data, key, spec){
		//Field not found in valid configuration spec
		if(!spec[key]) throw new Error('Configuration not valid - unidentified value: ' + key);
				
		//If configuration type does not match type in valid configuration spec
		if( typeof data !== spec[key].type && 
			(spec[key].type === 'RegExp' && !(data instanceof RegExp))) throw new Error('Configuration not valid - invalid data type for: ' + key);
	
		//Check subfields/dependencies recursively
		if( key === 'subfields' || key === 'dependencies' ){
			forEach(data, function(subObj){
				//Dependency.subfields is one level, config.subfields two level...
				if( key === 'subfields' && typeof subObj !== 'object'){
					if(!(subObj instanceof RegExp)) throw new Error('Configuration not valid - invalid data type for: ' + key);
				}else{
					forEach(subObj, function(subVal, subKey){							
						//'required' used in conf spec is actually 'mandatory' in marc
						if(subKey === 'mandatory') subKey = 'required';
						configMatchesSpec(subVal, subKey, (key === 'subfields') ? subSpec : depSpec)
					})
				}
			})
		}
	}


	//This is used to validate record against config
	function recordMatchesConfig(record, conf, dependencies) {
		//Parse trough every element of configuration array
		var res = conf.every( confObj => {
			if(confObj['dependencies']){								
				return confObj['dependencies'].every( dependency => {
					return recordMatchesConfigElement(record, dependency.tag, confObj, dependencies);
				});
			}else{
				return recordMatchesConfigElement(record, confObj.tag, confObj, dependencies);
			}
		});
		return res;
	}
	

	function recordMatchesConfigElement(record, searchedField, confObj, dependencies){
		//Find all record objects matching provided configuration object
		return record.get(searchedField).every( recordSubObj => { 
			//Validate check that every configuration field exists in record and matches configuration
			return Object.keys(confObj).every(confField => { 
				
				//Check that configuration field exists in record object
				if((!recordSubObj[confField])
					&& (confField === 'valuePattern' && !recordSubObj['value'])){
					console.log("!!! RecordSubObj not found: ", confField); 
					return false;
				}

				//If configuration field is RegExp, test that record field matches it (valuePattern, leader, tag, ind*)
				if( confObj[confField] instanceof RegExp){
					//'valuePattern' used in conf spec is actually 'value' in marc
					if(confField === 'valuePattern') return confObj[confField].test(recordSubObj['value']);
					if(confField === 'leader') return confObj[confField].test(record.leader);
					return confObj[confField].test(recordSubObj[confField]);
				}

				//Only the specified subfields are allowed if set to true. Defaults to false. (this ic checked at subfields)
				else if(confField === 'strict') return true;
				
				//Check that subfield stuff
				else if(confField === 'subfields'){
					var strict = confObj['strict'] || false,
					elementsTotal = 0,
					matching = [],
					length = 0,
					valid = true;
			
					forEach(confObj['subfields'], function(val, key){
						matching = filter(recordSubObj['subfields'], {code: key});
						length = matching.length;
						elementsTotal += length; //Calculate amount of record objects matching all confObj objects
						
						if(length > val.maxOccurrence) valid = false;
						if((confObj.mandatory || dependencies) && length === 0) valid = false;
						if(val.pattern){
							forEach(matching, function(field){
								if(!val.pattern.test(field.value)) valid = false;
							})
						}
					});
			
					//Check if there is less valid calculated objects than objects in subfield object => some not matching strict
					if(strict && elementsTotal < recordSubObj['subfields'].length) return false;

					return valid;
				}

				//Recursive check for dependicies
				else if(confField === 'dependencies'){
					return recordMatchesConfig(record, confObj[confField], true);
				}
				
				else{
					console.log("!!! Configuration field not identified: ", recordSubObj[confField], " | ", typeof recordSubObj[confField]);
					return false;
				}
			});
		});
	}
}


//Configuration specification
const confSpec = {
	leader: { // Description: Leader pattern
		type: 'RegExp',
		excl: [
			'tag', 'valuePattern', 'subfields', 'ind1', 'ind2'
		]
	},
	tag: { // Description: Field tag pattern
 		type: 'RegExp'
	},
	valuePattern:{ // Description: Pattern to which the field's value must match against
		type: 'RegExp',
		excl: [
			'leader', 'subfields', 'ind1', 'ind2'
		]
	},
	ind1: { // Description: Indicator-specific configuration object
		type: 'RegExp', //Array<Indicator>
		excl: [
			'leader', 'value'
		]
	},
	ind2: { // Description: Indicator-specific configuration object
		type: 'RegExp', //Array<Indicator>
		excl: [
			'leader', 'value'
		]
	},
	strict: { // Description: Only the specified subfields are allowed if set to true. Defaults to false.
		type: 'boolean',
		excl: [
			'leader', 'valuePattern'
		]
	},
	subfields: { // Description: Subfields configuration
		type: 'object', //Object<String, Subfield> (Keys are subfield codes)
		contains: [
			'String', 'subfieldSpec'
		],
		excl: [
			'leader', 'value'
		]
	},
	dependencies: { // Description: Dependencies configuration
		type: 'array', //Array<Dependency>
		contains: 'dependencySpec'
	}
};

//Subfiled specification
const subSpec = {
	pattern: { // Description: Pattern to which the subfield's value must match against
		type: 'RegExp'
	},
	required: { // Description: Whether the subfield is mandatory or not. Defaults to false
		type: 'boolean'
	},
	maxOccurrence: { // Description: Maximum number of times this subfield can occur. Defaults to unlimited if omitted. The value 0 means that the subfield cannot exist.
		type: 'number'
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