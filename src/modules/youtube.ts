import { CONFIG } from '../config';
import { formatTime } from './utils';

export let ytPlayer: any = null;
export let ytDuration = 0;
let isShuffle = true;
let repeatState = 0; // 0 = Repeat All, 1 = Repeat One, 2 = Repeat Off
let ytInterval: any = null;

// DOM Elements
const bgmPlayer = document.getElementById('bgm-player');
const bgmPlayPause = document.getElementById('bgm-play-pause');
const bgmPlayPauseSmall = document.getElementById('bgm-play-pause-small');
const bgmMute = document.getElementById('bgm-mute');
const bgmCurrent = document.getElementById('bgm-current');
const bgmDuration = document.getElementById('bgm-duration');
const timelineSlider = document.getElementById('bgm-progress-slider') as HTMLInputElement;
const volumeSlider = document.getElementById('bgm-volume') as HTMLInputElement;
const bgmPrev = document.getElementById('bgm-prev');
const bgmNext = document.getElementById('bgm-next');
const bgmShuffle = document.getElementById('bgm-shuffle');
const bgmRepeat = document.getElementById('bgm-repeat');
const bgmTitleEl = document.querySelector('.bgm-title');
export const bgmCoverImg = document.getElementById('bgm-cover-img') as HTMLImageElement;
const bgmCoverBtn = document.getElementById('bgm-cover-btn');


export function updatePlayPauseUI(isPlaying: boolean) {
    if (isPlaying) {
        bgmPlayPause?.classList.replace('fa-play', 'fa-pause');
        bgmPlayPauseSmall?.classList.replace('fa-play', 'fa-pause');
        bgmPlayer?.classList.add('playing');
    } else {
        bgmPlayPause?.classList.replace('fa-pause', 'fa-play');
        bgmPlayPauseSmall?.classList.replace('fa-pause', 'fa-play');
        bgmPlayer?.classList.remove('playing');
    }
}

export function updateBgmTitle(title: string) {
    if (!bgmTitleEl) return;
    bgmTitleEl.textContent = title;
    const container = bgmTitleEl.parentElement;
    if (container && bgmTitleEl.scrollWidth > container.clientWidth) {
        bgmTitleEl.classList.add('scroll');
    } else {
        bgmTitleEl.classList.remove('scroll');
    }
}

