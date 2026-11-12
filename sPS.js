// ==========================================================================
// STATE, DIRECTED WIN GRAPH & 1ST-ORDER MARKOV CHAIN MATRIX
// ==========================================================================
const allWeapons = ["rock", "paper", "scissors", "batarang", "emp"];

// Directed Graph: Each weapon defeats the 2 weapons in its array
const winGraph = {
    rock: ["scissors", "batarang"],     // Stone crushes Scissors & blunts Batarang
    paper: ["rock", "emp"],             // Paper covers Stone & insulates EMP
    scissors: ["paper", "batarang"],    // Scissors cuts Paper & deflects Batarang
    batarang: ["paper", "emp"],         // Batarang slices Paper & severs EMP emitter
    emp: ["rock", "scissors"]           // EMP shatters Stone & magnetizes Scissors
};

const weaponMeta = {
    rock: { label: "STONE", icon: "fa-hand-rock", color: "var(--amber)" },
    paper: { label: "PAPER", icon: "fa-hand-paper", color: "var(--emerald)" },
    scissors: { label: "SCISSORS", icon: "fa-hand-scissors", color: "var(--crimson)" },
    batarang: { label: "BATARANG", icon: "fa-crosshairs", color: "var(--cyan)" },
    emp: { label: "EMP PULSE", icon: "fa-bolt", color: "#b366ff" }
};

let useMarkovAI = true;
let tactical5Mode = false;
let lastUserMove = null;
let roundNumber = 0;

// Armor Integrity (Boss HP)
let userHP = 100;
let aiHP = 100;

// Load persisted stats from localStorage
let savedStats = JSON.parse(localStorage.getItem("bat_sps_stats")) || {
    userScore: 0,
    aiScore: 0,
    drawScore: 0,
    bestStreak: 0
};
let userScore = savedStats.userScore;
let AIscore = savedStats.aiScore;
let drawScore = savedStats.drawScore;
let bestStreak = savedStats.bestStreak;
let currentStreak = 0;
let isMuted = JSON.parse(localStorage.getItem("bat_sps_muted")) || false;

// 1st-Order Markov Transition Matrix: transitionMatrix[prevMove][nextMove]
let transitionMatrix = {};
const initMarkovMatrix = () => {
    allWeapons.forEach(w1 => {
        transitionMatrix[w1] = {};
        allWeapons.forEach(w2 => {
            transitionMatrix[w1][w2] = 1; // Laplace smoothing uniform prior
        });
    });
};
initMarkovMatrix();

// DOM Elements
const choicesGrid = document.getElementById("choices-grid");
const choices = document.querySelectorAll(".choice");
const expansionWeapons = document.querySelectorAll(".expansion-weapon");
const msg = document.getElementById("msg");
const userScorePara = document.getElementById("user-score");
const compScorePara = document.getElementById("AI-score");
const drawScorePara = document.getElementById("draw-score");
const streakCountEl = document.getElementById("streak-count");
const bestStreakEl = document.getElementById("best-streak");

const userHpBar = document.getElementById("user-hp-bar");
const aiHpBar = document.getElementById("ai-hp-bar");
const userHpText = document.getElementById("user-hp-text");
const aiHpText = document.getElementById("ai-hp-text");
const dmgBadge = document.getElementById("dmg-badge");

const probBar = document.getElementById("prob-bar");
const aiReadoutTag = document.getElementById("ai-readout-tag");
const combatLogList = document.getElementById("combat-log-list");

const userPickedIcon = document.getElementById("user-picked-icon");
const userPickedName = document.getElementById("user-picked-name");
const aiPickedIcon = document.getElementById("ai-picked-icon");
const aiPickedName = document.getElementById("ai-picked-name");
const userCard = document.getElementById("user-card");
const aiCard = document.getElementById("ai-card");

const matchModal = document.getElementById("match-modal");
const modalTitle = document.getElementById("modal-title");
const modalSub = document.getElementById("modal-sub");
const nextBoutBtn = document.getElementById("next-bout-btn");

