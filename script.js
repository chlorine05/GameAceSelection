// ===== MATRIX BACKGROUND =====
const canvas = document.getElementById('cyberCanvas');
const ctx = canvas.getContext('2d');
let fontSize = 16, columns, drops;
function initMatrix() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; columns = Math.floor(canvas.width / fontSize); drops = Array(columns).fill(1); }
window.addEventListener('resize', initMatrix); initMatrix();
setInterval(() => {
    ctx.fillStyle = "rgba(0,0,0,0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#00ff41"; ctx.font = fontSize + "px monospace";
    drops.forEach((y, i) => {
        const t = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%".charAt(Math.floor(Math.random() * 40));
        ctx.fillText(t, i * fontSize, y * fontSize);
        drops[i] = y * fontSize > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
    });
}, 50);

// ===== SOUND SYSTEM =====
const sounds = {
    start: new Audio('sounds/mixkit-sci-fi-click-900.mp3'),
    correct: new Audio('sounds/mixkit-digital-quick-tone-2866.mp3'),
    wrong: new Audio('sounds/mixkit-sci-fi-error-alert-898.mp3'),
    timeout: new Audio('sounds/mixkit-alarm-digital-clock-beep-989.mp3'),
    finish: new Audio('sounds/mixkit-completion-of-a-level-2063.mp3')
};
Object.values(sounds).forEach(s => { s.volume = 0.35; s.preload = 'auto'; });
const playSound = s => { s.currentTime = 0; s.play().catch(() => { }); };

// ===== DOM =====
const qEl = document.getElementById('question-text'),
    inEl = document.getElementById('answer-input'),
    btn = document.getElementById('action-btn'),
    feed = document.getElementById('feedback-msg'),
    reveal = document.getElementById('correct-reveal'),
    box = document.querySelector('.ace-container'),
    timerEl = document.getElementById('main-timer'),
    qTimerEl = document.getElementById('question-timer'),
    progressEl = document.getElementById('progress-tag');

// ===== STATE =====
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
let globalTime = 10 * 60, globalInterval, questionTime = 60, questionInterval;
function formatTime(t) { const m = Math.floor(t / 60); const s = t % 60; return `${m}:${s < 10 ? '0' : ''}${s}`; }
function startGlobalTimer() {
    clearInterval(globalInterval);
    timerEl.innerText = formatTime(globalTime);
    globalInterval = setInterval(() => {
        if (!active) return;
        globalTime--; timerEl.innerText = formatTime(globalTime);
        if (globalTime <= 10) timerEl.classList.add('danger');
        if (globalTime <= 0) finish();
    }, 1000);
}
function startQuestionTimer() {
    clearInterval(questionInterval); questionTime = 60; qTimerEl.innerText = questionTime;
    questionInterval = setInterval(() => {
        questionTime--; qTimerEl.innerText = questionTime;
        if (questionTime === 5) { feed.innerText = "⚠️ SYSTEM WARNING: 5s LEFT"; playSound(sounds.timeout); }
        if (questionTime <= 0) { clearInterval(questionInterval); markWrong(); }
    }, 1000);
}

// ===== QUESTIONS =====
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function generateQuestion() {
    let a, b, c;
    if (mode === "easy") { a = rand(10, 30); b = rand(1, 20); c = rand(0, 10); }
    else if (mode === "hard") { a = rand(100, 300); b = rand(50, 150); c = rand(10, 80); }
    else { a = rand(30, 80); b = rand(10, 50); c = rand(5, 30); }
    return { text: `${a} + ${b} - ${c}`, answer: a + b - c };
}

// ===== STAR =====
function spawnStar() {
    const star = document.createElement('div');
    star.className = 'star-fly';
    star.style.left = `${Math.random() * (window.innerWidth - 20)}px`;
    star.style.top = `${window.innerHeight - 50}px`;
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 1000);
}

