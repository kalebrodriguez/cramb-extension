/**
 * Anki `.apkg` collection schema and defaults.
 *
 * Values mirror Anki's own collection format, taken from the reference
 * implementation (genanki). The DDL, the default `conf`/`dconf`/Default-deck
 * objects, and the note-type (model) JSON shape are reproduced so exported
 * files import cleanly into desktop Anki.
 */

/** `collection.anki2` table definitions (no rows). */
export const APKG_SCHEMA = `
CREATE TABLE col (
    id integer primary key, crt integer not null, mod integer not null,
    scm integer not null, ver integer not null, dty integer not null,
    usn integer not null, ls integer not null, conf text not null,
    models text not null, decks text not null, dconf text not null, tags text not null
);
CREATE TABLE notes (
    id integer primary key, guid text not null, mid integer not null, mod integer not null,
    usn integer not null, tags text not null, flds text not null, sfld integer not null,
    csum integer not null, flags integer not null, data text not null
);
CREATE TABLE cards (
    id integer primary key, nid integer not null, did integer not null, ord integer not null,
    mod integer not null, usn integer not null, type integer not null, queue integer not null,
    due integer not null, ivl integer not null, factor integer not null, reps integer not null,
    lapses integer not null, left integer not null, odue integer not null, odid integer not null,
    flags integer not null, data text not null
);
CREATE TABLE revlog (
    id integer primary key, cid integer not null, usn integer not null, ease integer not null,
    ivl integer not null, lastIvl integer not null, factor integer not null, time integer not null,
    type integer not null
);
CREATE TABLE graves (usn integer not null, oid integer not null, type integer not null);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_notes_csum on notes (csum);
`;

export const BASIC_MODEL_ID = 1559383000;
export const CLOZE_MODEL_ID = 1550428389;

const DEFAULT_LATEX_PRE =
  '\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n' +
  '\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n';
const DEFAULT_LATEX_POST = '\\end{document}';

const BASE_CSS =
  '.card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n';
const CLOZE_CSS =
  BASE_CSS + '\n.cloze {\n font-weight: bold;\n color: blue;\n}\n.nightMode .cloze {\n color: lightblue;\n}';

interface ModelOpts {
  id: number;
  name: string;
  type: 0 | 1; // 0 = standard, 1 = cloze
  fieldNames: string[];
  templates: { name: string; qfmt: string; afmt: string }[];
  css: string;
  req: [number, 'all' | 'any', number[]][];
  mod: number;
}

function buildModel(o: ModelOpts) {
  return {
    id: String(o.id),
    name: o.name,
    type: o.type,
    mod: o.mod,
    usn: -1,
    sortf: 0,
    did: 1,
    tmpls: o.templates.map((t, ord) => ({
      name: t.name,
      ord,
      qfmt: t.qfmt,
      afmt: t.afmt,
      bqfmt: '',
      bafmt: '',
      bfont: '',
      bsize: 0,
      did: null,
    })),
    flds: o.fieldNames.map((name, ord) => ({
      name,
      ord,
      font: 'Arial',
      media: [],
      rtl: false,
      size: 20,
      sticky: false,
    })),
    css: o.css,
    latexPre: DEFAULT_LATEX_PRE,
    latexPost: DEFAULT_LATEX_POST,
    latexsvg: false,
    req: o.req,
    tags: [],
    vers: [],
  };
}

/** The `models` JSON map: a Basic and a Cloze note type, keyed by id string. */
export function buildModels(mod: number): Record<string, unknown> {
  return {
    [String(BASIC_MODEL_ID)]: buildModel({
      id: BASIC_MODEL_ID,
      name: 'Basic (Cramb)',
      type: 0,
      fieldNames: ['Front', 'Back'],
      templates: [{ name: 'Card 1', qfmt: '{{Front}}', afmt: '{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}' }],
      css: BASE_CSS,
      req: [[0, 'all', [0]]],
      mod,
    }),
    [String(CLOZE_MODEL_ID)]: buildModel({
      id: CLOZE_MODEL_ID,
      name: 'Cloze (Cramb)',
      type: 1,
      fieldNames: ['Text', 'Back Extra'],
      templates: [{ name: 'Cloze', qfmt: '{{cloze:Text}}', afmt: '{{cloze:Text}}<br>\n{{Back Extra}}' }],
      css: CLOZE_CSS,
      req: [[0, 'all', [0]]],
      mod,
    }),
  };
}

/** Default collection `conf`. `curModel` is filled in by the builder. */
export const DEFAULT_CONF = {
  activeDecks: [1],
  addToCur: true,
  collapseTime: 1200,
  curDeck: 1,
  curModel: String(BASIC_MODEL_ID),
  dueCounts: true,
  estTimes: true,
  newBury: true,
  newSpread: 0,
  nextPos: 1,
  sortBackwards: false,
  sortType: 'noteFld',
  timeLim: 0,
};

/** A deck object (the Default deck, and the template for exported decks). */
export function buildDeck(id: number, name: string, mod: number) {
  return {
    id,
    name,
    mod,
    usn: 0,
    conf: 1,
    desc: '',
    dyn: 0,
    collapsed: false,
    browserCollapsed: false,
    extendNew: 10,
    extendRev: 50,
    lrnToday: [0, 0],
    newToday: [0, 0],
    revToday: [0, 0],
    timeToday: [0, 0],
  };
}

/** Default deck-options group (`dconf`), keyed "1". */
export const DEFAULT_DCONF = {
  '1': {
    id: 1,
    name: 'Default',
    mod: 0,
    usn: 0,
    maxTaken: 60,
    autoplay: true,
    timer: 0,
    replayq: true,
    new: { bury: true, delays: [1, 10], initialFactor: 2500, ints: [1, 4, 7], order: 1, perDay: 20, separate: true },
    rev: { bury: true, ease4: 1.3, fuzz: 0.05, ivlFct: 1, maxIvl: 36500, minSpace: 1, perDay: 100 },
    lapse: { delays: [10], leechAction: 0, leechFails: 8, minInt: 1, mult: 0 },
  },
};
