// Configuration specification
const confSpec = {
  leader: { // Description: Leader pattern
    type: 'RegExp',
    excl: ['tag', 'valuePattern', 'subfields', 'ind1', 'ind2']
  },
  tag: { // Description: Field tag pattern
    type: 'RegExp',
    excl: ['leader']
  },
  valuePattern: { // Description: Pattern to which the field's value must match against
    type: 'RegExp',
    excl: ['leader', 'subfields', 'ind1', 'ind2']
  },
  ind1: { // Description: Indicator-specific configuration object
    type: 'RegExp', // Array<Indicator>
    excl: ['leader', 'value']
  },
  ind2: { // Description: Indicator-specific configuration object
    type: 'RegExp', // Array<Indicator>
    excl: ['leader', 'value']
  },
  strict: { // Description: Only the specified subfields are allowed if set to true. Defaults to false.
    type: 'boolean',
    excl: ['leader', 'valuePattern']
  },
  subfields: { // Description: Subfields configuration
    type: 'object', // Object<String, Subfield> (Keys are subfield codes)
    contains: ['String', 'subfieldSpec'],
    excl: ['leader', 'value']
  },
  dependencies: { // Description: Dependencies configuration
    type: 'array', // Array<Dependency>
    contains: 'dependencySpec'
  }
};

// Subfiled specification
const subSpec = {
  pattern: { // Description: Pattern to which the subfield's value must match against
    type: 'RegExp'
  },
  required: { // Description: Whether the subfield is mandatory or not. Defaults to false
    type: 'boolean'
  },
  maxOccurrence: { // Description: Maximum number of times this subfield can occur. Defaults to unlimited if omitted. The value 0 means that the subfield cannot exist.
    type: 'number'
  }
};

// Dependency specification
const depSpec = {
  leader: { // Description: Leader pattern
    type: 'RegExp',
    excl: ['tag', 'valuePattern', 'subfields', 'ind1', 'ind2']
  },
  tag: { // Description: Field tag pattern
    type: RegExp,
    excl: ['leader']
  },
  ind1: { // Description: Pattern to which the indicator must match against
    type: RegExp,
    excl: ['value', 'leader']
  },
  ind2: { // Description: Pattern to which the indicator must match against
    type: RegExp,
    excl: ['value', 'leader']
  },
  valuePattern: { // Description: Pattern to which the field's value must match agains
    type: RegExp,
    excl: ['subfields', 'ind1', 'ind2', 'leader']
  },
  subfields: { // Description: An object with subfield codes as keys and RegExp patterns as values. The subfield value must this pattern.
    type: Object, // [String, RegExp]
    required: false
  }
};

function forEach(obj, fun) {
  Object.entries(obj).forEach(fun);
}

