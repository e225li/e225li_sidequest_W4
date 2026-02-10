/*
Week 4 — Example 4: Playable Maze (JSON + Level class + Player class)
Course: GBDA302
Instructors: Dr. Karen Cochrane and David Han
Date: Feb. 5, 2026

This is the "orchestrator" file:
- Loads JSON levels (preload)
- Builds Level objects
- Creates/positions the Player
- Handles input + level switching

It is intentionally light on "details" because those are moved into:
- Level.js (grid + drawing + tile meaning)
- Player.js (position + movement rules)

Based on the playable maze structure from Example 3
*/

const TS = 32;

// Raw JSON data (from levels.json).
let levelsData;

// Array of Level instances.
let levels = [];

// Current level index.
let li = 0;

// Player instance (tile-based).
let player;

let obstaclesByLevel = [];
let wordsByLevel = [];

function preload() {
  // Ensure level data is ready before setup runs.
  levelsData = loadJSON("levels.json");
}

function setup() {
  /*
  Convert raw JSON grids into Level objects.
  levelsData.levels is an array of 2D arrays. 
  */
  levels = levelsData.levels.map((grid) => new Level(copyGrid(grid), TS));

  obstaclesByLevel = levelsData.levels.map((lvl) => lvl.obstacles || []);
  wordsByLevel = levelsData.levels.map((lvl) => lvl.words || []);

  // Create a player.
  player = new Player(TS);

  // Load the first level (sets player start + canvas size).
  loadLevel(0);

  noStroke();
  textFont("sans-serif");
  textSize(14);
}

function draw() {
  background(240);

  // Draw current level then player on top.
  levels[li].draw();

  drawObstacles(obstaclesByLevel[li]);

  drawWords(wordsByLevel[li]);

  player.draw();

  drawHUD();
}

function drawHUD() {
  // HUD matches your original idea: show level count and controls.
  fill(0);
  text(`Level ${li + 1}/${levels.length} — WASD/Arrows to move`, 10, 16);
}

function drawObstacles(obstacles) {
  const level = levels[li];

  fill(200, 80, 80);
  for (let i = 0; i < obstacles.length; i++) {
    const o = obstacles[i];

    // only draw if inside bounds and not a wall tile
    if (level.inBounds(o.r, o.c) && !level.isWall(o.r, o.c)) {
      rect(o.c * TS, o.r * TS, TS, TS);
    }
  }
}

function drawWords(words) {
  const level = levels[li];

  fill(0);
  textSize(12);
  textAlign(LEFT, CENTER);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];

    // only draw if inside bounds and not a wall tile
    if (level.inBounds(w.r, w.c) && !level.isWall(w.r, w.c)) {
      const x = w.c * TS + TS * 0.15; // padding so it reads cleanly
      const y = w.r * TS + TS / 2;
      text(w.text, x, y);
    }
  }
}

function keyPressed() {
  /*
  Convert key presses into a movement direction. (WASD + arrows)
  */
  let dr = 0;
  let dc = 0;

  if (keyCode === LEFT_ARROW || key === "a" || key === "A") dc = -1;
  else if (keyCode === RIGHT_ARROW || key === "d" || key === "D") dc = 1;
  else if (keyCode === UP_ARROW || key === "w" || key === "W") dr = -1;
  else if (keyCode === DOWN_ARROW || key === "s" || key === "S") dr = 1;
  else return; // not a movement key

  // Try to move. If blocked, nothing happens.
  const moved = player.tryMove(levels[li], dr, dc);

  // If the player moved onto a goal tile, advance levels.
  if (moved && levels[li].isGoal(player.r, player.c)) {
    nextLevel();
  }
}

// ----- Level switching -----

function loadLevel(idx) {
  li = idx;

  const level = levels[li];

  // Place player at the level's start tile (2), if present.
  if (level.start) {
    player.setCell(level.start.r, level.start.c);
  } else {
    // Fallback spawn: top-left-ish (but inside bounds).
    player.setCell(1, 1);
  }

  // Ensure the canvas matches this level’s dimensions.
  resizeCanvas(level.pixelWidth(), level.pixelHeight());
}

function nextLevel() {
  // Wrap around when we reach the last level.
  const next = (li + 1) % levels.length;
  loadLevel(next);
}

// ----- Utility -----

function copyGrid(grid) {
  /*
  Make a deep-ish copy of a 2D array:
  - new outer array
  - each row becomes a new array

  Why copy?
  - Because Level constructor may normalize tiles (e.g., replace 2 with 0)
  - And we don’t want to accidentally mutate the raw JSON data object. 
  */
  return grid.map((row) => row.slice());
}
