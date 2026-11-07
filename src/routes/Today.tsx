import { useEffect, useState } from 'preact/hooks';
import type { Stay } from '../data/schema';
import { etiquette, ETIQUETTE_GROUPS } from '../data/etiquette';
import { phrases, PHRASE_TABS } from '../data/phrases';
import { KYOTO_GENERAL, tipsBySlug } from '../data/places';
import { dateRange, longDate, now } from '../lib/now';
import { href } from '../lib/router';
import { useSettings } from '../lib/settings';
import { showCard, telDisplay } from '../lib/showcard';
import { hotelCard } from '../lib/hotelCard';
import { jmaAreaForCity, jmaUrl, JMA_MAP_URL, nearestJmaArea, type JmaArea } from '../lib/jma';
import { itineraryDayUrl, stayById, trip, todayState, weatherCities, type TodayState } from '../lib/trip';
import { cachedWeather, cToF, refreshWeather, type CityWeather } from '../lib/weather';
import { stamp } from '../lib/now';
import { Tiles } from '../components/Tiles';
import { UnclaimedNotice } from '../components/UnclaimedNotice';
import { areaLabel, todayWants, useWants } from '../lib/wants';

export function Today() {
  const st = todayState(now());
  return (
    <div class="stack">
      <Header st={st} />
      {st.phase === 'after' ? <After /> : <DayBody st={st} />}
      <h2>Tools</h2>
      <Tiles />
    </div>
  );
}

function Header({ st }: { st: TodayState }) {
  if (st.phase === 'before') {
    return (
      <header class="today-head">
        <h1>{st.daysToGo === 1 ? '1 day to go' : `${st.daysToGo} days to go`}</h1>
        <p class="leg">Flight on Thu, Oct 22. Here’s a preview of your first day, Oct 23.</p>
      </header>
    );
  }
  if (st.phase === 'air-out') {
    return (
      <header class="today-head">
        <h1>{longDate(st.ymd)} · In the air</h1>
        <p class="leg">You land tomorrow, Oct 23.</p>
      </header>
    );
  }
  if (st.phase === 'after') {
    return <header class="today-head"><h1>Trip complete</h1><p class="leg">Welcome home.</p></header>;
  }
  const leg = st.leg;
  return (
    <header class="today-head">
      <h1>{longDate(st.ymd)} · {st.city}</h1>
      <p class="leg">
        Day {st.dayNumber} of 20
        {leg && !st.flightHome && <> · {st.city}, night {leg.night} of {leg.nights}</>}
        {st.flightHome && <> · Flight home tonight</>}
      </p>
    </header>
  );
}

function After() {
  return (
    <div class="card">
      <p>That’s the trip. Safe travels home.</p>
      <UnclaimedNotice />
    </div>
  );
}

function DayBody({ st }: { st: TodayState }) {
  const day = st.day;
  if (!day) return null;
  const preview = st.phase === 'before' || st.phase === 'air-out';
  const ymd = preview ? '2026-10-23' : st.ymd;
  const shownDay = preview ? undefined : day;
  const previewDay = preview ? (st.phase === 'air-out' ? undefined : day) : day;
  const itineraryLink = itineraryDayUrl(ymd);
  return (
    <>
      {day.note && !preview && <div class="card tight small">{day.note}</div>}
      <Weather ymd={ymd} day={preview ? undefined : shownDay} />
      {previewDay && <Hoods day={previewDay} />}
      {shownDay && <ToBuyHint day={shownDay} />}
      <Hotels st={st} />
      {st.flightHome && <UnclaimedNotice nov27 />}
      {itineraryLink && (
        <>
          <a class="btn block" href={itineraryLink} target="_blank" rel="noopener">Open this day in the itinerary ↗</a>
          <p class="small faint" style="margin-top:4px">The itinerary asks for its password. If it lands on the top, pick {longDate(ymd).replace(/^\w+, /, '')}.</p>
        </>
      )}
      <Suggested st={st} />
    </>
  );
}

function fmtTemp(c: number, first: 'F' | 'C') {
  const f = Math.round(cToF(c)), cc = Math.round(c);
  return first === 'F' ? [`${f}°F`, `${cc}°C`] : [`${cc}°C`, `${f}°F`];
}

