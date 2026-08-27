const DISCORD_ID = "834722078489968680";
const COUNTER_URL = "https://api.counterapi.dev/v1/akari310/v2/up";

// --- Entry Screen & Audio ---
const entryScreen = document.getElementById('entry');
const mainContent = document.getElementById('main');
const audio = document.getElementById('bg-audio');
const bgmPlayer = document.getElementById('bgm-player');
const bgmPlayPause = document.getElementById('bgm-play-pause');
const bgmMute = document.getElementById('bgm-mute');
const bgmCurrent = document.getElementById('bgm-current');
const bgmDuration = document.getElementById('bgm-duration');
const timelineSlider = document.getElementById('bgm-progress-slider');
const volumeSlider = document.getElementById('bgm-volume');
const visualizerCanvas = document.getElementById('audio-visualizer');
const visCtx = visualizerCanvas.getContext('2d');
let audioContext, analyser, source, dataArray;

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Restore Saved Volume
const savedVol = localStorage.getItem('akari_bgm_volume');
if (savedVol !== null) {
    volumeSlider.value = savedVol;
    audio.volume = savedVol;
    if (savedVol == 0) bgmMute.className = 'fa-solid fa-volume-xmark';
}

entryScreen.addEventListener('click', (e) => {
    entryScreen.classList.add('hidden');
    mainContent.classList.remove('hidden');
    bgmPlayer.classList.add('visible', 'playing');
    audio.volume = volumeSlider.value;
    createSparkles(e.clientX, e.clientY);
    
    // Init Audio Visualizer
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        source = audioContext.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(audioContext.destination);
        analyser.fftSize = 64;
        const bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
    }
    if (audioContext.state === 'suspended') audioContext.resume();
    
    audio.play().catch(e => console.log("Audio play blocked", e));
});

// --- Playlist & Audio System ---
const playlist = [
    { title: "Moshi Moshi Remix", type: "local", src: "assets/audio/bgm.webm", cover: "https://img.youtube.com/vi/ys7Gc6j_iG4/hqdefault.jpg" },
    { title: "Trên Tình Bạn Dưới Tình Yêu (Lofi)", type: "local", src: "assets/audio/IVOXMTInEoo.webm", cover: "https://img.youtube.com/vi/IVOXMTInEoo/hqdefault.jpg" },
    { title: "Em Khác Gì Hoa (Lofi)", type: "local", src: "assets/audio/Lacy9EGbH_M.webm", cover: "https://img.youtube.com/vi/Lacy9EGbH_M/hqdefault.jpg" },
    { title: "Nắng Có Mang Em Về", type: "local", src: "assets/audio/nnJNidtX5fE.webm", cover: "https://img.youtube.com/vi/nnJNidtX5fE/hqdefault.jpg" },
    { title: "Em Là Hoàng Hôn", type: "local", src: "assets/audio/zuyAOpISnao.webm", cover: "https://img.youtube.com/vi/zuyAOpISnao/hqdefault.jpg" }
];

let currentTrackIndex = 0;
const bgmPrev = document.getElementById('bgm-prev');
const bgmNext = document.getElementById('bgm-next');
const bgmTitleEl = document.querySelector('.bgm-title');
const bgmCoverImg = document.getElementById('bgm-cover-img');

