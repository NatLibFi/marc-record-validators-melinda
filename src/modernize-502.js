//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldToString} from './utils';

// Note that https://github.com/NatLibFi/marc-record-validators-melinda/blob/master/src/unicode-decomposition.js contains
// similar functionalities. It's less generic and lacks diacritic removal but has it advantages as well.

//const debug = createDebugLogger('@natlibfi/marc-record-validators-melinda/normalize-utf-diacritics');

// See also https://github.com/NatLibFi/marc-record-validators-melinda/blob/master/src/unicode-decomposition.js .
// It uses a list of convertable characters whilst this uses a generic stuff as well.
// It handles various '.' and '©' type normalizations as well.
// NB! This version has minor bug/feature issue regarding fixComposition()

// Author(s): Nicholas Volk
export default function () {

  return {
    description: 'Generic normalization of latin UTF-8 diacritics. Precompose Finnish å, ä and ö. Decompose others.',
    validate, fix
  };

  function fix(record) {
    const res = {message: [], fix: [], valid: true};

    record.fields.forEach(field => {
      normalizeField502(field);
    });

    // message.valid = !(message.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validate(record) {
    const res = {message: []};

    record.fields.forEach(field => {
      validateField(field, res);
    });

    res.valid = !(res.message.length >= 1); // eslint-disable-line functional/immutable-data
    return res;
  }

  function validateField(field, res) {
    if (!field.subfields) {
      return;
    }
    const orig = fieldToString(field);

    const normalizedField = normalizeField502(clone(field));
    const mod = fieldToString(normalizedField);
    if (orig !== mod) { // Fail as the input is "broken"/"crap"/sumthing
      res.message.push(`Fix '${orig}' => '${mod}'`); // eslint-disable-line functional/immutable-data
      return;
    }
    return;
  }
}


export function normalizeField502(field) {
  if (!field.subfields) {
    return field;
  }
  const acd = field.subfields.filter(sf => 'acd'.includes(sf.code));
  const str = acd.map(sf => sf.code).join('');
  // Check that we have relevant subfields and that they are in relevant order (with each other):
  if (!['acd', 'ac', 'ad'].includes(str)) {
    return field;
  }

  // "a = acd[0]"" is way more readable than "[a] = acd"...
  const a = acd[0]; // eslint-disable-line prefer-destructuring
  const c = acd[1].code === 'c' ? acd[1] : null;
  const d = acd[acd.length - 1].code === 'd' ? acd[acd.length - 1] : null;

  console.log(JSON.stringify(d)); // eslint-disable-line no-console

  if (!hasValidA() || !hasValidD) {
    return field;
  }

  const newValue = `${extractA()}--${extractC()}${extractD()}`;
  a.value = newValue; // eslint-disable-line functional/immutable-data
  field.subfields = field.subfields.filter(sf => !['c', 'd'].includes(sf.code)); // eslint-disable-line functional/immutable-data
  return field;

  function extractA() {
    return a.value.replace(/[ ,:]+$/u, '');
  }

  function extractC() {
    if (!c) {
      return '';
    }
    if (c) {
      return `${c.value.replace(/,$/u, '')},${d ? ' ' : ''}`;
    }
    return c.value;
  }

  function extractD() {
    return d ? d.value : '';
  }

  function hasValidA() {
    // Belongs to https://finto.fi/mts/fi/page/m91
    if (a.value.match(/^(?:AMK-opinnäytetyö|Anbalyysiseminaarityö|Artikkeliväitöskirja|Diplomityö|Erikoistyö|Esseeväitöskirja|Kandidaatintutkielma|Laudaturseminaarityö|Laudaturtyö|Lisensiaatintyö|Lopputyö|Monografiaväitöskirja|Opinnäyte|Opinnäytetyö|Pro gradu -tutkielma|Proseminaarityö|Seminaarityö|Väitöskirja|Ylempi AMK-opinnäytetyö)[, :]*$/u) ||
        a.value.match(/^(?:Analysseminariearbete|Artikelavhandling|Diplomarbete|Doktorsavhandling|Essäavhandling|Högre YH-examensarbete|Kandidatavhandling|Laudaturarbete|Laudaturseminariearbete|Licentiatavhandling|Lärdomsprov|Monografiavhandling|Pro gradu-avhandling|Proseminariearbete|Seminariearbete|Slutarbete|Specialarbete|YH-examesarbete)[:, ]*$/u)) {
      return true;
    }
    return false;
  }


  function hasValidD() {
    if (!d) { // We can live without $d:
      return true;
    }
    // Content makes sense:
    return d.value(/^\[?(?:[0-9]{4}|[0-9]{4}-[0-9]{4}|1[89]uu|Vuosien [0-9]{4} ja [0-9]{4} välillä)[\].]{0,2}$/u);
  }

}
