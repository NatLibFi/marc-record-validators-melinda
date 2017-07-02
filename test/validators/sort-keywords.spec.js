/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda-related validators for @natlibfi/marc-record-validate
 *
 * Copyright (c) 2014-2017 University Of Helsinki (The National Library Of Finland)
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

/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'chai/chai',
      'chai-as-promised',
      'marc-record-js',
      '../../lib/validators/sort-keywords'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('marc-record-js'),
      require('../../lib/validators/sort-keywords')
    );
  }

}(this, factory));

function factory(chai, chaiAsPromised, MarcRecord, validator_factory)
{

  'use strict';

  var expect = chai.expect;

  chai.use(chaiAsPromised);

  describe('sort-keywords', function() {
    
    it('Should be the expected object', function() {
      expect(validator_factory).to.be.an('object');
      expect(validator_factory.name).to.be.a('string');
      expect(validator_factory.factory).to.be.a('function');
    });
    
    describe('#factory', function() {

      it('Should throw because tag is not supported', function() {
        expect(validator_factory.factory).to.throw(Error, /^Tag 'undefined' is not supported$/);
      });
      
      it('Should return the expected object', function() {        
        expect(validator_factory.factory('650')).to.be.an('object').and.to
          .respondTo('validate').and.to
          .respondTo('fix');        
      });
      
      describe('object', function() {
        
        describe('#validate', function() {
          
          it('Should resolve with an array', function() {
            return expect(validator_factory.factory('650').validate(new MarcRecord())).to.eventually.eql([]);
          });

          it('Should not resolve with messages', function() {
            return expect(validator_factory.factory('650').validate(new MarcRecord({
              fields: [
                {
                  tag: '650',
                  ind2: '7',
                  subfields: [
                    {
                      code: '2',
                      value: 'ysa'
                    },
                    {
                      code: 'a',
                      value: 'foobar'
                    },
                  ]
                },
                {
                  tag: '650',
                  ind2: '7',
                  subfields: [
                    {
                      code: '2',
                      value: 'allars'
                    },
                    {
                      code: 'a',
                      value: 'fubar'
                    }
                  ]
                }
              ]
            }))).to.eventually.eql([]);
          });

          it('Should resolve with a warning message (More prioritized ind2 in higher index)', function() {

            var record = new MarcRecord({
              fields: [
                {
                  tag: '001',
                  value: '1234567'
                },
                {
                  tag: '650',
                  ind2: '3',
                  subfields: [{
                    code: 'a',
                    value: 'foobar'
                  }]
                },
                {
                  tag: '650',
                  ind2: '0',
                  subfields: [{
                    code: 'a',
                    value: 'foobar'
                  }]
                }
              ]
            });
            
            return expect(validator_factory.factory('650').validate(record)).to.eventually.eql([{
              type: 'warning',
              message: "Keyword field is not in correct position",
              field: record.fields[2]
            }]);

          });

          it('Should resolve with a warning message (More prioritized lexicon in higher index)', function() {

            var record = new MarcRecord({
              fields: [
                {
                  tag: '001',
                  value: '1234567'
                },
                {
                  tag: '650',
                  ind2: '7',
                  subfields: [
                    {
                      code: '2',
                      value: 'allars'
                    },
                    {
                      code: 'a',
                      value: 'fubar'
                    },
                  ]
                },
                {
                  tag: '650',
                  ind2: '7',
                  subfields: [
                    {
                      code: '2',
                      value: 'ysa'
                    },
                    {
                      code: 'a',
                      value: 'foobar'
                    }
                  ]
                }
              ]
            });
            
            return expect(validator_factory.factory('650').validate(record)).to.eventually.eql([{
              type: 'warning',
              message: "Keyword field is not in correct position",
              field: record.fields[2]
            }]);

          });

          it("Should resolve with a warning message (Keyword missing subfield '2')", function() {

            var record = new MarcRecord({
              fields: [
                {
                  tag: '001',
                  value: '1234567'
                },
                {
                  tag: '650',
                  ind2: '7',
                  subfields: [{
                    code: 'a',
                    value: 'foobar'
                  }]
                },
                {
                  tag: '650',
                  ind2: '7',
                  subfields: [
                    {
                      code: '2',
                      value: 'allars'
                    },
                    {
                      code: 'a',
                      value: 'fubar'
                    }
                  ]
                }
              ]
            });
            
            return expect(validator_factory.factory('650').validate(record)).to.eventually.eql([{
              type: 'warning',
              message: "Keyword field is not in correct position",
              field: record.fields[2]
            }]);

          });
          
        });

        describe('#fix', function() {
          
          it('Should resolve with an array', function() {
            return expect(validator_factory.factory('650').fix(new MarcRecord())).to.eventually.be.an('array');
          });
          
          it('Should fix the record', function() {
            
            var record = new MarcRecord({
              fields: [             
                {
                  tag: '001',
                  value: '1234567'
                }, 
                {
                  tag: '650',
                  ind2: '7',
                  subfields: [
                    {
                      code: '2',
                      value: 'allars'
                    },
                    {
                      code: 'a',
                      value: 'fubar'
                    },
                  ]
                },
                {
                  tag: '650',
                  ind2: '0',
                  subfields: [{
                    code: 'a',
                    value: 'foobar'
                  }]
                },
                {
                  tag: '650',
                  ind2: '7',
                  subfields: [
                    {
                      code: '2',
                      value: 'ysa'
                    },
                    {
                      code: 'a',
                      value: 'foobar'
                    },
                  ]
                }
              ]
            }),
            record_original = record.toJsonObject(),
            record_fields_modified = [
              record_original.fields[0],
              record_original.fields[3],
              record_original.fields[1],
              record_original.fields[2]
            ];

            return validator_factory.factory('650').fix(record).then(function(results) {
              expect(results).to.eql([{
                'type': 'moveField',
                'field': record_original.fields[3],
                'old': 3,
                'new': 1
              }]);
              
              expect(record_original).to.not.eql(record.toJsonObject());
              expect(record.fields).to.eql(record_fields_modified);
              
            });

          });

        });

      });

    });

  });

}
        
