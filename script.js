// ===== MATRIX BACKGROUND =====
const canvas = document.getElementById('cyberCanvas');
const ctx = canvas.getContext('2d');
let fontSize = 16, columns, drops;

function initMatrix() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
}
window.addEventListener('resize', initMatrix);
initMatrix();

setInterval(() => {
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00ff41";
    ctx.font = fontSize + "px monospace";

    drops.forEach((y, i) => {
        const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%".charAt(Math.random() * 40 | 0);
        ctx.fillText(t, i * fontSize, y * fontSize);
        drops[i] = y * fontSize > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
    });
}, 50);

// ===== SOUND SYSTEM =====
const sounds = {
    start: new Audio('sounds/mixkit-sci-fi-click-900.wav'),
    correct: new Audio('sounds/mixkit-digital-quick-tone-2866.wav'),
    wrong: new Audio('sounds/mixkit-sci-fi-error-alert-898.wav'),
    timeout: new Audio('sounds/mixkit-alarm-digital-clock-beep-989.wav'),
    finish: new Audio('sounds/mixkit-completion-of-a-level-2063.wav')
};
Object.values(sounds).forEach(s => s.volume = 0.35);
const playSound = s => { s.currentTime = 0; s.play(); };

// ===== DOM =====
const qEl = document.getElementById('question-text');
const inEl = document.getElementById('answer-input');
const btn = document.getElementById('action-btn');
const feed = document.getElementById('feedback-msg');
const reveal = document.getElementById('correct-reveal');
const box = document.querySelector('.ace-container');
const timerEl = document.getElementById('main-timer');
const progressEl = document.getElementById('progress-tag');

// ===== GAME STATE =====
let solved = 0, correct = 0, wrong = 0, streak = 0;
let currentAnswer, active = false, finished = false;
let correctTimes = [], points = 0;

// Batas soal per mode
const maxQuestions = { easy: 5, medium: 10, hard: 15 };
// Reward per mode
const rewardPoints = { easy: 50, medium: 500, hard: 1000 };

// ===== MODE BUTTONS =====
let mode = "medium";
document.querySelectorAll('.mode-select button').forEach(btnMode => {
    btnMode.onclick = () => {
        document.querySelectorAll('.mode-select button').forEach(b => b.classList.remove('active'));
        btnMode.classList.add('active');
        mode = btnMode.dataset.mode;
    };
});

// ===== TIMER FORMAT =====
function formatTime(t) {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ===== GLOBAL TIMER =====
let globalTime = 10 * 60, globalInterval;
function startGlobalTimer() {
    timerEl.innerText = formatTime(globalTime);
    globalInterval = setInterval(() => {
        if (!active) return;
        globalTime--;
        timerEl.innerText = formatTime(globalTime);
        if (globalTime <= 10) timerEl.classList.add('danger');
        if (globalTime <= 0) finish();
    }, 1000);
}

// ===== QUESTION TIMER =====
let questionTime = 60, questionInterval;
function startQuestionTimer() {
    clearInterval(questionInterval);
    questionTime = 60;
    questionInterval = setInterval(() => {
        questionTime--;
        if (questionTime === 5) {
            feed.innerText = "⚠️ WAKTU ANDA 5 DETIK LAGI";
            feed.classList.add('warning');
            playSound(sounds.timeout);
        }
        if (questionTime <= 0) {
            clearInterval(questionInterval);
            wrong++; streak = 0; solved++;
            feed.innerText = "TIME OUT";
            reveal.innerText = `EXPECTED: ${currentAnswer}`;
            box.classList.add('wrong');
            setTimeout(() => box.classList.remove('wrong'), 300);
            setTimeout(nextQuestion, 800);
        }
    }, 1000);
}

// ===== QUESTION GENERATOR =====
function generateQuestion() {
    let a, b, c;
    if (mode === "easy") { a = rand(10, 30); b = rand(1, 20); c = rand(0, 10); }
    else if (mode === "hard") { a = rand(100, 300); b = rand(50, 150); c = rand(10, 80); }
    else { a = rand(30, 80); b = rand(10, 50); c = rand(5, 30); }
    return { text: `${a} + ${b} - ${c}`, answer: a + b - c };
}
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ===== STAR ANIMATION =====
function spawnStar() {
    const star = document.createElement('div');
    star.className = 'star-fly';
    star.style.left = `${Math.random() * (window.innerWidth - 20)}px`;
    star.style.top = `${window.innerHeight - 50}px`;
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 1000);
}

