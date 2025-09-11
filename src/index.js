import AccessRights from './access-rights.js';
import AddMissingField041 from './addMissingField041.js';
import AddMissingField336 from './addMissingField336.js';
import AddMissingField337 from './addMissingField337.js';
import AddMissingField338 from './addMissingField338.js';
import Cyrillux from './cyrillux.js';
import CyrilluxUsemarconReplacement from './cyrillux-usemarcon-replacement.js';
import DisambiguateSeriesStatements from './disambiguateSeriesStatements.js';
import DoubleCommas from './double-commas.js';
import DuplicatesInd1 from './duplicates-ind1.js';
import EmptyFields from './empty-fields.js';
import EndingPunctuation from './ending-punctuation.js';
import EndingWhitespace from './ending-whitespace.js';
import Field008CharacterGroups from './field-008-18-34-character-groups.js';
import Field505Separators from './field-505-separators.js';
import Field521Fix from './field-521-fix.js';
import FieldExclusion from './field-exclusion.js';
import FieldStructure from './field-structure.js';
import FieldsPresent from './fields-present.js';
import Fix33X from './fix-33X.js';
import FixCountryCodes from './fix-country-codes.js';
import FixLanguageCodes from './fix-language-codes.js';
import FixRelatorTerms from './fixRelatorTerms.js';
import FixedFields from './fixed-fields.js';
import IdenticalFields from './identical-fields.js';
import IndicatorFixes from './indicator-fixes.js';
import IsbnIssn from './isbn-issn.js';
import ItemLanguage from './item-language.js';
import MergeField500Lisapainokset from './mergeField500Lisapainokset.js';
import MergeFields from './merge-fields/index.js';
import MergeRelatorTermFields from './mergeRelatorTermFields.js';
import Modernize502 from './modernize-502.js';
import MultipleSubfield0s from './multiple-subfield-0.js';
import NonBreakingSpace from './non-breaking-space.js';
import NormalizeDashes from './normalize-dashes.js';
import NormalizeIdentifiers from './normalize-identifiers.js';
import NormalizeQualifyingInformation from './normalize-qualifying-information.js';
import NormalizeUTF8Diacritics from './normalize-utf8-diacritics.js';
import Punctuation from './punctuation/index.js';
import Punctuation2 from './punctuation2'; // What is this?
import ReindexSubfield6OccurenceNumbers from './reindexSubfield6OccurenceNumbers.js';
import RemoveDuplicateDataFields from './removeDuplicateDataFields.js';
import RemoveInferiorDataFields from './removeInferiorDataFields.js';
import ResolvableExtReferences from './resolvable-ext-references-melinda.js';
import ResolveOrphanedSubfield6s from './resolveOrphanedSubfield6s.js';
import SanitizeVocabularySourceCodes from './sanitize-vocabulary-source-codes.js';
import SortFields from './sortFields.js';
import SortRelatorTerms from './sortRelatorTerms.js';
import SortSubfields from './sortSubfields.js';
import SortTags from './sort-tags.js';
// import StripPunctuation from './stripPunctuation'; // Can we add this here? Should be used very cautiosly!
import SubfieldValueNormalizations from './subfieldValueNormalizations.js';
import SubfieldExclusion from './subfield-exclusion.js';
import Sync007And300 from './sync-007-and-300.js';
import TranslateTerms from './translate-terms.js';
import TypeOfDateF008 from './typeOfDate-008.js';
import UnicodeDecomposition from './unicode-decomposition.js';
import UpdateField540 from './update-field-540.js';
import Urn from './urn.js';

export {
  AccessRights,
  AddMissingField041,
  AddMissingField336,
  AddMissingField337,
  AddMissingField338,
  Cyrillux,
  CyrilluxUsemarconReplacement,
  DisambiguateSeriesStatements,
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
  Modernize502, //
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