function loadTrack(index, autoPlay = true) {
    if (index < 0) index = playlist.length - 1;
    if (index >= playlist.length) index = 0;
    currentTrackIndex = index;

    const track = playlist[currentTrackIndex];
    currentBgmMode = track.type;
    bgmTitleEl.textContent = track.title;
    bgmCoverImg.src = track.cover;

    timelineSlider.value = 0;
    bgmCurrent.textContent = "0:00";
    timelineSlider.style.background = `linear-gradient(to right, var(--c-lavender) 0%, rgba(255,255,255,0.1) 0%)`;

    if (track.type === 'local') {
        if (ytPlayer && ytPlayer.pauseVideo) ytPlayer.pauseVideo();
        audio.src = track.src;
        if (autoPlay) {
            audio.play().then(() => {
                bgmPlayPause.classList.replace('fa-play', 'fa-pause');
                bgmPlayer.classList.add('playing');
            }).catch(e => console.log("Play failed", e));
        }
    } else {
        if (!audio.paused) audio.pause();
        if (ytPlayer && ytPlayer.loadVideoById) {
            if (autoPlay) {
                ytPlayer.loadVideoById(track.vid);
            } else {
                ytPlayer.cueVideoById(track.vid);
            }
        } else {
            const check = setInterval(() => {
                if (ytPlayer && ytPlayer.loadVideoById) {
                    clearInterval(check);
                    if (autoPlay) ytPlayer.loadVideoById(track.vid);
                    else ytPlayer.cueVideoById(track.vid);
                }
            }, 300);
        }
    }
}

if (bgmPrev) bgmPrev.addEventListener('click', () => loadTrack(currentTrackIndex - 1, true));
if (bgmNext) bgmNext.addEventListener('click', () => loadTrack(currentTrackIndex + 1, true));

