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
      '../../lib/validators/identical-field-eliminator'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('marc-record-js'),
      require('../../lib/validators/identical-field-eliminator')
    );
  }

}(this, factory));

function factory(chai, chaiAsPromised, MarcRecord, validator_factory)
{

  'use strict';

  var expect = chai.expect;

  chai.use(chaiAsPromised);

  describe('identical-field-eliminator', function() {

    it('Should be the expected object', function() {
      expect(validator_factory).to.be.an('object');
      expect(validator_factory.name).to.be.a('string');
      expect(validator_factory.factory).to.be.a('function');
    });

    describe('#factory', function() {

      it('Should return the expected object', function() {
        expect(validator_factory.factory('foo')).to.be.an('object').and.to
          .respondTo('validate').and.to
          .respondTo('fix');
      });

      describe('object', function() {

        describe('#validate', function() {

          it('Should resolve with an array', function() {
            return expect(validator_factory.factory('foo').validate(new MarcRecord())).to.eventually.eql([]);
          });

          it('Should generate two warnings', function() {
            return expect(validator_factory.factory('foo').validate(new MarcRecord({
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
            }))).to.eventually.have.lengthOf(2);
          });

          it('Should not de-duplicate fields with different indicator 1', function() {
            return expect(validator_factory.factory('foo').validate(new MarcRecord({
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
            }))).to.eventually.eql([]);
          });

        });

        describe('#fix', function() {

          it('Should resolve with an array', function() {
            return expect(validator_factory.factory('foo').fix(new MarcRecord())).to.eventually.be.an('array');
          });

          it("Should fix the record", function() {

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

            return validator_factory.factory('foo').fix(record).then(function(results) {

              expect(record_original).to.not.eql(record.toJsonObject());

            });

          });

        });

      });

    });

  });

}
