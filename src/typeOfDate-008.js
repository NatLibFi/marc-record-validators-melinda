import {getChar} from './utils';
import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/typeOfDate-008');  // eslint-disable-line

export default function () {
  return {
    description: 'Validates 008 06',
    validate,
    fix
  };

  function validate(record) {
    const [f008] = record.get(/008/u);
    const c06 = getChar(f008.value, 6, 1);
    const c1114 = getChar(f008.value, 11, 4);
    // if 008 06 = s, and 11-14 = #### (not year/digits)
    if (c06 === 't' && !(/\d{4}/u).test(c1114)) {
      debug('is t and not valid 1114');
      return {valid: false, message: 'Invalid 008 06'};
    }

    return {valid: true};
  }

  function fix(record) {
    //  LDR/06=t ja 11-14=####, niin LDR/06 muutetaan s:ksi
    const [f008] = record.pop(/008/u); // eslint-disable-line functional/immutable-data
    const c06 = getChar(f008.value, 6, 1);
    const c1114 = getChar(f008.value, 11, 4);
    // if 008 06 = s, and 11-14 = #### (not year/digits)
    if (c06 === 't' && !(/\d{4}/u).test(c1114)) {
      f008.value = `${getChar(f008.value, 0, 6)}s${getChar(f008.value, 7)}`; // eslint-disable-line functional/immutable-data
      record.insertField(f008);
      return true;
    }

    record.insertField(f008);
    return true;
  }
}
