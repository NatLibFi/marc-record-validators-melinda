//import createDebugLogger from 'debug';
import clone from 'clone';
import {fieldToString, getCatalogingLanguage, nvdebug} from './utils';
import {map336CodeToTerm, map337CodeToTerm, map338CodeToTerm} from './field33XUtils';

const description = 'Fix non-RDA 33X field(s)';


const map336 = {
  'Bild (kartografisk ; att vidra)': 'crt',
  'Bild (kartografisk ; rörlig)': 'crm',
  'Bild (kartografisk)': 'cri',
  'Bild (rörlig ; tredimensionell)': 'tdm',
  'Bild (rörlig ; tvådimensionell)': 'tdi',
  'Bild (still ; att vidra)': 'tci',
  'Bild (still ; tredimensionell)': 'sti',
  'Bild (still)': 'sti',
  'Data': 'cod',
  'Data (kartografinen)': 'crd',
  'Dataset': 'cod',
  'Dataset (kartografisk)': 'crd',
  'Datorprogram': 'cop',
  'Esine': 'tdf',
  'Esine (kartografinen ; kosketeltava)': 'crn',
  'Esine (kartografinen)': 'crf',
  'Esine (kartogragrafinen ; kolmiulotteinen)': 'crf',
  'Esine (kolmiulotteinen)': 'tdf',
  'Esine (kosketeltava)': 'tcf',
  'Flera innehållstyper': 'zzz',
  'Föremal': 'tdf',
  'Föremål (att vidra)': 'tcf',
  'Föremål (kartografisk ; att vidra)': 'crn',
  'Föremål (kartografisk ; tredimensionell)': 'crn',
  'Föremål (tredimensionell)': 'tdf',
  'Geräusche': 'snd',
  'Kuva': 'sti',
  'Kuva (kartografinen ; kosketeltava)': 'crt',
  'Kuva (kartografinen ; liikkuva)': 'crm',
  'Kuva (kartografinen)': 'cri',
  'Kuva (liikkuva ; kaksiulotteinen)': 'tdi',
  'Kuva (liikkuva ; kolmiulotteinen)': 'tdm',
  'Kuva (still ; kaksiulotteinen)': 'sti',
  'Kuva (still ; kolmiulotteinen)': 'sti',
  'Kuva (still ; kosketeltava)': 'tci',
  'Kuva (still)': 'sti',
  'Liike (kosketeltava ; notatoitu)': 'tcn',
  'Liike (notatoitu ; kosketeltava': 'tcn',
  'Liike (notatoitu)': 'ntv',
  'Ljud': 'snd',
  'Musiikki (esitetty)': 'prm',
  'Musiikki (kosketeltava ; notatoitu)': 'tcm',
  'Musiikki (notatoitu ; kosketeltava)': 'tcm',
  'Musiikki (notatoitu)': 'ntm',
  'Musik (notation ; att vidra)': 'tcm',
  'Musik (notation)': 'ntm',
  'Musik (performance)': 'prm',
  'Määrittelemätön': 'zzz',
  'Määrittelemätön sisältötyyppi': 'zzz',
  'Obestämd innehållstyp': 'zzz',
  'Ospecificerad innehållstyp': 'zzz',
  'Puhe': 'spw',
  'Rörelse (notation ; att vidra)': 'tcn',
  'Rörelse (notation)': 'ntv',
  'Tal': 'spw',
  'Teksti': 'txt',
  'Teksti (kosketeltava); Text (att vidra)': 'tct',
  'Text': 'txt',
  'Tietokoneohjelma': 'cop',
  'Useita sisältötyyppejä': 'zzz',
  'Vild (still ; tvådimensionell)': 'sti',
  'annan': 'xxx',
  'cartographic dataset': 'crd',
  'cartographic image': 'cri',
  'cartographic moving image': 'crm',
  'cartographic tactile image': 'crt',
  'cartographic tactile three-dimensional form': 'crn',
  'cartographic three-dimensional form': 'crf',
  'cartographic three-dimensional tactile form': 'crn',
  'computer dataset': 'cod',
  'computer program': 'cop',
  'dataset': 'cod',
  'datorprogram': 'cop',
  'digitaalinen data': 'cod',
  'digitalt dataset': 'cod',
  'esitetty musiikki': 'prm',
  'framförd musik': 'prm',
  'gesprochenes Wort': 'spw',
  'kaksiulotteinen liikkuva kuva': 'tdi',
  'kartografinen data': 'crd',
  'kartografinen kolmiulotteinen muoto': 'crf',
  'kartografinen kuva': 'cri',
  'kartografinen liikkuva kuva': 'crm',
  'kartografinen taktiili kolmiulotteinen muoto': 'crn',
  'kartografinen taktiili kuva': 'crt',
  'kartografisk bild': 'cri',
  'kartografisk data': 'crd',
  'kartografisk rörlig bild': 'crm',
  'kartografisk taktil bild': 'crt',
  'kartografisk taktil tredimensionell form': 'crn',
  'kartografisk tredimensionell form': 'crf',
  'kolmiulotteinen liikkuva kuva': 'tdm',
  'kolmiulotteinen muoto': 'tdf',
  'liikenotaatio': 'ntv',
  'ljud': 'snd',
  'muu': 'xxx',
  'määrittelemätön': 'zzz',
  'notated movement': 'ntv',
  'notated music': 'ntm',
  'noterad musik': 'ntm',
  'nuottikirjoitus': 'ntm',
  'ospecificerad': 'zzz',
  'other': 'xxx',
  'performed music': 'prm',
  'puhe': 'spw',
  'rörelsenotation': 'ntv',
  'sounds': 'snd',
  'spoken word': 'spw',
  'still image': 'sti',
  'stillbild': 'sti',
  'stillkuva': 'sti',
  'tactile image': 'tci',
  'tactile notated movement': 'tcn',
  'tactile notated music': 'tcm',
  'tactile text': 'tct',
  'tactile three-dimensional form': 'tcf',
  'taktiili kolmiulotteinen muoto': 'tcf',
  'taktiili kuva': 'tci',
  'taktiili liikenotaatio': 'tcn',
  'taktiili nuottikirjoitus': 'tcm',
  'taktiili teksti': 'tct',
  'taktil bild': 'tci',
  'taktil musiknotation': 'tcm',
  'taktil noterad rörelse': 'tcn',
  'taktil text': 'tct',
  'taktil tredimensionell form': 'tcf',
  'tal': 'spw',
  'teksti': 'txt',
  'text': 'txt',
  'texte': 'txt',
  'texte tactile': 'tct',
  'three-dimensional form': 'tdf',
  'three-dimensional moving image': 'tdm',
  'tietokoneohjelma': 'cop',
  'tredimensionell form': 'tdf',
  'tredimensionell rörlig bild': 'tdm',
  'tvådimensionell rörlig bild': 'tdi',
  'two-dimensional moving image': 'tdi',
  'unbewegtes Bild': 'sti',
  'unspecified': 'zzz',
  'Ääni': 'snd',
  'ääni': 'snd',
  'Электронная программа': 'cop', // computer program
  'Изображение (картографическое)': 'cri',
  'Музыка (знаковая)': 'ntm', // notated music
  'Музыка (исполнительская)': 'prm', // performed music
  'Устная речь': 'spw',
  'Изображение (неподвижное)': 'sti',
  'Изображение (движущееся)': 'tdi', // 2D moving image
  'Текст': 'txt',
  'Текст (визуальный)': 'txt'
};

