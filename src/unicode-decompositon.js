import {isEqual, uniqWith} from 'lodash';

export default async function () {
	return {
		description: 'Handles identical duplicate in record fields',
		validate,
		fix
	};

	async function validate(record) {

		return valid ? {valid, messages: []} : {valid, messages};
	}

	async function fix(record) {

	}
}


// async function validate(record) {
//   const uniq = uniqWith(record.fields, isEqual);
//   const valid = uniq.length === record.fields.length;
//   const messages = record.fields.filter(tag => !uniq.includes(tag))
//     .map(obj => `Field ${obj.tag} has duplicates`);

//   return valid ? {valid, messages: []} : {valid, messages};
// }

// async function fix(record) {
//   record.fields
//     .filter(tag => !uniqWith(record.fields, isEqual).includes(tag))
//     .forEach(tag => record.removeField(tag));
// }