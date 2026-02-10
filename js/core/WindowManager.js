let zIndexCounter = 10;

function createWindow(title, contentHTML) {
  const win = document.createElement("div");
  win.className = "window";
  win.style.top = "100px";
  win.style.left = "100px";
  win.style.zIndex = zIndexCounter++;

  win.innerHTML = `
    <div class="window-header">
      <span class="window-title">${title}</span>
      <div class="window-controls">
        <span class="maximize-btn">▢</span>
        <span class="close-btn">X</span>
      </div>
    </div>
    <div class="window-content">
      ${contentHTML}
    </div>
  `;

  document.body.appendChild(win);

  // Cerrar
  win.querySelector(".close-btn").onclick = () => {
    // attempt to stop any running animation in project scenes
    const container = win.querySelector('#guitarra-canvas');
    if (container && container._guitarraContext && container._guitarraContext.stop) {
      container._guitarraContext.stop();
    }
    win.remove();
  };

  // Maximizar / restaurar
  const maximizeBtn = win.querySelector('.maximize-btn');
  win._isMaximized = false;
  maximizeBtn.onclick = () => {
    const content = win.querySelector('.window-content');
    const container = win.querySelector('#guitarra-canvas');
    if (!win._isMaximized) {
      // save previous
      win._prev = {
        left: win.style.left,
        top: win.style.top,
        width: win.style.width || win.clientWidth + 'px',
        height: win.style.height || win.clientHeight + 'px'
      };
      win.style.left = '0px';
      win.style.top = '0px';
      win.style.width = window.innerWidth + 'px';
      win.style.height = window.innerHeight + 'px';
      win._isMaximized = true;
      maximizeBtn.textContent = '🗗';
    } else {
      // restore
      if (win._prev) {
        win.style.left = win._prev.left;
        win.style.top = win._prev.top;
        win.style.width = win._prev.width;
        win.style.height = win._prev.height;
      }
      win._isMaximized = false;
      maximizeBtn.textContent = '▢';
    }

    // After layout change, resize any three.js scene inside
    if (container && typeof resizeGuitarraScene === 'function') {
      // allow style to apply
      setTimeout(() => resizeGuitarraScene(container), 50);
    }
  };

  // Traer al frente
  win.addEventListener("mousedown", () => {
    win.style.zIndex = zIndexCounter++;
  });

  // Drag
  dragWindow(win);

  return win;
}

function dragWindow(win) {
  const header = win.querySelector(".window-header");
  let offsetX, offsetY, isDragging = false;

  header.addEventListener("mousedown", e => {
    // don't start dragging when maximized
    if (win._isMaximized) return;
    isDragging = true;
    offsetX = e.clientX - win.offsetLeft;
    offsetY = e.clientY - win.offsetTop;
  });

  document.addEventListener("mousemove", e => {
    if (!isDragging) return;
    win.style.left = e.clientX - offsetX + "px";
    win.style.top = e.clientY - offsetY + "px";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}
