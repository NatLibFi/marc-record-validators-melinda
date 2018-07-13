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

import {MAP_CONVERSION, modifySubfields} from './utils/unicodes';

export default async function () {
	const PATTERN = Object.keys(MAP_CONVERSION).reduce((result, key, index, list) => {
		console.log('key: ', key);
		console.log('result: ', result);
		return index === list.length - 1 ? new RegExp(`${result}${key})`) : `${result}${key}|`;
	}, '(');

	return {
		description: 'Unicode decomposer',
		validate,
		fix
	};

	async function validate(record) {
		getFields(record).map(field => {
			return field.subfields.filter(subfield => PATTERN.test(subfield.value)
				.map(subfield => subfield.code));
		});
		return false;
		// Return valid ? {valid, messages: []} : {valid, messages};
	}

	async function fix(record) {
		const get = getFields(record).map(field => {
			return modifySubfields(field, subfield => {
				if (PATTERN.test(subfield.value)) {
					subfield.value = convert(subfield.value);
				}
			});
		});
		console.log('get: ', get);
	}

	function getFields(record) {
		return record.fields.filter(field => {
			if ('subfields' in field) {
				console.log('subfields: ', field.subfields);
				return field.subfields.some(subfield => PATTERN.test(subfield.value));
			}
			return [];
		});
	}
	function convert(value) {
		console.log('convert: ', convert);
		return Object.keys(MAP_CONVERSION).reduce((result, key) => {
			return result.includes(key) ? result.replace(new RegExp(key, 'g'), MAP_CONVERSION[key]) : result;
		}, value);
	}
}

// Result = (‐ |‑ |‒ |– |— |― |å |ä |ö |Å |Ä |Ö |á |à |â |ã |é |è |ê |ẽ |ë |í |ì |î |ĩ |ï|ñ |ó |ò |ô |õ |ś |ú |ù |û |ü |ũ |ý |ỳ |ŷ |ỹ |ÿ |Á |À |Â |Ã |É |È |Ê |Ẽ |Ë |Í |Ì |Î |Ĩ|Ï |Ñ |Ó |Ò |Ô |Õ |Ś |Ú |Ù |Û |Ũ |

// key:  ‐
// key:  ‑
// key:  ‒
// key:  –
// key:  —
// key:  ―
// key:  å
// key:  ä
// key:  ö
// key:  Å
// key:  Ä
// key:  Ö
// key:  á
// key:  à
// key:  â
// key:  ã
// key:  é
// key:  è
// key:  ê
// key:  ẽ
// key:  ë
// key:  í
// key:  ì
// key:  î
// key:  ĩ
// key:  ï
// key:  ñ
// key:  ó
// key:  ò
// key:  ô
// key:  õ
// key:  ś
// key:  ú
// key:  ù
// key:  û
// key:  ü
// key:  ũ
// key:  ý
// key:  ỳ
// key:  ŷ
// key:  ỹ
// key:  ÿ
// key:  Á
// key:  À
// key:  Â
// key:  Ã
// key:  É
// key:  È
// key:  Ê
// key:  Ẽ
// key:  Ë
// key:  Í
// key:  Ì
// key:  Î
// key:  Ĩ
// key:  Ï
// key:  Ñ
// key:  Ó
// key:  Ò
// key:  Ô
// key:  Õ
// key:  Ś
// key:  Ú
// key:  Ù
// key:  Û
// key:  Ũ
// key:  Ü
// key:  Ý
// key:  Ỳ
// key:  Ŷ
// key:  Ỹ
// key:  Ÿ

// [
// '‐',
// '‑',
// '‒',
// '–',
// '—',
// '―',
// 'å',
// 'ä',
// 'ö',
// 'Å',
// 'Ä',
// 'Ö',
// 'á',
// 'à',
// 'â',
// 'ã',
// 'é',
// 'è',
// 'ê',
// 'ẽ',
// 'ë',
// 'í',
// 'ì',
// 'î',
// 'ĩ',
// 'ï',
// 'ñ',
// 'ó',
// 'ò',
// 'ô',
// 'õ',
// 'ś',
// 'ú',
// 'ù',
// 'û',
// 'ü',
// 'ũ',
// 'ý',
// 'ỳ',
// 'ŷ',
// 'ỹ',
// 'ÿ',
// 'Á',
// 'À',
// 'Â',
// 'Ã',
// 'É',
// 'È',
// 'Ê',
// 'Ẽ',
// 'Ë',
// 'Í',
// 'Ì',
// 'Î',
// 'Ĩ',
// 'Ï',
// 'Ñ',
// 'Ó',
// 'Ò',
// 'Ô',
// 'Õ',
// 'Ś',
// 'Ú',
// 'Ù',
// 'Û',
// 'Ũ',
// 'Ü',
// 'Ý',
// 'Ỳ',
// 'Ŷ',
// 'Ỹ',
// 'Ÿ'
// ];
