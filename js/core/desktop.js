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
  }
};

// Open folder viewer
function openFolder(folderKey) {
  const folder = virtualFS[folderKey];
  if (!folder || folder.type !== 'folder') return;

  let content = '<div class="folder-view" style="padding:10px; overflow:auto; height:100%;">';
  
  folder.children.forEach(item => {
    const icon = item.icon || 'assets/images/icons/file.png';
    const model = item.model || '';
    content += `
      <div class="file-icon" data-type="${item.type}" data-app="${item.app || ''}" data-name="${item.name}" data-model="${model}" style="display:inline-block; text-align:center; margin:15px; cursor:pointer; user-select:none;">
        <img src="${icon}" style="width:64px; height:64px; margin-bottom:5px;" />
        <div style="font-size:12px; width:80px; word-wrap:break-word;">${item.name}</div>
      </div>
    `;
  });
  
  content += '</div>';

  const win = createWindow(`Carpeta: ${folder.name}`, content);
  
  // Attach double-click handlers to files
  const fileIcons = win.querySelectorAll('.file-icon');
  fileIcons.forEach(fileIcon => {
    fileIcon.addEventListener('dblclick', () => {
      const app = fileIcon.dataset.app;
      const name = fileIcon.dataset.name;
      
      if (app === 'model-viewer') {
        const modelPath = fileIcon.dataset.model;
        openModelViewer(name, modelPath);
      }
    });
  });
}

// Open the 3D model viewer (generic for any model)
function openModelViewer(fileName, modelPath) {
  const content = `
    <div class="guitarra-controls">
      <label>X: <input id="guitarra-scale-x" type="range" min="0.01" max="3" step="0.01" value="1"></label>
      <label>Y: <input id="guitarra-scale-y" type="range" min="0.01" max="3" step="0.01" value="1"></label>
      <label>Z: <input id="guitarra-scale-z" type="range" min="0.01" max="3" step="0.01" value="1"></label>
      <button id="guitarra-add-light" style="margin-left:8px">Añadir luz</button>
      <button id="guitarra-wireframe" style="margin-left:8px">Wireframe</button>
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
    initGuitarraScene(container, modelPath);
  } catch (e) {
    console.error('[desktop] initGuitarraScene error:', e);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const icons = document.querySelectorAll(".icon");

  icons.forEach(icon => {
    icon.addEventListener("dblclick", () => {
      const app = icon.dataset.app;

      if (app === "guitarra") {
        openFolder('guitarra');
      } else if (app === "muelle") {
        openFolder('muelle');
      }
    });
  });
});
