import { useEffect, useState } from 'preact/hooks';
import type { Place, Purchase } from '../data/schema';
import { TAX_FREE_MIN_YEN } from '../data/money';
import { SyncStatus } from '../components/SyncStatus';
import { DATA_REPO } from '../lib/sync';
import { now, tokyo, longDate } from '../lib/now';
import { href, type Route } from '../lib/router';
import { fmtUsd, fmtYen, yenToUsd } from '../lib/rates';
import { addPhoto, byRecipient, claimTotals, getPhoto, savePurchase, setDeleted, stillNeed, storeDays, taxDue, usePurchases, uuid } from '../lib/purchases';
import { useSettings } from '../lib/settings';
import { todayState } from '../lib/trip';
import { useRate } from './Currency';

const PLACE_LABEL: Record<string, string> = { tokyo: 'Tokyo', hakone: 'Hakone', kyoto: 'Kyoto', osaka: 'Osaka', nara: 'Nara', maihama: 'Maihama', anywhere: 'Other' };

export function Purchases({ route }: { route: Route }) {
  const view = route.params.get('view') || 'souvenirs';
  const editId = route.params.get('edit');
  const list = usePurchases();
  const editing = editId ? list?.find((p) => p.id === editId) : undefined;
  const tabs = [['souvenirs', 'By person'], ['claim', 'Tax refund log'], ['add', editId ? 'Edit' : '+ Add']] as const;
  return (
    <div>
      <h1>Purchases & tax refund</h1>
      <p class="small muted">Log what you buy, for yourselves or as gifts. Mark tax-free items to claim the refund when you leave Japan.</p>
      <SyncStatus link />
      <div class="chips" style="margin-top:10px">
        {tabs.map(([id, label]) => <a key={id} class={'chip' + (view === id ? ' on' : '')} href={href('purchases', { view: id })}>{label}</a>)}
      </div>
      {list === null ? <div class="empty">Loading…</div>
        : view === 'add' ? <AddForm key={editId ?? 'new'} existing={editing} />
          : view === 'claim' ? <ClaimLog list={list} checklist={route.params.get('check') === '1'} />
            : <Souvenirs list={list} />}
    </div>
  );
}

function Money({ yen }: { yen: number }) {
  const { usdPerYen } = useRate();
  return <>{fmtYen(yen)}{usdPerYen ? <span class="faint"> · {fmtUsd(yenToUsd(yen, usdPerYen))}</span> : null}</>;
}

function Row({ p }: { p: Purchase }) {
  return (
    <div class="card tight row" data-testid={`purchase-${p.id}`}>
      <div class="grow">
        <b>{p.item}</b>{p.taxFree && <span class="pill" style="margin-left:6px">tax-free</span>}
        <div class="small muted">{[p.shop, p.place && PLACE_LABEL[p.place], longDate(p.date), p.bag, p.by && `added by ${p.by}`].filter(Boolean).join(' · ')}</div>
        {p.forWhom?.length ? <div class="small">For {p.forWhom.join(', ')}</div> : null}
      </div>
      <div style="text-align:right">
        <div><Money yen={p.priceYen} /></div>
        <a class="small" href={href('purchases', { view: 'add', edit: p.id })}>Edit</a>
      </div>
    </div>
  );
}

function Souvenirs({ list }: { list: Purchase[] }) {
  const s = useSettings();
  const groups = byRecipient(list);
  const need = stillNeed(s.recipients, list);
  const total = list.reduce((a, p) => a + p.priceYen, 0);
  if (!list.length) {
    return <div class="empty">Nothing yet. <a href={href('purchases', { view: 'add' })}>Add the first purchase</a>.{!s.recipients.length && <> Add recipients in <a href={href('settings')}>Settings</a>.</>}</div>;
  }
  return (
    <div>
      <div class="card tight"><b>Total</b>: <Money yen={total} /> · {list.length} item{list.length === 1 ? '' : 's'}</div>
      {need.length > 0 && (
        <div class="card" style="border-left:5px solid var(--ochre);margin-top:10px">
          <b>Everyone still needs something</b>
          <div class="chips wrap" style="margin-top:6px">{need.map((n) => <span class="chip" key={n}>{n}</span>)}</div>
        </div>
      )}
      {[...groups.entries()].map(([who, items]) => (
        <section key={who}>
          <h2>{who} <span class="small muted">· <Money yen={items.reduce((a, p) => a + p.priceYen, 0)} /></span></h2>
          {items.map((p) => <Row p={p} key={p.id} />)}
        </section>
      ))}
    </div>
  );
}

