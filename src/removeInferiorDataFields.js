//import createDebugLogger from 'debug';
import {fieldToChain, sameField} from './removeDuplicateDataFields.js';
import {fieldGetOccurrenceNumberPairs, fieldHasValidSubfield6, fieldSevenToOneOccurrenceNumber, fieldsToNormalizedString} from './subfield6Utils.js';
import {fieldHasSubfield, fieldsToString, fieldToString, /*nvdebug,*/ uniqArray} from './utils.js';
import {fieldHasValidSubfield8} from './subfield8Utils.js';
import {encodingLevelIsBetterThanPrepublication, fieldRefersToKoneellisestiTuotettuTietue, getEncodingLevel} from './prepublicationUtils.js';
import {cloneAndNormalizeFieldForComparison} from './normalizeFieldForComparison.js';
import {fixComposition, precomposeFinnishLetters} from './normalize-utf8-diacritics.js';

// Relocated from melinda-marc-record-merge-reducers (and renamed)

// NB! This validator handles only full fields, and does not support subfield $8 removal.
// Also, having multiple $8 subfields in same fields is not supported.
// If this functionality is needed, see removeDuplicateDatafields.js for examples of subfield-only stuff.

// const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda:removeInferiorDataFields');
//const debugData = debug.extend('data');
//const debugDev = debug.extend('dev');

export default function () {
  return {
    description: 'Remove subset data fields. Certain exceptions apply, mainly too complicated for chained fields',
    validate, fix
  };

  function fix(record) {
    //nvdebug('Fix record: remove inferior (eg. subset) data fields', debugDev);
    const res = {message: [], fix: [], valid: true};
    removeInferiorDatafields(record, true);
    // This can not really fail...
    return res;
  }

  function validate(record) {
    // Check max, and check number of different indexes
    //nvdebug('Validate record: remove inferior (eg. subset) data fields', debugDev);

    const duplicates = removeInferiorDatafields(record, false);

    const res = {message: duplicates};

    res.valid = res.message.length < 1;
    return res;
  }
}


function deriveInferiorChains(fields, record) {
  //nvdebug(`======= GOT ${fields.length} FIELDS TO CHAINIFY`, debugDev);
  const hash = {};

  fields.forEach(f => fieldToChainToDeletables(f));

  return hash;

  //nvdebug(`WP1: GOT ${todoList.length} CHAINS`, debugDev);


  // here we map deletableStringObject[str] => field. The idea is to help debugging. We don't actually need the field object...
  //return deriveChainDeletables(todoList);

  function fieldToChainToDeletables(field) {
    const chain = fieldToChain(field, record);
    if (chain.length < 2) {
      return;
    }
    const chainAsString = fieldsToNormalizedString(chain, 0, true, true);
    const arr = deriveChainDeletables([chainAsString]);
    //nvdebug(`GOT ${arr.length} DELETABLES FOR ${chainAsString}`, debugDev);
    arr.forEach(val => {
      if (!(val in hash)) {
        hash[val] = field;
      }
    });
  }

  function deriveChainDeletables(todoList, deletables = []) {
    const [chainAsString, ...stillToDo] = todoList;
    if (chainAsString === undefined) {
      return deletables;
    }

    // Fix MRA-476 (part 1): one $6 value can be worse than the other
    const withoutScriptIdentificationCode = chainAsString.replace(/( ‡6 [0-9X][0-9][0-9]-(?:XX|[0-9]+))\/[^ ]+/u, '$1');

    // Remove keepless versions:
    const keepless = chainAsString.replace(/ ‡9 [A-Z]+<KEEP>/u, '');

    // MRA-433: 490 ind1=1 vs ind1=0: remove latter (luckily no 2nd indicator etc)
    const linked490Ind1 = chainAsString.replace(/^490 1/u, '490 0').replace(/\t880 1/ug, '\t880 0');
    const arr = [withoutScriptIdentificationCode, keepless, linked490Ind1].filter(val => val !== chainAsString);
    if (arr.length > 0) {
      return deriveChainDeletables([...stillToDo, ...arr], [...deletables, ...arr]);
    }

    return deriveChainDeletables(stillToDo, deletables);
  }

}

