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

'use strict';

export default async function (configuration) {
	if (Array.isArray(configuration)) {
		return {
			description:
			'Validates fixed fields',
			validate
		};
	}

	throw new Error('No configuration provided');

	async function validate(record) {
		const messages = configuration.reduce((messages, item) => {
			let results;

			if (item.leader) {
				results = validateField(record.leader, item);
			} else {
				results = record.get(item.tag)
					.map(f => validateField(f.value, item, f.tag));
			}

			if (results && results.length > 0) {
				return messages.concat(...results).reduce((acc, item) => {
					return acc.includes(item) ? acc : acc.concat(item);
				}, []);
			}

			return messages;
		}, []);

		return {valid: messages.length === 0, messages};

		function validateField(value, spec, tag) {
			const messagePrefix = tag ? `Field ${tag}` : 'Leader';

			if (typeof spec.length === 'number') {
				if (value.length !== spec.length) {
					return [`${messagePrefix} has invalid length`];
				}
			}

			if (spec.rules) {
				return spec.rules.reduce((messages, rule, ruleIndex) => {
					const indexes = getIndexes(rule.position);
					const positions = value.split('').reduce((positions, char, index) => {
						if (indexes.includes(index) && (!rule.dependencies || rule.dependencies.every(checkDependency))) {
							if (!rule.pattern.test(char)) {
								return positions.concat(index);
							}
						}

						return positions;

						function checkDependency(dependency) {
							const indexes = getIndexes(dependency.position);
							return value.split('').every((char, index) => {
								return !indexes.includes(index) || dependency.pattern.test(char);
							});
						}
					}, []);

					if (positions.length > 0) {
						return messages.concat(`${messagePrefix} has invalid values at positions: ${positions.join()} (Rule index ${ruleIndex})`);
					}

					return messages;

					function getIndexes(arg) {
						if (Array.isArray(arg)) {
							const indexes = [...new Array(arg[1] + 1).keys()];
							return indexes.slice(arg[0], arg[1] + 1);
						}

						return [arg];
					}
				}, []);
			}
		}
	}
}