export function togglePlayPause() {
    if (ytPlayer) {
        const state = ytPlayer.getPlayerState();
        if (state === (window as any).YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
        else ytPlayer.playVideo();
    }
}

export function initYouTube(userInteracted: () => boolean) {
    // Restore Saved Volume safely
    let savedVol = null;
    let savedMute = null;
    try {
        savedVol = localStorage.getItem('akari_bgm_volume');
        savedMute = localStorage.getItem('akari_bgm_muted');
    } catch (e) {}

    if (savedVol !== null && volumeSlider) {
        volumeSlider.value = savedVol;
        if (Number(savedVol) == 0 && bgmMute) bgmMute.className = 'fa-solid fa-volume-xmark';
    }
    if (savedMute === 'true' && bgmMute) {
        bgmMute.className = 'fa-solid fa-volume-xmark';
    }

    let originalPlaylist: string[] = [];
    let isPlaylistInit = false;

    const initPlaylist = () => {
        if (isPlaylistInit) return;
        if (!ytPlayer) return;
        try {
            const currentList = ytPlayer.getPlaylist();
            if (currentList && currentList.length > 0) {
                originalPlaylist = currentList;
                ytPlayer.setLoop(true);
                ytPlayer.setShuffle(isShuffle);
                isPlaylistInit = true;
                if (userInteracted()) ytPlayer.playVideo();
            }
        } catch (err) {}
    };

    // Expose to ui.ts
    (window as any).playBgm = () => {
        if (ytPlayer && ytPlayer.playVideo) {
            if (!isPlaylistInit) initPlaylist();
            ytPlayer.playVideo();
        }
    };
    (window as any).onYouTubeIframeAPIReady = () => {
        console.log('[YT] onYouTubeIframeAPIReady called!');
        const YT = (window as any).YT;
        ytPlayer = new YT.Player('yt-player-container', {
            height: '0', width: '0',
            playerVars: { 
                'autoplay': 0, 
                'controls': 0, 
                'disablekb': 1, 
                'fs': 0 
            },
            events: {
                'onReady': (e: any) => {
                    let savedIndex = 0;
                    let savedTime = 0;
                    let isMuted = false;
                    
                    try {
                        savedIndex = parseInt(localStorage.getItem('akari_bgm_original_index') || '0');
                        savedTime = parseFloat(localStorage.getItem('akari_bgm_time') || '0');
                        isMuted = localStorage.getItem('akari_bgm_muted') === 'true';
                    } catch (err) {}
                    
                    if (isNaN(savedIndex)) savedIndex = 0;
                    if (isNaN(savedTime)) savedTime = 0;
                    
                    e.target.cuePlaylist({
                        listType: 'playlist',
                        list: CONFIG.YOUTUBE_PLAYLIST_ID,
                        index: savedIndex,
                        startSeconds: savedTime
                    });
                    
                    if (volumeSlider) {
                        e.target.setVolume(Number(volumeSlider.value) * 100);
                    }
                    if (isMuted || (volumeSlider && Number(volumeSlider.value) == 0)) {
                        e.target.mute();
                    }
                    // Fallback in case CUED event doesn't fire reliably
                    setTimeout(initPlaylist, 1500);
                    setTimeout(() => {
                        if (!isPlaylistInit) {
                            console.warn('[YT] Playlist failed to init. Possible bad index. Retrying with index 0.');
                            try { localStorage.removeItem('akari_bgm_original_index'); } catch(e){}
                            e.target.cuePlaylist({
                                listType: 'playlist',
                                list: CONFIG.YOUTUBE_PLAYLIST_ID,
                                index: 0,
                                startSeconds: 0
                            });
                            setTimeout(initPlaylist, 1000);
                        }
                    }, 3000);
                },
                'onStateChange': (e: any) => {
                    if (e.data === (window as any).YT.PlayerState.CUED) {
                        initPlaylist();
                    } else if (e.data === (window as any).YT.PlayerState.PLAYING) {
                        updatePlayPauseUI(true);
                        ytDuration = ytPlayer.getDuration();
                        if (bgmDuration) bgmDuration.textContent = formatTime(ytDuration);
                        
                        const videoData = ytPlayer.getVideoData();
                        if (videoData) {
                            updateBgmTitle(videoData.title);
                            if (bgmCoverImg) bgmCoverImg.src = `https://i.ytimg.com/vi/${videoData.video_id}/maxresdefault.jpg`;
                            if ('mediaSession' in navigator) {
                                navigator.mediaSession.metadata = new MediaMetadata({
                                    title: videoData.title,
                                    artist: videoData.author || 'YouTube Music',
                                    artwork: [{ src: `https://i.ytimg.com/vi/${videoData.video_id}/maxresdefault.jpg`, sizes: '1280x720', type: 'image/jpeg' }]
                                });
                            }
                        }

                        const spinner = document.querySelector('.bgm-spin') as HTMLElement;
                        if(spinner) spinner.style.animationPlayState = 'running';
                        
                        if (ytInterval) clearInterval(ytInterval);
                        ytInterval = setInterval(() => {
                            const cur = ytPlayer.getCurrentTime() || 0;
                            const currentVideoData = ytPlayer.getVideoData();
                            
                            if (currentVideoData && currentVideoData.video_id) {
                                if (originalPlaylist && originalPlaylist.length > 0) {
                                    const origIdx = originalPlaylist.indexOf(currentVideoData.video_id);
                                    if (origIdx !== -1) {
                                        try { localStorage.setItem('akari_bgm_original_index', String(origIdx)); } catch (e) {}
                                    }
                                }
                                try { localStorage.setItem('akari_bgm_time', String(cur)); } catch (e) {}
                            }
                            
                            // Robust Repeat One: bypass ENDED event entirely
                            if (repeatState === 1 && ytDuration > 0 && (ytDuration - cur) <= 0.4) {
                                ytPlayer.seekTo(0, true);
                            }
                            
                            if (timelineSlider && !timelineSlider.matches(':active')) {
                                if (bgmCurrent) bgmCurrent.textContent = formatTime(cur);
                                const percent = ytDuration ? (cur / ytDuration) * 100 : 0;
                                timelineSlider.value = String(percent || 0);
                                timelineSlider.style.background = `linear-gradient(to right, var(--c-lavender) ${percent}%, rgba(255,255,255,0.1) ${percent}%)`;
                            }
                        }, 500);
                    } else {
                        updatePlayPauseUI(false);
                        const spinner = document.querySelector('.bgm-spin') as HTMLElement;
                        if(spinner) spinner.style.animationPlayState = 'paused';
                        
                        // We no longer manually handle ENDED for repeat because we use the time check bypass
                    }
                }
            }
        });
    };

    const ytScript = document.createElement('script');
    ytScript.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(ytScript);

    // Event Listeners
    if (bgmPrev) bgmPrev.addEventListener('click', () => { if (ytPlayer) ytPlayer.previousVideo(); });
    if (bgmNext) bgmNext.addEventListener('click', () => { if (ytPlayer) ytPlayer.nextVideo(); });
    if (bgmShuffle) {
        if (isShuffle) {
            bgmShuffle.classList.add('active');
            bgmShuffle.title = 'Shuffle: On';
            bgmShuffle.setAttribute('data-tippy-content', 'Shuffle: On');
            if ((bgmShuffle as any)._tippy) (bgmShuffle as any)._tippy.setContent('Shuffle: On');
        }
        bgmShuffle.addEventListener('click', () => {
            isShuffle = !isShuffle;
            bgmShuffle.classList.toggle('active', isShuffle);
            const newTitle = isShuffle ? 'Shuffle: On' : 'Shuffle: Off';
            bgmShuffle.title = newTitle;
            bgmShuffle.setAttribute('data-tippy-content', newTitle);
            if ((bgmShuffle as any)._tippy) (bgmShuffle as any)._tippy.setContent(newTitle);
            if (ytPlayer) ytPlayer.setShuffle(isShuffle);
        });
    }
    if (bgmRepeat) {
        // Default UI
        bgmRepeat.classList.add('active');
        bgmRepeat.title = 'Repeat: All';
        bgmRepeat.setAttribute('data-tippy-content', 'Repeat: All');
        if ((bgmRepeat as any)._tippy) (bgmRepeat as any)._tippy.setContent('Repeat: All');

        bgmRepeat.addEventListener('click', () => {
            repeatState = (repeatState + 1) % 3;
            let newTitle = '';
            
            if (repeatState === 0) {
                // Repeat All
                bgmRepeat.classList.add('active');
                newTitle = 'Repeat: All';
                bgmRepeat.innerHTML = '';
                if (ytPlayer) ytPlayer.setLoop(true);
            } else if (repeatState === 1) {
                // Repeat One
                bgmRepeat.classList.add('active');
                newTitle = 'Repeat: One';
                bgmRepeat.style.position = 'relative';
                bgmRepeat.innerHTML = '<span style="font-family: \'Plus Jakarta Sans\', sans-serif; font-size: 0.6em; font-weight: 900; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--c-bg);">1</span>';
                if (ytPlayer) ytPlayer.setLoop(true);
            } else {
                // Repeat Off
                bgmRepeat.classList.remove('active');
                newTitle = 'Repeat: Off';
                bgmRepeat.innerHTML = '';
                if (ytPlayer) ytPlayer.setLoop(false);
            }
            
            bgmRepeat.title = newTitle;
            bgmRepeat.setAttribute('data-tippy-content', newTitle);
            if ((bgmRepeat as any)._tippy) (bgmRepeat as any)._tippy.setContent(newTitle);
        });
    }

    if (bgmCoverBtn) bgmCoverBtn.addEventListener('click', togglePlayPause);
    if (bgmPlayPauseSmall) bgmPlayPauseSmall.addEventListener('click', togglePlayPause);

    if (bgmMute) {
        bgmMute.addEventListener('click', () => {
            let isMuted = false;
            if (ytPlayer) {
                if (ytPlayer.isMuted()) {
                    ytPlayer.unMute();
                    isMuted = false;
                    bgmMute.className = 'fa-solid fa-volume-high';
                } else {
                    ytPlayer.mute();
                    isMuted = true;
                    bgmMute.className = 'fa-solid fa-volume-xmark';
                }
            }
            try { localStorage.setItem('akari_bgm_muted', isMuted ? 'true' : 'false'); } catch (e) {}
        });
    }

    if (timelineSlider) {
        timelineSlider.addEventListener('input', (e: any) => {
            const percent = e.target.value;
            timelineSlider.style.background = `linear-gradient(to right, var(--c-lavender) ${percent}%, rgba(255,255,255,0.1) ${percent}%)`;
            if (ytPlayer) {
                ytPlayer.seekTo((percent / 100) * ytDuration, true);
            }
        });
    }

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e: any) => {
            const vol = e.target.value;
            try { localStorage.setItem('akari_bgm_volume', vol); } catch (err) {}
            let isMuted = vol == 0;
            if (ytPlayer) {
                ytPlayer.setVolume(vol * 100);
                if (isMuted) ytPlayer.mute(); else ytPlayer.unMute();
            }
            if (bgmMute) bgmMute.className = isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
            try { localStorage.setItem('akari_bgm_muted', isMuted ? 'true' : 'false'); } catch (err) {}
        });
    }

    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('play', () => { if (ytPlayer) ytPlayer.playVideo(); });
        navigator.mediaSession.setActionHandler('pause', () => { if (ytPlayer) ytPlayer.pauseVideo(); });
        navigator.mediaSession.setActionHandler('previoustrack', () => { if (ytPlayer) ytPlayer.previousVideo(); });
        navigator.mediaSession.setActionHandler('nexttrack', () => { if (ytPlayer) ytPlayer.nextVideo(); });
    }
}
