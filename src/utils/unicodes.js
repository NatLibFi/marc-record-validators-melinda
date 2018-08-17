export const MAP_CONVERSION = {
	/**
   * @internal Normalizations
   **/
	'‐': '-',
	'‑': '-',
	'‒': '-',
	'–': '-',
	'—': '-',
	'―': '-',
	/**
   * @internal Precompose å, ä, ö, Å, Ä and Ö
   **/
	å: 'å',
	ä: 'ä',
	ö: 'ö',
	Å: 'Å',
	Ä: 'Ä',
	Ö: 'Ö',
	/**
   * @internal Decompose everything else (list incomplete)
   **/
	á: 'á',
	à: 'à',
	â: 'â',
	ã: 'ã',
	é: 'é',
	è: 'è',
	ê: 'ê',
	ẽ: 'ẽ',
	ë: 'ë',
	í: 'í',
	ì: 'ì',
	î: 'î',
	ĩ: 'ĩ',
	ï: 'ï',
	ñ: 'ñ',
	ó: 'ó',
	ò: 'ò',
	ô: 'ô',
	õ: 'õ',
	ś: 'ś',
	ú: 'ú',
	ù: 'ù',
	û: 'û',
	ü: 'ü',
	ũ: 'ũ',
	ý: 'ý',
	ỳ: 'ỳ',
	ŷ: 'ŷ',
	ỹ: 'ỹ',
	ÿ: 'ÿ',
	Á: 'Á',
	À: 'À',
	Â: 'Â',
	Ã: 'Ã',
	É: 'É',
	È: 'È',
	Ê: 'Ê',
	Ẽ: 'Ẽ',
	Ë: 'Ë',
	Í: 'Í',
	Ì: 'Ì',
	Î: 'Î',
	Ĩ: 'Ĩ',
	Ï: 'Ï',
	Ñ: 'Ñ',
	Ó: 'Ó',
	Ò: 'Ò',
	Ô: 'Ô',
	Õ: 'Õ',
	Ś: 'Ś',
	Ú: 'Ú',
	Ù: 'Ù',
	Û: 'Û',
	Ũ: 'Ũ',
	Ü: 'Ü',
	Ý: 'Ý',
	Ỳ: 'Ỳ',
	Ŷ: 'Ŷ',
	Ỹ: 'Ỹ',
	Ÿ: 'Ÿ'
};

export function clone(obj) {
	return typeof obj === 'object' ? JSON.parse(JSON.stringify(obj)) : obj;
}

export function modifySubfields(field, modifyCallback) {
	if ('subfields' in field) {
		const fieldOriginal = clone(field);
		field.subfields.forEach(modifyCallback);
		return {
			old: fieldOriginal,
			new: clone(field)
		};
	}
	throw new Error('Field is not a variable field');
}
