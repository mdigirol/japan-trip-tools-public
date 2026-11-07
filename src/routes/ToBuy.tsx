import { useEffect, useState } from 'preact/hooks';
import { href } from '../lib/router';
import { useOnline } from '../lib/online';
import { ITEM_MAX, NOTE_MAX } from '../lib/wantAdvice';
import { addWant, areaLabel, deleteWant, relook, runWants, setGot, SHOPPING_URL, useWants, type Want } from '../lib/wants';

export function ToBuy() {
  const list = useWants();
  const online = useOnline();
  useEffect(() => { if (online) void runWants(); }, [online]);
  const open = list?.filter((w) => !w.got) ?? [];
  const got = list?.filter((w) => w.got) ?? [];
  const waiting = open.filter((w) => w.lookup === 'pending').length;
  return (
    <div>
      <h1>To buy</h1>
      <p class="small muted">Things we want to find on the trip. Each item gets suggestions for where to buy it.</p>
      <AddForm />
      {!SHOPPING_URL && <p class="small faint" data-testid="lookups-off">Where-to-buy suggestions are off in this build.</p>}
      {SHOPPING_URL && waiting > 0 && !online && <p class="small faint">{waiting} waiting for a connection to look up.</p>}
      {list === null ? <div class="empty">Loading…</div>
        : !list.length ? <div class="empty">Nothing on the list yet.</div>
          : (
            <>
              {open.length > 0 && <section><h2>Still to find <span class="small muted">· {open.length}</span></h2>{open.map((w) => <Item w={w} key={w.id} />)}</section>}
              {!open.length && <div class="empty">Everything’s found.</div>}
              {got.length > 0 && (
                <details style="margin-top:16px">
                  <summary><b>Found</b> <span class="small muted">· {got.length}</span></summary>
                  {got.map((w) => <Item w={w} key={w.id} />)}
                </details>
              )}
            </>
          )}
    </div>
  );
}

function AddForm() {
  const [item, setItem] = useState('');
  const [note, setNote] = useState('');
  const submit = async (e: Event) => {
    e.preventDefault();
    if (!item.trim()) return;
    await addWant(item, note);
    setItem(''); setNote('');
  };
  return (
    <form class="card" onSubmit={submit} style="margin-top:10px">
      <label class="field"><span>Item</span>
        <input type="text" required maxLength={ITEM_MAX} value={item} onInput={(e) => setItem(e.currentTarget.value)} placeholder="e.g. Ceremonial matcha" name="want-item" /></label>
      <label class="field"><span>Note (optional)</span>
        <input type="text" maxLength={NOTE_MAX} value={note} onInput={(e) => setNote(e.currentTarget.value)} placeholder="Size, brand, budget" name="want-note" /></label>
      <button class="btn primary block" type="submit">Add to list</button>
    </form>
  );
}

function Item({ w }: { w: Want }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div class="card" data-testid={`want-${w.id}`} style={w.got ? 'opacity:.75;margin-top:10px' : 'margin-top:10px'}>
      <label class="toggle" style="padding:0">
        <span class="grow"><b style={w.got ? 'text-decoration:line-through' : ''}>{w.item}</b>
          {w.note && <div class="small muted">{w.note}</div>}</span>
        <input type="checkbox" checked={w.got} onChange={() => setGot(w, !w.got)} aria-label={`Found: ${w.item}`} />
      </label>
      {!w.got && <Advice w={w} />}
      <div class="row wrap" style="margin-top:8px">
        {w.got && <a class="btn" href={href('purchases', { view: 'add', item: w.item })}>Log the purchase</a>}
        {!w.got && SHOPPING_URL && w.lookup !== 'pending' && <button class="btn" type="button" onClick={() => relook(w)}>Look again</button>}
        {confirm
          ? <><button class="btn" type="button" onClick={() => deleteWant(w.id)}>Yes, delete</button><button class="btn" type="button" onClick={() => setConfirm(false)}>Keep</button></>
          : <button class="btn" type="button" onClick={() => setConfirm(true)}>Delete</button>}
      </div>
    </div>
  );
}

function Advice({ w }: { w: Want }) {
  if (!SHOPPING_URL && !w.advice) return null;
  return (
    <div style="margin-top:8px" data-testid="advice">
      {w.advice && (
        <>
          <p class="small" style="margin:0 0 6px">{w.advice.summary}</p>
          <ul class="list-plain small">{w.advice.places.map((p) => (
            <li key={p.name}><b>{p.name}</b> <span class="muted">· {areaLabel(p.area)}</span><div class="muted">{p.why}</div></li>
          ))}</ul>
        </>
      )}
      {w.lookup === 'pending' && !w.error && <p class="small faint" style="margin:0">{w.advice ? 'Looking again…' : 'Looking up where to buy…'}</p>}
      {w.error && <p class="small" style="margin:4px 0 0;color:var(--must)">{w.error}</p>}
    </div>
  );
}
