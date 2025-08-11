export default function () {
  return {
    description: 'Handle double commas in 700$e-subfields',
    validate: record => ({
      valid: !record
        .get(/^700$/u)
        .some(f => f.subfields.every(sf => sf.code === 'e' && (/,,/u).test(sf.value)))
    }),
    fix: record => record.get(/^700$/u).forEach(f => f.subfields.filter(sf => sf.code === 'e').forEach(sf => { // eslint-disable-line array-callback-return
      sf.value = sf.value.replace(/,,/u, ',');
    }))
  };
}
