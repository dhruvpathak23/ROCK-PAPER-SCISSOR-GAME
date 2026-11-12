# ⚔️ STONE-PAPER-SCISSORS // Markov Chain AI & Tactical-5 Simulator

[![Live Demo](https://img.shields.io/badge/PLAY_LIVE-GITHUB_PAGES-ff0a16?style=for-the-badge&logo=github)](https://dhruvpathak23.github.io/ROCK-PAPER-SCISSOR-GAME/)
[![AI Engine](https://img.shields.io/badge/AI_ENGINE-1ST_ORDER_MARKOV_CHAIN-ff9900?style=for-the-badge)](https://dhruvpathak23.github.io/ROCK-PAPER-SCISSOR-GAME/)
[![Graph Theory](https://img.shields.io/badge/MODES-CLASSIC_3_%7C_TACTICAL_5_GRAPH-00ff88?style=for-the-badge)](https://dhruvpathak23.github.io/ROCK-PAPER-SCISSOR-GAME/)

A man-vs-machine combat simulator styled as **Wayne Tech Combat Module #02**. Instead of relying purely on `Math.random()`, this simulator features a **1st-Order Markov Chain Predictive AI** that learns the human player's subconscious transition habits in real time, displays a live probability matrix bar, and deploys the optimal counter-weapon.

🔗 **Live Deployment:** [https://dhruvpathak23.github.io/ROCK-PAPER-SCISSOR-GAME/](https://dhruvpathak23.github.io/ROCK-PAPER-SCISSOR-GAME/)

---

## 🧠 Algorithmic & Game Theory Architecture

### 1. 1st-Order Markov Chain Transition Matrix (`transitionMatrix[prev][next]`)
* Humans are notoriously bad at generating true randomness and fall into predictable sequential patterns (e.g., switching to *Paper* after playing *Stone*).
* The AI maintains a **Laplace-smoothed Transition Probability Matrix** that updates after every round based on what weapon you threw following your previous move.
* Before each clash, the AI queries `transitionMatrix[lastUserMove]`, predicts your highest-probability next move, and selects the weapon that defeats it.

### 2. Live Probability Telemetry HUD
* Visualizes the AI's internal confidence distribution across all weapons in real time (e.g., `STONE 58% | PAPER 24% | SCISSORS 18% → AI COUNTER: PAPER`).

### 3. "Tactical-5" Directed Graph Expansion (`Stone-Paper-Scissors-Batarang-EMP`)
* Toggle between **Classic (3 Weapons)** and **Tactical-5 (5 Weapons)**.
* Modeled as a balanced 5-node directed graph (`winGraph`) where every weapon defeats exactly **2** targets and loses to **2** targets—reducing stalemate probability from 33.3% down to 20%:
  * **Stone (`[R]`):** Crushes *Scissors* & blunts *Batarang*
  * **Paper (`[P]`):** Covers *Stone* & insulates *EMP*
  * **Scissors (`[S]`):** Cuts *Paper* & deflects *Batarang*
  * **Batarang (`[B]`):** Slices *Paper* & severs *EMP*
  * **EMP Pulse (`[E]`):** Shatters *Stone* & magnetizes *Scissors*

---

## ✨ Interactive Combat Features

* **100% Armor Integrity (Boss HP Bars) & Critical Streaks:** Each round inflicts **20% Armor Damage**. Achieving a **3+ Win Streak** triggers **Critical Strikes (35% Damage)** until either the Operative or Batcomputer armor hits `0%`.
* **Head-to-Head Clash Arena & Scrolling Telemetry Log:** Displays deployed weapons side-by-side and records the last 5 rounds of combat outcomes.
* **Web Audio API Synthesizer + Mute Toggle:** Generates zero-latency tactical deployment, victory, defeat, and stalemate sound effects via browser oscillators.
* **Keyboard Hotkeys & `localStorage` Persistence:** Rapidly deploy weapons using keys **`[R]`**, **`[P]`**, **`[S]`**, **`[B]`**, and **`[E]`**. Lifetime scores, best win streaks, and audio settings persist in `localStorage`.

---

## 📂 File Structure

```text
├── index.html       # Combat HUD, Markov probability bar, clash arena & weapon cards
├── sPS.css          # Batman 2022 noir theme, HP bar animations & 3/5-column responsive grid
├── sPS.js           # Markov transition matrix, directed win graph, HP engine & Web Audio synth
└── image/           # Custom weapon assets (with automatic FontAwesome vector fallback)
🚀 Run Locally
Bash
git clone [https://github.com/dhruvpathak23/ROCK-PAPER-SCISSOR-GAME.git](https://github.com/dhruvpathak23/ROCK-PAPER-SCISSOR-GAME.git)
cd ROCK-PAPER-SCISSOR-GAME
# Open index.html in your browser
👤 Author
Dhruv Pathak — GitHub | LinkedIn | LeetCode