const soundToggleBtn = document.getElementById("sound-toggle");
const soundIcon = document.getElementById("sound-icon");
const soundLabel = document.getElementById("sound-label");

// Sync Initial Score UI
userScorePara.innerText = userScore;
compScorePara.innerText = AIscore;
drawScorePara.innerText = drawScore;
bestStreakEl.innerText = bestStreak;

const saveStats = () => {
    localStorage.setItem("bat_sps_stats", JSON.stringify({
        userScore, aiScore: AIscore, drawScore, bestStreak
    }));
};

// ==========================================================================
// BATCOMPUTER WEB AUDIO SYNTHESIZER
// ==========================================================================
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

const initAudio = () => {
    if (!audioCtx && AudioContextClass) audioCtx = new AudioContextClass();
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
};

const playTone = (freqStart, freqEnd, duration, type = "sine", volume = 0.11, delay = 0) => {
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
    deploy: () => playTone(520, 280, 0.08, "triangle", 0.12),
    win: () => {
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
            playTone(freq, freq, 0.18, "triangle", 0.13, idx * 0.07);
        });
    },
    lose: () => {
        playTone(240, 110, 0.2, "sawtooth", 0.12, 0);
        playTone(160, 85, 0.26, "sawtooth", 0.12, 0.15);
    },
    draw: () => {
        playTone(340, 340, 0.11, "sine", 0.1, 0);
        playTone(280, 280, 0.15, "sine", 0.1, 0.13);
    },
    uiClick: () => playTone(800, 400, 0.05, "sine", 0.08)
};

const applyMuteUI = () => {
    soundToggleBtn.classList.toggle("muted", isMuted);
    soundIcon.className = isMuted ? "fas fa-volume-mute" : "fas fa-volume-up";
    soundLabel.innerText = isMuted ? "SFX: MUTED" : "SFX: ON";
};
applyMuteUI();

soundToggleBtn.addEventListener("click", () => {
    isMuted = !isMuted;
    localStorage.setItem("bat_sps_muted", JSON.stringify(isMuted));
    applyMuteUI();
    if (!isMuted) sfx.uiClick();
});

// ==========================================================================
// MARKOV CHAIN PREDICTION ENGINE & TELEMETRY BAR
// ==========================================================================
const getActivePool = () => tactical5Mode ? allWeapons : ["rock", "paper", "scissors"];

