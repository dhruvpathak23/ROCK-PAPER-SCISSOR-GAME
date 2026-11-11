let userScore = 0;
let AIscore = 0;
let drawScore = 0;
let currentStreak = 0;
let isMuted = false;

const choices = document.querySelectorAll(".choice");
const msg = document.querySelector("#msg");
const userScorePara = document.querySelector("#user-score");
const compScorePara = document.querySelector("#AI-score");
const drawScorePara = document.querySelector("#draw-score");
const streakCountEl = document.querySelector("#streak-count");

// Clash Arena Elements
const userPickedIcon = document.querySelector("#user-picked-icon");
const userPickedName = document.querySelector("#user-picked-name");
const aiPickedIcon = document.querySelector("#ai-picked-icon");
const aiPickedName = document.querySelector("#ai-picked-name");
const userCard = document.querySelector("#user-card");
const aiCard = document.querySelector("#ai-card");

// Controls
const resetBtn = document.querySelector("#reset-btn");
const soundToggleBtn = document.querySelector("#sound-toggle");
const soundIcon = document.querySelector("#sound-icon");
const soundLabel = document.querySelector("#sound-label");

const weaponMeta = {
    rock: { label: "STONE", icon: "fa-hand-rock" },
    paper: { label: "PAPER", icon: "fa-hand-paper" },
    scissors: { label: "SCISSORS", icon: "fa-hand-scissors" }
};

// ==========================================================================
// BATCOMPUTER WEB AUDIO SYNTHESIZER (Zero External MP3s Required)
// ==========================================================================
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

const initAudio = () => {
    if (!audioCtx && AudioContextClass) {
        audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
};

const playTone = (freqStart, freqEnd, duration, type = "sine", volume = 0.12, delay = 0) => {
    if (isMuted) return;
    initAudio();
    if (!audioCtx) return;

    const startTime = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, startTime);
    if (freqEnd !== freqStart) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 20), startTime + duration);
    }

    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
};

const sfx = {
    deploy: () => {
        playTone(520, 280, 0.08, "triangle", 0.13);
    },
    win: () => {
        const notes = [440, 554.37, 659.25, 880]; // A4 -> C#5 -> E5 -> A5
        notes.forEach((freq, idx) => {
            playTone(freq, freq, 0.18, "triangle", 0.14, idx * 0.07);
        });
    },
    lose: () => {
        playTone(240, 110, 0.22, "sawtooth", 0.13, 0);
        playTone(160, 85, 0.28, "sawtooth", 0.13, 0.16);
    },
    draw: () => {
        playTone(340, 340, 0.12, "sine", 0.11, 0);
        playTone(280, 280, 0.16, "sine", 0.11, 0.14);
    },
    uiClick: () => {
        playTone(800, 400, 0.05, "sine", 0.09);
    }
};

// Mute / Unmute Toggle Listener
if (soundToggleBtn) {
    soundToggleBtn.addEventListener("click", () => {
        isMuted = !isMuted;
        if (isMuted) {
            soundToggleBtn.classList.add("muted");
            soundIcon.className = "fas fa-volume-mute";
            soundLabel.innerText = "SFX: MUTED";
        } else {
            soundToggleBtn.classList.remove("muted");
            soundIcon.className = "fas fa-volume-up";
            soundLabel.innerText = "SFX: ON";
            sfx.uiClick();
        }
    });
}

// ==========================================================================
// GAME LOGIC & CLASH ARENA UPDATES
// ==========================================================================
const genCompChoice = () => {
    const options = ["rock", "paper", "scissors"];
    const randIdx = Math.floor(Math.random() * 3);
    return options[randIdx];
};

const updateArenaVisuals = (userChoice, compChoice, outcome) => {
    const uMeta = weaponMeta[userChoice];
    const cMeta = weaponMeta[compChoice];

    userPickedIcon.innerHTML = `<i class="fas ${uMeta.icon}"></i>`;
    userPickedName.innerText = uMeta.label;
    aiPickedIcon.innerHTML = `<i class="fas ${cMeta.icon}"></i>`;
    aiPickedName.innerText = cMeta.label;

    // Trigger pop animation
    userPickedIcon.classList.remove("pop-anim");
    aiPickedIcon.classList.remove("pop-anim");
    void userPickedIcon.offsetWidth;
    userPickedIcon.classList.add("pop-anim");
    aiPickedIcon.classList.add("pop-anim");

    // Color-code arena icons by outcome
    if (outcome === "win") {
        userPickedIcon.style.borderColor = "var(--emerald)";
        userPickedIcon.style.color = "var(--emerald)";
        aiPickedIcon.style.borderColor = "rgba(255, 255, 255, 0.15)";
        aiPickedIcon.style.color = "var(--text-muted)";
    } else if (outcome === "lose") {
        userPickedIcon.style.borderColor = "rgba(255, 255, 255, 0.15)";
        userPickedIcon.style.color = "var(--text-muted)";
        aiPickedIcon.style.borderColor = "var(--crimson)";
        aiPickedIcon.style.color = "var(--crimson)";
    } else {
        userPickedIcon.style.borderColor = "var(--amber)";
        userPickedIcon.style.color = "var(--amber)";
        aiPickedIcon.style.borderColor = "var(--amber)";
        aiPickedIcon.style.color = "var(--amber)";
    }
};