// ===== GAME =====
function nextQuestion() {
    if (solved >= maxQuestions[mode]) return finish();
    feed.innerText = 'AWAITING COMMAND...'; reveal.innerText = '';
    const q = generateQuestion(); qEl.innerText = q.text; currentAnswer = q.answer;
    inEl.value = ''; inEl.disabled = false; inEl.focus();
    progressEl.innerText = `LEVEL: ${mode.toUpperCase()} | TASK ${solved + 1}/${maxQuestions[mode]}`;
    startQuestionTimer();
}

function markCorrect() {
    correct++; streak++; points += rewardPoints[mode]; correctTimes.push(60 - questionTime);
    playSound(sounds.correct); feed.innerText = `ACCESS GRANTED [STREAK: x${streak}]`;
    box.classList.add('correct'); spawnStar();
    setTimeout(() => box.classList.remove('correct'), 300);
    solved++; setTimeout(nextQuestion, 600);
}
function markWrong() {
    wrong++; streak = 0; solved++;
    playSound(sounds.wrong); feed.innerText = "ACCESS DENIED - DATA MISMATCH"; reveal.innerText = `EXPECTED_VAL: ${currentAnswer}`;
    box.classList.add('wrong'); setTimeout(() => box.classList.remove('wrong'), 300);
    setTimeout(nextQuestion, 1200);
}
function submitAnswer() { if (!active || finished) return; const val = parseInt(inEl.value); if (isNaN(val)) return; clearInterval(questionInterval); val === currentAnswer ? markCorrect() : markWrong(); }

function handleAction() {
    if (!active) {
        active = true; finished = false; solved = 0; correct = 0; wrong = 0; streak = 0; correctTimes = []; points = 0; globalTime = 10 * 60;
        playSound(sounds.start); btn.innerText = "ENTER"; inEl.disabled = false; inEl.placeholder = "ANSWER";
        document.querySelector('.mode-select').style.display = "none";
        startGlobalTimer(); nextQuestion();
    } else { submitAnswer(); }
}

function finish() {
    if (finished) return;
    finished = true; active = false;
    clearInterval(globalInterval); clearInterval(questionInterval);
    playSound(sounds.finish); inEl.disabled = true; inEl.value = ''; btn.innerText = "DONE"; btn.style.opacity = "0.5"; btn.style.pointerEvents = "none";
    const modeBox = document.querySelector('.mode-select'); modeBox.style.display = "flex"; modeBox.style.opacity = "1"; modeBox.style.pointerEvents = "auto";

    const overlay = document.getElementById('result-overlay'); overlay.style.display = 'flex';
    document.getElementById('res-correct').innerText = correct;
    document.getElementById('res-wrong').innerText = wrong;
    const avg = correctTimes.length ? (correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length).toFixed(2) : "0.00";
    document.getElementById('res-avg-correct').innerText = `${avg}s`;

    const logList = document.getElementById('log-list'); logList.innerHTML = `<div style="margin-bottom:10px;color:#666;">--- SYSTEM LOG ---</div>`;
    logList.innerHTML += correctTimes.map((t, i) => `OP_${i + 1}: <span style="color:#00ff41">OK (${t}s)</span>`).join('<br>');

    const percent = solved > 0 ? (correct / solved) * 100 : 0;
    let stars = percent >= 90 ? 3 : percent >= 70 ? 2 : percent >= 40 ? 1 : 0;
    const starSymbols = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    const rewardEl = document.createElement('div'); rewardEl.style.marginTop = "20px"; rewardEl.style.borderTop = "1px solid #333"; rewardEl.style.paddingTop = "10px";
    rewardEl.innerHTML = `
        <div style="font-size:0.7rem;color:#888;">FINAL_SCORE</div>
        <div style="font-size:1.4rem;color:#00ff41;font-weight:800;">${points.toLocaleString()} PTS</div>
        <div style="font-size:1.2rem;letter-spacing:5px;color:gold;">${starSymbols}</div>
    `;
    logList.appendChild(rewardEl);
}

// ===== EVENTS =====
btn.addEventListener('click', handleAction);
inEl.addEventListener('keydown', e => { if (e.key === 'Enter') { !active ? handleAction() : submitAnswer(); } });
