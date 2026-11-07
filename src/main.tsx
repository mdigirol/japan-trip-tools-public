import { render } from 'preact';
import './styles.css';
import { App } from './app';
import { persistStorage } from './lib/db';
import { applyTextSize, getSettings } from './lib/settings';
import { startSync } from './lib/sync';
import { startWants } from './lib/wants';

applyTextSize(getSettings().textSize);
persistStorage();
startSync();
startWants();
render(<App />, document.getElementById('app')!);
