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
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
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
 **/

/**
 * This validator de-duplicates identical fields in a record.
 */

import {MarcRecord} from '@natlibfi/marc-record';

export default function () {
  return {
    description: 'Handles identical duplicate in record fields',
    validate,
    fix
  };

  function validate(record) {
    const uniq = uniqWith(record.fields);
    const valid = uniq.length === record.fields.length;
    const messages = record.fields.filter(tag => !uniq.includes(tag))
      .map(obj => `Field ${obj.tag} has duplicates`);

    return valid ? {valid, messages: []} : {valid, messages};
  }

  function fix(record) {
    record.fields
      .filter(tag => !uniqWith(record.fields).includes(tag))
      .forEach(tag => record.removeField(tag));
  }

  function uniqWith(fields) {
    return fields.reduce((uniq, field) => {
      if (!uniq.some(f => MarcRecord.isEqual(f, field))) { // eslint-disable-line functional/no-conditional-statement
        uniq.push(field); // eslint-disable-line functional/immutable-data
      }

      return uniq;
    }, []);
  }
}
