/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* MARC record validators used in Melinda
*
* Copyright (C) 2014-2018 University Of Helsinki (The National Library Of Finland)
*
* This file is part of marc-record-validators-melinda
*
* marc-record-validators-melinda program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* marc-record-validators-melinda is distributed in the hope that it will be useful,
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
*/

/* eslint-disable require-await */
'use strict';

import {promisify} from 'es6-promisify';
import {detect as detectAsync} from 'cld';
import LanguageCodes from 'langs';

export default async function (tagPattern, treshold = 90) {
	const detect = promisify(detectAsync);

	if (tagPattern instanceof RegExp) {
		return {
			description:
      'Handles invalid/missing item language code',
			validate,
			fix
		};
	}
	throw new Error('No tagPattern provided');

	async function validate(record) {
		const results = await checkLanguage(record);

		if (results.failed) {
			return {valid: Boolean(results.currentCode), messages: [
				'Language detection failed'
			]};
		}

		/* istanbul ignore if: Unreliable text is hard to find */
		if (results.notReliable) {
			return {valid: Boolean(results.currentCode), messages: [
				'Language detection was not reliable'
			]};
		}

		if (results.detected) {
			if (results.detected !== results.currentCode) {
				return {valid: false, messages: [
					`Item language code is invalid. Correct language code: ${results.detected}`
				]};
			}
			return {valid: true};
		}

		if (results.suggested) {
			return {valid: Boolean(results.currentCode), messages: [
				`Item language code is invalid. Current code: '${results.currentCode}', suggestions: ${results.suggested.join()}`
			]};
		}
	}

	async function fix(record) {
		const results = await checkLanguage(record);

		/* istanbul ignore if: Unreliable text is hard to find */
		if (results.notReliable && !results.currentCode) {
			return;
		}

		if (results.suggested && results.currentCode) {
			return;
		}

		if (results.failed && !results.currentCode) {
			return;
		}

		if (results.detected && results.detected !== results.currentCode) {
			const f008 = record.get(/^008$/).shift();

			if (f008) {
				const start = f008.value.slice(0, 35);
				const end = f008.value.slice(38);
				f008.value = `${start}${results.detected}${end}`;
			}

			const f041 = record.get(/^041$/).shift();

			if (f041) {
				const subfield = f041.subfields.find(sf => sf.code === 'a');

				if (subfield) {
					subfield.value = results.detected;
				} else {
					f041.subfields.push({code: 'a', value: results.detected});
					f041.subfields.sort((a, b) => {
						if (a.code < b.code) {
							return -1;
						}

						if (a.code > b.code) {
							return 1;
						}
						return 0;
					});
				}
			} else {
				record.insertField({tag: '041', ind1: ' ', ind2: ' ', subfields: [{
					code: 'a',
					value: results.detected
				}]});
			}
		}
	}

	async function checkLanguage(record) {
		const text = getText(record);
		const langCode = getLanguageCode(record);

		if (text.length === 0) {
			return {failed: true, currentCode: langCode};
		}

		try {
			const results = await detect(text);

			if (results.reliable) {
				const detectedLang = results.languages.find(l => l.percent >= treshold);

				if (detectedLang) {
					return {
						detected: get2TLangCode(detectedLang.code),
						currentCode: langCode
					};
				}

				return {
					currentCode: langCode,
					suggested: results.languages.map(l => get2TLangCode(l.code))
				};
			}

			return {notReliable: true, currentCode: langCode};
		} catch (err) {
			if (/^Failed to identify language$/.test(err.message)) {
				return {failed: true, currentCode: langCode};
			}

			throw err instanceof Error ? err : new Error(err.message);
		}

		function getText(record) {
			return record.get(tagPattern).reduce((acc, field) => {
				const fieldText = field.subfields.find(sf => sf.code === 'a').value;
				return `${acc}${fieldText}`;
			}, '');
		}

		function getLanguageCode(record) {
			const f008 = record.get(/^008$/).shift();

			if (f008) {
				const code = f008.value.slice(35, 38);
				if (/^[^ |^]+$/.test(code) && code !== 'zzzx') {
					return code;
				}
			}

			const f041 = record.get(/^041$/).shift();

			if (f041) {
				const code = f041.subfields.find(sf => sf.code === 'a').value;
				return code;
			}
		}

		function get2TLangCode(code) {
			return LanguageCodes.where('1', code)['2T'];
		}
	}
}
