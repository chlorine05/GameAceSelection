// ===== MATRIX BACKGROUND =====
const canvas = document.getElementById('cyberCanvas');
const ctx = canvas.getContext('2d');
let fontSize = 16, columns, drops;

function initMatrix() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
        const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%".charAt(Math.floor(Math.random() * 40));
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
Object.values(sounds).forEach(s => { s.volume = 0.35; s.preload = 'auto'; });
const playSound = s => { s.currentTime = 0; s.play().catch(() => { }); };

// ===== DOM ELEMENTS =====
const qEl = document.getElementById('question-text');
const inEl = document.getElementById('answer-input');
const btn = document.getElementById('action-btn');
const feed = document.getElementById('feedback-msg');
const reveal = document.getElementById('correct-reveal');
const box = document.querySelector('.ace-container');
const timerEl = document.getElementById('main-timer');
const qTimerEl = document.getElementById('question-timer');
const progressEl = document.getElementById('progress-tag');

// ===== GAME STATE =====
let solved = 0, correct = 0, wrong = 0, streak = 0;
let currentAnswer, active = false, finished = false;
let correctTimes = [], points = 0;

// ===== CONFIG =====
const maxQuestions = { easy: 10, medium: 15, hard: 20 };
const rewardPoints = { easy: 50, medium: 500, hard: 1000 };
let mode = "medium";

// ===== MODE BUTTONS =====
document.querySelectorAll('.mode-select button').forEach(btnMode => {
    btnMode.onclick = () => {
        if (active) return;
        document.querySelectorAll('.mode-select button').forEach(b => b.classList.remove('active'));
        btnMode.classList.add('active');
        mode = btnMode.dataset.mode;
    };
});

// ===== TIMERS =====
let globalTime = 10 * 60, globalInterval;
let questionTime = 60, questionInterval;

function formatTime(t) { const m = Math.floor(t / 60); const s = t % 60; return `${m}:${s < 10 ? '0' : ''}${s}`; }

function startGlobalTimer() {
    clearInterval(globalInterval);
    timerEl.innerText = formatTime(globalTime);
    globalInterval = setInterval(() => {
        if (!active) return;
        globalTime--;
        timerEl.innerText = formatTime(globalTime);
        if (globalTime <= 10) timerEl.classList.add('danger');
        if (globalTime <= 0) finish();
    }, 1000);
}

function startQuestionTimer() {
    clearInterval(questionInterval);
    questionTime = 60;
    qTimerEl.innerText = questionTime;
    questionInterval = setInterval(() => {
        questionTime--;
        qTimerEl.innerText = questionTime;
        if (questionTime === 5) {
            feed.innerText = "⚠️ SYSTEM WARNING: 5s LEFT";
            playSound(sounds.timeout);
        }
        if (questionTime <= 0) { clearInterval(questionInterval); markWrong(); }
    }, 1000);
}

// ===== QUESTION GENERATOR =====
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function generateQuestion() {
    let a, b, c;
    if (mode === "easy") { a = rand(10, 30); b = rand(1, 20); c = rand(0, 10); }
    else if (mode === "hard") { a = rand(100, 300); b = rand(50, 150); c = rand(10, 80); }
    else { a = rand(30, 80); b = rand(10, 50); c = rand(5, 30); }
    return { text: `${a} + ${b} - ${c}`, answer: a + b - c };
}

// ===== STAR ANIMATION =====
function spawnStar() {
    for (let i = 0; i < 3; i++) { // 3 bintang terbang per jawaban benar
        const star = document.createElement('div');
        star.className = 'star-fly';
        star.style.left = `${Math.random() * (window.innerWidth - 20)}px`;
        star.style.top = `${window.innerHeight - 50}px`;
        document.body.appendChild(star);
        setTimeout(() => star.remove(), 1500);
    }
}

