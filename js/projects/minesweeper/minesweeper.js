function initMinesweeper(container, rows = 8, cols = 8, mines = 10) {
  if (!container) return;
  container.innerHTML = '';
  const root = document.createElement('div');
  root.style.display = 'flex';
  root.style.flexDirection = 'column';
  root.style.height = '100%';
  root.style.boxSizing = 'border-box';
  root.style.padding = '8px';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.marginBottom = '8px';

  const info = document.createElement('div');
  info.textContent = `Buscaminas ${rows}x${cols} • Minas: ${mines}`;

  const resetBtn = document.createElement('button');
  resetBtn.textContent = 'Reiniciar';
  resetBtn.style.padding = '4px 8px';

  header.appendChild(info);
  header.appendChild(resetBtn);

  const boardWrap = document.createElement('div');
  boardWrap.style.flex = '1 1 auto';
  boardWrap.style.display = 'flex';
  boardWrap.style.justifyContent = 'center';
  boardWrap.style.alignItems = 'center';

  const board = document.createElement('div');
  board.style.display = 'grid';
  board.style.gridTemplateColumns = `repeat(${cols}, 28px)`;
  board.style.gridTemplateRows = `repeat(${rows}, 28px)`;
  board.style.gap = '4px';

  boardWrap.appendChild(board);
  root.appendChild(header);
  root.appendChild(boardWrap);
  container.appendChild(root);

  // Game state
  let grid = [];
  let revealed = [];
  let flagged = [];
  let gameOver = false;

  const inBounds = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols;

  function placeMines(excludeR, excludeC) {
    // initialize
    grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    let placed = 0;
    while (placed < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (grid[r][c] === 'M') continue;
      // avoid placing on first click
      if (r === excludeR && c === excludeC) continue;
      grid[r][c] = 'M';
      placed++;
    }
    // compute numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 'M') continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (inBounds(nr, nc) && grid[nr][nc] === 'M') count++;
        }
        grid[r][c] = count;
      }
    }
  }

  function buildBoard() {
    board.innerHTML = '';
    revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
    flagged = Array.from({ length: rows }, () => Array(cols).fill(false));
    gameOver = false;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const btn = document.createElement('button');
        btn.style.width = '28px';
        btn.style.height = '28px';
        btn.style.padding = '0';
        btn.style.userSelect = 'none';
        btn.style.fontSize = '14px';
        btn.dataset.r = r;
        btn.dataset.c = c;

        btn.addEventListener('click', (e) => {
          if (gameOver) return;
          const rr = parseInt(btn.dataset.r, 10);
          const cc = parseInt(btn.dataset.c, 10);
          // if first reveal and mines not placed, place mines avoiding this cell
          if (grid.flat().every(v => v === 0)) {
            placeMines(rr, cc);
          }
          revealCell(rr, cc);
        });

        btn.addEventListener('contextmenu', (ev) => {
          ev.preventDefault();
          if (gameOver) return;
          const rr = parseInt(btn.dataset.r, 10);
          const cc = parseInt(btn.dataset.c, 10);
          flagged[rr][cc] = !flagged[rr][cc];
          btn.textContent = flagged[rr][cc] ? '🚩' : '';
        });

        board.appendChild(btn);
      }
    }
  }

  function revealCell(r, c) {
    if (!inBounds(r, c) || revealed[r][c] || flagged[r][c]) return;
    revealed[r][c] = true;
    const idx = r * cols + c;
    const btn = board.children[idx];

    if (grid[r][c] === 'M') {
      btn.textContent = '💣';
      btn.style.background = '#f88';
      endGame(false);
      return;
    }

    if (grid[r][c] > 0) {
      btn.textContent = grid[r][c];
      btn.disabled = true;
    } else {
      btn.disabled = true;
      // flood fill neighbors
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc) && !revealed[nr][nc]) revealCell(nr, nc);
      }
    }

    checkWin();
  }

  function endGame(won) {
    gameOver = true;
    // reveal all mines
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const btn = board.children[idx];
      if (grid[r][c] === 'M') btn.textContent = '💣';
    }
    setTimeout(() => {
      alert(won ? '¡Has ganado!' : 'Juego terminado');
    }, 10);
  }

  function checkWin() {
    let ok = true;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== 'M' && !revealed[r][c]) ok = false;
    }
    if (ok) endGame(true);
  }

  resetBtn.addEventListener('click', () => {
    grid = Array.from({ length: rows }, () => Array(cols).fill(0));
    buildBoard();
  });

  // initial empty grid (mines placed on first click)
  grid = Array.from({ length: rows }, () => Array(cols).fill(0));
  buildBoard();
}
