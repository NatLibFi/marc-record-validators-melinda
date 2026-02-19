// See https://www.loc.gov/marc/bibliographic/bdapndxj.html for details

import {subfieldArraysContainSameData} from '../utils.js';
import {tagToDataProvenanceSubfieldCode} from '../dataProvenanceUtils.js';

export function provenanceSubfieldsPermitMerge(baseField, sourceField) {
    if (!baseField.subfields) {
        return true;
    }
    const provenanceSubfieldCode = tagToDataProvenanceSubfieldCode(baseField.tag);

    if (provenanceSubfieldCode === undefined) {
        return false;
    }

    const baseProvenanceSubfields = baseField.subfields.filter(sf => sf.code === provenanceSubfieldCode);
    const sourceProvenanceSubfields = sourceField.subfields.filter(sf => sf.code === provenanceSubfieldCode);

    // Currently we just compare two arrays. Later on we might do something more sophisticated with specific $7 data provenance category/relationship codes,
    // or actual values.

    return subfieldArraysContainSameData(baseProvenanceSubfields, sourceProvenanceSubfields);

}