const predictAndCounter = () => {
    const pool = getActivePool();

    if (!useMarkovAI || !lastUserMove) {
        aiReadoutTag.innerText = useMarkovAI ? "COLLECTING DATA..." : "RNG MODE ACTIVE";
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // Calculate transition probabilities from lastUserMove
    const counts = transitionMatrix[lastUserMove];
    let total = 0;
    pool.forEach(w => { total += counts[w]; });

    let mostLikelyUserMove = pool[0];
    let highestProb = -1;

    // Render live probability segments in the telemetry bar
    probBar.innerHTML = "";
    pool.forEach(w => {
        const prob = counts[w] / total;
        const pct = Math.round(prob * 100);
        if (prob > highestProb) {
            highestProb = prob;
            mostLikelyUserMove = w;
        }

        const seg = document.createElement("div");
        seg.className = `prob-seg seg-${w}`;
        seg.style.width = `${pct}%`;
        seg.innerText = `${weaponMeta[w].label.slice(0, 3)} ${pct}%`;
        probBar.appendChild(seg);
    });

    // Find all weapons in the active pool that beat `mostLikelyUserMove`
    const counters = pool.filter(candidate => winGraph[candidate].includes(mostLikelyUserMove));
    const chosenCounter = counters[Math.floor(Math.random() * counters.length)];

    aiReadoutTag.innerText = `PREDICTED: ${weaponMeta[mostLikelyUserMove].label} (${Math.round(highestProb * 100)}%) → COUNTER: ${weaponMeta[chosenCounter].label}`;
    return chosenCounter;
};

// ==========================================================================
// CORE COMBAT RESOLUTION & ARMOR HP DAMAGE
// ==========================================================================
const updateHPUI = () => {
    userHpBar.style.width = `${userHP}%`;
    aiHpBar.style.width = `${aiHP}%`;
    userHpText.innerText = `${userHP}% HP`;
    aiHpText.innerText = `${aiHP}% HP`;
};

const addCombatLog = (text) => {
    const li = document.createElement("li");
    li.innerHTML = text;
    combatLogList.prepend(li);
    while (combatLogList.children.length > 5) {
        combatLogList.removeChild(combatLogList.lastChild);
    }
};

const checkBossKnockout = () => {
    if (aiHP <= 0 || userHP <= 0) {
        setTimeout(() => {
            if (aiHP <= 0) {
                modalTitle.innerText = "TARGET NEUTRALIZED";
                modalTitle.style.color = "var(--emerald)";
                modalSub.innerText = `You shattered the Batcomputer's armor in ${roundNumber} rounds!`;
            } else {
                modalTitle.innerText = "OPERATIVE ARMOR CRITICAL";
                modalTitle.style.color = "var(--crimson)";
                modalSub.innerText = `The Markov AI adapted to your patterns and depleted your armor.`;
            }
            matchModal.classList.remove("hide");
        }, 500);
    }
};

const playGame = (userChoice) => {
    if (userHP <= 0 || aiHP <= 0) return;

    roundNumber++;
    sfx.deploy();

    choices.forEach(c => c.classList.remove("selected-choice"));
    const activeEl = document.getElementById(userChoice);
    if (activeEl) activeEl.classList.add("selected-choice");

    // 1. AI predicts user's move using current Markov matrix BEFORE updating matrix
    const compChoice = predictAndCounter();

    // 2. Update Markov Transition Matrix with user's actual transition
    if (lastUserMove) {
        transitionMatrix[lastUserMove][userChoice] += 1.5;
    }
    lastUserMove = userChoice;

    const uMeta = weaponMeta[userChoice];
    const cMeta = weaponMeta[compChoice];

    userPickedIcon.innerHTML = `<i class="fas ${uMeta.icon}"></i>`;
    userPickedName.innerText = uMeta.label;
    aiPickedIcon.innerHTML = `<i class="fas ${cMeta.icon}"></i>`;
    aiPickedName.innerText = cMeta.label;

    if (userChoice === compChoice) {
        drawScore++;
        drawScorePara.innerText = drawScore;
        sfx.draw();
        dmgBadge.innerText = "0 DMG";
        msg.innerText = `STALEMATE // BOTH DEPLOYED ${uMeta.label}`;
        msg.className = "status-draw";
        addCombatLog(`R#${roundNumber}: DRAW [${uMeta.label} vs ${cMeta.label}] // 0 DMG`);
    } else {
        const userWin = winGraph[userChoice].includes(compChoice);

        if (userWin) {
            userScore++;
            currentStreak++;
            if (currentStreak > bestStreak) bestStreak = currentStreak;

            const dmg = currentStreak >= 3 ? 35 : 20;
            aiHP = Math.max(0, aiHP - dmg);

            userScorePara.innerText = userScore;
            streakCountEl.innerHTML = `${currentStreak} <i class="fas fa-fire"></i>`;
            bestStreakEl.innerText = bestStreak;
            dmgBadge.innerText = `-${dmg}% AI`;

            sfx.win();
            msg.innerText = `${currentStreak >= 3 ? "CRITICAL STRIKE! " : ""}YOUR ${uMeta.label} DEFEATED AI'S ${cMeta.label} (-${dmg}% HP)`;
            msg.className = "status-win";
            userCard.classList.add("pulse-win");
            aiCard.classList.remove("pulse-win");
            addCombatLog(`R#${roundNumber}: <span style="color:var(--emerald)">WIN</span> [${uMeta.label} > ${cMeta.label}] // -${dmg}% AI HP`);
        } else {
            AIscore++;
            currentStreak = 0;
            userHP = Math.max(0, userHP - 20);

            compScorePara.innerText = AIscore;
            streakCountEl.innerHTML = `0 <i class="fas fa-fire"></i>`;
            dmgBadge.innerText = `-20% YOU`;

            sfx.lose();
            msg.innerText = `BREACH DETECTED // AI'S ${cMeta.label} COUNTERED YOUR ${uMeta.label} (-20% HP)`;
            msg.className = "status-lose";
            aiCard.classList.add("pulse-win");
            userCard.classList.remove("pulse-win");
            addCombatLog(`R#${roundNumber}: <span style="color:var(--crimson)">LOSS</span> [${cMeta.label} > ${uMeta.label}] // -20% YOUR HP`);
        }
    }

    saveStats();
    updateHPUI();
    checkBossKnockout();
};

// ==========================================================================
// LISTENERS, MODE TOGGLES & KEYBOARD SHORTCUTS ([R][P][S][B][E])
// ==========================================================================
choices.forEach(choice => {
    choice.addEventListener("click", () => {
        playGame(choice.getAttribute("id"));
    });
});

document.getElementById("ai-markov").addEventListener("click", (e) => {
    sfx.uiClick();
    useMarkovAI = true;
    e.currentTarget.classList.add("active");
    document.getElementById("ai-random").classList.remove("active");
    document.getElementById("ai-label").innerText = "MARKOV AI";
});

document.getElementById("ai-random").addEventListener("click", (e) => {
    sfx.uiClick();
    useMarkovAI = false;
    e.currentTarget.classList.add("active");
    document.getElementById("ai-markov").classList.remove("active");
    document.getElementById("ai-label").innerText = "RANDOM SCOUT";
});

document.getElementById("mode-classic").addEventListener("click", (e) => {
    sfx.uiClick();
    tactical5Mode = false;
    e.currentTarget.classList.add("active");
    document.getElementById("mode-tactical5").classList.remove("active");
    choicesGrid.classList.remove("five-grid");
    expansionWeapons.forEach(w => w.classList.add("hide"));
    msg.innerText = "CLASSIC 3-WEAPON LOADOUT // KEYS [R] [P] [S]";
});

document.getElementById("mode-tactical5").addEventListener("click", (e) => {
    sfx.uiClick();
    tactical5Mode = true;
    e.currentTarget.classList.add("active");
    document.getElementById("mode-classic").classList.remove("active");
    choicesGrid.classList.add("five-grid");
    expansionWeapons.forEach(w => w.classList.remove("hide"));
    msg.innerText = "TACTICAL-5 LOADOUT UNLOCKED // KEYS [R] [P] [S] [B] [E]";
});

const restoreArmor = () => {
    sfx.uiClick();
    userHP = 100;
    aiHP = 100;
    dmgBadge.innerText = "VS";
    updateHPUI();
    matchModal.classList.add("hide");
    msg.innerText = "ARMOR INTEGRITY RESTORED TO 100% // ENGAGE";
    msg.className = "status-neutral";
};

document.getElementById("heal-btn").addEventListener("click", restoreArmor);
nextBoutBtn.addEventListener("click", restoreArmor);

document.getElementById("reset-btn").addEventListener("click", () => {
    sfx.uiClick();
    userScore = 0; AIscore = 0; drawScore = 0; currentStreak = 0; bestStreak = 0;
    lastUserMove = null; roundNumber = 0;
    initMarkovMatrix();
    saveStats();

    userScorePara.innerText = "0";
    compScorePara.innerText = "0";
    drawScorePara.innerText = "0";
    bestStreakEl.innerText = "0";
    streakCountEl.innerHTML = `0 <i class="fas fa-fire"></i>`;
    combatLogList.innerHTML = `<li>MEMORY WIPED // Markov Matrix reset to uniform prior.</li>`;
    restoreArmor();
});

window.addEventListener("keydown", (e) => {
    if (!matchModal.classList.contains("hide") && e.code === "Space") {
        e.preventDefault();
        restoreArmor();
        return;
    }
    const key = e.key.toLowerCase();
    if (key === "r") playGame("rock");
    if (key === "p") playGame("paper");
    if (key === "s") playGame("scissors");
    if (tactical5Mode && key === "b") playGame("batarang");
    if (tactical5Mode && key === "e") playGame("emp");
});
