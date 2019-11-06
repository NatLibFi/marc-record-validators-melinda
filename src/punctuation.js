import includes from 'lodash/includes';
import head from 'lodash/head';
import _ from 'lodash';
import createDebug from 'debug';

const debug = createDebug('marc-record-punctuation');

export default async function (recordType = 'BIBLIOGRAPHIC') {
	const rules = readPunctuationRulesFromJSON();

	function readPunctuationRulesFromJSON() {
		let json;
		if (recordType === 'BIBLIOGRAPHIC') {
			json = require('../src/bib-punctuation.json');
		} else {
			json = require('../src/auth-punctuation.json');
		}

		const rules = json.filter(row => row.selector !== '').map(row => {
			const {selector, namePortion, description, portion, preceedingPunctuation, exceptions} = row;
			return {
				selector: new RegExp(selector.replace(/X/g, '.')),
				namePortion: namePortion.replace(/\$/g, '').trim(),
				description, portion, preceedingPunctuation, exceptions
			};
		});

		return rules;
	}

	function fieldToString(field) {
		if (field && field.subfields) {
			const ind1 = field.ind1 || ' ';
			const ind2 = field.ind2 || ' ';
			const subfields = field.subfields.map(subfield => `‡${subfield.code}${subfield.value}`).join('');
			return `${field.tag} ${ind1}${ind2} ${subfields}`;
		}

		return `${field.tag}    ${field.value}`;
	}

	function validateField(field) {
		const testField = _.cloneDeep(field);
		const punctuated = punctuateField(testField, rules, recordType);
		if (!punctuated) {
			return true;
		}

		if (_.isEqual(punctuated, field)) {
			return true;
		}

		return false;
	}

	function punctuateField(field, rules, recordType) {
		debug(`Handling field ${field.tag}`);
		debug(`Field contents: ${fieldToString(field)}`);
		const rulesForField = getRulesForField(field.tag);
		if (rulesForField.length === 0) {
			debug(`No matching rules for field ${field.tag}`);
			return;
		}

		let currentPortion;
		let preceedingField;
		let inNamePortion = true;

		debug(`Field subfields: ${field.subfields.map(sub => sub.code)}`);
		debug(`Field portions: ${field.subfields.map(sub => getPortion(sub, rulesForField))}`);

		field.subfields.forEach(subfield => {
			debug(`Handling subfield ${subfield.code}`);
			let portion = getPortion(subfield, rulesForField);

			if (portion === 'CF' || portion === 'NC') {
				return;
			}

			if (inNamePortion && includes('T', 'S', portion)) {
				debug(`Portion changed to ${portion}. Not in name portion anymore`);
				inNamePortion = false;
			}

			if (inNamePortion && portion === 'NT') {
				portion = 'N';
			}

			if (!inNamePortion && portion === 'NT') {
				portion = 'T';
			}

			debug(`Current portion is ${portion}.`);

			if (currentPortion) {
				if (currentPortion === portion) {
					debug(`Current stayed as ${portion}. Adding punctuation for subfield.`);
					addSubfieldPunctuation(preceedingField, subfield, rulesForField);
				} else {
					debug(`Current portion changed to ${portion}.`);
					if (portion !== 'S') {
						debug('Adding punctuation for portion.');
						addNamePortionPunctuation(preceedingField);
					}
				}
			}

			currentPortion = portion;
			preceedingField = subfield;
		});

		if (recordType === 'BIBLIOGRAPHIC') {
			addNamePortionPunctuation(preceedingField);
		}

		debug(`After punctuation: ${fieldToString(field)}`);

		return field;
	}

	function getRulesForField(tag) {
		return rules.filter(rule => rule.selector.test(tag));
	}

	function getPortion(subfield, rules) {
		debug(`Looking for namePortion for ${subfield.code}`);
		const portions = rules.filter(rule => rule.namePortion === subfield.code).map(rule => rule.portion);

		if (portions.length === 0) {
			throw new Error(`Unknown subfield code ${subfield.code}`);
		}

		return head(portions).toUpperCase();
	}

	function addNamePortionPunctuation(preceedingSubfield) {
		const subfieldContainsPunctuation = /[?")\].\-!,]$/.test(preceedingSubfield.value);
		if (!subfieldContainsPunctuation) {
			const nextValue = preceedingSubfield.value + '.';
			debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
			preceedingSubfield.value = nextValue;
		}
	}

	function addSubfieldPunctuation(preceedingSubfield, currentSubfield, rules) {
		const punctType = getPrecedingPunctuation(currentSubfield, rules);
		const exceptionsFunctions = getExceptions(currentSubfield, rules);

		const isExceptionCase = exceptionsFunctions.some(fn => {
			return fn(preceedingSubfield);
		});

		if (isExceptionCase) {
			return;
		}

		const endsInPunctuation = /[?")\]\-!,]$/.test(preceedingSubfield.value);
		debug(`addSubfieldPunctuation -- punctType: ${punctType} endsInPunctuation: ${endsInPunctuation}`);

		if (!endsInPunctuation) {
			if (punctType === 'PERIOD' && !/\.$/.test(preceedingSubfield.value)) {
				const nextValue = preceedingSubfield.value + '.';
				debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
				preceedingSubfield.value = nextValue;
			}
		}

		if (punctType === 'COMMA') {
			if (!/,$/.test(preceedingSubfield.value)) {
				if (!/^[[(]/.test(currentSubfield.value)) {
					const nextValue = preceedingSubfield.value + ',';
					debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
					preceedingSubfield.value = nextValue;
				}
			}
		}

		if (punctType === 'COND_COMMA') {
			if (!/[-,]$/.test(preceedingSubfield.value)) {
				const nextValue = preceedingSubfield.value + ',';
				debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
				preceedingSubfield.value = nextValue;
			}
		}

		debug('addSubfieldPunctuation -- end');
	}

	function getPrecedingPunctuation(subfield, rules) {
		const punct = rules.filter(rule => rule.namePortion === subfield.code).map(rule => rule.preceedingPunctuation);

		if (punct.length === 0) {
			throw new Error(`Unknown subfield code ${subfield.code}`);
		}

		return head(punct).toUpperCase();
	}

	function getExceptions(subfield, rules) {
		const exceptions = rules.filter(rule => rule.namePortion === subfield.code).map(rule => parseExceptions(rule.exceptions));

		if (exceptions.length === 0) {
			throw new Error(`Unknown subfield code ${subfield.code}`);
		}

		return head(exceptions);
	}

	function parseExceptions(expectionsString) {
		const exceptionRules = expectionsString.split('\n');
		const exceptionFuncs = [];

		exceptionRules.forEach(exceptionRule => {
			const match = /- (.*) if preceded by (.*)/.exec(exceptionRule);
			if (match) {
				const [, type, preceededCode] = match;
				const normalizedType = type.trim().toUpperCase().trim();
				const normalizedCode = preceededCode.replace(/\$/g, '').trim();
				exceptionFuncs.push(ifPrecededByException(normalizedCode, normalizedType));
			}
		});

		return exceptionFuncs;
	}

	function ifPrecededByException(code, type) {
		return preceedingSubfield => {
			if (code === preceedingSubfield.code) {
				debug(`Adding ${type} to ${preceedingSubfield.code}`);
				if (type === 'SEMICOLON' && !/;$/.test(preceedingSubfield.value)) {
					const nextValue = preceedingSubfield.value + ' ;';
					debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
					preceedingSubfield.value = nextValue;
				}

				if (type === 'COLON' && !/:$/.test(preceedingSubfield.value)) {
					const nextValue = preceedingSubfield.value + ' :';
					debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
					preceedingSubfield.value = nextValue;
				}

				return true;
			}

			return false;
		};
	}

	async function validate(record) {
		return {valid: record.fields.every(validateField)};
	}

	async function fix(record) {
		record.fields.map(field => punctuateField(field, rules, recordType));
		return true;
	}

	return {
		description: 'Fixes punctuation of fields',
		validate,
		fix
	};
}
