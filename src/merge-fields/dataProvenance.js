// See https://www.loc.gov/marc/bibliographic/bdapndxj.html for details

import {subfieldArraysContainSameData} from '../utils.js';
import {tagToDataProvenanceSubfieldCode} from '../dataProvenanceUtils.js';

export function provenanceSubfieldsPermitMerge(baseField, sourceField) {
    if (!baseField.subfields) {
        return true;
    }
    const provinanceSubfieldCode = tagToDataProvenanceSubfieldCode(baseField.tag);

    if (provinanceSubfieldCode === undefined) {
        return false;
    }

    const baseProvinanceSubfields = baseField.subfields.filter(sf => sf.code === provinanceSubfieldCode);
    const sourceProvinanceSubfields = sourceField.subfields.filter(sf => sf.code === provinanceSubfieldCode);

    // Currently we just compare two arrays. Later on we might do something more sophisticated with specific $7 data provenance category/relationship codes,
    // or actual values.

    return subfieldArraysContainSameData(baseProvinanceSubfields, sourceProvinanceSubfields);

}