function extractVideoID(url) {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function playYouTubeAudio(vid, activity) {
    currentBgmMode = 'youtube';
    if (!audio.paused) audio.pause();
    
    bgmTitleEl.textContent = activity.details || activity.name;
    const coverSrc = document.getElementById('rp-large-img').src;
    bgmCoverImg.src = coverSrc;
    
    if (ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(vid);
    } else {
        const check = setInterval(() => {
            if (ytPlayer && ytPlayer.loadVideoById) {
                clearInterval(check);
                ytPlayer.loadVideoById(vid);
            }
        }, 500);
    }
}

let ytPlayer = null;
let currentBgmMode = 'local';
let ytDuration = 0;
let ytInterval = null;

function onYouTubeIframeAPIReady() {
    ytPlayer = new YT.Player('yt-player-container', {
        height: '0', width: '0',
        videoId: '',
        playerVars: { 'autoplay': 0, 'controls': 0, 'disablekb': 1, 'fs': 0 },
        events: {
            'onReady': (e) => {
                e.target.setVolume(volumeSlider.value * 100);
            },
            'onStateChange': (e) => {
                if (currentBgmMode !== 'youtube') return;
                
                if (e.data === YT.PlayerState.PLAYING) {
                    bgmPlayPause.classList.replace('fa-play', 'fa-pause');
                    bgmPlayer.classList.add('playing');
                    ytDuration = ytPlayer.getDuration();
                    bgmDuration.textContent = formatTime(ytDuration);
                    
                    if (ytInterval) clearInterval(ytInterval);
                    ytInterval = setInterval(() => {
                        if (currentBgmMode === 'youtube' && !timelineSlider.matches(':active')) {
                            const cur = ytPlayer.getCurrentTime() || 0;
                            bgmCurrent.textContent = formatTime(cur);
                            const percent = ytDuration ? (cur / ytDuration) * 100 : 0;
                            timelineSlider.value = percent;
                            timelineSlider.style.background = `linear-gradient(to right, var(--c-lavender) ${percent}%, rgba(255,255,255,0.1) ${percent}%)`;
                        }
                    }, 500);
                } else if (e.data === YT.PlayerState.PAUSED) {
                    bgmPlayPause.classList.replace('fa-pause', 'fa-play');
                    bgmPlayer.classList.remove('playing');
                } else if (e.data === YT.PlayerState.ENDED) {
                    // Auto-play next song in playlist
                    loadTrack(currentTrackIndex + 1, true);
                }
            }
        }
    });
}

const ytScript = document.createElement('script');
ytScript.src = "https://www.youtube.com/iframe_api";
document.head.appendChild(ytScript);

const bgmCoverBtn = document.getElementById('bgm-cover-btn');
bgmCoverBtn.addEventListener('click', () => {
    if (currentBgmMode === 'local') {
        if (audio.paused) {
            audio.play();
            bgmPlayPause.classList.replace('fa-play', 'fa-pause');
            bgmPlayer.classList.add('playing');
        } else {
            audio.pause();
            bgmPlayPause.classList.replace('fa-pause', 'fa-play');
            bgmPlayer.classList.remove('playing');
        }
    } else if (currentBgmMode === 'youtube' && ytPlayer) {
        const state = ytPlayer.getPlayerState();
        if (state === YT.PlayerState.PLAYING) ytPlayer.pauseVideo();
        else ytPlayer.playVideo();
    }
});

bgmMute.addEventListener('click', () => {
    if (currentBgmMode === 'local') {
        audio.muted = !audio.muted;
        bgmMute.className = audio.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
    } else if (currentBgmMode === 'youtube' && ytPlayer) {
        if (ytPlayer.isMuted()) {
            ytPlayer.unMute();
            bgmMute.className = 'fa-solid fa-volume-high';
        } else {
            ytPlayer.mute();
            bgmMute.className = 'fa-solid fa-volume-xmark';
        }
    }
});

audio.addEventListener('loadedmetadata', () => {
    if (currentBgmMode === 'local') bgmDuration.textContent = formatTime(audio.duration);
});

audio.addEventListener('play', () => {
    if (currentBgmMode === 'local') {
        bgmPlayPause.classList.replace('fa-play', 'fa-pause');
        bgmPlayer.classList.add('playing');
    }
});

audio.addEventListener('pause', () => {
    if (currentBgmMode === 'local') {
        bgmPlayPause.classList.replace('fa-pause', 'fa-play');
        bgmPlayer.classList.remove('playing');
    }
});

audio.addEventListener('ended', () => {
    if (currentBgmMode === 'local') loadTrack(currentTrackIndex + 1, true);
});

audio.addEventListener('timeupdate', () => {
    if (currentBgmMode !== 'local') return;
    bgmCurrent.textContent = formatTime(audio.currentTime);
    const percent = (audio.currentTime / audio.duration) * 100;
    if (!timelineSlider.matches(':active')) {
        timelineSlider.value = percent || 0;
        timelineSlider.style.background = `linear-gradient(to right, var(--c-lavender) ${percent}%, rgba(255,255,255,0.1) ${percent}%)`;
    }
});

timelineSlider.addEventListener('input', (e) => {
    const percent = e.target.value;
    timelineSlider.style.background = `linear-gradient(to right, var(--c-lavender) ${percent}%, rgba(255,255,255,0.1) ${percent}%)`;
    if (currentBgmMode === 'local') {
        audio.currentTime = (percent / 100) * audio.duration;
    } else if (currentBgmMode === 'youtube' && ytPlayer) {
        ytPlayer.seekTo((percent / 100) * ytDuration, true);
    }
});

volumeSlider.addEventListener('input', (e) => {
    const vol = e.target.value;
    localStorage.setItem('akari_bgm_volume', vol);
    if (currentBgmMode === 'local') {
        audio.volume = vol;
        audio.muted = vol == 0;
    } else if (currentBgmMode === 'youtube' && ytPlayer) {
        ytPlayer.setVolume(vol * 100);
        if (vol == 0) ytPlayer.mute(); else ytPlayer.unMute();
    }
    bgmMute.className = vol == 0 ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
});

function tickVisualizer() {
    if(!analyser) return;
    
    // Resize canvas dynamically to match CSS size
    visualizerCanvas.width = visualizerCanvas.clientWidth;
    visualizerCanvas.height = visualizerCanvas.clientHeight;
    
    if (currentBgmMode === 'local') {
        analyser.getByteFrequencyData(dataArray);
    } else {
        // Fake visualizer for YouTube
        const playing = ytPlayer && ytPlayer.getPlayerState() === YT.PlayerState.PLAYING;
        for(let i=0; i<dataArray.length; i++) {
            if (playing) {
                dataArray[i] = Math.max(0, Math.min(255, dataArray[i] + (Math.random() * 40 - 20)));
            } else {
                dataArray[i] = Math.max(0, dataArray[i] - 10);
            }
        }
    }
    
    visCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    
    const barWidth = (visualizerCanvas.width / dataArray.length) * 1.5;
    let barHeight;
    let x = 0;
    
    for(let i = 0; i < dataArray.length; i++) {
        barHeight = dataArray[i] / 2;
        visCtx.fillStyle = '#b4befe';
        visCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}

// --- Hacker Text Scramble Effect ---
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
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";

function scrambleText() {
    const targetText = quotes[Math.floor(Math.random() * quotes.length)].toUpperCase();
    let iterations = 0;
    
    const interval = setInterval(() => {
        scrambleEl.textContent = targetText.split("").map((letter, index) => {
            if(index < iterations) { return targetText[index]; }
            return letters[Math.floor(Math.random() * letters.length)];
        }).join("");
        
        if(iterations >= targetText.length){ 
            clearInterval(interval); 
            setTimeout(scrambleText, 4000); // Wait 4s then scramble to next
        }
        iterations += 1 / 3;
    }, 30);
}
scrambleText();

// --- View Counter ---
async function updateViews() {
    const viewCountEl = document.getElementById('view-count');
    let localViews = parseInt(localStorage.getItem('akari_views_v3') || "0");
    try {
        const res = await fetch(COUNTER_URL);
        const data = await res.json();
        let serverCount = typeof data === 'number' ? data : data?.count || data?.value;
        if (serverCount) {
            viewCountEl.textContent = serverCount.toLocaleString();
            localStorage.setItem('akari_views_v3', serverCount);
        } else throw new Error("Invalid response");
    } catch (err) {
        localViews++;
        localStorage.setItem('akari_views_v3', localViews);
        viewCountEl.textContent = localViews.toLocaleString();
    }
}
updateViews();

// --- 3D Tilt Effect & Hologram Glare ---
const cardTilt = document.getElementById('card');
const hologramGlare = document.getElementById('hologram-glare');

function handleTilt(e) {
    if (mainContent.classList.contains('hidden')) return;
    const clientX = e.touches ? e.touches[0].clientX : e.pageX;
    const clientY = e.touches ? e.touches[0].clientY : e.pageY;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const xAxis = (centerX - clientX) / 35;
    const yAxis = (centerY - clientY) / 35;
    cardTilt.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;

    // Move Hologram reflection
    if (hologramGlare) {
        const posX = 50 + xAxis * 2.5;
        const posY = 50 + yAxis * 2.5;
        hologramGlare.style.backgroundPosition = `${posX}% ${posY}%`;
    }
}
document.addEventListener('mousemove', handleTilt);
document.addEventListener('touchmove', handleTilt);

// Reset tilt on mouseleave or touchend
function resetTilt() {
    cardTilt.style.transition = 'transform 0.5s ease';
    cardTilt.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)`;
    if (hologramGlare) hologramGlare.style.backgroundPosition = `50% 50%`;
    setTimeout(() => cardTilt.style.transition = 'none', 500);
}
document.addEventListener('mouseleave', resetTilt);
document.addEventListener('touchend', resetTilt);

// --- Multi-Tabs Switcher ---
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.classList.add('active');
    });
});

// --- Easter Egg: 5 Clicks on Avatar (Rainbow Rave Mode) ---
const avatarWrapper = document.getElementById('avatar-wrapper');
const cardBorder = document.getElementById('card-border');
let avatarClickCount = 0;
let avatarClickTimer = null;

if (avatarWrapper) {
    avatarWrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        avatarClickCount++;
        createSparkles(e.clientX, e.clientY);

        clearTimeout(avatarClickTimer);
        avatarClickTimer = setTimeout(() => {
            avatarClickCount = 0;
        }, 2000);

        if (avatarClickCount === 5) {
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

// --- Anonymous Message Form Handler ---
const anonForm = document.getElementById('anonymous-form');
if (anonForm) {
    anonForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('anon-name').value.trim() || "Anonymous";
        const msg = document.getElementById('anon-msg').value.trim();
        const submitBtn = document.getElementById('anon-submit-btn');

        if (!msg) return;

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sending...`;

        const p1 = "aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTU0MjU2NzI1NzIwNzQ3NjI3Ng==";
        const p2 = "L3Y2VFVXTkltRGhCWTdCLVNpdVBSalNpVHJZTnVvMm9IendTaWVzSjE1cTdYa0pjMTZya2NIelRZX2NrVFhxZnBvOERY";
        const WEBHOOK_URL = atob(p1) + atob(p2);
        
        const payload = {
            embeds: [{
                title: "💌 Thư nặc danh mới!",
                color: 13346551, // Hex 0xcba6f7 (Catppuccin Mauve)
                fields: [
                    { name: "👤 Người gửi", value: name, inline: true },
                    { name: "⏰ Thời gian", value: new Date().toLocaleString('vi-VN'), inline: true },
                    { name: "💬 Lời nhắn", value: msg }
                ],
                footer: { text: "Gửi từ akari310 bio-link" }
            }]
        };

        fetch(WEBHOOK_URL, {
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
        }).catch(err => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Send Message`;
            showToast(`❌ Network Error! Cannot reach the server.`);
        });
    });
}

// --- Custom Cursor ---
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;
let dotX = 0, dotY = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function tickCursor() {
    // Instant dot (synced with screen refresh)
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;

    // Lerp ring
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;
}

// --- Sakura Particles ---
const canvas = document.getElementById('mouse-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let sakuraArray = [];
for (let i = 0; i < 40; i++) {
    sakuraArray.push(new Sakura());
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

function Sakura() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height - canvas.height;
    this.size = Math.random() * 3 + 2;
    this.speedY = Math.random() * 1 + 0.5;
    this.speedX = Math.random() * 2 - 1;
    this.angle = Math.random() * 360;
    this.spin = Math.random() * 0.05 - 0.025;
    // Sakura petal colors (red/pink/white)
    const colors = ['#f38ba8', '#f5c2e7', '#ffffff'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
}

Sakura.prototype.update = function() {
    this.y += this.speedY;
    this.x += this.speedX + Math.sin(this.angle) * 0.5;
    this.angle += this.spin;
    
    if (this.y > canvas.height) {
        this.y = -10;
        this.x = Math.random() * canvas.width;
    }
}

Sakura.prototype.draw = function() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    // Draw a petal shape
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-this.size, -this.size, -this.size, this.size, 0, this.size);
    ctx.bezierCurveTo(this.size, this.size, this.size, -this.size, 0, 0);
    ctx.fill();
    ctx.restore();
}

function tickSakura() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < sakuraArray.length; i++) {
        sakuraArray[i].update();
        sakuraArray[i].draw();
    }
}

// --- Click Sparkles Particles ---
let sparkleArray = [];
class Sparkle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.size = Math.random() * 3 + 2;
        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.02;
        const colors = ['#cba6f7', '#b4befe', '#74c7ec', '#f5c2e7', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.08; // light gravity
        this.alpha -= this.decay;
        this.size *= 0.95;
    }
    draw() {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.alpha);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function createSparkles(x, y) {
    for (let i = 0; i < 18; i++) {
        sparkleArray.push(new Sparkle(x, y));
    }
}

window.addEventListener('click', (e) => {
    createSparkles(e.clientX, e.clientY);
});

function tickSparkles() {
    for (let i = sparkleArray.length - 1; i >= 0; i--) {
        sparkleArray[i].update();
        sparkleArray[i].draw();
        if (sparkleArray[i].alpha <= 0 || sparkleArray[i].size <= 0.5) {
            sparkleArray.splice(i, 1);
        }
    }
}

// --- Toast Notification & Click-to-Copy ---
const toast = document.getElementById('toast');
let toastTimeout;
function showToast(message) {
    if (!toast) return;
    toast.innerHTML = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

document.querySelectorAll('.social-icon[data-copy]').forEach(icon => {
    icon.addEventListener('click', (e) => {
        const textToCopy = icon.getAttribute('data-copy');
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                showToast(`<i class="fa-solid fa-circle-check" style="color: var(--c-green);"></i> Copied <b>${textToCopy}</b> to clipboard!`);
            }).catch(() => {});
        }
    });
});

// --- Main Animation Loop ---
function mainLoop() {
    requestAnimationFrame(mainLoop);
    tickVisualizer();
    tickCursor();
    tickSakura();
    tickSparkles();
}
mainLoop();

// --- Lanyard API ---
const statusColors = { online: '#a6da95', idle: '#f9e2af', dnd: '#f38ba8', offline: '#a6adc8' };

async function initLanyard() {
    try {
        const res = await fetch(`https://api.lanyard.rest/v1/users/${DISCORD_ID}`);
        const json = await res.json();
        if (json.success) {
            updatePresence(json.data);
            connectWS();
        }
    } catch (e) { console.error("Lanyard init failed", e); }
}

function connectWS() {
    const ws = new WebSocket('wss://api.lanyard.rest/socket');
    let hb;
    ws.onopen = () => ws.send(JSON.stringify({ op: 2, d: { subscribe_to_id: DISCORD_ID } }));
    ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.op === 1) hb = setInterval(() => ws.send(JSON.stringify({ op: 3 })), msg.d.heartbeat_interval);
        if (msg.t === 'INIT_STATE' || msg.t === 'PRESENCE_UPDATE') updatePresence(msg.d);
    };
    ws.onclose = () => { clearInterval(hb); setTimeout(connectWS, 5000); };
}

