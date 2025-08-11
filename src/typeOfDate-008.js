import createDebugLogger from 'debug';

const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/typeOfDate-008');

export default function () {
  return {
    description: 'Validates 008 06',
    validate,
    fix
  };

  function validate(record) {
    const [f008] = record.get(/008/u);
    const c06 = f008.value.substring(6, 7);
    const c1114 = f008.value.substring(11, 15);
    // if 008 06 = s, and 11-14 = #### (not year/digits)
    if (c06 === 't' && !(/[0-9u]{4}/u).test(c1114)) {
      debug('is t and not valid 1114');
      return {valid: false, message: 'Invalid 008 06'};
    }

    return {valid: true};
  }

  function fix(record) {
    //  LDR/06=t ja 11-14=####, niin LDR/06 muutetaan s:ksi
    const [f008] = record.pop(/008/u);
    const c06 = f008.value.substring(6, 7);
    const c1114 = f008.value.substring(11, 15);
    // if 008 06 = s, and 11-14 = #### (not year/digits)
    if (c06 === 't' && !(/[0-9u]{4}/u).test(c1114)) {
      f008.value = `${f008.value.substring(0, 6)}s${f008.value.substring(7)}`;
      record.insertField(f008);
      return true;
    }

    record.insertField(f008);
    return true;
  }
}
