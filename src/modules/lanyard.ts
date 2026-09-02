import { CONFIG } from '../config';
import { formatTime, showToast } from './utils';
import { ytPlayer, updateBgmTitle, bgmCoverImg } from './youtube';

const statusColors: Record<string, string> = { online: '#a6da95', idle: '#f9e2af', dnd: '#f38ba8', offline: '#a6adc8' };

export async function initLanyard() {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${CONFIG.DISCORD_ID}`);
        const json = await res.json();
        if (json.success) {
            updatePresence(json.data);
            connectWS();
        }
    } catch (e) { console.error("Lanyard init failed", e); }
}

function connectWS() {
    const ws = new WebSocket('wss://api.lanyard.rest/socket');
    let hb: any;
    ws.onopen = () => ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: CONFIG.DISCORD_ID } }));
    ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.op === 1) hb = setInterval(() => ws.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
        if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') updatePresence(msg.d);
    };
    ws.onclose = () => { clearInterval(hb); setTimeout(connectWS, 5000); };
}

export function updatePresence(d: any) {
    if (!d?.discord_user) return;
    const u = d.discord_user;

    const activityCard = document.getElementById('activity-card-container');
    const spotifyBox = document.getElementById('spotify-box');
    const gameBox = document.getElementById('game-box');
    const skeletonBox = document.getElementById('skeleton-box');
    const infoBox = document.querySelector('.activity-box');

    // Add fade out transition
    if (activityCard) activityCard.classList.add('fade-transition');
    if (infoBox) infoBox.classList.add('fade-transition');

    setTimeout(() => {
        // Avatar
        const av = u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256` : `https://cdn.discordapp.com/embed/avatars/0.png`;
        (document.getElementById('avatar') as HTMLImageElement).src = av;
        (document.getElementById('discord-avatar') as HTMLImageElement).src = av;

        // Avatar Decoration
        const adEl = document.getElementById('avatar-decoration') as HTMLImageElement;
        const isReduced = document.body.classList.contains('reduced-motion');
        
        // Store user data globally for toggles
        (window as any).currentUserData = u;

        if (u.avatar_decoration_data && u.avatar_decoration_data.asset) {
            let assetUrl = `https://cdn.discordapp.com/avatar-decoration-presets/${u.avatar_decoration_data.asset}.png?size=256`;
            if (isReduced && u.avatar_decoration_data.sku_id) {
                assetUrl = `https://cdn.discordapp.com/media/v1/collectibles-shop/${u.avatar_decoration_data.sku_id}/static`;
            }
            if(adEl) {
                adEl.src = assetUrl;
                adEl.classList.remove('hidden');
            }
        } else {
            if(adEl) adEl.classList.add('hidden');
        }

        // Nameplate Effect in Activity Box
        const np = u.collectibles?.nameplate;
        const videoEl = document.getElementById('nameplate-video') as HTMLVideoElement;
        const imgEl = document.getElementById('nameplate-img') as HTMLImageElement;
        const effectContainer = document.getElementById('nameplate-effect');
        
        (window as any).currentNameplateData = np;
        
        if (np && np.sku_id && videoEl && imgEl && effectContainer) {
            const videoSrc = `https://cdn.discordapp.com/media/v1/collectibles-shop/${np.sku_id}/video.webm`;
            const staticSrc = './assets/img/static.png';
            
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
            effectContainer.classList.remove('hidden');
        } else if (effectContainer) {
            effectContainer.classList.add('hidden');
        }

        const nameplateEl = document.getElementById('nameplate');
        if (nameplateEl) nameplateEl.classList.add('hidden');

        // Status Dot & Text
        const s = d.discord_status || 'offline';
        const dot = document.getElementById('status-dot');
        if(dot) {
            dot.className = `status-dot ${s}`;
            dot.style.backgroundColor = ''; 
        }
        const statusText = document.getElementById('discord-status-text');
        if(statusText) {
            statusText.textContent = s.toUpperCase();
            statusText.style.color = statusColors[s] || statusColors.offline;
        }

        // Remove skeleton loader classes
        document.querySelectorAll('.skeleton').forEach(el => {
            el.classList.remove('skeleton');
            if ((el as HTMLElement).style.width) (el as HTMLElement).style.width = 'auto';
            if ((el as HTMLElement).style.height) (el as HTMLElement).style.height = 'auto';
        });

        // Custom Status (Type 4)
        const cs = d.activities?.find((a: any) => a.type === 4);
        const customStatusEl = document.getElementById('discord-custom-status');
        if (customStatusEl) {
            if (cs) {
                let html = '';
                if (cs.emoji) {
                    if (cs.emoji.id) {
                        const ext = cs.emoji.animated ? 'gif' : 'webp';
                        html += `<img src="https://cdn.discordapp.com/emojis/${cs.emoji.id}.${ext}?size=48&quality=lossless" class="custom-status-emoji" alt="${cs.emoji.name}"> `;
                    } else if (cs.emoji.name) {
                        html += cs.emoji.name + ' ';
                    }
                }
                if (cs.state) {
                    const textSpan = document.createElement('span');
                    textSpan.textContent = cs.state;
                    html += textSpan.innerHTML;
                }
                customStatusEl.innerHTML = html || "Just chilling.";
            } else {
                customStatusEl.textContent = "Just chilling.";
            }
        }

        // Rich Presence Logic
        const gameActivity = d.activities?.find((a: any) => a.type !== 4);

        if ((window as any).spotifyInterval) clearInterval((window as any).spotifyInterval);

        if (d.spotify && activityCard && spotifyBox && gameBox) {
            activityCard.classList.remove('hidden');
            spotifyBox.classList.remove('hidden');
            gameBox.classList.add('hidden');
            if (skeletonBox) skeletonBox.classList.add('hidden');
            
            (document.getElementById('sp-art') as HTMLImageElement).src = d.spotify.album_art_url;
            (document.getElementById('sp-song') as HTMLElement).textContent = d.spotify.song;
            (document.getElementById('sp-artist') as HTMLElement).textContent = d.spotify.artist;
            
            const spFill = document.getElementById('sp-progress-fill');
            const spCurrent = document.getElementById('sp-time-current');
            const spTotal = document.getElementById('sp-time-total');
            
            if (d.spotify.timestamps?.start && d.spotify.timestamps?.end) {
                const startMs = d.spotify.timestamps.start;
                const endMs = d.spotify.timestamps.end;
                const totalSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
                if (spTotal) spTotal.textContent = formatTime(totalSec);
                
                const updateSpotify = () => {
                    const now = Date.now();
                    const currentSec = Math.max(0, Math.min(totalSec, Math.floor((now - startMs) / 1000)));
                    const percent = totalSec > 0 ? (currentSec / totalSec) * 100 : 0;
                    if (spCurrent) spCurrent.textContent = formatTime(currentSec);
                    if (spFill) spFill.style.width = `${percent}%`;
                };
                updateSpotify();
                (window as any).spotifyInterval = setInterval(updateSpotify, 1000);
            }
            
        } else if (gameActivity && activityCard && gameBox && spotifyBox) {
            activityCard.classList.remove('hidden');
            gameBox.classList.remove('hidden');
            spotifyBox.classList.add('hidden');
            if (skeletonBox) skeletonBox.classList.add('hidden');
            
            const rpHeader = document.getElementById('rp-header');
            let headerHTML = '<i class="fa-solid fa-gamepad"></i> PLAYING A GAME';
            if (gameActivity.type === 1) headerHTML = '<i class="fa-solid fa-video"></i> STREAMING';
            else if (gameActivity.type === 2) headerHTML = '<i class="fa-solid fa-music"></i> LISTENING TO MUSIC';
            else if (gameActivity.type === 3) headerHTML = '<i class="fa-solid fa-tv"></i> WATCHING';
            else if (gameActivity.type === 5) headerHTML = '<i class="fa-solid fa-trophy"></i> COMPETING';
            
            if (rpHeader) rpHeader.innerHTML = headerHTML;
            
            (document.getElementById('rp-name') as HTMLElement).textContent = gameActivity.name || "Unknown";
            (document.getElementById('rp-details') as HTMLElement).textContent = gameActivity.details || "";
            (document.getElementById('rp-state') as HTMLElement).textContent = gameActivity.state || "";
            
            const lImg = document.getElementById('rp-large-img') as HTMLImageElement;
            if (lImg) {
                lImg.onerror = function(this: HTMLImageElement) {
                    if (gameActivity.application_id && !this.src.includes('dcdn.dstn.to')) {
                        this.src = `https://dcdn.dstn.to/app-icons/${gameActivity.application_id}?size=256`;
                    } else if (this.src !== av) {
                        this.src = av;
                    }
                };
                if (gameActivity.assets?.large_image) {
                    let assetId = gameActivity.assets.large_image;
                    if (assetId.startsWith('mp:external/')) {
                        lImg.src = `https://media.discordapp.net/external/${assetId.replace('mp:external/', '')}`;
                    } else {
                        lImg.src = `https://cdn.discordapp.com/app-assets/${gameActivity.application_id}/${assetId}.png`;
                    }
                } else if (gameActivity.application_id) {
                    lImg.src = `https://dcdn.dstn.to/app-icons/${gameActivity.application_id}?size=256`;
                } else {
                    lImg.src = av;
                }
            }
            
            const sImg = document.getElementById('rp-small-img') as HTMLImageElement;
            if (sImg) {
                sImg.onerror = function(this: HTMLImageElement) { this.classList.add('hidden'); };
                if (gameActivity.assets?.small_image) {
                    sImg.classList.remove('hidden');
                    let sAssetId = gameActivity.assets.small_image;
                    if (sAssetId.startsWith('mp:external/')) {
                        sImg.src = `https://media.discordapp.net/external/${sAssetId.replace('mp:external/', '')}`;
                    } else {
                        sImg.src = `https://cdn.discordapp.com/app-assets/${gameActivity.application_id}/${sAssetId}.png`;
                    }
                } else {
                    sImg.classList.add('hidden');
                }
            }

            if ((window as any).rpInterval) clearInterval((window as any).rpInterval);
            const timeEl = document.getElementById('rp-time');
            
            if (gameActivity.timestamps?.end || gameActivity.timestamps?.start) {
                const hasEnd = !!gameActivity.timestamps?.end;
                const targetMs = hasEnd ? gameActivity.timestamps.end : gameActivity.timestamps.start;
                
                const updateTime = () => {
                    let diffSeconds = 0;
                    if (hasEnd) {
                        diffSeconds = Math.max(0, Math.floor((targetMs - Date.now()) / 1000));
                    } else {
                        diffSeconds = Math.max(0, Math.floor((Date.now() - targetMs) / 1000));
                    }
                    
                    const h = Math.floor(diffSeconds / 3600);
                    const m = Math.floor((diffSeconds % 3600) / 60);
                    const s = diffSeconds % 60;
                    let txt = '';
                    if (h > 0) txt += `${h}:`;
                    txt += `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                    
                    if (timeEl) {
                        timeEl.textContent = hasEnd ? `${txt} left` : `${txt} elapsed`;
                    }
                };
                updateTime();
                (window as any).rpInterval = setInterval(updateTime, 1000);
            } else {
                if (timeEl) timeEl.textContent = "";
            }
            
            const buttonsContainer = document.getElementById('rp-buttons');
            if (gameActivity.buttons && gameActivity.buttons.length > 0) {
                if (buttonsContainer) {
                    buttonsContainer.classList.remove('hidden');
                    buttonsContainer.innerHTML = '';
                    gameActivity.buttons.slice(0, 2).forEach((btnText: string) => {
                        const btn = document.createElement('a');
                        btn.className = 'rp-button';
                        btn.target = "_blank";
                        
                        const textLower = btnText.toLowerCase();
                        const isListen = textLower.includes("listen") || textLower.includes("play") || textLower.includes("watch");
                        const isView = textLower.includes("artist") || textLower.includes("channel") || textLower.includes("creator") || textLower.includes("album") || textLower.includes("view");
                        const isRead = textLower.includes("read");
                        
                        if (isListen) {
                            btn.innerHTML = `<i class="fa-solid fa-headphones"></i> ${btnText}`;
                        } else if (isView) {
                            btn.innerHTML = `<i class="fa-solid fa-arrow-up-right-from-square"></i> ${btnText}`;
                        } else if (isRead) {
                            btn.innerHTML = `<i class="fa-solid fa-book-open"></i> ${btnText}`;
                        } else {
                            btn.textContent = btnText;
                        }
                        
                        let url: string | null = null;
                        if (isListen || isRead) {
                            url = gameActivity.details_url || gameActivity.state_url;
                        } else {
                            url = gameActivity.state_url || gameActivity.details_url;
                        }
                        
                        if (url) {
                            btn.href = url;
                            if (isListen) {
                                function extractVideoID(url: string) {
                                    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                                    const match = url.match(regExp);
                                    return match;
                                }
                                const match = extractVideoID(url);
                                const vid = match && match[2].length === 11 ? match[2] : null;
                                if (vid) {
                                    btn.onclick = (e) => {
                                        e.preventDefault();
                                        if(ytPlayer && typeof ytPlayer.loadVideoById === 'function') {
                                            ytPlayer.loadVideoById(vid);
                                        } 
                                        updateBgmTitle(gameActivity.details || gameActivity.name);
                                        if (bgmCoverImg && lImg) bgmCoverImg.src = lImg.src;
                                    };
                                }
                            }
                        } else {
                            btn.onclick = (e) => {
                                e.preventDefault();
                                showToast(`<i class="fa-solid fa-circle-exclamation" style="color: var(--c-yellow);"></i> Discord API hides this link for privacy!`);
                            };
                        }
                        buttonsContainer.appendChild(btn);
                    });
                }
            } else {
                if (buttonsContainer) buttonsContainer.classList.add('hidden');
            }
            
        } else {
            if (activityCard) activityCard.classList.add('hidden');
        }

        requestAnimationFrame(() => {
            if (activityCard) activityCard.classList.remove('fade-transition');
            if (infoBox) infoBox.classList.remove('fade-transition');
        });
    }, 300);
}

export async function fetchExtendedProfile() {
    try {
        const res = await fetch(`https://dcdn.dstn.to/profile/${CONFIG.DISCORD_ID}`);
        if (!res.ok) return;
        const json = await res.json();
        
        if (json.user && json.user.accent_color) {
            const hex = '#' + json.user.accent_color.toString(16).padStart(6, '0');
            document.documentElement.style.setProperty('--c-lavender', hex);
        }

        const nameplateEl = document.getElementById('nameplate') as HTMLImageElement;
        const np = json.user?.collectibles?.nameplate;
        if (nameplateEl && np) {
            let src = '';
            if (np.asset && np.palette) {
                src = `https://cdn.discordapp.com/${np.asset}${np.palette}.png`;
            } else if (np.asset) {
                src = `https://cdn.discordapp.com/${np.asset}default.png`;
            } else if (np.palette) {
                src = `https://cdn.discordapp.com/nameplates/${np.palette}.png`;
            }
            
            const skuSrc = np.sku_id ? `https://cdn.discordapp.com/media/v1/collectibles-shop/${np.sku_id}/static` : '';
            
            if (src) {
                nameplateEl.src = src;
                nameplateEl.classList.remove('hidden');
                nameplateEl.onerror = () => {
                    if (skuSrc) {
                        nameplateEl.src = skuSrc;
                        nameplateEl.onerror = () => { nameplateEl.classList.add('hidden'); };
                    } else {
                        nameplateEl.classList.add('hidden');
                    }
                };
            } else if (skuSrc) {
                nameplateEl.src = skuSrc;
                nameplateEl.classList.remove('hidden');
                nameplateEl.onerror = () => nameplateEl.classList.add('hidden');
            } else {
                nameplateEl.classList.add('hidden');
            }
        }
    } catch (e) {
        console.error("Failed to fetch extended profile", e);
    }
}
