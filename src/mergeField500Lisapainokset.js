export default function () {

  // NB! We should and could handle ISNIs here as well.
  return {
    description: 'Merge 500 $a Lisäpainokset fields',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};
    mergeLisapainokset(record);
    return res;
  }

  function validate(record) {
    const relevantFields = getRelevantFields(record);
    if (relevantFields.length < 2) {
      return {message: [], 'valid': true}; // No action required
    }

    const printData = extractAllPrintData(relevantFields);
    if (printData.length === 0) {
      return {message: ['There are issues, but the fixer can not fix them!'], 'valid': false}; // No action required
    }

    return {message: [`Fixer can merge ${relevantFields.length} 500 $a Lisäpainokset fields into one`], 'valid': false};
  }
}


function getRelevantFields(record) {
  return record.fields.filter(field => validLisapainosField(field));
}

function validLisapainosField(field) {
  // We are only interested in field 500 with a lone $a subfield.
  // Especially $9 FENNI<KEEP> should not be merged!
  if (field.tag !== '500' || field.subfields.length !== 1 || field.subfields[0].code !== 'a') {
    return false;
  }
  return field.subfields[0].value.match(/^(?:Lisäpainokset|Lisäpainos): (?:[1-9][0-9]*\. (?:p\.|painos|uppl\.) [0-9]+\.)(?: - [1-9][0-9]*\. (?:p\.|painos|uppl\.) \[?[0-9]+\]?\.)*$/u);
}

function fieldToPrintsString(field) {
  // Could this just be something on the lines of s/^\S+ // ?
  return field.subfields[0].value.replace(/^(?:Lisäpainokset|Lisäpainos): /u, '').replace(/\.$/u, '');
}

const printPreference = ['painos', 'p.', 'upplaga', 'uppl.'];
function getPrintPreference(value) {
  return printPreference.findIndex(pp => pp === value);
}

function mergePrintData(value1, value2) {
  const [index1, print1, year1] = value1.split(' ');
  const [index2, print2, year2] = value2.split(' ');

  const betterIndex = index1 ? index1 : index2; // just to cheat eslint...

  // merge print1 and print2
  const betterPrint = getBetterPrint(print1, print2);
  if (!betterPrint) {
    return null;
  }

  const betterYear = getBetterYear(year1, year2);
  if (!betterYear) {
    return null;
  }

  return `${betterIndex} ${betterPrint} ${betterYear}`;

  function getBetterYear(y1, y2) {
    if (y1 === y2 || y2 === `[${y1}]`) {
      return y1;
    }
    if (y1 === `[${y2}]`) {
      return y2;
    }
    return null;
  }

  function getBetterPrint(print1, print2) {
    if (print1 === print2) {
      return print1;
    }

    const i1 = getPrintPreference(print1);
    const i2 = getPrintPreference(print2);
    if (i1 === -1 || i2 === -1) {
      return null;
    }
    if (i1 <= i2) {
      return printPreference[i1];
    }
    return printPreference[i2];
  }

}


function extractAllPrintData(relevantFields) {
  /* eslint-disable */
  // Gather data about 500 $a Lisäpainokset.*
  let allPrintData = [];
  let i;
  let j;
  for (i=0; i < relevantFields.length; i++) {
    const value = fieldToPrintsString(relevantFields[i]);
    const fieldsPrintData = value.split('. - ');
    for (j=0; j < fieldsPrintData.length; j++) {
      let currPrintData = fieldsPrintData[j];
      // Example value: "2. p. 2020"
      const [ printIndex ] = currPrintData.split('.');
      if (allPrintData[printIndex] !== undefined) {
        if (allPrintData[printIndex] !== currPrintData ) {
          const mergedPrintData = mergePrintData(allPrintData[printIndex], currPrintData);
          if (!mergedPrintData) {
            return []; // reason for for-loops: exit function from within nested loops
          }
          currPrintData = mergedPrintData;
        }
      }
      allPrintData[printIndex] = currPrintData;
    }
  };
  return allPrintData.filter(p => p !== undefined);
}


export function mergeLisapainokset(record) {
  const relevantFields = getRelevantFields(record);
  if (relevantFields.length < 2) {
    return;
  }

  /* eslint-disable */
  const collapsedArray = extractAllPrintData(relevantFields);
  if (collapsedArray.length === 0) {
    return;
  }

  const content = "Lisäpainokset: " + collapsedArray.join('. - ') + ".";

  relevantFields[0].subfields[0].value = content; // Keep the place 

  relevantFields.forEach((field, index) => {
    if (index > 0) {
      record.removeField(field);
      return;
    }
  });
  /* eslint-enable */
}
