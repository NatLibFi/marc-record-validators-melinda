
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