import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';

import { initYouTube } from './modules/youtube';
import { initLanyard, fetchExtendedProfile } from './modules/lanyard';
import { initSakura, startAnimLoop } from './modules/canvas';
import { 
    initEntry, 
    initThemeAndSettings, 
    initViewCounter, 
    initScrambleText, 
    initTilt, 
    initTabs, 
    initEasterEgg, 
    initAnonymousForm, 
    initCopyLinks,
    userInteracted
} from './modules/ui';

// 1. Initialize UI components
initEntry();
initThemeAndSettings();
initViewCounter();
initScrambleText();
initTilt();
initTabs();
initEasterEgg();
initAnonymousForm();
initCopyLinks();

// 2. Initialize YouTube BGM
initYouTube(() => userInteracted);

// 3. Initialize Canvas Effects
initSakura();
startAnimLoop();

// 4. Initialize Discord API (Lanyard)
initLanyard();
fetchExtendedProfile();

// 5. Initialize Tippy.js Tooltips
tippy('[data-tippy-content]', {
    allowHTML: true,
    theme: 'discord',
    animation: 'scale-subtle',
    placement: 'top',
    arrow: true
});
