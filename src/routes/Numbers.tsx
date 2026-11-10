import { useState } from 'preact/hooks';
import { BOTTLES, GLASSES, PEOPLE, readTime, readYen, THINGS } from '../lib/numbers';
import { speak } from '../lib/speech';

export function Numbers() {
  const [yen, setYen] = useState('3480');
  const [time, setTime] = useState('19:30');
  const n = Math.floor(+yen.replace(/[^0-9]/g, '') || 0);
  const r = readYen(n);
  const [h, m] = time.split(':').map(Number);
  const t = isNaN(h) ? null : readTime(h, m || 0);
  return (
    <div>
      <h1>Numbers</h1>
      <h2>Prices aloud</h2>
      <div class="card">
        <label class="field"><span>Price in yen</span><input type="number" inputMode="numeric" value={yen} onInput={(e) => setYen(e.currentTarget.value)} /></label>
        <button class="card-btn" style="background:none;border:0;padding:0" onClick={() => speak(`${n}円`)} aria-label="Hear it">
          <div lang="ja" style="font-size:1.3em;font-weight:600">{n.toLocaleString('en-US')}円</div>
          <div style="color:var(--indigo);font-size:1.15em" data-testid="yen-romaji"><i>{r.romaji}</i></div>
          <div class="small muted" lang="ja">{r.kana}</div>
          <div class="small faint">Tap to hear</div>
        </button>
      </div>
      <h2>Times</h2>
      <div class="card">
        <label class="field"><span>Time</span><input type="time" value={time} onInput={(e) => setTime(e.currentTarget.value)} /></label>
        {t && (
          <button class="card-btn" style="background:none;border:0;padding:0" onClick={() => speak(t.kana)}>
            <div style="color:var(--indigo);font-size:1.15em"><i>{t.romaji}</i></div>
            <div class="small muted" lang="ja">{t.kana}</div>
            <div class="small faint">{t.en} · gozen = AM, gogo = PM, han = half past</div>
          </button>
        )}
      </div>
      <h2>Counting</h2>
      <Counter title="People (for a table)" rows={PEOPLE} />
      <Counter title="Things (pointing at the menu)" rows={THINGS} note="Most other things. Kore o futatsu kudasai: two of these, please." />
      <Counter title="Bottles, cans, skewers (-hon)" rows={BOTTLES} note="Biiru o nihon kudasai: two bottles of beer, please. Pointing works too: nihon kudasai." />
      <Counter title="Glasses, cups, bowls (-hai)" rows={GLASSES} note="Nama o nihai kudasai: two draft beers, please. Mou ippai: one more." />
    </div>
  );
}

function Counter({ title, rows, note }: { title: string; rows: string[][]; note?: string }) {
  return (
    <div class="card">
      <h3>{title}</h3>
      {note && <p class="small muted">{note}</p>}
      <table class="tbl"><tbody>{rows.map(([n, r, k]) => (
        <tr key={n} onClick={() => speak(k)} style="cursor:pointer"><td style="width:2.5em;font-weight:700">{n}</td><td><i>{r}</i></td><td lang="ja" class="muted">{k}</td></tr>
      ))}</tbody></table>
    </div>
  );
}
