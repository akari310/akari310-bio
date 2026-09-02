import { ytPlayer } from './youtube';

// --- Audio Visualizer ---
const visualizerCanvas = document.getElementById('audio-visualizer') as HTMLCanvasElement;
const visCtx = visualizerCanvas ? visualizerCanvas.getContext('2d') : null;

export function tickVisualizer() {
    if(!visualizerCanvas || !visCtx) return;
    visualizerCanvas.width = visualizerCanvas.clientWidth;
    visualizerCanvas.height = visualizerCanvas.clientHeight;
    
    let isActuallyPlaying = false;
    if (ytPlayer && ytPlayer.getPlayerState && ytPlayer.getPlayerState() === (window as any).YT.PlayerState.PLAYING) {
        if (!ytPlayer.isMuted()) {
            isActuallyPlaying = true;
        }
    }
    
    if (!(window as any).fakeDataArray) {
        (window as any).fakeDataArray = new Uint8Array(64);
    }
    
    for(let i=0; i<(window as any).fakeDataArray.length; i++) {
        if (isActuallyPlaying) {
            (window as any).fakeDataArray[i] = Math.max(0, Math.min(255, (window as any).fakeDataArray[i] + (Math.random() * 40 - 20)));
        } else {
            (window as any).fakeDataArray[i] = Math.max(0, (window as any).fakeDataArray[i] - 10);
        }
    }
    
    visCtx.clearRect(0, 0, visualizerCanvas.width, visualizerCanvas.height);
    const barWidth = (visualizerCanvas.width / (window as any).fakeDataArray.length) * 1.5;
    let barHeight;
    let x = 0;
    
    for(let i = 0; i < (window as any).fakeDataArray.length; i++) {
        barHeight = (window as any).fakeDataArray[i] / 2;
        visCtx.fillStyle = '#b4befe';
        visCtx.fillRect(x, visualizerCanvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
    }
}

// --- Custom Cursor ---
const cursorDot = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function tickCursor() {
    if (cursorDot) {
        cursorDot.style.left = `${mouseX}px`;
        cursorDot.style.top = `${mouseY}px`;
    }
    if (cursorRing) {
        ringX += (mouseX - ringX) * 0.15;
        ringY += (mouseY - ringY) * 0.15;
        cursorRing.style.left = `${ringX}px`;
        cursorRing.style.top = `${ringY}px`;
    }
}

// --- Sakura Particles ---
const mouseCanvas = document.getElementById('mouse-canvas') as HTMLCanvasElement;
const mCtx = mouseCanvas ? mouseCanvas.getContext('2d') : null;

if (mouseCanvas) {
    mouseCanvas.width = window.innerWidth;
    mouseCanvas.height = window.innerHeight;
    window.addEventListener('resize', () => {
        mouseCanvas.width = window.innerWidth;
        mouseCanvas.height = window.innerHeight;
    });
}

let sakuraArray: Sakura[] = [];

class Sakura {
    x: number;
    y: number;
    size: number;
    speedY: number;
    speedX: number;
    angle: number;
    spin: number;
    color: string;

    constructor() {
        this.x = Math.random() * (mouseCanvas?.width || 0);
        this.y = Math.random() * (mouseCanvas?.height || 0) - (mouseCanvas?.height || 0);
        this.size = Math.random() * 3 + 2;
        this.speedY = Math.random() * 1 + 0.5;
        this.speedX = Math.random() * 2 - 1;
        this.angle = Math.random() * 360;
        this.spin = Math.random() * 0.05 - 0.025;
        const colors = ['#f38ba8', '#f5c2e7', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.angle) * 0.5;
        this.angle += this.spin;
        
        if (this.y > (mouseCanvas?.height || 0)) {
            this.y = -10;
            this.x = Math.random() * (mouseCanvas?.width || 0);
        }
    }

    draw() {
        if (!mCtx) return;
        mCtx.save();
        mCtx.translate(this.x, this.y);
        mCtx.rotate(this.angle);
        mCtx.fillStyle = this.color;
        mCtx.beginPath();
        mCtx.moveTo(0, 0);
        mCtx.bezierCurveTo(-this.size, -this.size, -this.size, this.size, 0, this.size);
        mCtx.bezierCurveTo(this.size, this.size, this.size, -this.size, 0, 0);
        mCtx.fill();
        mCtx.restore();
    }
}

export function initSakura() {
    for (let i = 0; i < 40; i++) {
        sakuraArray.push(new Sakura());
    }
}

function tickSakura() {
    if (!mCtx || !mouseCanvas) return;
    mCtx.clearRect(0, 0, mouseCanvas.width, mouseCanvas.height);
    for (let i = 0; i < sakuraArray.length; i++) {
        sakuraArray[i].update();
        sakuraArray[i].draw();
    }
}

// --- Click Sparkles Particles ---
let sparkleArray: Sparkle[] = [];
class Sparkle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
    decay: number;
    color: string;

    constructor(x: number, y: number) {
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
        this.vy += 0.08; 
        this.alpha -= this.decay;
        this.size *= 0.95;
    }
    draw() {
        if (!mCtx) return;
        mCtx.save();
        mCtx.globalAlpha = Math.max(0, this.alpha);
        mCtx.fillStyle = this.color;
        mCtx.shadowColor = this.color;
        mCtx.shadowBlur = 8;
        mCtx.beginPath();
        mCtx.arc(this.x, this.y, Math.max(0.5, this.size), 0, Math.PI * 2);
        mCtx.fill();
        mCtx.restore();
    }
}

export function createSparkles(x: number, y: number) {
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

// --- Main Animation Loop ---
let animationPaused = false;
let animFrameId: any = null;

export function isReducedMotion(): boolean {
    return document.body.classList.contains('reduced-motion');
}

function mainLoop() {
    if (animationPaused || isReducedMotion()) { animFrameId = null; return; }
    animFrameId = requestAnimationFrame(mainLoop);
    tickVisualizer();
    tickCursor();
    tickSakura();
    tickSparkles();
}

export function startAnimLoop() {
    if (!animFrameId && !animationPaused && !isReducedMotion()) {
        animFrameId = requestAnimationFrame(mainLoop);
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        animationPaused = true;
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    } else {
        animationPaused = false;
        startAnimLoop();
    }
});