const drawGame = (userChoice, compChoice) => {
    drawScore++;
    drawScorePara.innerText = drawScore;
    sfx.draw();

    updateArenaVisuals(userChoice, compChoice, "draw");

    msg.innerText = `STALEMATE // BOTH DEPLOYED ${weaponMeta[userChoice].label}`;
    msg.className = "status-draw";
    userCard.classList.remove("pulse-win");
    aiCard.classList.remove("pulse-win");
};

const showWinner = (userWin, userChoice, compChoice) => {
    const uLabel = weaponMeta[userChoice].label;
    const cLabel = weaponMeta[compChoice].label;

    if (userWin) {
        userScore++;
        currentStreak++;
        userScorePara.innerText = userScore;
        streakCountEl.innerHTML = `${currentStreak} <i class="fas fa-fire"></i>`;
        sfx.win();

        updateArenaVisuals(userChoice, compChoice, "win");

        msg.innerText = `TARGET NEUTRALIZED // YOUR ${uLabel} CRUSHED AI'S ${cLabel}`;
        msg.className = "status-win";
        userCard.classList.add("pulse-win");
        aiCard.classList.remove("pulse-win");
    } else {
        AIscore++;
        currentStreak = 0;
        compScorePara.innerText = AIscore;
        streakCountEl.innerHTML = `0 <i class="fas fa-fire"></i>`;
        sfx.lose();

        updateArenaVisuals(userChoice, compChoice, "lose");

        msg.innerText = `BREACH DETECTED // AI'S ${cLabel} OVERPOWERED YOUR ${uLabel}`;
        msg.className = "status-lose";
        aiCard.classList.add("pulse-win");
        userCard.classList.remove("pulse-win");
    }
};

const playGame = (userChoice) => {
    sfx.deploy();

    // Highlight active weapon card
    choices.forEach((c) => c.classList.remove("selected-choice"));
    const activeChoiceEl = document.getElementById(userChoice);
    if (activeChoiceEl) activeChoiceEl.classList.add("selected-choice");

    const compChoice = genCompChoice();

    if (userChoice === compChoice) {
        drawGame(userChoice, compChoice);
    } else {
        let userWin = true;
        if (userChoice === "rock") {
            userWin = compChoice === "paper" ? false : true;
        } else if (userChoice === "paper") {
            userWin = compChoice === "scissors" ? false : true;
        } else {
            userWin = compChoice === "rock" ? false : true;
        }
        showWinner(userWin, userChoice, compChoice);
    }
};

// Click Listeners for Weapon Cards
choices.forEach((choice) => {
    choice.addEventListener("click", () => {
        const userChoice = choice.getAttribute("id");
        playGame(userChoice);
    });
});

// Keyboard Shortcuts: [R] = Rock, [P] = Paper, [S] = Scissors
window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (key === "r") playGame("rock");
    if (key === "p") playGame("paper");
    if (key === "s") playGame("scissors");
});

// Reset Combat Logs Button
if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        sfx.uiClick();
        userScore = 0;
        AIscore = 0;
        drawScore = 0;
        currentStreak = 0;

        userScorePara.innerText = "0";
        compScorePara.innerText = "0";
        drawScorePara.innerText = "0";
        streakCountEl.innerHTML = `0 <i class="fas fa-fire"></i>`;

        userPickedIcon.innerHTML = `<i class="fas fa-shield-alt"></i>`;
        userPickedName.innerText = "STANDBY";
        userPickedIcon.style = "";

        aiPickedIcon.innerHTML = `<i class="fas fa-microchip"></i>`;
        aiPickedName.innerText = "STANDBY";
        aiPickedIcon.style = "";

        choices.forEach((c) => c.classList.remove("selected-choice"));
        userCard.classList.remove("pulse-win");
        aiCard.classList.remove("pulse-win");

        msg.innerText = "COMBAT LOGS WIPED // AWAITING TACTICAL INPUT";
        msg.className = "status-neutral";
    });
}
