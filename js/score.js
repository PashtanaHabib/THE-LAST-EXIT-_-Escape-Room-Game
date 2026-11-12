// score.js — score system

// Public API:
// addScore(points)   add (or subtract) points, never below 0
// getScore()         current score
// Rules: start 1000, puzzle +100, wrong -25, hint -50,
// room +150, game +300. Score never goes negative.

var SCORE_RULES = {
    start: 1000,
    puzzle: 100,
    wrong: -25,
    hint: -50,
    room: 150,
    game: 300
};

function addScore(points) {
    if (!gameState) return 0;
    gameState.score = Math.max(0, gameState.score + points);
    saveGame();
    updateScoreDisplay();
    if (points !== 0) showScorePop(points);
    return gameState.score;
}

function getScore() {
    return gameState ? gameState.score : 0;

}

function updateScoreDisplay() {
    var el = document.getElementById('hud-score');
    if (el) el.textContent = getScore();
}

function showScorePop(points) {
    var anchor = document.getElementById('hud-score');
    if (!anchor) return;
    var r = anchor.getBoundingClientRect();
    var pop = document.createElement('div');
    pop.className = 'score-pop ' + (points > 0 ? 'plus' : 'minus');
    pop.textContent = (points > 0 ? '+' : '') + points;
    pop.style.left = (r.left + r.width / 2) + 'px';
    pop.style.top = (r.bottom + 4) + 'px';
    document.body.appendChild(pop);
    setTimeout(function () { if (pop.parentNode) pop.parentNode.removeChild(pop); }, 1300);
}




