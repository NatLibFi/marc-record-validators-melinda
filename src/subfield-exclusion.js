// Tag (RegExp): Pattern to match the field's tags Mandatory
// ind1 (RegExp): Pattern to match the field's ind1 property
// ind2 (RegExp): Pattern to match the field's ind2 property
// subfields (Array<Object>): An array of objects with the following properties (Mandatory):
// // code (RegExp): Pattern to match the subfield's code Mandatory
// // value (RegExp): Pattern to match the subfield's value

// Configuration specification
const confSpec = {
  tag: { // Pattern to match the field's tags
    type: 'RegExp',
    mandatory: true
  },
  ind1: { // Pattern to match the field's ind1 property.
    type: 'RegExp' // Array<Indicator>
  },
  ind2: { // Pattern to match the field's ind2 property.
    type: 'RegExp' // Array<Indicator>
  },
  subfields: { // An array of objects with the following properties
    code: {
      type: 'RegExp',
      mandatory: true
    },
    value: {
      type: 'RegExp'
    },
    mandatory: true
  }
};

function forEach(obj, fun) {
  Object.entries(obj).forEach(fun);
}

function isRegExp(re) {
  return re instanceof RegExp;
}

export default function (config) {
  if (!Array.isArray(config)) {
    throw new TypeError('Configuration array not provided');
  }

  configValid(config);

  return {
    description:
      'Checks that the record does not contain the configured subfields',
    validate: record => excludeSubfields(record, config, false),
    fix: record => excludeSubfields(record, config, true)
  };

  /// /////////////////////////////////////////
  // These check that configuration is valid
  function configValid(config) {
    config.forEach(obj => {
      checkMandatory(confSpec, obj);

      forEach(obj, ([key, val]) => {
        configMatchesSpec(val, key, confSpec);
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
    if (key === 'subfields') { // eslint-disable-line functional/no-conditional-statements
      forEach(data, ([, subObj]) => {
        // Console.log("subObj: ", subObj, " type: ", typeof subObj, !(Array.isArray(subObj)))
        if (typeof subObj === 'object' && !Array.isArray(subObj)) { // eslint-disable-line functional/no-conditional-statements
          checkMandatory(spec[key], subObj);

          forEach(subObj, ([subKey, subVal]) => {
            configMatchesSpec(subVal, subKey, spec[key]);
          });
        } else {
          throw new TypeError(`Configuration not valid - subfield: ${subObj} not object`);
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
  function excludeSubfields(record, conf, fix) {
    const res = {message: [], valid: true};

    // Parse trough every element of config array
    conf.forEach(confObj => {
      const found = record.get(confObj.tag); // Find matching record fields based on mandatory tag

      // Check if some of found record fields matches all configuration fields
      found.forEach(element => {
        // Compare each found element against each configuration object
        if (Object.entries(confObj).every(([confKey, confField]) => {
          // Tag already checked at .get(), subfields later
          if (confKey === 'tag' || confKey === 'subfields') {
            return true;
          }

          // Configuration object is RegExp and record value matches it
          if (element[confKey] && isRegExp(confField) && confField.test(element[confKey])) {
            return true;
          }

          // Configuration object not found from found element
          return false;
        })) { // eslint-disable-line functional/no-conditional-statements
          // All configuration fields match, check if some subfields should be excluded.
          confObj.subfields.forEach(subField => {
            const excluded = [];

            element.subfields.forEach(elemSub => {
              // Check if subfield matches configuration spec
              const subFieldCodeFine = subField.code && elemSub.code && subField.code.test(elemSub.code);
              const subFieldValueFine = subField.value && elemSub.value && subField.value.test(elemSub.value);
              if (subFieldCodeFine && (typeof subField.value === 'undefined' || subFieldValueFine)) {
                if (fix) { // eslint-disable-line functional/no-conditional-statements
                  excluded.push(elemSub); // eslint-disable-line functional/immutable-data
                } else { // eslint-disable-line functional/no-conditional-statements
                  res.message.push(`Subfield $${element.tag}$$${elemSub.code}should be excluded`); // eslint-disable-line functional/immutable-data
                }
              }
            });

            excluded.forEach(sf => record.removeSubfield(sf, element));
            // If no subfields remains, the whole field will be removed as well:
            if (element.subfields && element.subfields.length === 0) { // eslint-disable-line functional/no-conditional-statements
              record.removeField(element);
            }
          });
        }
      });
    });

    // Fix does not send response
    if (!fix) {
      if (res.message.length > 0) { // eslint-disable-line functional/no-conditional-statements
        res.valid = false; // eslint-disable-line functional/immutable-data
      }

      return res;
    }
    // Res.fix.push('Field $' + element.tag + ' excluded');
  }
}
