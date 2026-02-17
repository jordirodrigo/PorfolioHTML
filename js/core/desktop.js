// Virtual file system structure
const virtualFS = {
  guitarra: {
    type: 'folder',
    name: 'Guitarra',
    icon: 'assets/images/icons/carpeta.png',
    children: [
      {
        type: 'file',
        name: 'guitarra.blend',
        icon: 'assets/images/icons/blender.png',
        app: 'model-viewer',
        model: 'assets/models/guitarra.glb'
      }
    ]
  },
  muelle: {
    type: 'folder',
    name: 'Muelle',
    icon: 'assets/images/icons/carpeta.png',
    children: [
      {
        type: 'file',
        name: 'muelle.blend',
        icon: 'assets/images/icons/blender.png',
        app: 'model-viewer',
        model: 'assets/models/muelle.glb'
      }
    ]
  },
  camisa: {
    type: 'folder',
    name: 'Camisa',
    icon: 'assets/images/icons/carpeta.png',
    children: [
      {
        type: 'file',
        name: 'camisa.blend',
        icon: 'assets/images/icons/blender.png',
        app: 'model-viewer',
        model: 'assets/models/camisa.glb'
      }
    ]
  },
  pikachu: {
    type: 'folder',
    name: 'Pikachu',
    icon: 'assets/images/icons/carpeta.png',
    children: [
      {
        type: 'file',
        name: 'pikachu.blend',
        icon: 'assets/images/icons/blender.png',
        app: 'model-viewer',
        model: 'assets/models/pikachu.glb'
      }
    ]
  },
  guardian: {
    type: 'folder',
    name: 'Guardian',
    icon: 'assets/images/icons/carpeta.png',
    children: [
      {
        type: 'file',
        name: 'guardian.blend',
        icon: 'assets/images/icons/blender.png',
        app: 'model-viewer',
        model: 'assets/models/guardian.glb',
        hasAnimation: true
      }
    ]
  }
};

// Open folder viewer with support for nested folders
function openFolder(folderKey) {
  const folder = virtualFS[folderKey];
  if (!folder || folder.type !== 'folder') return;

  // Build breadcrumb navigation path
  let breadcrumbs = [{ key: folderKey, name: folder.name }];
  let parent = folder.parent ? virtualFS[folder.parent] : null;
  while (parent) {
    breadcrumbs.unshift({ key: Object.keys(virtualFS).find(k => virtualFS[k] === parent), name: parent.name });
    parent = parent.parent ? virtualFS[parent.parent] : null;
  }
  
  // Build navigation HTML
  let navHTML = '<div style="padding:8px; background:#e0e0e0; border-bottom:1px solid #999; display:flex; align-items:center; gap:8px;">';
  if (folder.parent) {
    navHTML += '<button id="folder-back" style="padding:4px 8px; cursor:pointer;">← Atrás</button>';
  }
  navHTML += '<div style="flex:1; font-size:12px;">';
  breadcrumbs.forEach((bc, idx) => {
    if (idx > 0) navHTML += ' > ';
    navHTML += bc.name;
  });
  navHTML += '</div></div>';

  let content = navHTML + '<div class="folder-view" style="padding:10px; overflow:auto; height:100%; box-sizing:border-box;">';
  
  folder.children.forEach(item => {
    const icon = item.icon || 'assets/images/icons/file.png';
    const model = item.model || '';
    const hasAnimation = item.hasAnimation ? 'true' : 'false';
    const folderKey = item.folderKey || '';
    
    console.log('[desktop] creating file-icon for', item.name, 'with model:', model, 'app:', item.app);
    
    let itemHTML = `
      <div class="file-icon" data-type="${item.type}" data-app="${item.app || ''}" data-name="${item.name}" data-model="${model}" data-has-animation="${hasAnimation}" data-folder-key="${folderKey}" style="display:inline-block; text-align:center; margin:15px; cursor:pointer; user-select:none; position:relative;">
        <img src="${icon}" style="width:64px; height:64px; margin-bottom:5px;" />
        <div style="font-size:12px; width:80px; word-wrap:break-word;">${item.name}</div>
      </div>
    `;
    content += itemHTML;
  });
  
  content += '</div>';

  const win = createWindow(`Carpeta: ${folder.name}`, content);
  
  // Attach back button handler
  if (folder.parent) {
    const backBtn = win.querySelector('#folder-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        win.remove();
        openFolder(folder.parent);
      });
    }
  }
  
  // Attach double-click handlers to files and folders
  const fileIcons = win.querySelectorAll('.file-icon');
  fileIcons.forEach(fileIcon => {
    fileIcon.addEventListener('dblclick', () => {
      const type = fileIcon.dataset.type;
      const app = fileIcon.dataset.app;
      const name = fileIcon.dataset.name;
      
      if (type === 'folder') {
        // Open nested folder
        const fKey = fileIcon.dataset.folderKey;
        if (fKey) {
          win.remove();
          openFolder(fKey);
        }
      } else if (type === 'file' && app === 'model-viewer') {
        const modelPath = fileIcon.dataset.model;
        const hasAnimation = fileIcon.dataset.hasAnimation === 'true';
        console.log('[desktop] dblclick on model file:', name, 'modelPath:', modelPath, 'hasAnimation:', hasAnimation);
        openModelViewer(name, modelPath, hasAnimation);
      }
    });
  });
}