function Weather({ ymd, day }: { ymd: string; day?: TodayState['day'] }) {
  const s = useSettings();
  const cities = weatherCities(day);
  const [wx, setWx] = useState<CityWeather[] | null>(null);
  const key = cities.map((c) => c.id).join(',') + ymd;
  useEffect(() => {
    let alive = true;
    Promise.all(cities.map((c) => cachedWeather(c, ymd))).then((w) => alive && setWx(w));
    Promise.all(cities.map((c) => refreshWeather(c, ymd))).then((w) => alive && setWx(w));
    return () => { alive = false; };
  }, [key]);
  if (!wx) return <div class="card tight muted small">Weather…</div>;
  return (
    <>
    <section aria-label="Weather" class="wx">
      {wx.map((w) => {
        const [hi, hi2] = fmtTemp(w.day.hiC, s.tempFirst), [lo, lo2] = fmtTemp(w.day.loC, s.tempFirst);
        const area = jmaAreaForCity(w.city, day);
        return (
          <a class="card tight card-btn" key={w.city.id} href={jmaUrl(area.code)} target="_blank" rel="noopener"
            style="text-decoration:none;color:inherit" data-testid={`wx-${w.city.id}`}>
            <div class="row" style="justify-content:space-between"><b>{w.city.name}</b>{w.typical && <span class="pill">typical</span>}</div>
            <div class="temp">{hi} <span class="muted" style="font-weight:400">/ {lo}</span></div>
            <div class="small faint">{hi2} / {lo2}</div>
            <div class="small">
              {w.day.rainPct != null && <>Rain {w.day.rainPct}% · </>}
              {w.day.sunset && <>Sunset {fmtClock(w.day.sunset)} JST</>}
            </div>
            {w.at && <div class="small faint">Forecast from {stamp(w.at, s.timeZone)}</div>}
            {w.typical && <div class="small faint">Mid-November average. No forecast yet.</div>}
            <div class="small" style="color:var(--indigo)">JMA forecast, {area.name} ↗</div>
          </a>
        );
      })}
    </section>
    <ForecastHere />
    </>
  );
}