function updatePresence(d) {
    if (!d?.discord_user) return;
    const u = d.discord_user;

    const activityCard = document.getElementById('activity-card-container');
    const spotifyBox = document.getElementById('spotify-box');
    const gameBox = document.getElementById('game-box');
    const infoBox = document.querySelector('.activity-box');

    // Add fade out transition
    if (activityCard) activityCard.classList.add('fade-transition');
    if (infoBox) infoBox.classList.add('fade-transition');

    setTimeout(() => {
        // Avatar
        const av = u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256` : `https://cdn.discordapp.com/embed/avatars/0.png`;
        document.getElementById('avatar').src = av;
        document.getElementById('discord-avatar').src = av;

        // Status Dot & Text
        const s = d.discord_status || 'offline';
        document.getElementById('status-dot').style.backgroundColor = statusColors[s] || statusColors.offline;
        document.getElementById('discord-status-text').textContent = s.toUpperCase();
        document.getElementById('discord-status-text').style.color = statusColors[s] || statusColors.offline;

        // Remove skeleton loader classes
        document.querySelectorAll('.skeleton').forEach(el => {
            el.classList.remove('skeleton');
            if (el.style.width) el.style.width = 'auto';
            if (el.style.height) el.style.height = 'auto';
        });

        // Custom Status (Type 4) with Custom Emoji support
        const cs = d.activities?.find(a => a.type === 4);
        const customStatusEl = document.getElementById('discord-custom-status');
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

        // Rich Presence Logic
        // Find a game/app activity (ignore Custom Status type 4)
        const gameActivity = d.activities?.find(a => a.type !== 4);

    if (window.spotifyInterval) clearInterval(window.spotifyInterval);

    if (d.spotify) {
        // Show Spotify
        activityCard.classList.remove('hidden');
        spotifyBox.classList.remove('hidden');
        gameBox.classList.add('hidden');
        
        document.getElementById('sp-art').src = d.spotify.album_art_url;
        document.getElementById('sp-song').textContent = d.spotify.song;
        document.getElementById('sp-artist').textContent = d.spotify.artist;
        
        // Real-time Spotify Progress
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
            window.spotifyInterval = setInterval(updateSpotify, 1000);
        }
        
    } else if (gameActivity) {
        // Show Game / App
        activityCard.classList.remove('hidden');
        gameBox.classList.remove('hidden');
        spotifyBox.classList.add('hidden');
        
        // Dynamic Header based on Activity Type
        const rpHeader = document.getElementById('rp-header');
        let headerHTML = '<i class="fa-solid fa-gamepad"></i> PLAYING A GAME';
        if (gameActivity.type === 1) headerHTML = '<i class="fa-solid fa-video"></i> STREAMING';
        else if (gameActivity.type === 2) headerHTML = '<i class="fa-solid fa-music"></i> LISTENING TO MUSIC';
        else if (gameActivity.type === 3) headerHTML = '<i class="fa-solid fa-tv"></i> WATCHING';
        else if (gameActivity.type === 5) headerHTML = '<i class="fa-solid fa-trophy"></i> COMPETING';
        
        rpHeader.innerHTML = headerHTML;
        
        document.getElementById('rp-name').textContent = gameActivity.name || "Unknown";
        document.getElementById('rp-details').textContent = gameActivity.details || "";
        document.getElementById('rp-state').textContent = gameActivity.state || "";
        
        // Large Image
        const lImg = document.getElementById('rp-large-img');
        lImg.onerror = function() {
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
            lImg.src = av; // Fallback to avatar
        }
        
        // Small Image
        const sImg = document.getElementById('rp-small-img');
        sImg.onerror = function() { this.classList.add('hidden'); };
        
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

        // Timer
        if (window.rpInterval) clearInterval(window.rpInterval);
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
            window.rpInterval = setInterval(updateTime, 1000);
        } else {
            if (timeEl) timeEl.textContent = "";
        }
        
        // Buttons
        const buttonsContainer = document.getElementById('rp-buttons');
        if (gameActivity.buttons && gameActivity.buttons.length > 0) {
            if (buttonsContainer) {
                buttonsContainer.classList.remove('hidden');
                buttonsContainer.innerHTML = '';
                gameActivity.buttons.slice(0, 2).forEach(btnText => {
                    const btn = document.createElement('a');
                    btn.className = 'rp-button';
                    btn.textContent = btnText;
                    btn.target = "_blank";
                    
                    let url = null;
                    const textLower = btnText.toLowerCase();
                    const isListen = textLower.includes("listen") || textLower.includes("play") || textLower.includes("watch");
                    if (isListen) {
                        url = gameActivity.details_url || gameActivity.state_url;
                    } else if (textLower.includes("artist") || textLower.includes("channel") || textLower.includes("creator")) {
                        url = gameActivity.state_url || gameActivity.details_url;
                    }
                    
                    if (url) {
                        btn.href = url;
                        if (isListen) {
                            const vid = extractVideoID(url);
                            if (vid) {
                                btn.onclick = (e) => {
                                    e.preventDefault();
                                    playYouTubeAudio(vid, gameActivity);
                                };
                            }
                        }
                    } else {
                        btn.onclick = () => alert("This button's link is hidden by Discord API.");
                    }
                    
                    buttonsContainer.appendChild(btn);
                });
            }
        } else {
            if (buttonsContainer) buttonsContainer.classList.add('hidden');
        }
        
    } else {
        // No Activity -> Hide Card
        activityCard.classList.add('hidden');
    }

    // Remove fade out transition to show updated content
    requestAnimationFrame(() => {
        if (activityCard) activityCard.classList.remove('fade-transition');
        if (infoBox) infoBox.classList.remove('fade-transition');
    });
    }, 300); // 300ms transition time
}

initLanyard();
