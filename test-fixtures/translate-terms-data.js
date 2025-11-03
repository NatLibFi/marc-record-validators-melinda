const fakeTerms = {
    graph: [
        {
            uri: 'http://www.yso.fi/onto/yso/p13299',
            prefLabel: [
                { lang: 'fi', value: 'laiturit' },
                { lang: 'sv', value: 'bryggor'}
            ]
        },
        {
            uri: 'http://www.yso.fi/onto/yso/p111739',
            prefLabel: [
                { lang: 'fi', value: 'Ivalo (Inari)' },
                { lang: 'sv', value: 'Ivalo (Enare)'}
            ]
        },
        {
            uri: 'http://www.yso.fi/onto/yso/p6197061979',
            prefLabel: [
                { lang: 'fi', value: '1970-luku' },
                { lang: 'sv', value: '1970-talet' }
            ]
        },
        {
            uri: 'http://www.yso.fi/onto/yso/p6196061969',
            prefLabel: [
                { lang: 'fi', value: '1960-luku' },
                { lang: 'sv', value: '1960-talet' }
            ]
        },
        {
            uri: 'http://urn.fi/URN:NBN:fi:au:slm:s161',
            prefLabel: [
                { lang: 'fi', value: 'naistenlehdet' },
                { lang: 'sv', value: 'damtidningar' }
            ]
        }
    ]

};

export const fakeData = JSON.stringify(fakeTerms);