// Configuration specification
const confSpec = {
  tag: { // Pattern to match the field's tags
    type: 'RegExp',
    mandatory: true
  },
  value: { // Regular expression object for matching a controlfields value. Mutual exclusive with
    type: 'RegExp',
    excl: ['subfields', 'ind1', 'ind2']
  },
  ind1: { // Pattern to match the field's ind1 property.
    type: 'RegExp', // Array<Indicator>
    excl: ['value']
  },
  ind2: { // Pattern to match the field's ind2 property.
    type: 'RegExp', // Array<Indicator>
    excl: ['value']
  },
  subfields: { // An array of objects with the following properties
    code: {
      type: 'RegExp',
      mandatory: true
    },
    value: {
      type: 'RegExp',
      mandatory: true
    }
  },
  dependencies: {
    leader: {
      type: 'RegExp'
    }
  }
};

function forEach(obj, fun) {
  Object.entries(obj).forEach(fun);
}

function isRegExp(re) {
  const result = re instanceof RegExp;
  return result;
}

export default function (config) {
  if (!Array.isArray(config)) {
    throw new TypeError('Configuration array not provided');
  }

  // Transform RegExp-only elements to objects
  const objOnlyConfigs = config.map(e => isRegExp(e) ? {tag: e} : e);
  configValid(objOnlyConfigs);

  return {
    description:
      'Checks that the record does not contain the configured fields',
    validate: record => excludeFields(record, objOnlyConfigs, false),
    fix: record => excludeFields(record, objOnlyConfigs, true)
  };

  /// /////////////////////////////////////////
  // These check that configuration is valid
  function configValid(config) {
    config.forEach(obj => {
      const excluded = []; // Validate fields: check that they are valid to confSpec (exists, correct data type), concat excluded elements

      checkMandatory(confSpec, obj);

      forEach(obj, ([key, val]) => {
        configMatchesSpec(val, key, confSpec);
        // Concat all excluded elements to array
        if (confSpec[key].excl) {
          excluded.push(...confSpec[key].excl);
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
      (spec[key].type === 'RegExp' && !isRegExp(data))) {
      throw new Error(`Configuration not valid - invalid data type for: ${key}`);
    }

    // Check subfields recursively
    if (key === 'subfields') {
      forEach(data, ([, subObj]) => {
        // Console.log("subObj: ", subObj, " type: ", typeof subObj, !(Array.isArray(subObj)))
        if (typeof subObj === 'object' && !Array.isArray(subObj)) {
          checkMandatory(spec[key], subObj);

          forEach(subObj, ([subKey, subVal]) => {
            configMatchesSpec(subVal, subKey, spec[key]);
          });
        } else {
          throw new TypeError(`Configuration not valid - subfield: ${subObj} not object`);
        }
      });
    }

    if (key === 'dependencies') {
      forEach(data, ([, subObj]) => {
        if (!(typeof subObj === 'object' && !Array.isArray(subObj) && Object.keys(subObj).length === 1 && isRegExp(subObj.leader))) {
          throw new TypeError('Configuration not valid - Invalid dependencies config');
        }
      });
    }
  }

  function checkMandatory(spec, obj) {
    // Check if all mandatory fields are present
    forEach(spec, ([key, val]) => {
      if (val.mandatory && typeof obj[key] === 'undefined') {
        throw new Error(`Configuration not valid - missing mandatory element: ${key}`);
      }
    });
  }
  /// /////////////////////////////////////////

  /// /////////////////////////////////////////
  // These check that record is valid
  function subFieldCheck(confField, element) {
    // Parse trough every configuration subfield, check if one matches some subobjects fields
    return Object.values(confField).some(subField => Object.values(element.subfields)
      // Check if subfield matches configuration spec
      .some(elemSub => subField.code && elemSub.code && subField.code.test(elemSub.code) &&
        subField.value && elemSub.value && subField.value.test(elemSub.value)));
  }

  function excludeFields(record, conf, fix) {
    const res = {message: [], valid: true};

    // Parse trough every element of config array
    forEach(conf, ([, confObj]) => {
      const found = record.get(confObj.tag); // Find matching record fields based on mandatory tag
      const excluded = [];

      // Check if some of found record fields matches all configuration fields
      found.forEach(element => {
        // Compare each found element against each configuration object
        if (Object.entries(confObj).every(([confKey, confField]) => {
          // This is already checked on .get()
          if (confKey === 'tag') {
            return true;
          }

          if (confKey === 'dependencies') {
            return confObj.dependencies.every(dependency => dependency.leader.test(record.leader));
          }

          // Check subfield configurations
          if (confKey === 'subfields') {
            return subFieldCheck(confField, element);
          }

          // Configuration object is RegExp and record value matches it
          if (element[confKey] && isRegExp(confField) && confField.test(element[confKey])) {
            return true;

            // Configuration object not found from found element
          }

          return false;
        })) {
          // All configuration fields match, element should be excluded.
          if (fix) {
            excluded.push(element);
          } else {
            res.message.push(`Field $${element.tag} should be excluded`);
          }
        }
      });

      excluded.forEach(field => record.removeField(field)); // eslint-disable-line array-callback-return
    });

    // Fix does not send response
    if (!fix) {
      if (res.message.length > 0) {
        res.valid = false;
      }

      return res;
    }
    // Res.fix.push('Field $' + element.tag + ' excluded');
  }
  /// /////////////////////////////////////////
}
