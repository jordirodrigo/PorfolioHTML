let zIndexCounter = 10;

function createWindow(title, contentHTML) {
  const win = document.createElement("div");
  win.className = "window";
  win.style.top = "100px";
  win.style.left = "100px";
  win.style.zIndex = zIndexCounter++;

  win.innerHTML = `
    <div class="window-header">
      <span>${title}</span>
      <span class="close-btn">X</span>
    </div>
    <div class="window-content">
      ${contentHTML}
    </div>
  `;

  document.body.appendChild(win);

  // Cerrar
  win.querySelector(".close-btn").onclick = () => win.remove();

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