function ClaimLog({ list, checklist }: { list: Purchase[]; checklist: boolean }) {
  const s = useSettings();
  const items = list.filter((p) => p.taxFree);
  const t = claimTotals(items);
  const days = storeDays(items);
  const short = days.filter((d) => !d.ok);
  const isLastDay = tokyo(now()).ymd === '2026-11-10';
  const check = checklist || isLastDay;
  const bags = new Map<string, Purchase[]>();
  for (const p of items) { const b = p.bag || 'No bag set'; bags.set(b, [...(bags.get(b) ?? []), p]); }
  const order = [...s.bags, 'No bag set', ...[...bags.keys()].filter((b) => !s.bags.includes(b) && b !== 'No bag set')];
  const claimed = items.filter((p) => p.claimed).length;

  if (!items.length) return <div class="empty">No tax-free items yet. Turn on “Claim tax refund” when you add a purchase.</div>;
  return (
    <div>
      <div class="card">
        <div class="big-num" style="font-size:1.8em">{fmtYen(t.taxYen)}</div>
        <div class="small muted">tax due back on {t.count} item{t.count === 1 ? '' : 's'} (<Money yen={t.priceYen} /> paid)</div>
        <p class="small">Claim at Haneda customs on departure, <b>before check-in</b>. Goods must be with you. Keep every receipt.</p>
      </div>
      {short.length > 0 && (
        <div class="card" style="border-left:5px solid var(--must);margin-top:10px" data-testid="min-warning">
          <b>Below the ¥5,000 minimum</b>
          <ul class="list-plain small">{short.map((d) => (
            <li key={d.shop + d.date}>{d.shop}, {longDate(d.date)}: {fmtYen(d.preTaxYen)} before tax. Needs {fmtYen(TAX_FREE_MIN_YEN - d.preTaxYen)} more that day.</li>
          ))}</ul>
        </div>
      )}
      <div class="row" style="margin-top:10px;justify-content:space-between">
        <span class="small">{check ? `Checklist: ${claimed} of ${items.length} shown` : 'Grouped by bag'}</span>
        <a class="btn" href={href('purchases', { view: 'claim', ...(checklist ? {} : { check: '1' }) })}>{checklist ? 'Done' : 'Customs checklist'}</a>
      </div>
      {order.filter((b) => bags.has(b)).map((b) => (
        <section key={b}>
          <h2>{b}</h2>
          {bags.get(b)!.map((p) => check ? <CheckRow p={p} key={p.id} /> : (
            <div class="card tight row" key={p.id}>
              <div class="grow"><b>{p.item}</b><div class="small muted">{[p.shop, longDate(p.date), p.receiptKept ? 'receipt ✓' : 'no receipt noted'].filter(Boolean).join(' · ')}</div></div>
              <div style="text-align:right"><div>{fmtYen(p.priceYen)}</div><div class="small faint">tax {fmtYen(taxDue(p))}</div><a class="small" href={href('purchases', { view: 'add', edit: p.id })}>Edit</a></div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function CheckRow({ p }: { p: Purchase }) {
  const tick = () => savePurchase({ ...p, claimed: !p.claimed, updatedAt: new Date().toISOString() });
  return (
    <label class="card tight toggle" data-testid={`claim-${p.id}`} style={p.claimed ? 'opacity:.6' : ''}>
      <span class="grow"><b style={p.claimed ? 'text-decoration:line-through' : ''}>{p.item}</b>
        <div class="small muted">{[p.shop, longDate(p.date), p.receiptKept ? 'receipt ✓' : ''].filter(Boolean).join(' · ')} · {fmtYen(p.priceYen)}</div></span>
      <input type="checkbox" checked={!!p.claimed} onChange={tick} aria-label={`Shown at customs: ${p.item}`} />
    </label>
  );
}

function PhotoThumb({ id }: { id: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let u: string | undefined;
    getPhoto(id).then((b) => { if (b) { u = URL.createObjectURL(b); setUrl(u); } });
    return () => { if (u) URL.revokeObjectURL(u); };
  }, [id]);
  return url ? <img src={url} alt="Purchase photo" style="width:72px;height:72px;object-fit:cover;border-radius:10px" /> : null;
}

function AddForm({ existing }: { existing?: Purchase }) {
  const s = useSettings();
  const st = todayState(now());
  const todayPlace = (st.day?.places[0] ?? 'tokyo') as Place;
  const [f, setF] = useState<Purchase>(() => existing ?? {
    id: uuid(), createdAt: '', updatedAt: '', by: s.who, item: '', shop: '', place: todayPlace,
    date: tokyo(now()).ymd, priceYen: 0, forWhom: [], taxFree: false, receiptKept: true, bag: s.bags[0], photoIds: []
  });
  const [price, setPrice] = useState(existing ? String(existing.priceYen) : '');
  const [saved, setSaved] = useState('');
  const set = (p: Partial<Purchase>) => setF({ ...f, ...p });
  const toggleWho = (w: string) => set({ forWhom: f.forWhom?.includes(w) ? f.forWhom.filter((x) => x !== w) : [...(f.forWhom ?? []), w] });

  const submit = async (e: Event) => {
    e.preventDefault();
    const yen = Math.round(parseFloat(price.replace(/[^0-9.]/g, '')) || 0);
    if (!f.item.trim()) return;
    const t = new Date().toISOString();
    await savePurchase({ ...f, item: f.item.trim(), shop: f.shop?.trim() || undefined, priceYen: yen, by: f.by || s.who, createdAt: f.createdAt || t, updatedAt: t });
    if (existing) { location.hash = href('purchases', { view: f.taxFree ? 'claim' : 'souvenirs' }); return; }
    setSaved(f.item.trim());
    setF({ ...f, id: uuid(), item: '', createdAt: '', updatedAt: '', photoIds: [], forWhom: [] });
    setPrice('');
  };

  const onPhoto = async (e: Event) => {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    const id = await addPhoto(f.id, file);
    set({ photoIds: [...(f.photoIds ?? []), id] });
  };

  const yen = Math.round(parseFloat(price) || 0);
  return (
    <form onSubmit={submit} class="card" style="margin-top:6px" data-testid="add-form">
      {saved && <div class="small" role="status" style="color:var(--moss)">Saved “{saved}”. Add another?</div>}
      <label class="field"><span>Item</span><input type="text" required value={f.item} onInput={(e) => set({ item: e.currentTarget.value })} placeholder="e.g. Matcha tin" name="item" /></label>
      <label class="field"><span>Price in yen (as paid, tax included)</span>
        <input type="number" inputMode="numeric" value={price} onInput={(e) => setPrice(e.currentTarget.value)} placeholder="¥" name="price" />
        {yen > 0 && <span class="small muted" style="display:block;margin-top:4px"><Money yen={yen} /></span>}</label>
      <label class="field"><span>Shop</span><input type="text" value={f.shop ?? ''} onInput={(e) => set({ shop: e.currentTarget.value })} placeholder="Store name" name="shop" /></label>
      <div class="row">
        <label class="field grow"><span>Where</span>
          <select value={f.place} onChange={(e) => set({ place: e.currentTarget.value as Place })}>
            {Object.entries(PLACE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select></label>
        <label class="field grow"><span>Date</span><input type="date" value={f.date} onInput={(e) => set({ date: e.currentTarget.value })} /></label>
      </div>
      <div class="field"><span class="small muted">Who it’s for (none = for us)</span>
        <div class="chips wrap" style="margin-top:6px">
          {s.recipients.map((w) => <button type="button" class={'chip' + (f.forWhom?.includes(w) ? ' on' : '')} key={w} onClick={() => toggleWho(w)} aria-pressed={!!f.forWhom?.includes(w)}>{w}</button>)}
          {!s.recipients.length && <span class="small faint">Add recipients in <a href={href('settings')}>Settings</a>.</span>}
        </div></div>
      <label class="toggle"><span><b>Claim tax refund</b><div class="small muted">Claim the tax back at departure</div></span>
        <input type="checkbox" checked={f.taxFree} onChange={(e) => set({ taxFree: e.currentTarget.checked })} name="taxFree" /></label>
      {f.taxFree && (
        <>
          <label class="toggle"><span>Receipt kept</span><input type="checkbox" checked={!!f.receiptKept} onChange={(e) => set({ receiptKept: e.currentTarget.checked })} /></label>
          <label class="field"><span>Which bag</span>
            <select value={f.bag} onChange={(e) => set({ bag: e.currentTarget.value })}>
              {[...new Set([...s.bags, ...(f.bag ? [f.bag] : [])])].map((b) => <option key={b} value={b}>{b}</option>)}
            </select></label>
        </>
      )}
      <label class="field"><span>Note</span><input type="text" value={f.note ?? ''} onInput={(e) => set({ note: e.currentTarget.value || undefined })} /></label>
      <div class="field"><span class="small muted">Photo of the item or receipt (optional)</span>
        <div class="row wrap" style="margin-top:6px">{(f.photoIds ?? []).map((id) => <PhotoThumb id={id} key={id} />)}
          <label class="btn">📷 Add photo<input type="file" accept="image/*" capture="environment" onChange={onPhoto} class="sr" /></label></div>
        <span class="small faint">Photos stay on this phone.{DATA_REPO && ' They don’t sync to the other phone.'}</span></div>
      <button class="btn primary block" type="submit">{existing ? 'Save changes' : 'Save purchase'}</button>
      {existing && (
        <button type="button" class="btn block" style="margin-top:8px" onClick={async () => { await setDeleted(existing, !existing.deleted); location.hash = href('purchases'); }}>
          {existing.deleted ? 'Restore' : 'Delete'}
        </button>
      )}
    </form>
  );
}
