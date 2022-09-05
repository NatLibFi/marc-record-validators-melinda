export function isElectronicMaterial(record) {
  const f337s = record.get('337');

  return f337s.some(field => {
    const mediaTypeIsC = field.subfields.some(sub => sub.code === 'b' && sub.value === 'c');
    const sourceIsRdamedia = field.subfields.some(sub => sub.code === '2' && sub.value === 'rdamedia');
    return mediaTypeIsC && sourceIsRdamedia;
  });
}
