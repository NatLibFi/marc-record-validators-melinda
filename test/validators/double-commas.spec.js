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

/* istanbul ignore next: umd wrapper */
(function (root, factory) {

  'use strict';

  if (typeof define === 'function' && define.amd) {
    define([
      'chai/chai',
      'marc-record-js',
      '../../lib/validators/double-commas'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('marc-record-js'),
      require('../../lib/validators/double-commas')
    );
  }

}(this, factory));

function factory(chai, MarcRecord, validator_factory)
{

  'use strict';

  var expect = chai.expect;

  describe('double-commas', function() {
    
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
          
          it('Should return an array', function() {
            expect(validator_factory.factory().validate(new MarcRecord())).to.eql([]);
          });

          it('Should not return messages', function() {
            expect(validator_factory.factory().validate(new MarcRecord({
              fields: [
                {
                  tag: '100',
                  subfields: [
                    {
                      code: 'a',
                      value: 'Foo, Bar'
                    },
                    {
                      code: 'e',
                      value: 'director'
                    },
                  ]
                },
                {
                  tag: '700',
                  subfields: [
                    {
                      code: 'a',
                      value: 'Fu, Bar'
                    },
                    {
                      code: 'e',
                      value: 'director'
                    },
                  ]
                }
              ]
            }))).to.eql([]);
          });

          it('Should return a warning message', function() {

            var record = new MarcRecord({
              fields: [{
                tag: '700',
                subfields: [
                  {
                    code: 'a',
                    value: 'Foo, Bar'
                  },
                  {
                    code: 'e',
                    value: 'director,,'
                  }
                ]
              }]
            });

            expect(validator_factory.factory().validate(record)).to.eql([{
              type: 'warning',
              message: "Double comma at subfield 'e'",
              field: record.fields[0]
            }]);
            
        });
        
        describe('#fix', function() {
          
          it('Should return an array', function() {
            expect(validator_factory.factory().fix(new MarcRecord())).to.be.an('array');
          });
          
          it('Should fix the record', function() {
            
            var record = new MarcRecord({
              fields: [{
                tag: '700',
                subfields: [
                  {
                    code: 'a',
                    value: 'Foo, Bar'
                  },
                  {
                    code: 'e',
                    value: 'director,,'
                  }
                ]
              }]
            }),
            field_modified = {
              tag: '700',
              subfields: [
                {
                  code: 'a',
                  value: 'Foo, Bar'
                },
                {
                  code: 'e',
                  value: 'director,'
                }
              ]
            },
            record_original = record.toJsonObject();

            expect(validator_factory.factory().fix(record)).to.eql([{
              'type': 'modifyField',
              'old': record_original.fields[0],
              'new': field_modified
            }]);
            expect(record_original).to.not.eql(record.toJsonObject());
            expect(record.fields).to.eql([field_modified]);
            
          });
                    
        });
        
        });
        
      });
      
    });

  });

}