function isRelevantChain6(field, record) {
  //Can't be a chain:
  if (!fieldHasValidSubfield6(field) && !fieldHasValidSubfield8(field)) {
    return false;
  }
  // Too short to be a chain:
  const chain = fieldToChain(field, record);
  if (chain.length < 2) {
    return false;
  }
  // No field can contains no more than one subfield $6
  if (chain.some(f => f.subfields.filter(sf => sf.code === '6').length > 1)) {
    return false;
  }

  // Check whether our field is the head of a chain:
  return sameField(field, chain[0]);
}

export function removeInferiorChains(record, fix = true) {
  const fields = record.fields.filter(f => isRelevantChain6(f, record));
  //nvdebug(`WP2.0: GOT ${fields.length} chain(s)`, debugDev);

  const deletableChainsAsKeys = deriveInferiorChains(fields, record);
  const nChains = Object.keys(deletableChainsAsKeys).length;
  //nvdebug(`WP2: GOT ${nChains} chain(s)`, debugDev);
  if (nChains === 0) {
    return [];
  }

  //nvdebug(`removeInferiorChains() has ${fields.length} fields-in-chain(s), and a list of ${nChains} deletable(s)`, debugDev);

  return innerRemoveInferiorChains(fields);

  function innerRemoveInferiorChains(fields, deletedStringsArray = []) {
    const [currField, ...remainingFields] = fields;

    if (currField === undefined) {
      return deletedStringsArray;
    }

    const chain = fieldToChain(currField, record);
    if (chain.length === 0 || !sameField(currField, chain[0])) {
      return innerRemoveInferiorChains(remainingFields, deletedStringsArray);
    }

    const chainAsString = fieldsToNormalizedString(chain, 0, true, true);
    if (!(chainAsString in deletableChainsAsKeys)) {
      return innerRemoveInferiorChains(remainingFields, deletedStringsArray);
    }

    const triggeringField = deletableChainsAsKeys[chainAsString];
    const triggeringChain = fieldToChain(triggeringField, record);

    // If the inferior (deletable) chain is 1XX-based, convert the triggering better chain from 7XX to 1XX:
    if (chainContains1XX(chain)) {
      triggeringChain.forEach(f => sevenToOne(f, triggeringChain));
    }
    //nvdebug(`iRIS6C: ${chainAsString}`, debugDev);
    const deletedString = fieldsToString(chain);
    const message = `DEL: '${deletedString}'  REASON: '${fieldsToString(triggeringChain)}'`;
    if (fix) {
      //nvdebug(`INFERIOR $6 CHAIN REMOVAL: ${message}}`, debugDev);
      chain.forEach(field => record.removeField(field));
    }
    return innerRemoveInferiorChains(remainingFields, [...deletedStringsArray, message]);
  }

  function chainContains1XX(chain) {
    return chain.some(f => f.tag.substring(0, 1) === '1');
  }

  function sevenToOne(field, chain) { // Change 7XX field to 1XX field. Also handle the corresponding 880$6 7XX-NN subfields
    // NB! This function should be called only if the original 1XX gets deleted!
    if (!['700', '710', '711', '730'].includes(field.tag)) {
      return;
    }
    // Retag field 7XX as 1XX and fix corresponding occurrence numbers as well:
    const pairs = fieldGetOccurrenceNumberPairs(field, chain);
    field.tag = `1${field.tag.substring(1)}`;
    // There should always be one pair, but I'm not sanity-checking this
    pairs.forEach(pairedField => fieldSevenToOneOccurrenceNumber(pairedField));
  }

}


function getIdentifierlessAndKeeplessSubsets(fieldAsString) {
  // The rules below are not perfect (in complex cases they don't catch all permutations), but good enough:
  // Remove identifier(s) (MELKEHITYS-2383-ish):

  const identifierlessString = fieldAsString.replace(/ ‡[01] [^‡]+($| ‡)/u, '$1');
  const keeplessString = fieldAsString.replace(/ ‡9 [A-Z]+<KEEP>/u, '');

  return [identifierlessString, keeplessString].filter(val => val !== fieldAsString);
}