// Open the 3D model viewer (generic for any model)
function openModelViewer(fileName, modelPath, hasAnimation) {
  let animationButtonHTML = '';
  if (hasAnimation) {
    animationButtonHTML = '<button id="guitarra-play-animation" style="margin-left:8px">Play Animation</button>';
  }
  
  // Check if this is Guardian model to add rig display button
  const isGuardian = modelPath && modelPath.toLowerCase().includes('guardian');
  const rigButtonHTML = isGuardian ? '<button id="guitarra-show-rig" style="margin-left:8px">Show Rig</button>' : '';
  
  const content = `
    <div class="guitarra-controls">
      <label>X: <input id="guitarra-scale-x" type="range" min="0.01" max="3" step="0.01" value="1"></label>
      <label>Y: <input id="guitarra-scale-y" type="range" min="0.01" max="3" step="0.01" value="1"></label>
      <label>Z: <input id="guitarra-scale-z" type="range" min="0.01" max="3" step="0.01" value="1"></label>
      <button id="guitarra-add-light" style="margin-left:8px">Añadir luz</button>
      <button id="guitarra-wireframe" style="margin-left:8px">Wireframe</button>
      ${animationButtonHTML}
      ${rigButtonHTML}
      <label style="margin-left:12px">Ojos: <input id="guitarra-morph-ojos" type="range" min="0" max="1" step="0.01" value="0"></label>
      <label style="margin-left:12px">Fondo: <input id="guitarra-bg" type="color" value="#222222"></label>
    </div>
    <div id="guitarra-canvas" style="width:100%;height:100%;"></div>
  `;

  const win = createWindow(fileName, content);

  // Initialize 3D viewer
  const container = win.querySelector('#guitarra-canvas');
  console.log('[desktop] created viewer window for', fileName, ':', container);
  try {
    const ctx = initGuitarraScene(container, modelPath);
    // If has animation, attach handler to play button
    if (hasAnimation && ctx) {
      const playBtn = win.querySelector('#guitarra-play-animation');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          try { playModelAnimation(ctx); } catch (e) { console.error('[desktop] play animation failed', e); }
        });
      }
    }
    // If Guardian, attach handler to rig display button
    if (isGuardian && ctx) {
      const rigBtn = win.querySelector('#guitarra-show-rig');
      if (rigBtn) {
        rigBtn.addEventListener('click', () => {
          try { toggleRigDisplay(ctx); } catch (e) { console.error('[desktop] toggle rig failed', e); }
        });
      }
    }
  } catch (e) {
    console.error('[desktop] initGuitarraScene error:', e);
  }
}

