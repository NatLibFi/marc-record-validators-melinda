import AccessRights from './access-rights';
import AddMissingField041 from './addMissingField041';
import AddMissingField336 from './addMissingField336';
import AddMissingField337 from './addMissingField337';
import AddMissingField338 from './addMissingField338';
import Cyrillux from './cyrillux';
import CyrilluxUsemarconReplacement from './cyrillux-usemarcon-replacement';
import DoubleCommas from './double-commas';
import DuplicatesInd1 from './duplicates-ind1';
import EmptyFields from './empty-fields';
import EndingPunctuation from './ending-punctuation';
import EndingWhitespace from './ending-whitespace';
import Field008CharacterGroups from './field-008-18-34-character-groups';
import Field505Separators from './field-505-separators';
import Field521Fix from './field-521-fix';
import FieldExclusion from './field-exclusion';
import FieldStructure from './field-structure';
import FieldsPresent from './fields-present';
import Fix33X from './fix-33X';
import FixCountryCodes from './fix-country-codes';
import FixLanguageCodes from './fix-language-codes';
import FixRelatorTerms from './fixRelatorTerms';
import FixedFields from './fixed-fields';
import IdenticalFields from './identical-fields';
import IndicatorFixes from './indicator-fixes';
import IsbnIssn from './isbn-issn';
import ItemLanguage from './item-language';
import MergeField500Lisapainokset from './mergeField500Lisapainokset';
import MergeFields from './merge-fields/';
import MergeRelatorTermFields from './mergeRelatorTermFields';
import MultipleSubfield0s from './multiple-subfield-0';
import NonBreakingSpace from './non-breaking-space';
import NormalizeDashes from './normalize-dashes';
import NormalizeIdentifiers from './normalize-identifiers';
import NormalizeQualifyingInformation from './normalize-qualifying-information';
import NormalizeUTF8Diacritics from './normalize-utf8-diacritics';
import Punctuation from './punctuation/';
import Punctuation2 from './punctuation2';
import ReindexSubfield6OccurenceNumbers from './reindexSubfield6OccurenceNumbers';
import RemoveDuplicateDataFields from './removeDuplicateDataFields';
import RemoveInferiorDataFields from './removeInferiorDataFields';
import ResolvableExtReferences from './resolvable-ext-references-melinda';
import ResolveOrphanedSubfield6s from './resolveOrphanedSubfield6s';
import SanitizeVocabularySourceCodes from './sanitize-vocabulary-source-codes';
import SortFields from './sortFields';
import SortRelatorTerms from './sortRelatorTerms';
import SortSubfields from './sortSubfields';
import SortTags from './sort-tags';
// import StripPunctuation from './stripPunctuation'; // Can we add this here? Should be used very cautiosly!
import SubfieldValueNormalizations from './subfieldValueNormalizations';
import SubfieldExclusion from './subfield-exclusion';
import Sync007And300 from './sync-007-and-300';
import TranslateTerms from './translate-terms';
import TypeOfDateF008 from './typeOfDate-008';
import UnicodeDecomposition from './unicode-decomposition';
import UpdateField540 from './update-field-540';
import Urn from './urn';

export {
  AccessRights,
  AddMissingField041,
  AddMissingField336,
  AddMissingField337,
  AddMissingField338,
  Cyrillux,
  CyrilluxUsemarconReplacement,
  DoubleCommas,
  DuplicatesInd1,
  EmptyFields,
  EndingPunctuation,
  EndingWhitespace,
  Field008CharacterGroups,
  Field505Separators,
  Field521Fix,
  FieldExclusion,
  FieldsPresent,
  FieldStructure,
  Fix33X,
  FixCountryCodes,
  FixLanguageCodes,
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
  NormalizeDashes,
  NormalizeIdentifiers,
  NormalizeQualifyingInformation,
  NormalizeUTF8Diacritics,
  Punctuation,
  Punctuation2,
  ResolveOrphanedSubfield6s, // Do this before reindexing! (thus I'm not sticking with alphabetical order here)
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
  TranslateTerms,
  UnicodeDecomposition,
  UpdateField540,
  Urn,
  SortFields, // Keep this penultimate
  MergeFields // Run this last *iff* you want to use this at all
};
