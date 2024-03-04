import fs from 'fs';
import path from 'path';

const mappings336 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'src', 'field336.json'), 'utf8'));

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
