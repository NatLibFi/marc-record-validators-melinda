// This field should be renamed, as it is called also from outside megre.

//import {MarcRecord} from '@natlibfi/marc-record';
import {fieldFixPunctuation} from '../punctuation2';
import {fieldRemoveDuplicateSubfields} from './removeDuplicateSubfields';

function postprocessBaseRecord(base) {

  base.fields.forEach(field => {
    // NB! Relator terms are now expanded and translated already at preprocess stage!

    // remove merge-specific information:
    if (field.merged) { // eslint-disable-line functional/no-conditional-statements
      // Field level ideas about things that could be done here:
      // - Fix indicators?
      // Record level fixes should be implemented as validators/fixers
      // in marc-record-validators-melinda and ust called from here.
      fieldRemoveDuplicateSubfields(field);
      fieldFixPunctuation(field); // NB! This will fix only fields with merged content
      delete field.merged; // eslint-disable-line functional/immutable-data
    }

    if (field.useExternalEndPunctuation) { // eslint-disable-line functional/no-conditional-statements
      delete field.useExternalEndPunctuation; // eslint-disable-line functional/immutable-data
    }

    if (field.added) { // eslint-disable-line functional/no-conditional-statements
      delete field.added; // eslint-disable-line functional/immutable-data
    }

    /*
    if (field.deleted) { // eslint-disable-line functional/no-conditional-statements
      delete field.deleted; // eslint-disable-line functional/immutable-data
    }
*/

  });
}


function removeDeletedFields(record) {
  // remove fields that are marked as deleted:
  record.fields = record.fields.filter(f => !f.deleted); // eslint-disable-line functional/immutable-data
}


export function postprocessRecords(base, source) {
  postprocessBaseRecord(base);
  removeDeletedFields(source); // So that we may know what was used, and what not.
}