const map337 = {
  'Computermedien': 'c',
  'Mikroform': 'h',
  'annan': 'x',
  'audio': 's',
  'computer': 'c',
  'dator': 'c',
  'datoranvändbar': 'c',
  'ei välittävää laitetta': 'n',
  'elektroninen': 'c',
  'elektronisk': 'c',
  'heijastettava': 'g',
  'ingen medietyp': 'n',
  'käytettävissä ilman laitetta': 'n',
  'microform': 'h',
  'microscopic': 'p',
  'mikroform': 'h',
  'mikromuoto': 'h',
  'mikroskooppinen': 'p',
  'mikroskopisch': 'p',
  'mikroskopisk': 'p',
  'muu': 'x',
  'määrittelemätön': 'z',
  'määrittelemätön välittävä laite': 'z',
  'oförmedlad': 'n',
  'ohne Hilfsmittel zu benutzen': 'n',
  'omedierad': 'n',
  'ospecificerad': 'z',
  'ospecificerad medietyp': 'z',
  'other': 'x',
  'projected': 'g',
  'projektion': 'g',
  'projicerad': 'g',
  'projicerbar': 'g',
  'projizierbar': 'g',
  'stereografinen': 'e',
  'stereografisch': 'e',
  'stereografisk': 'e',
  'stereographic': 'e',
  'tietokonekäyttöinen': 'c',
  'unmediated': 'n',
  'unspecified': 'z',
  'useita mediatyyppejä': 'z',
  'video': 'v',
  'övrig': 'x',
  // Cyrillic (sorted by result):
  'электронн': 'c',
  'электронный': 'c',
  'непосредственн': 'n',
  'непосредственный': 'n',
  'аудио': 's', // audio
  'видео': 'v'
};