function deriveIndividualDeletables490(todoList, deletables = []) {
  const [fieldAsString, ...stillToDo] = todoList;
  if (fieldAsString === undefined) {
    return deletables;
  }
  //nvdebug(`PROCESS ${fieldAsString}`, debugDev);
  if (!fieldAsString.match(/^490/u)) {
    return deriveIndividualDeletables490(stillToDo, deletables);
  }

  // $6-less version (keep this first)
  const sixless = fieldAsString.replace(/ ‡6 [^‡]+ ‡/u, ' ‡');

  // Without final $v or $x:
  const withoutFinalVOrX = fieldAsString.replace(/ *[;,] ‡[vx] [^‡]+$/u, '');
  // Add intermediate $x-less version
  const xless = fieldAsString.replace(/, ‡x [^‡]+(, ‡x| ; ‡v)/u, '$1');

  // Add $xv-less version (handled by recursion?)
  const xvless = fieldAsString.replace(/, ‡x [^‡]+ ‡v [^‡]+$/u, '');

  // MRA-433-ish (non-chain): 490 ind1=1 vs ind1=0: remove latter
  const modifiedInd2 = fieldAsString.match(/^490 1/u) ? `490 0${fieldAsString.substring(5)}` : fieldAsString;

  const arr = [sixless, withoutFinalVOrX, xless, xvless, modifiedInd2].filter(val => val !== fieldAsString);

  /*
  if (arr.length) {
    nvdebug(`${arr.length} derivation(s) for ${fieldAsString}`, debugDev);
    nvdebug(arr.join('\n'), debugDev);
  }
  */
  return arr;
}

