import { CONFIG } from '../config';
import { showToast } from './utils';
import { ytPlayer, initYouTube } from './youtube';
import { startAnimLoop, createSparkles } from './canvas';

// --- Entry Screen ---
const entryScreen = document.getElementById('entry');
const mainContent = document.getElementById('main');
const bgmPlayer = document.getElementById('bgm-player');
export let userInteracted = false;

function handleEntry(e: any) {
    if (userInteracted) return;
    userInteracted = true;
    if (entryScreen) entryScreen.classList.add('hidden');
    if (mainContent) mainContent.classList.remove('hidden');
    if (bgmPlayer) bgmPlayer.classList.add('visible', 'playing');
    
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;
    createSparkles(x, y);
    
    if (ytPlayer && ytPlayer.playVideo) {
        ytPlayer.playVideo();
    }
}

export function initEntry() {
    if (entryScreen) entryScreen.addEventListener('click', handleEntry);
    window.addEventListener('keydown', (e) => {
        if (entryScreen && !entryScreen.classList.contains('hidden')) {
            handleEntry(e);
        }
    });
}

// --- Theme & Settings Logic ---
const themeBtn = document.getElementById('theme-btn');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettings = document.getElementById('close-settings');
const reduceMotionToggle = document.getElementById('reduce-motion-toggle') as HTMLInputElement;

let currentThemeIndex = 0;

export function initThemeAndSettings() {
    const savedTheme = localStorage.getItem('akari_theme') || CONFIG.THEMES[0];
    currentThemeIndex = CONFIG.THEMES.indexOf(savedTheme);
    if (currentThemeIndex === -1) currentThemeIndex = 0;

    document.body.className = `theme-${CONFIG.THEMES[currentThemeIndex]}`;

    const savedReduceMotion = localStorage.getItem('akari_reduce_motion');
    if (savedReduceMotion === 'true') {
        document.body.classList.add('reduced-motion');
        if (reduceMotionToggle) reduceMotionToggle.checked = true;
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            currentThemeIndex = (currentThemeIndex + 1) % CONFIG.THEMES.length;
            const newTheme = CONFIG.THEMES[currentThemeIndex];
            
            CONFIG.THEMES.forEach(t => document.body.classList.remove(`theme-${t}`));
            document.body.classList.add(`theme-${newTheme}`);
            
            if (reduceMotionToggle && reduceMotionToggle.checked) {
                document.body.classList.add('reduced-motion');
            }
            
            localStorage.setItem('akari_theme', newTheme);
            
            const themeNames: Record<string, string> = {
                macchiato: "Catppuccin Macchiato",
                tokyonight: "Tokyo Night",
                atom: "Atom One Dark",
                latte: "Catppuccin Latte"
            };
            showToast(`🎨 Theme changed to <b>${themeNames[newTheme] || newTheme}</b>`);
        });
    }

    if (settingsBtn && settingsModal && closeSettings) {
        settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
        closeSettings.addEventListener('click', () => settingsModal.classList.add('hidden'));
        settingsModal.addEventListener('click', (e) => {
            if (e.target === settingsModal) settingsModal.classList.add('hidden');
        });
    }

    if (reduceMotionToggle) {
        reduceMotionToggle.addEventListener('change', (e: any) => {
            const isReduced = e.target.checked;
            if (isReduced) {
                document.body.classList.add('reduced-motion');
                localStorage.setItem('akari_reduce_motion', 'true');
            } else {
                document.body.classList.remove('reduced-motion');
                localStorage.setItem('akari_reduce_motion', 'false');
                startAnimLoop();
            }
            updateNameplateEffect();
            updateAvatarDecoration(isReduced);
        });
    }
}

function updateAvatarDecoration(isReduced: boolean) {
    const adEl = document.getElementById('avatar-decoration') as HTMLImageElement;
    if (!adEl || !adEl.src) return;
    
    const u = (window as any).currentUserData;
    if (u && u.avatar_decoration_data) {
        let assetUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${u.avatar_decoration_data.asset}.png?size=256`;
        if (isReduced && u.avatar_decoration_data.sku_id) {
            assetUrl = `https://cdn.discordapp.com/media/v1/collectibles-shop/${u.avatar_decoration_data.sku_id}/static`;
        }
        adEl.src = assetUrl;
    }
}

