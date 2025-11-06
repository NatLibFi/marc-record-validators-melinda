// See https://www.loc.gov/marc/bibliographic/bdapndxj.html for details

import {subfieldArraysContainSameData} from "../utils.js";

export function tagToDataProvenanceSubfieldCode(tag) {
    if ( ['533', '800', '810', '811', '830'].includes(tag)) {
        return 'y';
    }
    if ( tag === '856' || tag === '857' ) {
        return 'e';
    }

    if ( tag.match(/^7[678]/u) ) {
        return 'l'
    }

    if ( tag.match(/^00/u)) {
        return undefined;
    }
    return '7';
}


export function provenanceSubfieldsPermitMerge(baseField, sourceField) {
    const provinanceSubfieldCode = tagToDataProvenanceSubfieldCode(baseField.tag);
    if (!baseField.subfields) {
        return true;
    }
    if (provinanceSubfieldCode === undefined) {
        return false;
    }

    const baseProvinanceSubfields = baseField.subfields.filter(sf => sf.code === provinanceSubfieldCode);
    const sourceProvinanceSubfields = sourceField.subfields.filter(sf => sf.code === provinanceSubfieldCode);

    // Currently we just compare two arrays. Later on we might do something more sophisticated with specific $7 data provenance category/relationship codes,
    // or actual values.

    return subfieldArraysContainSameData(baseProvinanceSubfields, sourceProvinanceSubfields);

}