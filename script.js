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

entryScreen.addEventListener('click', () => {
    entryScreen.classList.add('hidden');
    mainContent.classList.remove('hidden');
    bgmPlayer.classList.add('visible', 'playing');
    audio.volume = volumeSlider.value;
    
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
        drawVisualizer();
    }
    if (audioContext.state === 'suspended') audioContext.resume();
    
    audio.play().catch(e => console.log("Audio play blocked", e));
});

bgmPlayPause.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        bgmPlayPause.classList.replace('fa-play', 'fa-pause');
        bgmPlayer.classList.add('playing');
    } else {
        audio.pause();
        bgmPlayPause.classList.replace('fa-pause', 'fa-play');
        bgmPlayer.classList.remove('playing');
    }
});

bgmMute.addEventListener('click', () => {
    audio.muted = !audio.muted;
    if (audio.muted) {
        bgmMute.classList.replace('fa-volume-high', 'fa-volume-xmark');
    } else {
        bgmMute.classList.replace('fa-volume-xmark', 'fa-volume-high');
    }
});

audio.addEventListener('loadedmetadata', () => {
    bgmDuration.textContent = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', () => {
    bgmCurrent.textContent = formatTime(audio.currentTime);
    const percent = (audio.currentTime / audio.duration) * 100;
    if (!timelineSlider.matches(':active')) {
        timelineSlider.value = percent || 0;
        timelineSlider.style.background = `linear-gradient(to right, var(--c-lavender) ${percent}%, rgba(255,255,255,0.1) ${percent}%)`;
    }
});

timelineSlider.addEventListener('input', (e) => {
    const percent = e.target.value;
    audio.currentTime = (percent / 100) * audio.duration;
    timelineSlider.style.background = `linear-gradient(to right, var(--c-lavender) ${percent}%, rgba(255,255,255,0.1) ${percent}%)`;
});

volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value;
    audio.muted = e.target.value == 0;
    if(audio.muted) bgmMute.classList.replace('fa-volume-high', 'fa-volume-xmark');
    else bgmMute.classList.replace('fa-volume-xmark', 'fa-volume-high');
});

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);
    if(!analyser) return;
    
    // Resize canvas dynamically to match CSS size
    visualizerCanvas.width = visualizerCanvas.clientWidth;
    visualizerCanvas.height = visualizerCanvas.clientHeight;
    
    analyser.getByteFrequencyData(dataArray);
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

// --- 3D Tilt Effect ---
const cardTilt = document.getElementById('card');
document.addEventListener('mousemove', (e) => {
    if (mainContent.classList.contains('hidden')) return;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const xAxis = (centerX - e.pageX) / 40;
    const yAxis = (centerY - e.pageY) / 40;
    cardTilt.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
});

// Reset tilt on mouseleave
document.addEventListener('mouseleave', () => {
    cardTilt.style.transition = 'transform 0.5s ease';
    cardTilt.style.transform = `perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)`;
    setTimeout(() => cardTilt.style.transition = 'none', 500);
});

// --- Custom Cursor ---
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorDot.style.left = `${mouseX}px`;
    cursorDot.style.top = `${mouseY}px`;
});

function animateCursor() {
    // Lerp (smooth follow)
    ringX += (mouseX - ringX) * 0.15;
    ringY += (mouseY - ringY) * 0.15;
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;
    requestAnimationFrame(animateCursor);
}
animateCursor();

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

function animateSakura() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < sakuraArray.length; i++) {
        sakuraArray[i].update();
        sakuraArray[i].draw();
    }
    requestAnimationFrame(animateSakura);
}
animateSakura();

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

    // Avatar
    const av = u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.${u.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256` : `avatar.jpg`;
    document.getElementById('avatar').src = av;
    document.getElementById('discord-avatar').src = av;

    // Status Dot & Text
    const s = d.discord_status || 'offline';
    document.getElementById('status-dot').style.backgroundColor = statusColors[s] || statusColors.offline;
    document.getElementById('discord-status-text').textContent = s.toUpperCase();
    document.getElementById('discord-status-text').style.color = statusColors[s] || statusColors.offline;

    // Custom Status (Type 4)
    const cs = d.activities?.find(a => a.type === 4);
    let txt = '';
    if (cs) {
        if (cs.emoji?.name) txt += cs.emoji.name + ' ';
        if (cs.state) txt += cs.state;
    }
    document.getElementById('discord-custom-status').textContent = txt || "Just chilling.";

    // Rich Presence Logic
    const activityCard = document.getElementById('activity-card-container');
    const spotifyBox = document.getElementById('spotify-box');
    const gameBox = document.getElementById('game-box');
    
    // Find a game/app activity (ignore Custom Status type 4)
    const gameActivity = d.activities?.find(a => a.type !== 4);

    if (d.spotify) {
        // Show Spotify
        activityCard.classList.remove('hidden');
        spotifyBox.classList.remove('hidden');
        gameBox.classList.add('hidden');
        
        document.getElementById('sp-art').src = d.spotify.album_art_url;
        document.getElementById('sp-song').textContent = d.spotify.song;
        document.getElementById('sp-artist').textContent = d.spotify.artist;
        
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
        if (gameActivity.timestamps?.start) {
            const startMs = gameActivity.timestamps.start;
            const updateTime = () => {
                const diff = Math.floor((Date.now() - startMs) / 1000);
                const h = Math.floor(diff / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = diff % 60;
                let txt = '';
                if (h > 0) txt += `${h}:`;
                txt += `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
                if (timeEl) timeEl.textContent = `${txt} elapsed`;
            };
            updateTime();
            window.rpInterval = setInterval(updateTime, 1000);
        } else {
            if (timeEl) timeEl.textContent = "";
        }
        
    } else {
        // No Activity -> Hide Card
        activityCard.classList.add('hidden');
    }
}

initLanyard();
