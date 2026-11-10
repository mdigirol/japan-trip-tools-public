// Japanese number readings in Hepburn romaji (long vowels written out) and hiragana.
const ONES_R = ['', 'ichi', 'ni', 'san', 'yon', 'go', 'roku', 'nana', 'hachi', 'kyuu'];
const ONES_K = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう'];

const HUNDREDS: Record<number, [string, string]> = {
  1: ['hyaku', 'ひゃく'], 3: ['sanbyaku', 'さんびゃく'], 6: ['roppyaku', 'ろっぴゃく'], 8: ['happyaku', 'はっぴゃく']
};
const THOUSANDS: Record<number, [string, string]> = {
  1: ['sen', 'せん'], 3: ['sanzen', 'さんぜん'], 8: ['hassen', 'はっせん']
};

// 0–9999 → [romaji words, kana]
function under10k(n: number, leadingSen = false): [string[], string] {
  const th = Math.floor(n / 1000), hu = Math.floor(n / 100) % 10, te = Math.floor(n / 10) % 10, on = n % 10;
  const r: string[] = []; let k = '';
  if (th) {
    const [tr, tk] = th === 1 && leadingSen ? ['issen', 'いっせん'] : THOUSANDS[th] ?? [ONES_R[th] + 'sen', ONES_K[th] + 'せん'];
    r.push(tr); k += tk;
  }
  if (hu) { const [hr, hk] = HUNDREDS[hu] ?? [ONES_R[hu] + 'hyaku', ONES_K[hu] + 'ひゃく']; r.push(hr); k += hk; }
  // Tens and ones read as one word: 48 → yonjuuhachi.
  const tensOnes = (te ? (te === 1 ? 'juu' : ONES_R[te] + 'juu') : '') + (on ? ONES_R[on] : '');
  if (tensOnes) r.push(tensOnes);
  if (te) k += (te === 1 ? '' : ONES_K[te]) + 'じゅう';
  if (on) k += ONES_K[on];
  return [r, k];
}

export function readNumber(n: number): { romaji: string; kana: string } {
  n = Math.floor(Math.abs(n));
  if (n === 0) return { romaji: 'zero', kana: 'ゼロ' };
  if (n >= 1e12) return { romaji: String(n), kana: String(n) };
  const oku = Math.floor(n / 1e8), man = Math.floor(n / 1e4) % 1e4, rest = n % 1e4;
  const r: string[] = []; let k = '';
  if (oku) { const [or, ok] = under10k(oku, true); r.push(or.join('') + 'oku'); k += ok + 'おく'; }
  if (man) { const [mr, mk] = under10k(man, true); r.push(mr.join('') + 'man'); k += mk + 'まん'; }
  if (rest) { const [rr, rk] = under10k(rest); r.push(...rr); k += rk; }
  return { romaji: r.join(' '), kana: k };
}

// Prices: "sanzen yonhyaku hachijuu en". 4 yen is "yo en".
export function readYen(n: number): { romaji: string; kana: string } {
  const { romaji, kana } = readNumber(n);
  const last = n % 10;
  if (last === 4) return { romaji: romaji.replace(/yon$/, 'yo') + ' en', kana: kana.replace(/よん$/, 'よ') + 'えん' };
  return { romaji: romaji + ' en', kana: kana + 'えん' };
}

// Clock times: 7:30 → "shichiji han"; 4:15 → "yoji juugofun"
const HOUR_R = ['', 'ichiji', 'niji', 'sanji', 'yoji', 'goji', 'rokuji', 'shichiji', 'hachiji', 'kuji', 'juuji', 'juuichiji', 'juuniji'];
const HOUR_K = ['', 'いちじ', 'にじ', 'さんじ', 'よじ', 'ごじ', 'ろくじ', 'しちじ', 'はちじ', 'くじ', 'じゅうじ', 'じゅういちじ', 'じゅうにじ'];
const MIN_ONE: Record<number, [string, string]> = {
  1: ['ippun', 'いっぷん'], 2: ['nifun', 'にふん'], 3: ['sanpun', 'さんぷん'], 4: ['yonpun', 'よんぷん'], 5: ['gofun', 'ごふん'],
  6: ['roppun', 'ろっぷん'], 7: ['nanafun', 'ななふん'], 8: ['happun', 'はっぷん'], 9: ['kyuufun', 'きゅうふん']
};

export function readMinutes(m: number): { romaji: string; kana: string } {
  const te = Math.floor(m / 10), on = m % 10;
  if (on === 0) {
    const pre = te === 1 ? ['', ''] : [ONES_R[te], ONES_K[te]];
    return { romaji: pre[0] + 'juppun', kana: pre[1] + 'じゅっぷん' };
  }
  const tensR = te ? (te === 1 ? 'juu' : ONES_R[te] + 'juu') : '';
  const tensK = te ? (te === 1 ? 'じゅう' : ONES_K[te] + 'じゅう') : '';
  return { romaji: tensR + MIN_ONE[on][0], kana: tensK + MIN_ONE[on][1] };
}

export function readTime(h24: number, m: number): { romaji: string; kana: string; en: string } {
  const pm = h24 >= 12, h = h24 % 12 || 12;
  const pre = pm ? ['gogo', 'ごご'] : ['gozen', 'ごぜん'];
  let r = `${pre[0]} ${HOUR_R[h]}`, k = pre[1] + HOUR_K[h];
  if (m === 30) { r += ' han'; k += 'はん'; }
  else if (m) { const mm = readMinutes(m); r += ' ' + mm.romaji; k += mm.kana; }
  return { romaji: r, kana: k, en: `${h}:${String(m).padStart(2, '0')} ${pm ? 'PM' : 'AM'}` };
}

export const PEOPLE = [
  ['1', 'hitori', 'ひとり'], ['2', 'futari', 'ふたり'], ['3', 'sannin', 'さんにん'], ['4', 'yonin', 'よにん'], ['5', 'gonin', 'ごにん'],
  ['6', 'rokunin', 'ろくにん'], ['7', 'nananin', 'ななにん'], ['8', 'hachinin', 'はちにん'], ['9', 'kyuunin', 'きゅうにん'], ['10', 'juunin', 'じゅうにん']
];
export const THINGS = [
  ['1', 'hitotsu', 'ひとつ'], ['2', 'futatsu', 'ふたつ'], ['3', 'mittsu', 'みっつ'], ['4', 'yottsu', 'よっつ'], ['5', 'itsutsu', 'いつつ'],
  ['6', 'muttsu', 'むっつ'], ['7', 'nanatsu', 'ななつ'], ['8', 'yattsu', 'やっつ'], ['9', 'kokonotsu', 'ここのつ'], ['10', 'too', 'とお']
];
// -hon counts long, thin things: bottles, cans, skewers. -hai counts glasses, cups and bowls.
export const BOTTLES = [
  ['1', 'ippon', 'いっぽん'], ['2', 'nihon', 'にほん'], ['3', 'sanbon', 'さんぼん'], ['4', 'yonhon', 'よんほん'], ['5', 'gohon', 'ごほん']
];
export const GLASSES = [
  ['1', 'ippai', 'いっぱい'], ['2', 'nihai', 'にはい'], ['3', 'sanbai', 'さんばい'], ['4', 'yonhai', 'よんはい'], ['5', 'gohai', 'ごはい']
];
