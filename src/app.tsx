import { ShowCardOverlay } from './components/ShowCardOverlay';
import { StatusPills } from './components/StatusPills';
import { UpdatePrompt } from './components/UpdatePrompt';
import { MODULES, navModules } from './lib/modules';
import { href, useRoute } from './lib/router';
import { useSettings } from './lib/settings';
import { Cards } from './routes/Cards';
import { Currency } from './routes/Currency';
import { Decoder } from './routes/Decoder';
import { Emergency } from './routes/Emergency';
import { Etiquette } from './routes/Etiquette';
import { Konbini } from './routes/Konbini';
import { More } from './routes/More';
import { Numbers } from './routes/Numbers';
import { Phrases } from './routes/Phrases';
import { Purchases } from './routes/Purchases';
import { Settings } from './routes/Settings';
import { Shopping } from './routes/Shopping';
import { ToBuy } from './routes/ToBuy';
import { Today } from './routes/Today';
import { Transit } from './routes/Transit';
import { Units } from './routes/Units';

const TOOL_PATHS = new Set(MODULES.map((m) => m.path));

export function App() {
  const route = useRoute();
  const { toolOrder } = useSettings();
  const nav = [
    { path: '', label: 'Today', ic: '☀︎' },
    ...navModules(toolOrder).map((m) => ({ path: m.path, label: m.short ?? m.label, ic: m.ic })),
    { path: 'more', label: 'More', ic: '☰' }
  ];
  const p = route.path;
  let page;
  switch (p) {
    case 'phrases': page = <Phrases route={route} />; break;
    case 'cards': page = <Cards />; break;
    case 'etiquette': page = <Etiquette route={route} />; break;
    case 'currency': page = <Currency />; break;
    case 'emergency': page = <Emergency />; break;
    case 'more': page = <More />; break;
    case 'settings': page = <Settings />; break;
    case 'shopping': page = <Shopping />; break;
    case 'purchases': page = <Purchases route={route} />; break;
    case 'tobuy': page = <ToBuy />; break;
    case 'konbini': page = <Konbini route={route} />; break;
    case 'decoder': page = <Decoder />; break;
    case 'transit': page = <Transit />; break;
    case 'numbers': page = <Numbers />; break;
    case 'units': page = <Units />; break;
    default: page = <Today />;
  }
  const current = nav.some((n) => n.path === p) ? p : p === 'more' || TOOL_PATHS.has(p) ? 'more' : '';
  return (
    <div class="app">
      <main>
        <StatusPills />
        {page}
      </main>
      <nav class="nav" aria-label="Main">
        {nav.map((n) => (
          <a key={n.path} href={href(n.path)} aria-current={current === n.path ? 'page' : undefined}>
            <span class="ic" aria-hidden="true">{n.ic}</span>{n.label}
          </a>
        ))}
      </nav>
      <UpdatePrompt />
      <ShowCardOverlay />
    </div>
  );
}
