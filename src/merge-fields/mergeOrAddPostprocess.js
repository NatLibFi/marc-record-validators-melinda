// This field should be renamed, as it is called also from outside megre.

//import {MarcRecord} from '@natlibfi/marc-record';
import {fieldFixPunctuation} from '../punctuation2';
import {fieldRemoveDuplicateSubfields} from './removeDuplicateSubfields';
import {sortAdjacentSubfields} from '../sortSubfields';
import {sortAdjacentRelatorTerms} from '../sortRelatorTerms';

function postprocessBaseRecord(base) {

  base.fields.forEach(field => {
    // NB! Relator terms are now expanded and translated already at preprocess stage!

    // remove merge-specific information:
    if (field.merged) {
      // Field level ideas about things that could be done here:
      // - Fix indicators?
      // Record level fixes should be implemented as validators/fixers
      // in marc-record-validators-melinda and ust called from here.
      fieldRemoveDuplicateSubfields(field);
      fieldFixPunctuation(field); // NB! This will fix only fields with merged content
      sortAdjacentSubfields(field); // Put the added $e subfield to proper places.
      sortAdjacentRelatorTerms(field); // Sort $e subfields with each other
      fieldFixPunctuation(field);

      delete field.merged;
    }

    if (field.useExternalEndPunctuation) {
      delete field.useExternalEndPunctuation;
    }

    if (field.added) {
      delete field.added;
    }

    /*
    if (field.deleted) {
      delete field.deleted;
    }
*/

  });
}


function removeDeletedFields(record) {
  // remove fields that are marked as deleted:
  record.fields = record.fields.filter(f => !f.deleted);
}


export function postprocessRecords(base, source) {
  postprocessBaseRecord(base);
  removeDeletedFields(source); // So that we may know what was used, and what not.
}