const map338 = {
  'aperture card': 'ha',
  'ark': 'nb',
  'arkki': 'nb',
  'audio belt': 'sb',
  'audio cartridge': 'sg',
  'audio cylinder': 'se',
  'audio disc': 'sd',
  'audio roll': 'sq',
  'audio wire reel': 'sw',
  'audiocassette': 'ss',
  'audiotape reel': 'st',
  'bildband': 'gf',
  'bildbandsmagasin': 'gc',
  'blädderblock': 'nn',
  'card': 'no',
  'computer card': 'ck',
  'computer cartridge': 'cb',
  'computer disc': 'cd',
  'computer disc cartridge': 'ce',
  'computer tape cartridge': 'ca',
  'computer tape cassette': 'cf',
  'computer tape reel': 'ch',
  'datorbandmagasin': 'ca',
  'datorbandspole': 'ch',
  'datorkassett': 'cf',
  'datorkort': 'ck',
  'datorminnesmodul': 'cb',
  'datorskiva': 'cd',
  'datorskivmagasin': 'ce',
  'dia': 'gs',
  'diabild': 'gs',
  'film cartridge': 'mc',
  'film cassette': 'mf',
  'film reel': 'mr',
  'film roll': 'mo',
  'filmikasetti': 'mf',
  'filmikela': 'mr',
  'filmiliuska': 'gd',
  'filmirulla': 'mo',
  'filmisilmukkakasetti': 'mc',
  'filmkassett': 'mf',
  'filmljudspole': 'si',
  'filmmagasin': 'mc',
  'filmremsa': 'gd',
  'filmrulle': 'mo',
  'filmslip': 'gd',
  'filmspole': 'mr',
  'filmstrip': 'gf',
  'filmstrip cartridge': 'gc',
  'flipchart': 'nn',
  'fönsterkort': 'ha',
  'föremål': 'nr',
  'ikkunakortti': 'ha',
  'kort': 'no',
  'kortti': 'no',
  'lehtiötaulu': 'nn',
  'ljudcylinder': 'se',
  'ljudkassett': 'ss',
  'ljudmagasin': 'sg',
  'ljudrulle': 'sq',
  'ljudskiva': 'sd',
  'ljudslinga': 'sb',
  'ljudspole': 'st',
  'ljudtråd': 'sw',
  'microfiche': 'he',
  'microfiche cassette': 'hf',
  'microfilm cartridge': 'hb',
  'microfilm cassette': 'hc',
  'microfilm reel': 'hd',
  'microfilm roll': 'hj',
  'microfilm slip': 'hh',
  'microopaque': 'hg',
  'microscope slide': 'pp',
  'mikrofiche': 'he',
  'mikrofiche (ogenomskinlig)': 'hg',
  'mikrofichekassett': 'hf',
  'mikrofilmikasetti': 'hc',
  'mikrofilmikela': 'hd',
  'mikrofilmiliuska': 'hh',
  'mikrofilmirulla': 'hj',
  'mikrofilmisilmukkakasetti': 'hb',
  'mikrofilmskassett': 'hc',
  'mikrofilmsmagasin': 'hb',
  'mikrofilmsremsa': 'hh',
  'mikrofilmsrulle': 'hj',
  'mikrofilmsspole': 'hd',
  'mikrokortti': 'he',
  'mikrokortti (läpinäkymätön)': 'hg',
  'mikrokorttikasetti': 'hf',
  'mikroskoperingspreparat': 'pp',
  'muistikortti': 'ck',
  'määrittelemätön': 'zu',
  'nide': 'nc',
  'object': 'nr',
  'objekti': 'nr',
  'online resource': 'cr',
  'onlineresurs': 'cr',
  'ospecificerad': 'zu',
  'overhead transparency': 'gt',
  'piirikotelo': 'cb',
  'piirtoheitinkalvo': 'gt',
  'preparaattilasi': 'pp',
  'raina': 'gf',
  'rainakasetti': 'gc',
  'roll': 'na',
  'rulla': 'na',
  'rulle': 'na',
  'sheet': 'nb',
  'slide': 'gs',
  'sound-track reel': 'si',
  'stereografinen kortti': 'eh',
  'stereografinen levy': 'es',
  'stereografisk skiva': 'es',
  'stereografiskt kort': 'eh',
  'stereograph card': 'eh',
  'stereograph disc': 'es',
  'tietokasetti': 'cf',
  'tietolevy': 'cd',
  'tietolevykotelo': 'ce',
  'tietonauhakela': 'ch',
  'tietonauhan silmukkakasetti': 'ca',
  'transparang': 'gt',
  'unspecified': 'zu',
  'verkkoaineisto': 'cr',
  'video cartridge': 'vc',
  'videocassette': 'vf',
  'videodisc': 'vd',
  'videokasetti': 'vf',
  'videokassett': 'vf',
  'videokela': 'vr',
  'videolevy': 'vd',
  'videomagasin': 'vc',
  'videosilmukkakasetti': 'vc',
  'videoskiva': 'vd',
  'videospole': 'vr',
  'videotape reel': 'vr',
  'volume': 'nc',
  'volym': 'nc',
  'äänihihna': 'sb',
  'äänikasetti': 'ss',
  'äänikela': 'st',
  'äänilankakela': 'sw',
  'äänilevy': 'sd',
  'ääniraitakela': 'si',
  'äänirulla': 'sq',
  'äänisilmukkakasetti': 'sg',
  'äänisylinteri': 'se'
};

