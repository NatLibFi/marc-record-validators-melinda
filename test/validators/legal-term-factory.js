/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file. 
 *
 * Melinda-related validators for marc-record-validate
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
      'marc-record-js'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('marc-record-js')
    );
  }

}(this, factory));

function factory(chai, chaiAsPromised, MarcRecord)
{

  'use strict';

  var expect = chai.expect;

  chai.use(chaiAsPromised);

  return function(validator_factory, http_mock)
  {

    describe('legal-term', function() {

      it('Should be the expected object', function() {
        expect(validator_factory).to.be.an('object');
        expect(validator_factory.name).to.be.a('string');
        expect(validator_factory.factory).to.be.a('function');
      });
      
      describe('#factory', function() {
        
        it('Should return the expected object', function() {        
          expect(validator_factory.factory()).to.be.an('object').and.to
            .respondTo('validate').and.to
            .respondTo('fix');        
        });
        
        describe('object', function() {
          
          describe('#validate', function() {
            
            it('Should resolve with an array', function() {
              return expect(validator_factory.factory().validate(new MarcRecord())).to.eventually.eql([]);
            });
   
            it('Should resolve with a warning message', function() {

              var record = new MarcRecord({
                fields: [{
                  tag: '650',
                  ind2: '7',
                  subfields: [{
                    code: 'a',
                    value: 'foobar'
                  }]
                }]
              });

              return expect(validator_factory.factory().validate(record)).to.eventually.eql([{
                type: 'warning',
                message: "Lexicon missing - Subfield '2' doesn't exist",
                field: record.fields[0]
              }]);
            });
         
          });
          
          describe('#fix', function() {
            
            afterEach(http_mock.restore);

            it('Should resolve with an array', function() {
              return expect(validator_factory.factory().fix(new MarcRecord())).to.eventually.be.an('array');
            });

            it('Should reject because of unhandled HTTP status', function() {

              http_mock.create({
                url: 'http://foo.bar/ysa/lookup?label=foobar&lang=fi',
                status: 500
              });

              return expect(validator_factory.factory({
                finto: {
                  url: 'http://foo.bar'
                }
              }).fix(new MarcRecord({
                fields: [{
                  tag: '650',
                  ind2: '7',
                  subfields: [{
                    code: 'a',
                    value: 'foobar'
                  }]
                }]
              }))).to.be.rejectedWith(Error, /^Error: HTTP status: 500$/);

            });

            it('Should reject because of multiple labels in response', function() {

              http_mock.create({
                url: 'http://foo.bar/ysa/lookup?label=foobar&lang=fi',
                status: 200,
                body: JSON.stringify({
                  result: [
                    {
                      vocab: 'ysa',
                      lang: 'fi'
                    },
                    {
                      vocab: 'ysa',
                      lang: 'fi'
                    }
                  ]
                })
              });

              return expect(validator_factory.factory({
                finto: {
                  url: 'http://foo.bar'
                }
              }).fix(new MarcRecord({
                fields: [{
                  tag: '650',
                  ind2: '7',
                  subfields: [{
                    code: 'a',
                    value: 'foobar'
                  }]
                }]
              }))).to.be.rejectedWith(Error, /^Error: Multiple matches found for term 'foobar'$/);

            });
            
            it('Should fix the record by adding lexicon to the fields', function() {
             
              var record = new MarcRecord({
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
                        value: 'foo'
                      }
                    ]
                  },
                  {
                    tag: '650',
                    ind2: '7',
                    subfields: [{
                      code: 'a',
                      value: 'bar'
                    }]
                  }]
              }),
              record_original = new MarcRecord(record),
              field_modified = {
                tag: '650',
                ind2: '7',
                subfields: [
                  {
                    code: 'a',
                    value: 'bar'
                  },
                  {
                    code: '2',
                    value: 'musa'
                  }
                ]
              };

              http_mock.create({
                url: 'http://foo.bar/ysa/lookup?label=bar&lang=fi',
                status: 404
              });

              http_mock.create({
                url: 'http://foo.bar/allars/lookup?label=bar&lang=sv',
                status: 404
              });

              http_mock.create({
                url: 'http://foo.bar/musa/lookup?label=bar&lang=fi',
                status: 200,
                body: JSON.stringify({
                  result: [{
                    vocab: 'musa',
                    lang: 'fi'
                  }]
                })
              });
              
              return validator_factory.factory({
                finto: {
                  url: 'http://foo.bar',
                  useCache: false
                },
              }).fix(record).then(function(results) {

                expect(results).to.eql([{
                  'type': 'addSubfield',
                  'field': field_modified,
                  'subfield': field_modified.subfields[1]
                }]);
                expect(record).to.not.eql(record_original);
                expect(record.fields).to.eql([record_original.fields[0], field_modified]);

              });

            });

            it('Should fix the record by adding lexicon to the fields (Using cache for the second field)', function() {
             
              var record = new MarcRecord({
                fields: [
                  {
                    tag: '650',
                    ind2: '7',
                    subfields: [{
                        code: 'a',
                        value: 'foo'
                    }]
                  },
                  {
                    tag: '650',
                    ind2: '7',
                    subfields: [{
                      code: 'a',
                      value: 'foo'
                    }]
                  }
                ]
              }),
              record_original = new MarcRecord(record),
              fields_modified = [
                {
                  tag: '650',
                  ind2: '7',
                  subfields: [
                    {
                      code: 'a',
                      value: 'foo'
                    },
                    {
                      code: '2',
                      value: 'ysa'
                    }
                  ]
                },
                {
                  tag: '650',
                  ind2: '7',
                  subfields: [
                    {
                      code: 'a',
                      value: 'foo'
                    },
                    {
                      code: '2',
                      value: 'ysa'
                    }
                  ]
                }
              ];

              http_mock.create({
                url: 'http://foo.bar/ysa/lookup?label=foo&lang=fi',
                status: 200,
                body: JSON.stringify({
                  result: [{
                    vocab: 'ysa',
                    lang: 'fi'
                  }]
                })
              });
              
              return validator_factory.factory({
                finto: {
                  url: 'http://foo.bar'
                }
              }).fix(record).then(function(results) {
                
                expect(results).to.eql([
                  {
                    'type': 'addSubfield',
                    'field': fields_modified[0],
                    'subfield': fields_modified[0].subfields[1]
                  },
                  {
                    'type': 'addSubfield',
                    'field': fields_modified[1],
                    'subfield': fields_modified[1].subfields[1]
                  }
                ]);
                expect(record).to.not.eql(record_original);
                expect(record.fields).to.eql(fields_modified);

              });

            });

            it("Should fix the record by converting to 653 field because lexicon couldn't be found", function() {

              var record = new MarcRecord({
                fields: [{
                  tag: '650',
                  ind2: '7',
                  subfields: [{
                    code: 'a',
                    value: 'foo'
                  }]
                }]
              }),
              record_original = new MarcRecord(record),
              field_modified_1 = {
                tag: '653',
                ind2: '7',
                subfields: [{
                  code: 'a',
                  value: 'foo'
                }]
              },
              field_modified_2 = {
                tag: '653',
                ind2: '0',
                subfields: [{
                  code: 'a',
                  value: 'foo'
                }]
              };

              http_mock.create({
                url: 'http://foo.bar/ysa/lookup?label=bar&lang=fi',
                status: 404
              });
              http_mock.create({
                url: 'http://foo.bar/allars/lookup?label=bar&lang=sv',
                status: 404
              });
              http_mock.create({
                url: 'http://foo.bar/musa/lookup?label=bar&lang=fi',
                status: 404
              });
              http_mock.create({
                url: 'http://foo.bar/musa/lookup?label=bar&lang=sv',
                status: 404
              });

              
              return validator_factory.factory({
                finto: {
                  url: 'http://foo.bar'
                }
              }).fix(record).then(function(results) {

                expect(results).to.eql([
                  {
                    'type': 'modifyField',
                    'old': record_original.fields[0],
                    'new': field_modified_1
                  },
                  {
                    'type': 'modifyField',
                    'old': field_modified_1,
                    'new': field_modified_2
                  }
                ]);
                expect(record).to.not.eql(record_original);
                expect(record.fields).to.eql([field_modified_2]);

              });

            });

            it("Should fix the record by converting to 653 field and mapping inexchangeable subfields", function() {

              var record = new MarcRecord({
                fields: [{
                  tag: '650',
                  ind2: '7',
                  subfields: [
                    {
                      code: 'a',
                      value: 'foo'
                    },
                    {
                      code: 'g',
                      value: 'bar'
                    },
                    {
                      code: 'c',
                      value: 'foobaria'
                    },
                    {
                      code: 'v',
                      value: 'fubar'
                    }
                  ]
                }]
              }),
              field_modified_1 = {
                tag: '653',
                ind2: '7',
                subfields: [
                  {
                    code: 'a',
                    value: 'foo'
                  },
                  {
                    code: 'g',
                    value: 'bar'
                  },
                  {
                    code: 'c',
                    value: 'foobaria'
                  },
                  {
                    code: 'v',
                      value: 'fubar'
                  }
                ]
              },
              field_modified_2 = {
                tag: '653',
                ind2: '0',
                subfields: [
                  {
                    code: 'a',
                    value: 'foo'
                  },
                  {
                    code: 'g',
                    value: 'bar'
                  },
                  {
                    code: 'c',
                    value: 'foobaria'
                  },
                  {
                    code: 'v',
                    value: 'fubar'
                  }
                ]
              },
              field_modified_3 = {
                tag: '653',
                ind2: '0',
                subfields: [
                  {
                    code: 'a',
                    value: 'foo'
                  },
                  {
                    code: 'g',
                    value: 'bar'
                  },
                  {
                    code: 'v',
                    value: 'fubar'
                  }
                ]
              },
              field_modified_4 = {
                tag: '653',
                ind2: '0',
                subfields: [
                  {
                    code: 'a',
                    value: 'foo'
                  },
                  {
                    code: 'g',
                    value: 'bar'
                  }
                ]
              },
              fields_added = [
                {
                  tag: '653',
                  ind1: '0',
                  ind2: '5',
                  subfields: [{
                    code: 'a',
                    value: 'foobaria'
                  }]
                },
                {
                  tag: '653',
                  ind1: '0',
                  ind2: '0',
                  subfields: [{
                    code: 'a',
                    value: 'fubar'
                  }]
                }
              ],
              record_original = new MarcRecord(record);

              http_mock.create({
                url: 'http://foo.bar/ysa/lookup?label=bar&lang=fi',
                status: 404
              });
              http_mock.create({
                url: 'http://foo.bar/allars/lookup?label=bar&lang=sv',
                status: 404
              });
              http_mock.create({
                url: 'http://foo.bar/musa/lookup?label=bar&lang=fi',
                status: 404
              });
              http_mock.create({
                url: 'http://foo.bar/musa/lookup?label=bar&lang=sv',
                status: 404
              });
              
              return validator_factory.factory({
                finto: {
                  url: 'http://foo.bar'
                }
              }).fix(record).then(function(results) {
  
                expect(results.length).to.equal(6);

                expect(results[0]).to.eql({
                  'type': 'modifyField',
                  'old': record_original.fields[0],
                  'new': field_modified_1
                });
                expect(results[1]).to.eql({
                  'type': 'modifyField',
                  'old': field_modified_1,
                  'new': field_modified_2
                });
                expect(results[2]).to.eql({
                  'type': 'addField',
                  'field': fields_added[0]
                });
                expect(results[3]).to.eql({
                  'type': 'removeSubfield',
                  'field': field_modified_3,
                  'subfield': field_modified_2.subfields[2]
                });
                expect(results[4]).to.eql({
                  'type': 'addField',
                  'field': fields_added[1]
                });
                expect(results[5]).to.eql({
                  'type': 'removeSubfield',
                  'field': field_modified_4,
                  'subfield': field_modified_2.subfields[3]
                });

                expect(record).to.not.eql(record_original);

              });

            });

          });

        });

      });

    });

  };

}