// Play first animation in the model's animations array (from GLTF rigging)
function playModelAnimation(ctx) {
  if (!ctx || !ctx.scene || !ctx.model) {
    console.warn('[guitarra] invalid context for animation');
    return;
  }
  
  // Check if animations are stored from GLTF load
  if (!ctx.animations || ctx.animations.length === 0) {
    console.warn('[guitarra] no animations found in model');
    return;
  }
  
  console.log('[guitarra] available animations:', ctx.animations.map(a => a.name));
  
  // Create mixer if not present
  if (!ctx.mixer) {
    ctx.mixer = new THREE.AnimationMixer(ctx.model);
    ctx.animClock = new THREE.Clock();
    console.log('[guitarra] created AnimationMixer for model');
  }
  
  // Stop any running action
  if (ctx.currentAction) {
    ctx.currentAction.stop();
    ctx.currentAction = null;
  }
  
  // Play first animation
  const clip = ctx.animations[0];
  const action = ctx.mixer.clipAction(clip);
  action.reset();
  action.clampWhenFinished = false;
  action.loop = THREE.LoopRepeat;
  action.play();
  ctx.currentAction = action;
  
  console.log('[guitarra] playing animation:', clip.name || 'unnamed', '(duration:', clip.duration, 's)');
}

// Toggle skeleton/rig display for Guardian model
function toggleRigDisplay(ctx) {
  if (!ctx || !ctx.model) {
    console.warn('[guitarra] no model in context');
    return;
  }

  if (!ctx.skeletonHelper) {
    // Create skeleton helper to visualize bones
    ctx.skeletonHelper = new THREE.SkeletonHelper(ctx.model);
    ctx.skeletonHelper.material.linewidth = 2;
    ctx.scene.add(ctx.skeletonHelper);
    console.log('[guitarra] skeleton helper created and added to scene');
  }

  // Toggle visibility
  ctx.skeletonHelper.visible = !ctx.skeletonHelper.visible;
  console.log('[guitarra] skeleton helper visibility:', ctx.skeletonHelper.visible);
}

