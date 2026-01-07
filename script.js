// --- CGI MATRIX BACKGROUND LOGIC ---
const canvas = document.getElementById('cyberCanvas');
const ctx = canvas.getContext('2d');
let fontSize = 16;
let columns, drops;

function initMatrix() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
}

// Inisialisasi awal dan saat layar berubah ukuran
window.addEventListener('resize', initMatrix);
initMatrix();

function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ff41"; // Warna hijau Matrix
    ctx.font = fontSize + "px monospace";

    for (let i = 0; i < drops.length; i++) {
        const text = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@&*%".charAt(Math.floor(Math.random() * 42));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}
setInterval(drawMatrix, 50);

// --- GAME LOGIC ---
let currentAnswer, solvedCount = 0, correctCount = 0, wrongCount = 0;
let timeLeft = 30 * 60, questionStartTime, correctTimes = [], gameActive = false;

const questionEl = document.getElementById('question-text');
const inputEl = document.getElementById('answer-input');
const actionBtn = document.getElementById('action-btn');
const timerEl = document.getElementById('main-timer');
const feedbackEl = document.getElementById('feedback-msg');
const revealEl = document.getElementById('correct-reveal');

function nextQuestion() {
    if (solvedCount >= 10) return finishGame();

    document.getElementById('progress-tag').innerText = `ROUND: ${solvedCount + 1} / 10`;

    // Logika matematika sederhana (Cyber Challenge)
    const a = Math.floor(Math.random() * 89) + 11;
    const b = Math.floor(Math.random() * 89) + 11;
    const c = Math.floor(Math.random() * 40) + 5;

    questionEl.innerText = `${a} + ${b} - ${c}`;
    currentAnswer = a + b - c;
    inputEl.value = '';
    inputEl.focus();
    questionStartTime = Date.now();
}

function submitAnswer() {
    const val = inputEl.value.trim();
    if (val === "" || !gameActive) return;

    const userVal = parseInt(val);
    const timeSpent = (Date.now() - questionStartTime) / 1000;

    if (userVal === currentAnswer) {
        correctCount++;
        correctTimes.push(timeSpent);
        feedbackEl.innerText = "ACCESS GRANTED";
        feedbackEl.style.color = "#00ff41";
        revealEl.innerText = "";
    } else {
        wrongCount++;
        feedbackEl.innerText = "ACCESS DENIED";
        feedbackEl.style.color = "#ff3e3e";
        revealEl.innerText = `EXPECTED: ${currentAnswer}`;
    }

    solvedCount++;
    if (solvedCount < 10) {
        setTimeout(nextQuestion, 600);
    } else {
        finishGame();
    }
}

function startGame() {
    if (gameActive) return;
    gameActive = true;

    actionBtn.innerText = "ENTER";
    actionBtn.onclick = submitAnswer;
    inputEl.disabled = false;
    inputEl.focus();

    // Timer Countdown
    const timerInterval = setInterval(() => {
        if (!gameActive) {
            clearInterval(timerInterval);
            return;
        }
        timeLeft--;
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        timerEl.innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        if (timeLeft <= 0) finishGame();
    }, 1000);

    nextQuestion();
}

function finishGame() {
    gameActive = false;
    inputEl.disabled = true;
    document.getElementById('result-overlay').style.display = 'flex';
    document.getElementById('res-correct').innerText = correctCount;
    document.getElementById('res-wrong').innerText = wrongCount;

    if (correctTimes.length > 0) {
        const avg = (correctTimes.reduce((a, b) => a + b, 0) / correctTimes.length).toFixed(2);
        document.getElementById('res-avg-correct').innerText = `${avg}s`;
        document.getElementById('log-list').innerHTML = correctTimes
            .map((t, i) => `LOG_REF_${i + 1}: <span style="color:#00ff41">${t.toFixed(2)}s</span>`)
            .join('<br>');
    } else {
        document.getElementById('log-list').innerText = "NO SUCCESS DATA RECORDED";
    }
}

// Event Listeners
actionBtn.onclick = startGame;
inputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') submitAnswer();
});