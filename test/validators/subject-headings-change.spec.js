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
      '../../lib/validators/subject-headings-change'
    ], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('chai'),
      require('chai-as-promised'),
      require('marc-record-js'),
      require('../../lib/validators/subject-headings-change')
    );
  }

}(this, factory));

function factory(chai, chaiAsPromised, MarcRecord, validator_factory) {

  'use strict';

  var expect = chai.expect;

  chai.use(chaiAsPromised);

  describe('subject-headings-change', function() {

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

          it('Should not resolve with messages', function() {
            return expect(validator_factory.factory().validate(new MarcRecord({
              fields: [{
                tag: '245',
                subfields: [{
                  code: 'a',
                  value: 'foobar'
                }]
              }]
            }))).to.eventually.eql([]);
          });

          it('Should resolve with a warning message', function() {

            var record = new MarcRecord({
              fields: [{
                tag: '650',
                subfields: [
                  {
                    code: 'a',
                    value: 'lapsikeskeisyys'
                  },
                  {
                    code: '2',
                    value: 'ysa'
                  }
                ]
              }]
            });

            return expect(validator_factory.factory().validate(record)).to.eventually.eql([{
              type: 'warning',
              message: 'Obsolete subject heading in field 650',
              field: record.fields[0]
            }]);

          });

        });

        describe('#fix', function() {

          it('Should resolve with an array', function() {
            return expect(validator_factory.factory().fix(new MarcRecord())).to.eventually.be.an('array');
          });

          it('Should fix the record', function() {

            var record = new MarcRecord({
              fields: [{
                tag: '650',
                subfields: [
                  {
                    code: 'a',
                    value: 'marsut'
                  },
                  {
                    code: '2',
                    value: 'ysa'
                  }
                ]
              }]
            }),
            field_modified = {
              tag: '650',
              subfields: [
                {
                  code: 'a',
                  value: 'marsu'
                },
                {
                  code: '2',
                  value: 'ysa'
                }
              ]
            },
            record_original = record.toJsonObject();

            return validator_factory.factory().fix(record).then(function(results) {

              expect(results).to.eql([{
                'type': 'modifyField',
                'old': record_original.fields[0],
                'new': field_modified
              }]);
              expect(record_original).to.not.eql(record.toJsonObject());
              expect(record.fields).to.eql([field_modified]);

            });

          });

          it('Should not alter a valid record', function() {

            var record = new MarcRecord({
              fields: [{
                tag: '651',
                subfields: [
                  {
                    code: 'a',
                    value: 'Kuopio'
                  },
                  {
                    code: '2',
                    value: 'ysa'
                  }
                ]
              }]
            }),

            record_original = record.toJsonObject();

            return validator_factory.factory().fix(record).then(function(results) {

              expect(record_original).to.eql(record.toJsonObject());

            });

          });

        });

      });

    });

  });

}
