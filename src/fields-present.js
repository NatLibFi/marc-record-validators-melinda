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


export default function (tagPatterns) {
  if (Array.isArray(tagPatterns)) {
    return {
      description:
        'Checks whether the configured fields are present in the record',
      validate
    };
  }

  throw new Error('No tag pattern array provided');

  function validate(record) {
    const missingFields = tagPatterns.map(pattern => {
      const result = record.fields.find(field => pattern.test(field.tag));
      return result ? undefined : pattern;
    });
    const isEmpty = missingFields.every(index => index === undefined);
    let errorMessage = ['The following tag patterns are not present in the record tag field: ']; // eslint-disable-line functional/no-let
    errorMessage = errorMessage.concat(missingFields).join(' ');

    return isEmpty ? {valid: true, messages: []} : {valid: false, messages: [errorMessage]};
  }
}