function updateNameplateEffect() {
    const videoEl = document.getElementById('nameplate-video') as HTMLVideoElement;
    const imgEl = document.getElementById('nameplate-img') as HTMLImageElement;
    const effectContainer = document.getElementById('nameplate-effect');
    const isReduced = document.body.classList.contains('reduced-motion');
    
    const np = (window as any).currentNameplateData;
    if (!np || !np.sku_id || !videoEl || !imgEl || !effectContainer) return;
    
    const videoSrc = `https://cdn.discordapp.com/media/v1/collectibles-shop/${np.sku_id}/video.webm`;
    const staticSrc = './assets/img/static.png';
    
    videoEl.onerror = null;
    imgEl.onerror = null;
    videoEl.pause();
    videoEl.src = '';
    videoEl.load();
    imgEl.src = '';
    videoEl.classList.add('hidden');
    imgEl.classList.add('hidden');
    
    if (isReduced) {
        imgEl.src = staticSrc;
        imgEl.classList.remove('hidden');
        imgEl.onerror = () => effectContainer.classList.add('hidden');
    } else {
        videoEl.src = videoSrc;
        videoEl.classList.remove('hidden');
        videoEl.load();
        videoEl.play().catch(() => {});
        videoEl.onerror = () => {
            videoEl.classList.add('hidden');
            imgEl.src = staticSrc;
            imgEl.classList.remove('hidden');
            imgEl.onerror = () => effectContainer.classList.add('hidden');
        };
    }
}

// --- View Counter ---
export function initViewCounter() {
    const viewCountEl = document.getElementById('view-count');
    if (!viewCountEl) return;
    
    let localViews = parseInt(localStorage.getItem('akari_views_v3') || "0");
    const hasCounted = sessionStorage.getItem('akari_view_counted');
    if (!hasCounted) {
        localViews++;
        localStorage.setItem('akari_views_v3', String(localViews));
        sessionStorage.setItem('akari_view_counted', 'true');
    }
    
    fetch(CONFIG.VIEW_COUNTER_API)
        .then(response => response.json())
        .then(data => {
            if (data && data.value) {
                viewCountEl.textContent = data.value.toLocaleString();
            } else {
                viewCountEl.textContent = localViews.toLocaleString();
            }
        })
        .catch(error => {
            console.error('Error fetching view count:', error);
            viewCountEl.textContent = localViews.toLocaleString();
        });
}

// --- Hacker Text Scramble Effect ---
export function initScrambleText() {
    const quotes = [
        "reality is an illusion.",
        "system breach detected...",
        "192.168.1.254 - user connected.",
        "i'm done overthinking.",
        "404 not found.",
        "access denied.",
        "terminal // offline",
        "too much love will kill you."
    ];
    const scrambleEl = document.getElementById('scramble-text');
    if (!scrambleEl) return;
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

    function scrambleText() {
        const targetText = quotes[Math.floor(Math.random() * quotes.length)].toUpperCase();
        let iterations = 0;
        
        const interval = setInterval(() => {
            if (scrambleEl) {
                scrambleEl.textContent = targetText.split("").map((letter, index) => {
                    if(index < iterations) { return targetText[index]; }
                    return letters[Math.floor(Math.random() * letters.length)];
                }).join("");
            }
            
            if(iterations >= targetText.length){ 
                clearInterval(interval); 
                setTimeout(scrambleText, 4000); 
            }
            iterations += 1 / 3;
        }, 30);
    }
    scrambleText();
}

