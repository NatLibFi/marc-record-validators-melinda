export default function (configuration) {
  if (Array.isArray(configuration)) {
    return {
      description:
        'Validates fixed fields',
      validate
    };
  }

  throw new Error('No configuration provided');

  function validate(record) {
    const messages = configuration.reduce((messages, item) => {
      let results; // eslint-disable-line functional/no-let

      if (item.leader) { // eslint-disable-line functional/no-conditional-statement
        results = validateField(record.leader, item);
      } else { // eslint-disable-line functional/no-conditional-statement
        results = record.get(item.tag)
          .map(f => validateField(f.value, item, f.tag));
      }

      if (results && results.length > 0) {
        return messages.concat(...results).reduce((acc, item) => acc.includes(item) ? acc : acc.concat(item), []);
      }

      return messages;
    }, []);

    return {valid: messages.length === 0, messages};

    function validateField(value, spec, tag) {
      const messagePrefix = tag ? `Field ${tag}` : 'Leader';

      if (typeof spec.length === 'number') {
        if (value.length !== spec.length) {
          return [`${messagePrefix} has invalid length`];
        }
      }

      if (spec.rules) {
        return spec.rules.reduce((messages, rule, ruleIndex) => {
          const indexes = getIndexes(rule.position);
          const positions = value.split('').reduce((positions, char, index) => {
            if (indexes.includes(index) && (!rule.dependencies || rule.dependencies.every(checkDependency))) {
              if (!rule.pattern.test(char)) {
                return positions.concat(index);
              }
            }

            return positions;

            function checkDependency(dependency) {
              const indexes = getIndexes(dependency.position);
              return value.split('').every((char, index) => !indexes.includes(index) || dependency.pattern.test(char));
            }
          }, []);

          if (positions.length > 0) {
            return messages.concat(`${messagePrefix} has invalid values at positions: ${positions.join()} (Rule index ${ruleIndex})`);
          }

          return messages;

          function getIndexes(arg) {
            if (Array.isArray(arg)) {
              const indexes = [...new Array(arg[1] + 1).keys()];
              return indexes.slice(arg[0], arg[1] + 1);
            }

            return [arg];
          }
        }, []);
      }
    }
  }
}
