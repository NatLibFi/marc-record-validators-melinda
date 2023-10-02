import AccessRights from './access-rights';
import DoubleCommas from './double-commas';
import DuplicatesInd1 from './duplicates-ind1';
import EmptyFields from './empty-fields';
import EndingPunctuation from './ending-punctuation';
import EndingWhitespace from './ending-whitespace';
import Field505Separators from './field-505-separators';
import Field521Fix from './field-521-fix';
import FieldExclusion from './field-exclusion';
import FieldStructure from './field-structure';
import FieldsPresent from './fields-present';
import FixedFields from './fixed-fields';
import FixRelatorTerms from './fixRelatorTerms';
import IdenticalFields from './identical-fields';
import IndicatorFixes from './indicator-fixes';
import IsbnIssn from './isbn-issn';
import ItemLanguage from './item-language';
import MergeField500Lisapainokset from './mergeField500Lisapainokset';
import MergeRelatorTermFields from './mergeRelatorTermFields';
import MultipleSubfield0s from './multiple-subfield-0';
import NonBreakingSpace from './non-breaking-space';
import NormalizeIdentifiers from './normalize-identifiers';
import NormalizeQualifyingInformation from './normalize-qualifying-information';
import NormalizeUTF8Diacritics from './normalize-utf8-diacritics';
import Punctuation from './punctuation/';
import Punctuation2 from './punctuation2';
import ResolveOrphanedSubfield6s from './resolveOrphanedSubfield6s'; // Do this before reindexing! (thus not in alphabetical order)
import ReindexSubfield6OccurenceNumbers from './reindexSubfield6OccurenceNumbers';
import RemoveDuplicateDataFields from './removeDuplicateDataFields';
import RemoveInferiorDataFields from './removeInferiorDataFields';
import ResolvableExtReferences from './resolvable-ext-references-melinda';
import SanitizeVocabularySourceCodes from './sanitize-vocabulary-source-codes';
import SortFields from './sortFields';
import SortRelatorTerms from './sortRelatorTerms';
import SortSubfields from './sortSubfields';
import SortTags from './sort-tags';
// import StripPunctuation from './stripPunctuation'; // Can we add this here? Should be used very cautiosly!
import SubfieldValueNormalizations from './subfieldValueNormalizations';
import SubfieldExclusion from './subfield-exclusion';
import Sync007And300 from './sync-007-and-300';
import TypeOfDateF008 from './typeOfDate-008';
import UnicodeDecomposition from './unicode-decomposition';
import UpdateField540 from './update-field-540';
import Urn from './urn';

export {
  AccessRights,
  DoubleCommas,
  DuplicatesInd1,
  EmptyFields,
  EndingPunctuation,
  EndingWhitespace,
  Field505Separators,
  Field521Fix,
  FieldExclusion,
  FieldsPresent,
  FieldStructure,
  FixRelatorTerms,
  FixedFields,
  IdenticalFields,
  IndicatorFixes,
  IsbnIssn,
  ItemLanguage,
  MergeField500Lisapainokset,
  MergeRelatorTermFields,
  MultipleSubfield0s,
  NonBreakingSpace,
  NormalizeIdentifiers,
  NormalizeQualifyingInformation,
  NormalizeUTF8Diacritics,
  Punctuation,
  Punctuation2,
  ResolveOrphanedSubfield6s,
  ReindexSubfield6OccurenceNumbers,
  RemoveDuplicateDataFields,
  RemoveInferiorDataFields,
  ResolvableExtReferences,
  SanitizeVocabularySourceCodes,
  SortRelatorTerms,
  SortSubfields,
  SortTags,
  SubfieldExclusion,
  SubfieldValueNormalizations,
  Sync007And300,
  TypeOfDateF008,
  UnicodeDecomposition,
  UpdateField540,
  Urn,
  SortFields // Keep this as last
};