// const multimediaRegexp = /multimedia/ui;

export default function () {

  return {
    description, validate, fix
  };

  function fix(record) {
    nvdebug(`FIX ${description}...`);
    const catLang = getCatalogingLanguage(record) || 'fin';
    const fields = getRelevantFields(record);
    fields.forEach(f => fixField(f, catLang));
    nvdebug(` GOT ${fields.length}...`);
    // FFS: we actually need newFields array here! Videogame, for example, might be
    // 336 ## ‡a kaksiulotteinen liikkuva kuva ‡b tdi ‡2 rdacontent
    // 336 ## ‡a tietokoneohjelma ‡b cop ‡2 rdacontent
    const res = {message: [], fix: [], valid: true};

    return res;
  }

  function validate(record) {
    nvdebug(`VALIDATE ${description}...`); // NOT READY YET
    const catLang = getCatalogingLanguage(record) || 'fin';
    const fields = getRelevantFields(record);
    if (fields.length === 0) {
      return {message: [], valid: true};
    }
    const originalStrings = fields.map(f => fieldToString(f));
    const clonedFields = fields.map(f => clone(f));
    clonedFields.forEach(f => fixField(f, catLang));
    const modifiedStrings = clonedFields.map(f => fieldToString(f));

    const changes = originalStrings.map((str, i) => `'${str}' => '${modifiedStrings[i]}'`);

    return {message: changes, valid: false};
  }


  function getA(field) {
    const as = field.subfields.filter(f => f.code === 'a');
    if (as.length === 1) {
      return as[0];
    }
    return undefined;
  }


  function mapTermToCode(term, tag) {
    nvdebug(`TERM/${tag}: '${term}'`);
    if (tag === '336' && term in map336) {
      return map336[term];
    }
    if (tag === '337' && term in map337) {
      return map337[term];
    }
    if (tag === '338' && term in map338) {
      return map338[term];
    }
    return undefined;
  }

  function mapFieldToCode(field) {
    const subfieldA = getA(field);
    if (subfieldA) {
      return mapTermToCode(subfieldA.value, field.tag);
    }
    return undefined;
  }

  function getRelevantFields(record) {
    const fields = record.get('33[678]');
    // Currently not handline $3 etc
    return fields.filter(f => f.subfields.length === 1 && mapFieldToCode(f));
  }

  function tagToSubfield2(tag) {
    if (tag === '336') {
      return {'code': '2', 'value': 'rdacontent'};
    }
    if (tag === '337') {
      return {'code': '2', 'value': 'rdamedia'};
    }
    if (tag === '338') {
      return {'code': '2', 'value': 'rdacarrier'};
    }
  }

  function fixField(field, catalogingLanguage = 'fin') {
    const subfieldA = getA(field);
    if (!subfieldA) {
      return;
    }
    const code = mapTermToCode(subfieldA.value, field.tag);
    if (!code) {
      return;
    }
    const newTerm = codeToTerm(code);
    if (!newTerm) {
      return;
    }

    subfieldA.value = newTerm;
    field.subfields.push({'code': 'b', 'value': code});
    field.subfields.push(tagToSubfield2(field.tag));

    function codeToTerm(code) {
      if (field.tag === '336') {
        return map336CodeToTerm(code, catalogingLanguage);
      }
      if (field.tag === '337') {
        return map337CodeToTerm(code, catalogingLanguage);
      }
      if (field.tag === '338') {
        return map338CodeToTerm(code, catalogingLanguage);
      }
      return undefined;
    }
  }

}

