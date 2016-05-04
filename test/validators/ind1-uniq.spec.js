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
      '../../lib/validators/ind1-uniq'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('marc-record-js'),
      require('../../lib/validators/ind1-uniq')
    );
  }

}(this, factory));

function factory(chai, MarcRecord, validator_factory)
{

  'use strict';

  var expect = chai.expect;

  describe('ind1-uniq', function() {
    
    it('Should be the expected object', function() {
      expect(validator_factory).to.be.an('object');
      expect(validator_factory.name).to.be.a('string');
      expect(validator_factory.factory).to.be.a('function');
    });
    
    describe('#factory', function() {
      
      it('Should throw because tag is not a string', function() {
        expect(validator_factory.factory).to.throw(Error, /^Tag is not defined or is not a string$/);
      });

      it('Should return the expected object', function() {        
        expect(validator_factory.factory('foo')).to.be.an('object').and.to
          .respondTo('validate').and.to
          .respondTo('fix');        
      });
      
      describe('object', function() {
        
        describe('#validate', function() {
          
          it('Should return an array', function() {
            expect(validator_factory.factory('foo').validate(new MarcRecord())).to.eql([]);
          });

          it('Should not return a warning because of ind1', function() {
            expect(validator_factory.factory('foo').validate(new MarcRecord({
              fields: [
                {
                  tag: 'foo',
                  ind1: ' ',
                  value: 'bar'
                },
                {
                  tag: 'foo',
                  ind1: ' ',
                  value: 'bar'
                }
              ]
            }))).to.eql([]);
          });

          it('Should return a warning message (Control fields)', function() {
            expect(validator_factory.factory('foo').validate(new MarcRecord({
              fields: [
                {
                  tag: 'foo',
                  ind1: ' ',
                  value: 'bar'
                },
                {
                  tag: 'foo',
                  ind1: '1',
                  value: 'bar'
                }
              ]
            }))).to.eql([{
              type: 'warning',
              message: 'foo: Remove almost duplicate',
              field: {
                tag: 'foo',
                ind1: ' ',
                value: 'bar'
              }
            }]);
          });

          it('Should return a warning message (Variable fields)', function() {
            expect(validator_factory.factory('foo').validate(new MarcRecord({
              fields: [
                {
                  tag: 'foo',
                  ind1: ' ',
                  subfields: [{
                    code: 'a',
                    value: 'fubar'
                  }]
                },
                {
                  tag: 'foo',
                  ind1: '1',
                  subfields: [{
                    code: 'a',
                    value: 'fubar'
                  }]
                }
              ]
            }))).to.eql([{
              type: 'warning',
              message: 'foo: Remove almost duplicate',
              field: {
                tag: 'foo',
                ind1: ' ',
                subfields: [{
                  code: 'a',
                  value: 'fubar'
                }]
              }
            }]);
          });
          
        });
        
        describe('#fix', function() {
          
          it('Should return an array', function() {
            expect(validator_factory.factory('foo').fix(new MarcRecord())).to.be.an('array');
          });

          it("Shouldn't fix the record", function() {

            var record = new MarcRecord({
              fields: [
                {
                  tag: 'foo',
                  ind1: ' ',
                  value: 'bar'
                },
                {
                  tag: 'foo',
                  ind1: ' ',
                  value: 'bar'
                }
              ]
            }),
            record_original = record.toJsonObject();
            
            expect(validator_factory.factory('foo').fix(record)).to.eql([]);
            expect(record_original).to.eql(record.toJsonObject());

          });
          
          it('Should fix the record', function() {
            
            var record = new MarcRecord({
              fields: [
                {
                  tag: 'foo',
                  ind1: ' ',
                  value: 'bar'
                },
                {
                  tag: 'foo',
                  ind1: '1',
                  value: 'bar'
                }
              ]
            }),
            record_original = record.toJsonObject();
            
            expect(validator_factory.factory('foo').fix(record)).to.eql([{
              type: 'removeField',
              field: {
                tag: 'foo',
                ind1: ' ',
                value: 'bar'
              }
            }]);
            expect(record_original).to.not.eql(record.toJsonObject());
            expect(record.fields.length).to.equal(1);

          });
          
        });
        
      });

    });

  });

}
