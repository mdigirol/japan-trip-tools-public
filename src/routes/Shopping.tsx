import { JNTO_TAX_FREE_URL, KNIFE_NOTE, SIZE_NOTES, TAX_FREE_RULES, WORTH_BUYING } from '../data/money';
import { glossary } from '../data/glossary';
import { href } from '../lib/router';
import { Sizes } from '../components/Units';

export function Shopping() {
  const knives = glossary.filter((g) => g.category === 'knife');
  return (
    <div>
      <h1>Shopping guide</h1>
      <h2>Tax-free from Nov 1, 2026</h2>
      <div class="card">
        <p><b>Timing matters.</b> Through Oct 31, 2026 the old tax-free process applies. For eligible purchases from Nov 1, 2026, Japan refunds the tax at departure instead of taking it off at the shop.</p>
        <ul class="list-plain small">{TAX_FREE_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
        <p class="small">Source: <a href={JNTO_TAX_FREE_URL} target="_blank" rel="noopener">JNTO: Changes are coming to Japan’s tax-free shopping ↗</a></p>
        <p class="small faint">Check the Japan Tourism Agency’s final procedure before the trip.</p>
      </div>
      <a class="btn primary block" style="margin-top:10px" href={href('purchases', { view: 'claim' })}>Open the tax refund log →</a>

      <h2>Worth buying</h2>
      <div class="card"><ul class="list-plain small">{WORTH_BUYING.map((w) => <li key={w}>{w}</li>)}</ul></div>

      <h2>Knife words (Kappabashi)</h2>
      <table class="tbl"><tbody>{knives.map((k) => (
        <tr key={k.id}><td lang="ja" style="font-size:1.15em;white-space:nowrap">{k.ja}</td><td class="small"><i>{k.romaji}</i><br />{k.en}</td></tr>
      ))}</tbody></table>
      <p class="small faint">{KNIFE_NOTE}</p>

      <h2>Sizes</h2>
      <ul class="list-plain small">{SIZE_NOTES.map((n) => <li key={n}>{n}</li>)}</ul>
      <Sizes />
    </div>
  );
}