export default function (config) {
  if (!Array.isArray(config)) {
    throw new TypeError('Configuration array not provided');
  }

  configValid(config);

  return {
    description:
      'Check whether the configured fields have valid structure',
    validate: record => ({
      valid: recordMatchesConfig(record, config, false)
    })
  };

  // This checks that configuration is valid
  function configValid(config) {
    config.forEach(obj => {
      const excluded = []; // Validate fields: check that they are valid to confSpec (exists, correct data type), concat excluded elements

      forEach(obj, ([key, val]) => {
        configMatchesSpec(val, key, confSpec);

        // Concat all excluded elements to array
        if (confSpec[key].excl) { // eslint-disable-line functional/no-conditional-statement
          excluded.push(...confSpec[key].excl); // eslint-disable-line functional/immutable-data
        }
      });

      // Check that no excluded elements are in use
      forEach(obj, ([key]) => {
        if (excluded.includes(key)) {
          throw new Error('Configuration not valid - excluded element');
        }
      });
    });
  }

  // Recursive validator
  function configMatchesSpec(data, key, spec) {
    // Field not found in configuration spec
    if (!spec[key]) {
      throw new Error(`Configuration not valid - unidentified value: ${key}`);
    }

    // If configuration type does not match type in configuration spec
    if (typeof data !== spec[key].type &&
      (spec[key].type === 'RegExp' && !(data instanceof RegExp))) {
      throw new Error(`Configuration not valid - invalid data type for: ${key}`);
    }

    // Check subfields/dependencies recursively
    if (key === 'subfields' || key === 'dependencies') { // eslint-disable-line functional/no-conditional-statement
      forEach(data, ([, subObj]) => {
        if (typeof subObj === 'object') { // eslint-disable-line functional/no-conditional-statement
          forEach(subObj, ([subKey, subVal]) => {
            configMatchesSpec(subVal, subKey, key === 'subfields' ? subSpec : depSpec);
          });
        } else {
          throw new TypeError(`Configuration not valid - ${key} not object`);
        }
      });
    }
  }
  /// /////////////////////////////////////////

  /// /////////////////////////////////////////
  // This is used to validate record against configuration
  function recordMatchesConfig(record, conf, dependencies) {
    // Parse trough every element of config array
    const res = conf.every(confObj => {
      if (confObj.dependencies) {
        if (confObj.dependencies.every(dependency => recordMatchesConfigElement(record, dependency.tag, dependency, dependencies))) {
          return recordMatchesConfigElement(record, confObj.tag, confObj, dependencies);
        }

        return true;
      }

      return recordMatchesConfigElement(record, confObj.tag, confObj, dependencies);
    });

    return res;
  }

  // Recursive validation function
  function recordMatchesConfigElement(record, searchedField, confObj, dependencies) {
    const foundFields = record.get(searchedField);
    // If field has dependencies and fields matching configuration is not found
    if (foundFields.length === 0 && confObj.dependencies) {
      return false;
    }

    // Parse trough record objects matching provided configuration object
    // Check that every configuration field exists in record and matches configuration
    return foundFields.every(recordSubObj => Object.keys(confObj).every(confField => {
      // If configuration field is RegExp, test that record field matches it (valuePattern, leader, tag, ind*)
      if (confObj[confField] instanceof RegExp) {
        // 'valuePattern' RegExp in conf spec is used to validate 'value' in marc
        if (confField === 'valuePattern') {
          return confObj[confField].test(recordSubObj.value);
        }

        if (confField === 'leader') {
          return confObj[confField].test(record.leader);
        }

        return confObj[confField].test(recordSubObj[confField]);
      }

      // Only the specified subfields are allowed if set to true. Defaults to false. (this is checked at subfields)
      if (confField === 'strict') {
        return true;
      }

      // Check that subfield stuff
      if (confField === 'subfields') {
        const strict = confObj.strict || false; // Defaults to false
        let elementsTotal = 0; // eslint-disable-line functional/no-let
        const valid = !Object.entries(confObj.subfields).some(([key, val]) => {
          const matching = recordSubObj.subfields.filter(({code}) => code === key);
          elementsTotal += matching.length; // Calculate amount of record objects matching all confObj objects

          const maxOccurrenceFine = matching.length > val.maxOccurrence;
          const isRequiredFine = (val.required || dependencies) && matching.length === 0;
          const valuePatternFine = val.pattern && !matching.every(field => val.pattern.test(field.value));
          return maxOccurrenceFine || isRequiredFine || valuePatternFine;
        });

        // Check if there is less valid calculated objects than objects in subfield object => some not matching strict
        return !(strict && elementsTotal < recordSubObj.subfields.length) && valid;
      }

      // Recursive check for dependicies
      if (confField === 'dependencies') {
        return recordMatchesConfig(record, confObj[confField], true);
      }

      // This should not be reached as configuration is validated

      console.log('!!! Configuration field not identified: ', recordSubObj[confField], ' | ', typeof recordSubObj[confField]); // eslint-disable-line no-console
      return false;
    }));
  }
}