// ===== GAME FUNCTIONS =====
function nextQuestion() {
    if (solved >= maxQuestions[mode]) return finish();
    feed.innerText = 'AWAITING COMMAND...';
    feed.classList.remove('warning');
    reveal.innerText = '';

    const q = generateQuestion();
    qEl.innerText = q.text;
    currentAnswer = q.answer;

    inEl.value = '';
    inEl.disabled = false;
    inEl.focus();

    progressEl.innerText = `LEVEL: ${mode.toUpperCase()} | TASK ${solved + 1}/${maxQuestions[mode]}`;
    startQuestionTimer();
}

function markCorrect() {
    correct++; streak++; points += rewardPoints[mode];
    correctTimes.push(60 - questionTime);
    playSound(sounds.correct);
    feed.innerText = `ACCESS GRANTED [STREAK: x${streak}]`;
    box.classList.add('correct');
    setTimeout(() => box.classList.remove('correct'), 300);
    spawnStar();
    solved++;
    setTimeout(nextQuestion, 600);
}

function markWrong() {
    wrong++; streak = 0; solved++;
    playSound(sounds.wrong);
    feed.innerText = "ACCESS DENIED - DATA MISMATCH";
    reveal.innerText = `EXPECTED_VAL: ${currentAnswer}`;
    box.classList.add('wrong');
    setTimeout(() => box.classList.remove('wrong'), 300);
    setTimeout(nextQuestion, 1200);
}

function submitAnswer() {
    if (!active || finished) return;
    const val = parseInt(inEl.value);
    if (isNaN(val)) return;
    clearInterval(questionInterval);
    val === currentAnswer ? markCorrect() : markWrong();
}

// ===== CORE CONTROLLER =====
function handleAction() {
    if (!active) {
        active = true; finished = false; solved = 0; correct = 0; wrong = 0; streak = 0; correctTimes = []; points = 0; globalTime = 10 * 60;
        playSound(sounds.start);
        btn.innerText = "ENTER";
        inEl.disabled = false;
        inEl.placeholder = "ANSWER";
        document.querySelector('.mode-select').style.display = "none";
        startGlobalTimer();
        nextQuestion();
    } else { submitAnswer(); }
}

// ===== FINISH GAME =====
function finish() {
    if (finished) return;
    finished = true; active = false;
    clearInterval(globalInterval);
    clearInterval(questionInterval);
    playSound(sounds.finish);
    inEl.disabled = true; inEl.value = '';
    btn.innerText = "DONE"; btn.style.opacity = "0.5"; btn.style.pointerEvents = "none";
    document.querySelector('.mode-select').style.display = "flex";

    document.getElementById('res-correct').innerText = correct;
    document.getElementById('res-wrong').innerText = wrong;
    const avg = correctTimes.length ? (correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length).toFixed(2) : "0.00";
    document.getElementById('res-avg-correct').innerText = `${avg}s`;

    const logList = document.getElementById('log-list');
    logList.innerHTML = `<div style="margin-bottom:10px;color:#666;">--- SYSTEM LOG ---</div>`;
    logList.innerHTML += correctTimes.map((t, i) => `OP_${i + 1}: <span style="color:#00ff41">OK (${t}s)</span>`).join('<br>');

    // FINAL SCORE & 3 STARS
    const percent = solved > 0 ? (correct / solved) * 100 : 0;
    let stars = percent >= 90 ? 3 : percent >= 70 ? 2 : percent >= 40 ? 1 : 0;
    document.getElementById('final-stars').innerText = '★'.repeat(stars) + '☆'.repeat(3 - stars);

    const rewardEl = document.createElement('div');
    rewardEl.style.marginTop = "10px";
    rewardEl.style.fontSize = "1.2rem";
    rewardEl.style.color = "#00ff41";
    rewardEl.style.fontWeight = "800";
    rewardEl.innerText = `POINTS : ${points.toLocaleString()}`;
    logList.appendChild(rewardEl);

    document.getElementById('result-overlay').style.display = 'flex';
}

// ===== EVENT LISTENERS =====
btn.addEventListener('click', handleAction);
inEl.addEventListener('keydown', e => { if (e.key === 'Enter') { if (!active) handleAction(); else submitAnswer(); } });
