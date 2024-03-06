import fs from 'fs';
import path from 'path';

const mappings336 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'field336.json'), 'utf8'));
const mappings337 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'field337.json'), 'utf8'));

export function map336CodeToTerm(code, catLang = 'fin') {
  const [mapping] = mappings336.filter(m => m.code === code);
  if (!mapping) {
    return undefined;
  }
  if (catLang in mapping) {
    return mapping[catLang];
  }
  return mapping.fin; // Default to Finnish (which should be complete, knock-knock)
}

export function map337CodeToTerm(code, catLang = 'fin') {
  const [mapping] = mappings337.filter(m => m.code === code);
  if (!mapping) {
    return undefined;
  }
  if (catLang in mapping) {
    return mapping[catLang];
  }
  return mapping.fin; // Default to Finnish (which should be complete, knock-knock)
}

export function getFormOfItem(record) {
  const [f008Value] = record.get('008').map(field => field.value);
  if (f008Value && f008Value.length === 40) {
    const pos = getFormOfItemPosition(record);
    return f008Value[pos];
  }
  return '|';
}

export function getFormOfItemPosition(record) {
  if (record.isMP() || record.isVM()) {
    return 29;
  }
  return 23;
}

export function getTitleMedium(record) {
  // Get 245$h. Very old and deprecated practise...
  const [f245] = record.get('245');
  if (!f245) {
    return undefined;
  }
  const [h] = f245.subfields.filter(sf => sf.code === 'h');
  return h ? h.value : undefined;
}