// --- 3D Tilt Effect ---
export function initTilt() {
    const cardTilt = document.getElementById('card');
    const hologramGlare = document.getElementById('hologram-glare');
    if (!cardTilt) return;

    function handleTilt(e: any) {
        if (mainContent && mainContent.classList.contains('hidden')) return;
        if (!cardTilt) return;
        const rect = cardTilt.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const xAxis = (centerX - clientX) / 15;
        const yAxis = (centerY - clientY) / 25;
        
        cardTilt.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;

        if (hologramGlare) {
            const posX = 50 + xAxis * 2.5;
            const posY = 50 + yAxis * 2.5;
            hologramGlare.style.backgroundPosition = `${posX}% ${posY}%`;
        }
    }
    cardTilt.addEventListener('mousemove', handleTilt);
    cardTilt.addEventListener('touchmove', handleTilt);

    function resetTilt() {
        if (!cardTilt) return;
        cardTilt.style.transition = 'transform 0.5s ease';
        cardTilt.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)`;
        if (hologramGlare) hologramGlare.style.backgroundPosition = `50% 50%`;
        setTimeout(() => { if (cardTilt) cardTilt.style.transition = 'none'; }, 500);
    }
    cardTilt.addEventListener('mouseleave', resetTilt);
    cardTilt.addEventListener('touchend', resetTilt);
}

// --- Multi-Tabs Switcher ---
export function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            if (targetId) {
                const targetPane = document.getElementById(targetId);
                if (targetPane) targetPane.classList.add('active');
            }
        });
    });
}

// --- Easter Egg ---
export function initEasterEgg() {
    const avatarWrapper = document.getElementById('avatar-wrapper');
    const cardBorder = document.getElementById('card-border');
    let avatarClickCount = 0;
    let avatarClickTimer: any = null;

    if (avatarWrapper) {
        avatarWrapper.addEventListener('click', (e) => {
            e.stopPropagation();
            avatarClickCount++;
            createSparkles(e.clientX, e.clientY);

            clearTimeout(avatarClickTimer);
            avatarClickTimer = setTimeout(() => {
                avatarClickCount = 0;
            }, 2000);

            if (avatarClickCount === CONFIG.EASTER_EGG_CLICKS) {
                avatarClickCount = 0;
                if (cardBorder) {
                    cardBorder.classList.add('rainbow-rave');
                    showToast("✨ <b>RAVE MODE ACTIVATED!</b> ✨");
                    for (let i = 0; i < 60; i++) {
                        setTimeout(() => {
                            createSparkles(window.innerWidth / 2 + (Math.random() * 300 - 150), window.innerHeight / 2 + (Math.random() * 300 - 150));
                        }, i * 30);
                    }
                    setTimeout(() => {
                        cardBorder.classList.remove('rainbow-rave');
                    }, 8000);
                }
            }
        });
    }
}

// --- Anonymous Form ---
export function initAnonymousForm() {
    const anonForm = document.getElementById('anonymous-form') as HTMLFormElement;
    if (anonForm) {
        anonForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameInput = document.getElementById('anon-name') as HTMLInputElement;
            const msgInput = document.getElementById('anon-msg') as HTMLInputElement;
            const submitBtn = document.getElementById('anon-submit-btn') as HTMLButtonElement;
            
            const name = nameInput?.value.trim() || "Anonymous";
            const msg = msgInput?.value.trim();

            if (!msg || !submitBtn) return;

            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;

            const themeColors: Record<string, number> = {
                macchiato: 13017334,
                tokyonight: 12294903,
                atom: 13007069,
                latte: 8927727
            };
            const currentTheme = CONFIG.THEMES[currentThemeIndex];
            const embedColor = themeColors[currentTheme] || 13017334;
            
            const payload = {
                embeds: [{
                    title: "💌 Thư nặc danh mới!",
                    color: embedColor,
                    fields: [
                        { name: "👤 Người gửi", value: name, inline: true },
                        { name: "⏰ Thời gian", value: new Date().toLocaleString('vi-VN'), inline: true },
                        { name: "💬 Lời nhắn", value: msg }
                    ],
                    footer: { text: "Gửi từ akari310 bio-link" }
                }]
            };

            fetch(CONFIG.WEBHOOK_PROXY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(res => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send Message`;
                if (res.ok) {
                    anonForm.reset();
                    showToast(`💌 Thank you <b>${name}</b>, your note was sent!`);
                } else {
                    showToast(`❌ Oops! Something went wrong.`);
                }
            }).catch(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send Message`;
                showToast(`❌ Network Error! Cannot reach the server.`);
            });
        });
    }
}

// Copy to Clipboard
export function initCopyLinks() {
    document.querySelectorAll('.social-icon[data-copy]').forEach(icon => {
        icon.addEventListener('click', () => {
            const textToCopy = icon.getAttribute('data-copy');
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast(`<i class="fa-solid fa-circle-check" style="color: var(--c-green);"></i> Copied <b>${textToCopy}</b> to clipboard!`);
                }).catch(() => {});
            }
        });
    });
}