// Open the mini minesweeper app
function openMinesweeper() {
  const content = `
    <div id="minesweeper-root" style="width:100%;height:100%;"></div>
  `;
  const win = createWindow('Buscaminas', content);
  const container = win.querySelector('#minesweeper-root');
  try {
    if (typeof initMinesweeper === 'function') initMinesweeper(container);
    else console.warn('[desktop] initMinesweeper not available');
  } catch (e) {
    console.error('[desktop] initMinesweeper error:', e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const desktop = document.getElementById('desktop');
  
  // Create icons only for root folders (those not inside other folders)
  const createRootIconsFromFS = () => {
    // Determine which folders are root (not inside other folders)
    const allFolderKeys = Object.keys(virtualFS);
    const nonRootFolders = new Set();
    
    allFolderKeys.forEach(key => {
      const folder = virtualFS[key];
      if (folder.children) {
        folder.children.forEach(child => {
          if (child.folderKey) {
            nonRootFolders.add(child.folderKey);
          }
        });
      }
    });
    
    // Create or show/hide icons based on root status
    allFolderKeys.forEach(key => {
      const folder = virtualFS[key];
      if (folder.type === 'folder' && !nonRootFolders.has(key)) {
        let icon = document.querySelector(`[data-app="${key}"]`);
        if (!icon) {
          icon = document.createElement('div');
          icon.className = 'icon';
          icon.dataset.app = key;
          icon.innerHTML = `<img src="${folder.icon}" /><span>${folder.name}</span>`;
          desktop.appendChild(icon);
        }
        icon.style.display = 'block';
      } else if (folder.type === 'folder' && nonRootFolders.has(key)) {
        let icon = document.querySelector(`[data-app="${key}"]`);
        if (icon) {
          icon.style.display = 'none';
        }
      }
    });
  };
  
  createRootIconsFromFS();
  
  attachDragHandlers();
  attachDesktopIconListeners();
});

// Attach double-click listeners to desktop icons
function attachDesktopIconListeners() {
  const icons = document.querySelectorAll(".icon");
  icons.forEach(icon => {
    icon.addEventListener("dblclick", () => {
      const app = icon.dataset.app;
      const folder = virtualFS[app];

      if (app === "minesweeper") {
        openMinesweeper();
      } else if (folder && folder.type === 'folder') {
        openFolder(app);
      }
    });
  });
}

// Global drag state
let globalDragState = {
  dragging: false,
  offsetX: 0,
  offsetY: 0,
  currentIcon: null
};

// Attach drag handlers to all desktop icons
function attachDragHandlers() {
  const desktop = document.getElementById('desktop');
  const taskbar = document.getElementById('taskbar');
  const taskbarHeight = taskbar ? taskbar.offsetHeight : 40;

  const icons = document.querySelectorAll('.icon');
  
  // Initialize positions
  icons.forEach((icon, idx) => {
    const key = 'desktop-icon-pos-' + icon.dataset.app;
    const saved = localStorage.getItem(key);
    
    if (saved) {
      const pos = JSON.parse(saved);
      icon.style.position = 'absolute';
      icon.style.left = pos.left + 'px';
      icon.style.top = pos.top + 'px';
    } else {
      icon.style.position = 'absolute';
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const left = 20 + col * 120;
      const top = 20 + row * 120;
      icon.style.left = left + 'px';
      icon.style.top = top + 'px';
    }
    icon.style.touchAction = 'none';
    icon.style.cursor = 'move';
  });

  // Attach pointerdown to each icon
  icons.forEach(icon => {
    icon.addEventListener('pointerdown', function(e) {
      if (e.target.closest('.icon')) {
        e.preventDefault();
        const iconEl = e.target.closest('.icon');
        
        if (this.setPointerCapture) this.setPointerCapture(e.pointerId);
        
        globalDragState.dragging = true;
        globalDragState.currentIcon = iconEl;
        iconEl.style.zIndex = 999;
        
        const rect = iconEl.getBoundingClientRect();
        globalDragState.offsetX = e.clientX - rect.left;
        globalDragState.offsetY = e.clientY - rect.top;
      }
    });
  });

  // Global pointermove
  document.addEventListener('pointermove', function(ev) {
    if (!globalDragState.dragging || !globalDragState.currentIcon) return;
    
    const desktopRect = desktop.getBoundingClientRect();
    const icon = globalDragState.currentIcon;
    
    let nx = ev.clientX - desktopRect.left - globalDragState.offsetX;
    let ny = ev.clientY - desktopRect.top - globalDragState.offsetY;
    
    // Clamp to desktop bounds
    nx = Math.max(0, Math.min(nx, desktopRect.width - icon.offsetWidth));
    ny = Math.max(0, Math.min(ny, desktopRect.height - icon.offsetHeight - taskbarHeight));
    
    icon.style.left = nx + 'px';
    icon.style.top = ny + 'px';
  });

  // Global pointerup
  document.addEventListener('pointerup', function(ev) {
    if (!globalDragState.dragging || !globalDragState.currentIcon) return;
    
    const icon = globalDragState.currentIcon;
    icon.style.zIndex = '';
    
    // Save position
    const key = 'desktop-icon-pos-' + icon.dataset.app;
    const left = parseFloat(icon.style.left);
    const top = parseFloat(icon.style.top);
    localStorage.setItem(key, JSON.stringify({ left, top }));
    
    globalDragState.dragging = false;
    globalDragState.currentIcon = null;
  });
}
