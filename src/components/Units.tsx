import { useState } from 'preact/hooks';
import { CLOTHING, shoeCm } from '../data/money';
import { UNIT_GROUPS, convertInput, type UnitPair } from '../lib/units';

function Pair({ p }: { p: UnitPair }) {
  const [a, setA] = useState(''), [b, setB] = useState('');
  return (
    <div class="row unit-pair" data-testid={`unit-${p.id}`}>
      <label class="grow unit-box">
        <input type="number" inputMode="decimal" aria-label={p.a} value={a}
          onInput={(e) => { const v = e.currentTarget.value; setA(v); setB(convertInput(v, p.ab)); }} />
        <span aria-hidden="true">{p.a}</span>
      </label>
      <span aria-hidden="true">⇄</span>
      <label class="grow unit-box">
        <input type="number" inputMode="decimal" aria-label={p.b} value={b}
          onInput={(e) => { const v = e.currentTarget.value; setB(v); setA(convertInput(v, p.ba)); }} />
        <span aria-hidden="true">{p.b}</span>
      </label>
    </div>
  );
}

export function Measurements() {
  return (
    <>
      {UNIT_GROUPS.map((g) => (
        <section class="card" key={g.id} aria-labelledby={`units-${g.id}`}>
          <h3 id={`units-${g.id}`}>{g.title}</h3>
          {g.pairs.map((p) => <Pair p={p} key={p.id} />)}
        </section>
      ))}
    </>
  );
}

export function Sizes() {
  const [us, setUs] = useState('9');
  const n = parseFloat(us);
  return (
    <div class="card">
      <h3>Shoes (rough guide)</h3>
      <div class="row">
        <label class="grow"><span class="small muted">US size</span>
          <input type="number" inputMode="decimal" value={us} onInput={(e) => setUs(e.currentTarget.value)} /></label>
        <div class="grow small">
          {n > 0 ? <>Men’s: <b>{shoeCm(n, 'men')} cm</b><br />Women’s: <b>{shoeCm(n, 'women')} cm</b></> : '—'}
        </div>
      </div>
      <h3 style="margin-top:12px">Clothing</h3>
      <table class="tbl small"><thead><tr><th>US</th><th>Japan</th></tr></thead>
        <tbody>{CLOTHING.map((c) => <tr key={c.us}><td>{c.us}</td><td>{c.jp}</td></tr>)}</tbody></table>
      <p class="small faint">Japanese sizes run small. Try on to be sure.</p>
    </div>
  );
}
