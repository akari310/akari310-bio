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
const bgmProgressFill = document.getElementById('bgm-progress-fill');
const bgmProgressContainer = document.getElementById('bgm-progress-container');

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
    audio.volume = 0.3;
    audio.play().catch(e => console.log("Audio play blocked by browser", e));
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
    bgmProgressFill.style.width = `${percent}%`;
});

bgmProgressContainer.addEventListener('click', (e) => {
    const rect = bgmProgressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * audio.duration;
});

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
    let localViews = parseInt(localStorage.getItem('akari_views') || "2400");
    try {
        const res = await fetch(COUNTER_URL);
        const data = await res.json();
        let serverCount = typeof data === 'number' ? data : data?.count || data?.value;
        if (serverCount) {
            viewCountEl.textContent = serverCount.toLocaleString();
            localStorage.setItem('akari_views', serverCount);
        } else throw new Error("Invalid response");
    } catch (err) {
        localViews++;
        localStorage.setItem('akari_views', localViews);
        viewCountEl.textContent = localViews.toLocaleString();
    }
}
updateViews();

// --- 3D Tilt Effect ---
const cardTilt = document.getElementById('card');
document.addEventListener('mousemove', (e) => {
    if (mainContent.classList.contains('hidden')) return;
    const xAxis = (window.innerWidth / 2 - e.pageX) / 40;
    const yAxis = (window.innerHeight / 2 - e.pageY) / 40;
    cardTilt.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg) translateZ(20px)`;
});

// Reset tilt on mouseleave
document.addEventListener('mouseleave', () => {
    cardTilt.style.transition = 'transform 0.5s ease';
    cardTilt.style.transform = `rotateY(0deg) rotateX(0deg) translateZ(0px)`;
    setTimeout(() => cardTilt.style.transition = 'none', 500);
});

// --- Mouse Canvas Trail (Ribbon/Stars) ---
const canvas = document.getElementById('mouse-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let particlesArray = [];
const mouse = { x: null, y: null };

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
    for (let i = 0; i < 2; i++) {
        particlesArray.push(new Particle());
    }
});
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

class Particle {
    constructor() {
        this.x = mouse.x;
        this.y = mouse.y;
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        // Lavender & Blue hues
        this.color = Math.random() > 0.5 ? '#b4befe' : '#89b4fa';
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.size > 0.1) this.size -= 0.05;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function animateCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
        if (particlesArray[i].size <= 0.1) {
            particlesArray.splice(i, 1);
            i--;
        }
    }
    requestAnimationFrame(animateCanvas);
}
animateCanvas();

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

    // Custom Status
    const cs = d.activities?.find(a => a.type === 4);
    let txt = '';
    if (cs) {
        if (cs.emoji?.name) txt += cs.emoji.name + ' ';
        if (cs.state) txt += cs.state;
    }
    document.getElementById('discord-custom-status').textContent = txt || "Just chilling.";

    // Spotify Activity
    const spotifyBox = document.getElementById('spotify-box');
    if (d.spotify) {
        spotifyBox.classList.remove('hidden');
        document.getElementById('sp-art').src = d.spotify.album_art_url;
        document.getElementById('sp-song').textContent = d.spotify.song;
        document.getElementById('sp-artist').textContent = d.spotify.artist;
    } else {
        spotifyBox.classList.add('hidden');
    }
}

initLanyard();
