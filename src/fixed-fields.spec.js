/**
 *
 * @licstart  The following is the entire license notice for the JavaScript code in this file.
 *
 * MARC record validators used in Melinda
 *
 * Copyright (c) 2014-2020 University Of Helsinki (The National Library Of Finland)
 *
 * This file is part of marc-record-validators-melinda
 *
 * marc-record-validators-melinda program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * marc-record-validators-melinda is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * @licend  The above is the entire license notice
 * for the JavaScript code in this file.
 *
 */


import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {MarcRecord} from '@natlibfi/marc-record';
import validatorFactory from '../src/fixed-fields';

const {expect} = chai;
chai.use(chaiAsPromised);

describe('fixed-fields: language', () => {
  it('Creates a validator', async () => {
    const validator = await validatorFactory([]);

    expect(validator)
      .to.be.an('object')
      .that.has.any.keys('description', 'validate');

    expect(validator.description).to.be.a('string');
    expect(validator.validate).to.be.a('function');
  });

  it('Throws an error when configuration is not provided', () => {
    try {
      validatorFactory();
    } catch (error) {
      expect(error).to.be.an('error').with.property('message', 'No configuration provided');
    }
  });

  describe('#validate', () => {
    it('Finds the record valid', async () => {
      const validator = await validatorFactory([
        {leader: true, length: 6, rules: [{position: [0, 6], pattern: /[abcdefg]/u}]},
        {tag: /^FOO$/u, length: 12, rules: [{position: 0, pattern: /f/u}]},
        {tag: /^BAR$/u, length: 6, rules: [
          {position: 0, pattern: /[fb]/u},
          {position: 1, pattern: /a/u, dependencies: [{position: 0, pattern: /b/u}]},
          {position: [2, 3], pattern: /u/u, dependencies: [{position: 0, pattern: /[^b]/u}]}
        ]}
      ]);
      const record = new MarcRecord({
        leader: 'bacgfe',
        fields: [
          {
            tag: 'FOO',
            value: 'foobarfoobar'
          },
          {
            tag: 'BAR',
            value: 'bauuoo'
          }
        ]
      });
      const result = await validator.validate(record);

      expect(result).to.be.an('object').and.to.include({valid: true});
    });

    it('Finds the record invalid', async () => {
      const validator = await validatorFactory([
        {leader: true, length: 6, rules: [{position: [0, 6], pattern: /[abcdefg]/u}]},
        {tag: /^FOO$/u, length: 12, rules: [{position: 0, pattern: /f/u}]},
        {tag: /^BAR$/u, length: 6, rules: [
          {position: 0, pattern: /[fb]/u},
          {position: 1, pattern: /a/u, dependencies: [{position: 0, pattern: /b/u}]},
          {position: [2, 3], pattern: /u/u, dependencies: [{position: 0, pattern: /[^a]/u}]}
        ]},
        {tag: /^FUBAR$/u, length: 5}
      ]);
      const record = new MarcRecord({
        leader: 'bacxfe',
        fields: [
          {
            tag: 'FOO',
            value: 'barfoofoobar'
          },
          {
            tag: 'BAR',
            value: 'burfoo'
          },
          {
            tag: 'FUBAR',
            value: 'foo'
          }
        ]
      });

      const result = await validator.validate(record);

      expect(result).to.eql({valid: false, messages: [
        'Leader has invalid values at positions: 3 (Rule index 0)',
        'Field FOO has invalid values at positions: 0 (Rule index 0)',
        'Field BAR has invalid values at positions: 1 (Rule index 1)',
        'Field BAR has invalid values at positions: 2,3 (Rule index 2)',
        'Field FUBAR has invalid length'
      ]});
    });
  });
});
