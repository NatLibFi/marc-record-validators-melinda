import {MarcRecord} from '@natlibfi/marc-record';
import createDebug from 'debug';
import {autRules, bibRules} from './rules';

const debug = createDebug('@natlibfi/marc-record-validator-melinda/punctuation');

function cloneDeep(field) {
  const r = new MarcRecord();
  r.appendField(field);
  return r.get(field.tag)?.[0];
}

export default function () {
  function readPunctuationRulesFromJSON(recordType) {
    const json = getRules(recordType);
    const rules = json.filter(row => row.selector !== '').map(row => {
      const {selector, namePortion, description, portion, preceedingPunctuation, exceptions} = row;
      return {
        selector: new RegExp(selector.replace(/X/ug, '.'), 'u'),
        namePortion: namePortion.replace(/\$/ug, '').trim(),
        description, portion, preceedingPunctuation, exceptions
      };
    });

    return rules;
  }

  function getRules(recordType) {
    if (recordType === 'z') {
      return autRules;
    }

    return bibRules;
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

  function validateField(recordType = 'a') {
    return function (element) {
      const testField = cloneDeep(element);
      debug(`Original field: ${JSON.stringify(element)}`);
      const punctuated = punctuateField(testField, recordType);
      debug(`Punctuation result: ${JSON.stringify(punctuated)}`);
      if (!punctuated) {
        debug('No punctuation result -> true');
        return true;
      }

      if (MarcRecord.isEqual(punctuated, element)) {
        debug(`Original field (element): ${JSON.stringify(element)}`);
        debug('Punctuation result equals original field');
        return true;
      }

      return false;
    };
  }

  function punctuateField(field, recordType) {
    const rules = readPunctuationRulesFromJSON(recordType);
    debug(`Handling field ${field.tag}`);
    debug(`Field contents: ${fieldToString(field)}`);
    const rulesForField = getRulesForField(field.tag, rules);
    if (rulesForField.length === 0) {
      debug(`No matching rules for field ${field.tag}`);
      return;
    }

    let currentPortion; // eslint-disable-line functional/no-let
    let preceedingField; // eslint-disable-line functional/no-let
    let inNamePortion = true; // eslint-disable-line functional/no-let

    debug(`Field subfields: ${field.subfields.map(sub => sub.code)}`);
    debug(`Field portions: ${field.subfields.map(sub => getPortion(sub, rulesForField))}`);

    field.subfields.forEach(subfield => {
      debug(`Handling subfield ${subfield.code}`);
      let portion = getPortion(subfield, rulesForField); // eslint-disable-line functional/no-let

      if (portion === 'CF' || portion === 'NC') {
        return;
      }

      if (inNamePortion && portion.includes('T', 'S')) { // eslint-disable-line functional/no-conditional-statement
        debug(`Portion changed to ${portion}. Not in name portion anymore`);
        inNamePortion = false;
      }

      if (inNamePortion && portion === 'NT') { // eslint-disable-line functional/no-conditional-statement
        portion = 'N';
      }

      if (!inNamePortion && portion === 'NT') { // eslint-disable-line functional/no-conditional-statement
        portion = 'T';
      }

      debug(`Current portion is ${portion}.`);

      if (currentPortion) {
        if (currentPortion === portion) { // eslint-disable-line functional/no-conditional-statement
          debug(`Current stayed as ${portion}. Adding punctuation for subfield.`);
          addSubfieldPunctuation(preceedingField, subfield, rulesForField);
        } else {
          debug(`Current portion changed to ${portion}.`);
          if (portion !== 'S') { // eslint-disable-line functional/no-conditional-statement
            debug('Adding punctuation for portion.');
            addNamePortionPunctuation(preceedingField);
          }
        }
      }

      currentPortion = portion;
      preceedingField = subfield;
    });

    if (recordType !== 'z') { // eslint-disable-line functional/no-conditional-statement
      addNamePortionPunctuation(preceedingField);
    }

    debug(`After punctuation: ${fieldToString(field)}`);

    return field;
  }

  function getRulesForField(tag, rules) {
    return rules.filter(rule => rule.selector.test(tag));
  }

  function getPortion(subfield, rules) {
    debug(`Looking for namePortion for ${subfield.code}`);
    const [portion] = rules.filter(rule => rule.namePortion === subfield.code).map(rule => rule.portion);

    if (portion === undefined) {
      throw new Error(`Unknown subfield code ${subfield.code}`);
    }

    return portion.toUpperCase();
  }

  function addNamePortionPunctuation(preceedingSubfield) {
    const subfieldContainsPunctuation = (/[?")\].\-!,]$/u).test(preceedingSubfield.value);
    if (!subfieldContainsPunctuation) { // eslint-disable-line functional/no-conditional-statement
      const nextValue = `${preceedingSubfield.value}.`;
      debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
      preceedingSubfield.value = nextValue; // eslint-disable-line functional/immutable-data
    }
  }

  function addSubfieldPunctuation(preceedingSubfield, currentSubfield, rules) {
    const punctType = getPrecedingPunctuation(currentSubfield, rules);
    const exceptionsFunctions = getExceptions(currentSubfield, rules);

    const isExceptionCase = exceptionsFunctions.some(fn => fn(preceedingSubfield));

    if (isExceptionCase) {
      return;
    }

    const endsInPunctuation = (/[?")\]\-!,]$/u).test(preceedingSubfield.value);
    debug(`addSubfieldPunctuation -- punctType: ${punctType} endsInPunctuation: ${endsInPunctuation}`);

    if (!endsInPunctuation) {
      if (punctType === 'PERIOD' && !(/\.$/u).test(preceedingSubfield.value)) { // eslint-disable-line functional/no-conditional-statement
        const nextValue = `${preceedingSubfield.value}.`;
        debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
        preceedingSubfield.value = nextValue; // eslint-disable-line functional/immutable-data
      }
    }

    if (punctType === 'COMMA') {
      if (!(/,$/u).test(preceedingSubfield.value)) {
        if (!(/^[[(]/u).test(currentSubfield.value)) { // eslint-disable-line functional/no-conditional-statement
          const nextValue = `${preceedingSubfield.value},`;
          debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
          preceedingSubfield.value = nextValue; // eslint-disable-line functional/immutable-data
        }
      }
    }

    if (punctType === 'COND_COMMA') {
      if (!(/[-,]$/u).test(preceedingSubfield.value)) { // eslint-disable-line functional/no-conditional-statement
        const nextValue = `${preceedingSubfield.value},`;
        debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
        preceedingSubfield.value = nextValue; // eslint-disable-line functional/immutable-data
      }
    }

    if (punctType === 'SPACECOLON') {
      if (!(/:$/u).test(preceedingSubfield.value)) { // eslint-disable-line functional/no-conditional-statement
        const nextValue = `${preceedingSubfield.value} :`;
        debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
        preceedingSubfield.value = nextValue; // eslint-disable-line functional/immutable-data
      }
      if ((/[^ ]:$/u).test(preceedingSubfield.value)) { // eslint-disable-line functional/no-conditional-statement
        const nextValue = `${preceedingSubfield.value.slice(0, -1)} :`;
        debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
        preceedingSubfield.value = nextValue; // eslint-disable-line functional/immutable-data
      }

    }

    debug('addSubfieldPunctuation -- end');
  }

  function getPrecedingPunctuation(subfield, rules) {
    const [punct] = rules.filter(rule => rule.namePortion === subfield.code).map(rule => rule.preceedingPunctuation);

    if (punct === undefined) {
      throw new Error(`Unknown subfield code ${subfield.code}`);
    }

    return punct.toUpperCase();
  }

  function getExceptions(subfield, rules) {
    const [exception] = rules.filter(rule => rule.namePortion === subfield.code).map(rule => parseExceptions(rule.exceptions));

    if (exception === undefined) {
      throw new Error(`Unknown subfield code ${subfield.code}`);
    }

    return exception;
  }

  function parseExceptions(expectionsString) {
    const exceptionRules = expectionsString.split('\n');
    const exceptionFuncs = [];

    exceptionRules.forEach(exceptionRule => {
      const match = (/- (.*) if preceded by (.*)/u).exec(exceptionRule); // eslint-disable-line prefer-named-capture-group
      if (match) { // eslint-disable-line functional/no-conditional-statement
        const [, type, preceededCode] = match;
        const normalizedType = type.trim().toUpperCase().trim();
        const normalizedCode = preceededCode.replace(/\$/ug, '').trim();
        exceptionFuncs.push(ifPrecededByException(normalizedCode, normalizedType)); // eslint-disable-line functional/immutable-data
      }
    });

    return exceptionFuncs;
  }

  function ifPrecededByException(code, type) {
    return preceedingSubfield => {
      if (code === preceedingSubfield.code) {
        debug(`Adding ${type} to ${preceedingSubfield.code}`);
        if (type === 'SEMICOLON' && !(/;$/u).test(preceedingSubfield.value)) { // eslint-disable-line functional/no-conditional-statement
          const nextValue = `${preceedingSubfield.value} ;`;
          debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
          preceedingSubfield.value = nextValue; // eslint-disable-line functional/immutable-data
        }

        if (type === 'COLON' && !(/:$/u).test(preceedingSubfield.value)) { // eslint-disable-line functional/no-conditional-statement
          const nextValue = `${preceedingSubfield.value} :`;
          debug(`Updated subfield ${preceedingSubfield.code} from '${preceedingSubfield.value}' to '${nextValue}'`);
          preceedingSubfield.value = nextValue; // eslint-disable-line functional/immutable-data
        }

        return true;
      }

      return false;
    };
  }

  function validate(record) {
    return {valid: record.fields.every(validateField(record.leader[6]))};
  }

  function fix(record) {
    record.fields.map(field => punctuateField(field, record.leader[6]));
    return true;
  }

  return {
    description: 'Fixes punctuation of fields',
    validate,
    fix
  };
}