// ===== NEXT QUESTION =====
function nextQuestion() {
    if (solved >= maxQuestions[mode]) return finish();

    feed.innerText = ''; feed.classList.remove('warning'); reveal.innerText = '';

    const q = generateQuestion();
    qEl.innerText = q.text;
    currentAnswer = q.answer;

    inEl.value = ''; inEl.focus();
    progressEl.innerText = `MODE ${mode.toUpperCase()} • SOAL ${solved + 1}/${maxQuestions[mode]}`;

    startQuestionTimer();
}

// ===== SUBMIT =====
function submit() {
    if (!active) return;
    const val = parseInt(inEl.value); if (isNaN(val)) return;
    clearInterval(questionInterval);

    if (val === currentAnswer) {
        playSound(sounds.correct);
        correct++; streak++; points += rewardPoints[mode];
        correctTimes.push(60 - questionTime);
        feed.innerText = `ACCESS GRANTED x${streak} (+${rewardPoints[mode]} pts)`;
        box.classList.add('correct'); setTimeout(() => box.classList.remove('correct'), 300);
        spawnStar(); // animasi bintang
    } else {
        playSound(sounds.wrong); wrong++; streak = 0;
        feed.innerText = "ACCESS DENIED"; reveal.innerText = `EXPECTED: ${currentAnswer}`;
        box.classList.add('wrong'); setTimeout(() => box.classList.remove('wrong'), 300);
    }
    solved++;
    setTimeout(nextQuestion, 700);
}

// ===== START =====
function start() {
    if (active) return;
    active = true; finished = false;
    solved = correct = wrong = streak = 0; correctTimes = []; points = 0; globalTime = 10 * 60;
    playSound(sounds.start);
    btn.innerText = "ENTER"; btn.onclick = submit; inEl.disabled = false;
    startGlobalTimer(); nextQuestion();
}

// ===== FINISH =====
function finish() {
    if (finished) return;
    finished = true; active = false;
    clearInterval(globalInterval); clearInterval(questionInterval);
    playSound(sounds.finish);

    document.getElementById('result-overlay').style.display = 'flex';
    document.getElementById('res-correct').innerText = correct;
    document.getElementById('res-wrong').innerText = wrong;
    const avg = correctTimes.length ? (correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length).toFixed(2) : "0.00";
    document.getElementById('res-avg-correct').innerText = `${avg}s`;
    document.getElementById('log-list').innerHTML = correctTimes.map((t, i) => `LOG_${i + 1}: <span style="color:#00ff41">${t.toFixed(2)}s</span>`).join('<br>');

    const percent = solved > 0 ? (correct / solved) * 100 : 0;
    let stars = 0;
    if (percent >= 90) stars = 3;
    else if (percent >= 75) stars = 2;
    else if (percent >= 50) stars = 1;

    const starSymbols = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    const rewardEl = document.createElement('div');
    rewardEl.style.marginTop = "10px";
    rewardEl.innerHTML = `TOTAL POINTS: <b style="color:#00ff41">${points}</b> <br> BINTANG: <span style="color:gold;font-size:1.2rem">${starSymbols}</span>`;
    document.getElementById('log-list').appendChild(rewardEl);
}

// ===== EVENTS =====
btn.onclick = start;
inEl.addEventListener('keydown', e => e.key === 'Enter' && submit());
