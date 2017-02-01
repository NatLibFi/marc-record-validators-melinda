/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda-related validators for marc-record-validate
 *
 * Copyright (c) 2014-2016 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of marc-record-validators-melinda
 *
 * marc-record-validators-melinda is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *  
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *  
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 **/

/**
 * @internal Attempts to find missing lexicon of 650 fields by querying the term from Finto. If the lexicon cannot be found the field is converted to 653 field.
 **/

/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';
  
  if (typeof define === 'function' && define.amd) {
    define([
      'es6-polyfills/lib/polyfills/promise',
      'es6-polyfills/lib/polyfills/object',
      'es6-shims/lib/shims/array',
      'merge',
      'marc-record-validate/lib/utils'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('es6-polyfills/lib/polyfills/promise'),
      require('es6-polyfills/lib/polyfills/object'),
      require('es6-shims/lib/shims/array'),
      require('merge'),
      require('marc-record-validate/lib/utils')
    );
  }
  
}(this, factory));

function factory(Promise, Object, shim_array, merge, utils)
{

  'use strict';

  var DEFAULT_OPTIONS = {
    finto: {
      url: 'https://api.finto.fi/rest/v1',
      useCache: true
    }
  };

  return function(fintoClientFactory)
  {

    /**
     * @internal Use vocabulary name as lexicon name or use name based on language
     **/
    var MAP_VOCABULARIES = {
      'ysa': ['fi'],
      'allars': ['sv'],
      'musa': [
        {
          language: 'fi',
          lexicon: 'musa'
        },
        {
          language: 'sv',
          lexicon: 'cilla'
        }
      ]
    },
    MAP_650_SUBFIELD_653_IND2 = {
      'b': '0',
      'c': '5',
      'd': '4',
      'e': '0',
      'v': '0',
      'x': '0',
      'y': '4',
      'z': '5'
    };

    /**
     * 650-fields with ind2 value '7' should have lexicon specified in subfield '2'. Return fields that are incorrectly missing subfield '2' but have subfield 'a'
     **/
    function getFields(record)
    {
      return record.fields.filter(function(field) {
        
        return field.tag === '650' && field.ind2 === '7' && !shim_array.find(field.subfields, function(subfield) {
          return subfield.code === '2';
        }) && shim_array.find(field.subfields, function(subfield) {
          return subfield.code === 'a' && subfield.value.length > 0;
        });

      });
    }
    
    return {
      name: 'legal-term',
      factory: function(options)
      {
        
        function lookupTerm(term, vocabularies)
        {

          function call(term, specs_vocabulary)
          {

            var language = specs_vocabulary.shift();

            if (!language) {
              return Promise.resolve();
            } else {

              language = typeof language === 'string' ? language : language.language;

              return finto_client.vocabulary.lookup(vocabulary, term, language).then(function(results) {                
                return Promise.resolve(results);
              }).catch(function(error) {

                if (error.status === 404) {
                  return call(term, specs_vocabulary);
                } else {
                  throw error;
                }

              });

            }

          }

          var vocabulary = vocabularies.shift();

          if (!vocabulary) {
            return Promise.resolve();
          } else {
            return call(term, MAP_VOCABULARIES[vocabulary].slice()).then(function(results) {
              if (!results) {
                return lookupTerm(term, vocabularies);
              } if (results.length > 1) {
                throw new Error("Multiple matches found for term '" + term + "'");
              } else {
                return {
                  name: results[0].vocab,
                  language: results[0].lang
                };
              }
            });
          }

        }

        function findLexicon(fields, results)
        {

          var term,
          field = fields.shift();
          
          results = Array.isArray(results) ? results : [];

          if (!field) {
            return Promise.resolve(results);
          } else {

            term = shim_array.find(field.subfields, function(field) {
              return field.code === 'a';
            }).value;
            
            if (options.finto.useCache === true && cache.hasOwnProperty(term)) {
              return findLexicon(fields, results.concat({
                field: field,
                lexicon: cache[term]
              }));
            } else {

              return lookupTerm(term, Object.keys(MAP_VOCABULARIES)).then(function(vocabulary) {

                var lexicon;

                if (vocabulary) {

                  lexicon = MAP_VOCABULARIES[vocabulary.name].indexOf(vocabulary.language) >= 0 ? vocabulary.name : shim_array.find(MAP_VOCABULARIES[vocabulary.name], function(spec) {
                    return spec.language === vocabulary.language;
                  }).lexicon;

                  if (options.finto.useCache) {
                    cache[term] = lexicon;
                  }

                }

                return findLexicon(fields, results.concat(Object.assign({
                  field: field
                }, !lexicon ? {} : {
                  lexicon: lexicon
                })));

              });
            }

          }

        }

        var finto_client,
        cache = {};

        options = merge.recursive(true, JSON.parse(JSON.stringify(DEFAULT_OPTIONS)), typeof options === 'object' ? options : {});
        finto_client = fintoClientFactory(Object.keys(options.finto).reduce(function(product, key) {

          return key === 'useCache' ? product : Object.defineProperty(product, key, {
            enumerabe: true,
            writable: true,
            value: options.finto[key]
          });
          
        }, {}));

        return {
          validate: function(record)
          {
            return Promise.resolve(getFields(record).map(function(field) {
              return utils.validate.warning("Lexicon missing - Subfield '2' doesn't exist", field);
            }));
	        },
          fix: function(record)
          {

            var fields = getFields(record);

            if (fields.length === 0) {
              return Promise.resolve([]);
            } else {
              return findLexicon(fields).then(function(bundles) {
                return bundles.reduce(function(results, bundle) {
                  if (bundle.lexicon) {
                    
                    return results.concat(utils.fix.addSubfield(bundle.field, {
                      code: '2',
                      value: bundle.lexicon
                    }));

                  } else {

                    results.push(utils.fix.modifyFieldTag(bundle.field, '653'));
                    results.push(utils.fix.modifyFieldIndicator(bundle.field, 2, '0'));

                    bundle.field.subfields.slice().forEach(function(subfield, index) {
                      if (MAP_650_SUBFIELD_653_IND2.hasOwnProperty(subfield.code)) {

                        results.push(utils.fix.addField(record, {
                          tag: '653',
                          ind1: '0',
                          ind2: MAP_650_SUBFIELD_653_IND2[subfield.code],
                          subfields: [{
                            code: 'a',
                            value: subfield.value
                          }]
                        }));

                        results.push(utils.fix.removeSubfield(bundle.field, subfield));

                      }
                    });

                    return results;

                  }
                }, []);
              });
            }

          }
        };
      }
    };

  };

}