// eslint-disable-next-line max-lines-per-function
function deriveIndividualDeletables(record) {
  const todoList = record.fields.map(f => fieldToString(f));
  //const finishedRecord = encodingLevelIsBetterThanPrepublication(getEncodingLevel(record));

  const deletableStringsArray = processTodoList(todoList);

  const inferiorTerms = getInferiorTerms(record);

  return uniqArray([...deletableStringsArray, ...inferiorTerms]);

  function getInferiorTerms(record) {
    const inputFields = record.fields.filter(f => ['648', '650', '651'].includes(f.tag) && f.subfields);
    const result = inputFields.flatMap(f => fieldToInferiorFields(f));

    // console.log(result.join('\n')); // eslint-disable-line no-console
    return result;
  }

  function fieldToInferiorFields(field) {
    const aArray = field.subfields.filter(sf => sf.code === 'a');
    if (field.tag === '650') {
      return aArray.flatMap(sf => [`653 ## ‡a ${sf.value}`, `653 #0 ‡a ${sf.value}`]);
    }
    return aArray.map(sf => `653 ## ‡a ${sf.value}`);
  }

  function processTodoList(thingsToDo, deletables = []) {
    const [currString, ...stillToDo] = thingsToDo;

    if (currString === undefined) {
      return deletables;
    }

    const accentless = getAccentlessVersion(currString);
    const d490 = deriveIndividualDeletables490([currString]);
    const subsets = getIdentifierlessAndKeeplessSubsets(currString);
    const moreToDo = [...accentless, ...d490, ...subsets];


    if (currString.match(/^[1678]00/u)) {
      // Proof-of-concept rule. Should be improved eventually...
      if (currString.match(/, ‡e [^‡]+\.$/u)) {
        const tmp = currString.replace(/, ‡e [^‡]+\.$/u, '.');
        return processTodoList([tmp, ...stillToDo, ...moreToDo], [...deletables, tmp]);
      }
    }

    if (currString.match(/^505 .0.*-- ‡t/u)) { // MRA-413-ish
      const tmp = currString.replace(/ -- ‡t /gu, ' -- '). // remove non-initial $t subfields
        replace(/ ‡[rg] /gu, ' '). // remove $r and $g subfields
        replace(/ ‡t /u, ' ‡a '). // change first $t to $a
        // ind2: '1' => '#':
        replace(/^505 (.)0/u, '505 $1#');
      if (tmp !== currString) {
        return processTodoList([tmp, ...stillToDo, ...moreToDo], [...deletables, tmp]);
      }
      //nvdebug(`505 ORIGINAL: '${fieldAsString}'`, debugDev)
      //nvdebug(`505 DERIVATE: '${tmp}'`, debugDev)
    }

    const inferiorFunctions = [ getPrepublicationTerms, getInferior341, getAiBased, getMelkehitys3147, getMet831, getMet569 ];

    const inferiorTerms = getInferiorTerms(inferiorFunctions); //getPrepublicationTerms(currString);

    const newDeletables = [...deletables, ...subsets, ...accentless, ...d490, ...inferiorTerms];

    return processTodoList([...stillToDo, ...moreToDo], newDeletables);

    function getInferiorTerms(functions, results = []) {
      const [currFunction, ...remainingFunctions] = functions;
      if (!currFunction) {
        return results
      }
      const newDeletables = currFunction(currString);
      return getInferiorTerms(remainingFunctions, [...results, ...newDeletables]);
    }

    function getMet569(string) {
      if (string.match(/^500 ## ‡a Lisäpainokset: Lisäpainos /u)) { // MET-569
        const tmp1 = string.replace(' Lisäpainos ', ' [Lisäpainos] ');
        const tmp2 = string.replace(' Lisäpainos ', ' ');
        if (tmp1 !== string && tmp2 !== string) { // Should not happen, just a sanity check
          return [tmp1, tmp2];
        }
      }

      if (string.match(/^500 ## ‡a Lisäpainokset: \[Lisäpainos\] /u)) { // MET-569
        const tmp = string.replace(' [Lisäpainos] ', ' ');
        if (tmp !== string) { // Should not happen, just a sanity check
          return [tmp];
        }
      }
      return [];
    }

    function getMet831(string) { // MET-381
      // MET-381: remove occurence number TAG-00, if TAG-NN existists
      if (string.match(/^880.* ‡6 [0-9][0-9][0-9]-(?:[1-9][0-9]|0[1-9])/u)) {
        const tmp = string.replace(/( ‡6 [0-9][0-9][0-9])-[0-9]+/u, '$1-00');
        //nvdebug(`MET-381: ADD TO DELETABLES: '${tmp}'`, debugDev);
        //deletableStringsArray.push(tmp);
        if (tmp.match(/ ‡6 [0-9][0-9][0-9]-00\/[^ ]+ /u)) {
          const tmp2 = tmp.replace(/( ‡6 [0-9][0-9][0-9]-00)[^ ]+/u, '$1');
          //nvdebug(`MET-381: ADD TO DELETABLES: '${tmp2}'`, debugDev);
          return [tmp, tmp2];
        }
        return [tmp];
      }
      return [];
    }

    function getMelkehitys3147(string) {
      if (string.match(/^500 ## ‡a Ei vastaanotettu\.$/u)) { // MELKEHITYS-3147
        return ['500 ## ‡a EI VASTAANOTETTU.'];
      }
      if (string.match(/^500 ## ‡a Ei ilmesty\.$/u)) { // MELKEHITYS-3147
        return ['500 ## ‡a EI ILMESTY.'];
      }

      if (string.match(/^594 ## ‡a Ei vastaanotettu ‡5 FENNI$/u)) { // MELKEHITYS-3147
        return ['594 ## ‡a EI VASTAANOTETTU ‡5 FENNI'];
      }
      if (string.match(/^594 ## ‡a Ei ilmesty ‡5 FENNI$/u)) { // MELKEHITYS-3147
        return ['594 ## ‡a EI ILMESTY ‡5 FENNI'];
      }
      return [];
    }

  }

  function getAiBased(string) { // MELKEHITYS-3277-ish: non-AI is better than AI (a rare case where longer version is inferior):
    return [`${string} ‡7 (dpenmw)AI`];
  }
  
  function getAccentlessVersion(string) { // MET-527
    //nvdebug(`START: '${string}`, debugDev);
    // This is a sanity check: if precomposition does something, there's something wrong, and we don't want to proceed..
    if (string !== precomposeFinnishLetters(string)) {
      return [];
    }
    const accentless = String(fixComposition(string)).replace(/\p{Diacritic}/gu, '');
    //nvdebug(`FROM '${string}'\n  TO '${accentless}'`, debugDev);
    if (accentless === string) { // Don't self-destruct
      return [];
    }
    return [accentless];
  }

  function getPrepublicationTerms(fieldAsString) {
    const subfield7Prepub = `${fieldAsString} ‡7 Ennakkotieto`
    if (fieldAsString.match(/^653./u)) {
      // MET-528 (extented by MET-575)
      return [subfield7Prepub, `${fieldAsString} ‡g ENNAKKOTIETO`, `${fieldAsString} ‡g Ennakkotieto`, `${fieldAsString} ‡g ennakkotieto`, `${fieldAsString} ‡g ENNAKKOTIETO.`, `${fieldAsString} ‡g Ennakkotieto.`, `${fieldAsString} ‡g ennakkotieto.`];
    }

    return [subfield7Prepub];
  }

  function getInferior341(fieldAsString) { // MET-783
    if (fieldAsString.match(/^341 .. ‡a textual ‡[bcdef].* ‡2 sapdv(?:$| ‡)/u)) {
      return ['341 ## ‡a textual ‡2 sapdv', '341 1# ‡a textual ‡2 sapdv', '341 0# ‡a textual ‡2 sapdv'];
    }
    if (fieldAsString.match(/^341 .. ‡a auditory ‡[bcdef].* ‡2 sapdv(?:$| ‡)/u)) {
      return ['341 ## ‡a auditory ‡2 sapdv', '341 1# ‡a auditory ‡2 sapdv', '341 0# ‡a auditory ‡2 sapdv'];
    }
    return [];
  }

}

function fieldToNormalizedString(field) {
  const normalizedField = cloneAndNormalizeFieldForComparison(field);
  return fieldToString(normalizedField);
}

function deriveIndividualNormalizedDeletables(record) { //  MET-461:
  const encodingLevel = getEncodingLevel(record);
  const recordIsFinished = encodingLevelIsBetterThanPrepublication(encodingLevel);
  const met495 = encodingLevel === '2' && record.fields.some(f => f.tag === '500' && fieldRefersToKoneellisestiTuotettuTietue(f));
  if (!recordIsFinished || met495) {
    return [];
  }
  const relevantFields = record.fields.filter(f => ['245', '246'].includes(f.tag) && fieldHasSubfield(f, 'a'));

  return deriveDeletable946s(relevantFields);

  function deriveDeletable946s(fields, results = []) {
    const [currField, ...remainingFields] = fields;
    if (currField === undefined) {
      return results;
    }

    const fieldAsNormalizedString = fieldToNormalizedString(currField);
    const tmp = fieldAsNormalizedString.replace(/^(?:...) ../u, '946 ##'). // <= Change tag to 946 and indicators to '##'
      replace(' ‡a ', ' ‡i nimeke onixissa ‡a '). // Add $i before $a. NB! This is added in the normalized lower-cased form!
      replace(/(?: \/)? ‡c[^‡]+$/u, ''); // Remove $c. (Can $c be non-last?)
    const candArray = [tmp, `${tmp} ‡5 MELINDA`].filter(val => val !== fieldAsNormalizedString);
    if (candArray.length) {
      return deriveDeletable946s(remainingFields, [...results, ...candArray]);
    }
    return deriveDeletable946s(remainingFields, results);
  }
}

export function removeIndividualInferiorDatafields(record, fix = true) { // No $6 nor $8 in field
  const deletableFieldsAsStrings = deriveIndividualDeletables(record);
  const deletableFieldsAsNormalizedStrings = deriveIndividualNormalizedDeletables(record);

  // nvdebug(`Deletables:\n ${deletableFieldsAsStrings.join('\n ')}`, debugDev);
  // nvdebug(`Normalized deletables:\n ${deletableFieldsAsNormalizedStrings.join('\n ')}`, debugDev);

  const hits = record.fields.filter(field => isDeletableField(field));

  const deletedFieldsAsStrings = hits.map(f => fieldToString(f));

  if (fix) {
    hits.forEach(field => {
      //nvdebug(`Remove inferior field: ${fieldToString(field)}`, debugDev);
      record.removeField(field);
    });
  }

  return deletedFieldsAsStrings;

  function isDeletableField(field) {
    const fieldAsString = fieldToString(field);
    if (deletableFieldsAsStrings.includes(fieldAsString)) {
      return true;
    }
    const fieldAsNormalizedString = fieldToNormalizedString(field);
    if (deletableFieldsAsNormalizedStrings.includes(fieldAsNormalizedString)) {
      return true;
    }

    return false;
  }
}


export function removeInferiorDatafields(record, fix = true) {
  const removables = removeIndividualInferiorDatafields(record, fix); // Lone fields
  //const removables8 = removeDuplicateSubfield8Chains(record, fix); // Lone subfield $8 chains
  const removables6 = removeInferiorChains(record, fix); // Lone subfield $6 chains
  // HOW TO HANDLE $6+$8 combos? Skipping is relatively OK.

  //nvdebug(`REMOVABLES:\n  ${removables.join('\n  ')}`, debugDev);
  //nvdebug(`REMOVABLES 6:\n  ${removables6.join('\n  ')}`, debugDev);

  const removablesAll = removables.concat(removables6); //.concat(removables8);

  return removablesAll;
}
