# Melinda-related validators for marc-record-validate [![NPM Version](https://img.shields.io/npm/v/marc-record-validators-melinda.svg)](https://npmjs.org/package/marc-record-validators-melinda) [![Build Status](https://travis-ci.org/NatLibFi/marc-record-validators-melinda.svg)](https://travis-ci.org/NatLibFi/marc-record-validators-melinda) [![Test Coverage](https://codeclimate.com/github/NatLibFi/marc-record-validators-melinda/badges/coverage.svg)](https://codeclimate.com/github/NatLibFi/marc-record-validators-melinda/coverage)

This project contains Melinda-related validators for [marc-record-validate](https://github.com/natlibfi/marc-record-validate). [Melinda](https://melinda.kansalliskirjasto.fi) is a union catalogue of Finnish libraries maintained by [The National Library of Finland](https://nationallibrary.fi).

## Usage

The project's main module is a marc-record-validate [bundle](https://github.com/NatLibFi/marc-record-validate/wiki/Writing-validators#generating-a-factory-module) that contains all the validators. See [lib/validators](https://github.com/natLibfi/marc-record-validators-melinda/blob/master/lib/validators) for invidual modules.

### Node.js

```js
var validate = require('marc-record-validators-melinda')({
  fix: true
}),
results = validate(record);
```

### AMD
```js
define(['marc-record-validators-melinda'], function(validateFactory) {

  var validate = validateFactory({
    fix: true
  }),
  results = validate(record);

});
```

## Development 

Clone the sources and install the package using `npm`:

```sh
npm install
```

Run the following NPM script to lint, test and check coverage of the code:

```javascript

npm run check

```

## License and copyright

Copyright (c) 2014-2016 **University Of Helsinki (The National Library Of Finland)**

This project's source code is licensed under the terms of **GNU Affero General Public License Version 3** or any later version.