// Asks for location only on tap, then offers the JMA page for the nearest area.
function ForecastHere() {
  const [busy, setBusy] = useState(false);
  const [area, setArea] = useState<JmaArea | null>(null);
  const [msg, setMsg] = useState('');
  const locate = () => {
    setMsg(''); setArea(null);
    if (!('geolocation' in navigator)) { setMsg('Location isn’t available.'); return; }
    setBusy(true);
    navigator.geolocation.getCurrentPosition((pos) => {
      setBusy(false);
      const a = nearestJmaArea({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      if (a) setArea(a); else setMsg('You’re outside the areas this app knows.');
    }, () => { setBusy(false); setMsg('Location was blocked or timed out.'); }, { timeout: 10000, maximumAge: 60000 });
  };
  return (
    <div style="margin-top:10px">
      <div class="row">
        <button class="btn grow" onClick={locate} disabled={busy}>{busy ? 'Looking…' : '📍 Forecast where I am'}</button>
        {area && <a class="btn grow" href={jmaUrl(area.code)} target="_blank" rel="noopener" data-testid="wx-here">JMA, {area.name} ↗</a>}
      </div>
      {msg && <p class="small" role="status" data-testid="wx-here-msg">{msg} <a href={JMA_MAP_URL} target="_blank" rel="noopener">Open JMA’s map ↗</a></p>}
    </div>
  );
}

const fmtClock = (hhmm: string) => {
  const h = +hhmm.slice(0, 2), m = hhmm.slice(3, 5);
  return `${((h + 11) % 12) + 1}:${m} ${h < 12 ? 'AM' : 'PM'}`;
};

function Hoods({ day }: { day: NonNullable<TodayState['day']> }) {
  if (!day.hoods.length) return null;
  const seen = new Set<string>();
  return (
    <section>
      <h2>Neighborhoods</h2>
      {day.seg === 'ky' && <div class="card tight small" style="margin-bottom:10px"><b>Kyoto:</b> {KYOTO_GENERAL}</div>}
      {day.hoods.map((h) => {
        const tip = tipsBySlug.get(h.slug);
        const showTips = tip && !seen.has(h.slug);
        if (tip) seen.add(h.slug);
        return (
          <div class="card" key={h.name}>
            <h3>{h.name}</h3>
            <p class="small muted">{h.blurb}</p>
            {showTips && (
              <details>
                <summary>Know before you go</summary>
                <ul class="tips small">{tip.tips.map((t) => <li key={t}>{t}</li>)}</ul>
              </details>
            )}
          </div>
        );
      })}
    </section>
  );
}

// Items on the To buy list with a suggested place in today's neighborhoods or cities. No stop names or times.
function ToBuyHint({ day }: { day: NonNullable<TodayState['day']> }) {
  const list = useWants();
  const hits = list ? todayWants(list, day) : [];
  if (!hits.length) return null;
  return (
    <section data-testid="tobuy-hint">
      <h2>On your to-buy list</h2>
      <a class="card card-btn" href={href('tobuy')} style="color:inherit;text-decoration:none">
        <ul class="list-plain small" style="margin:0">{hits.map(({ want, place }) => (
          <li key={want.id}><b>{want.item}</b>: {place.name} <span class="muted">· {areaLabel(place.area)}</span></li>
        ))}</ul>
      </a>
    </section>
  );
}

function HotelCompact({ s, label, secondary }: { s: Stay; label: string; secondary?: boolean }) {
  return (
    <button class={'card card-btn hotel-compact' + (secondary ? ' secondary' : '')} onClick={() => showCard(hotelCard(s))} data-testid={`hotel-${s.id}`}>
      <div class="small muted">{label}</div>
      <div class="ja" lang="ja">{s.nameJa}</div>
      <div class="small" lang="ja">{s.addrJa}</div>
      <div class="small faint">{s.name} · ☎ {telDisplay(s.tel)} · Tap for the taxi card</div>
    </button>
  );
}

function Hotels({ st }: { st: TodayState }) {
  if (st.phase === 'before' || st.phase === 'air-out') {
    const first = stayById(trip.stays[0]?.id);
    return first ? <section><h2>First hotel</h2><HotelCompact s={first} label={dateRange(first.from, first.to)} /></section> : null;
  }
  if (!st.primary) return null;
  if (st.flightHome) {
    return <section><h2>Today’s hotel</h2><HotelCompact s={st.primary} label="Checked out · bags held here" /></section>;
  }
  return (
    <section>
      <h2>Tonight’s hotel</h2>
      {st.checkingOut && <p class="small"><b>Checking out of {st.checkingOut.name}</b> · Tonight: {st.primary.name}</p>}
      <HotelCompact s={st.primary} label={st.checkingOut ? 'Tonight' : 'Tonight’s hotel'} />
      {st.checkingOut && <HotelCompact s={st.checkingOut} label="Checking out this morning" secondary />}
    </section>
  );
}

function Suggested({ st }: { st: TodayState }) {
  const day = st.phase === 'during' ? st.day : undefined;
  if (!day) return null;
  const venues = new Set(day.venues);
  const places = new Set(day.places);
  const matches = (v: string[], p?: string[]) => v.some((x) => venues.has(x as never)) || (p ?? []).some((x) => places.has(x as never));

  const chips: { label: string; to: string }[] = [];
  const cards = etiquette.filter((c) => c.group !== 'everywhere' && matches(c.venues, c.places));
  const rank = { must: 0, should: 1, nice: 2 } as const;
  cards.sort((a, b) => rank[a.severity] - rank[b.severity]);
  for (const c of cards.slice(0, 3)) chips.push({ label: `${c.severity === 'must' ? '⚠︎ ' : ''}${c.title}`, to: href('etiquette', { group: c.group, card: c.id }) });
  for (const t of PHRASE_TABS) {
    if (chips.length >= 6) break;
    if (t.id === 'basics' || t.id === 'emergency') continue;
    if (phrases.some((p) => p.tab === t.id && matches(p.venues, p.places))) chips.push({ label: `${t.label} phrases`, to: href('phrases', { tab: t.id }) });
  }
  for (const g of ETIQUETTE_GROUPS) {
    if (chips.length >= 6) break;
    if (cards.some((c) => c.group === g.id) && !chips.some((x) => x.label === `${g.label} etiquette`)) chips.push({ label: `${g.label} etiquette`, to: href('etiquette', { group: g.id }) });
  }
  if (!chips.length) return null;
  return (
    <section>
      <h2>Suggested for today</h2>
      <div class="chips wrap">{chips.slice(0, 6).map((c) => <a class="chip" href={c.to} key={c.to}>{c.label}</a>)}</div>
    </section>
  );
}

