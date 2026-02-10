function initGuitarraScene(container, modelPath) {
  console.log('[guitarra] initGuitarraScene called with container:', container, 'modelPath:', modelPath);
  if (!container) container = document.getElementById('guitarra-canvas');
  if (!container) {
    console.warn('[guitarra] no container found for guitarra-canvas');
    return;
  }

  // Use provided modelPath or default to guitarra.glb
  const MODEL_PATH = modelPath || 'assets/models/guitarra.glb';

  // avoid double initialization for same container
  if (container._guitarraContext) {
    console.log('[guitarra] container already initialized');
    return container._guitarraContext;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 1, 3);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x222222);
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);
  console.log('[guitarra] renderer appended, size:', container.clientWidth, container.clientHeight);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 5, 5);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0x606060);
  scene.add(ambient);

  // demo cube (will hide if model loads)
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: 0x8AC });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 0.5, 0);
  scene.add(cube);
  cube.scale.set(1.2, 1.2, 1.2);
  camera.lookAt(cube.position);

  // Store original materials for wireframe toggle
  cube._originalMaterial = material;

  // set up orbit controls if available
  let controls = null;
  if (typeof THREE !== 'undefined' && THREE.OrbitControls) {
    try {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.target.copy(cube.position);
      controls.enableDamping = true;
      controls.update();
      console.log('[guitarra] OrbitControls initialized');
    } catch (e) {
      console.warn('[guitarra] OrbitControls init failed:', e);
    }
  } else if (typeof window !== 'undefined' && window.OrbitControls) {
    try {
      controls = new window.OrbitControls(camera, renderer.domElement);
      controls.target.copy(cube.position);
      controls.enableDamping = true;
      controls.update();
      console.log('[guitarra] OrbitControls (window) initialized');
    } catch (e) {
      console.warn('[guitarra] OrbitControls (window) init failed:', e);
    }
  }

  // If controls not available, try dynamic import of OrbitControls ES module
  if (!controls) {
    const ctrlUrl = 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/controls/OrbitControls.js';
    console.log('[guitarra] attempting dynamic import of OrbitControls module:', ctrlUrl);
    import(ctrlUrl).then(mod => {
      const OrbitControls = mod.OrbitControls || mod.default;
      try {
        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.copy(cube.position);
        controls.enableDamping = true;
        controls.update();
        // store in context if created later
        if (container._guitarraContext) container._guitarraContext.controls = controls;
        console.log('[guitarra] OrbitControls loaded via dynamic import');
      } catch (e) {
        console.warn('[guitarra] OrbitControls construction failed (dynamic):', e);
      }
    }).catch(err => {
      console.warn('[guitarra] dynamic import of OrbitControls failed:', err);
    });
  }

  // ensure pointer interactions work across browsers
  try { renderer.domElement.style.touchAction = 'none'; } catch (e) {}

  // animation loop (per-container)
  let rafId = null;
  let animTime = 0;
  function animate() {
    rafId = requestAnimationFrame(animate);
    animTime += 0.01;
    
    cube.rotation.y += 0.01;
    
    // Apply morph target animation only if not manually controlled by slider
    if (ctx.morphTargetMeshes && !ctx.morphTargetManual) {
      ctx.morphTargetMeshes.forEach(({ mesh, targetIndex }) => {
        mesh.morphTargetInfluences[targetIndex] = Math.abs(Math.sin(animTime));
      });
    }
    
    if (controls && typeof controls.update === 'function') controls.update();
    renderer.render(scene, camera);
  }

  // Create GLTFLoader with fallbacks
  let LoaderClass = null;
  if (typeof THREE !== 'undefined' && THREE.GLTFLoader) {
    LoaderClass = THREE.GLTFLoader;
    console.log('[guitarra] using THREE.GLTFLoader');
  } else if (typeof window !== 'undefined' && window.GLTFLoader) {
    LoaderClass = window.GLTFLoader;
    console.log('[guitarra] using global GLTFLoader');
  } else if (typeof GLTFLoader !== 'undefined') {
    LoaderClass = GLTFLoader;
    console.log('[guitarra] using GLTFLoader (typeof)');
  } else {
    console.warn('[guitarra] no GLTFLoader available; skipping model load');
  }

  if (LoaderClass) {
    try {
      if (LoaderClass && LoaderClass.default) LoaderClass = LoaderClass.default;
      console.log('[guitarra] LoaderClass type:', typeof LoaderClass, LoaderClass);
      const loader = new LoaderClass();
      console.log('[guitarra] loading model:', MODEL_PATH);
      loader.load(
        MODEL_PATH,
        gltf => {
          console.log('[guitarra] model loaded', gltf);
          scene.add(gltf.scene);
          cube.visible = false;
          // store model reference for scaling and morph targets
          container._guitarraContextModel = gltf.scene;
          if (container._guitarraContext) container._guitarraContext.model = gltf.scene;
          
          // Hook morph target "ojos" if present
          try {
            attachMorphTargetSlider(container, gltf.scene, 'ojos', 'guitarra-morph-ojos');
          } catch (e) {
            console.warn('[guitarra] morph target hookup failed:', e);
          }

          try {
            const box = new THREE.Box3().setFromObject(gltf.scene);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            const cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.5;
            camera.position.set(center.x, center.y + maxDim * 0.25, center.z + cameraZ);
            camera.lookAt(center);
            camera.updateProjectionMatrix();
            console.log('[guitarra] adjusted camera to frame model', { size, center, cameraZ });
          } catch (e) {
            console.warn('[guitarra] error framing model:', e);
          }
        },
        undefined,
        error => {
          console.error('[guitarra] model load error:', error);
        }
      );
    } catch (e) {
      console.error('[guitarra] LoaderClass construction error:', e);
    }
  } else {
    // try dynamic import of the ES module version of GLTFLoader
    const loaderUrl = 'https://cdn.jsdelivr.net/npm/three@0.150.1/examples/jsm/loaders/GLTFLoader.js';
    console.log('[guitarra] attempting dynamic import of GLTFLoader module:', loaderUrl);
    import(loaderUrl).then(mod => {
      const GLTFLoader = mod.GLTFLoader;
      if (!GLTFLoader) {
        console.error('[guitarra] dynamic import did not provide GLTFLoader');
        return;
      }
      try {
        const loader = new GLTFLoader();
        console.log('[guitarra] loading model via dynamic import:', MODEL_PATH);
        loader.load(
          MODEL_PATH,
          gltf => {
            console.log('[guitarra] model loaded', gltf);
            scene.add(gltf.scene);
            cube.visible = false;
            container._guitarraContextModel = gltf.scene;
            if (container._guitarraContext) container._guitarraContext.model = gltf.scene;
            
            // Hook morph target "ojos" if present
            try {
              attachMorphTargetSlider(container, gltf.scene, 'ojos', 'guitarra-morph-ojos');
            } catch (e) {
              console.warn('[guitarra] morph target hookup failed (dynamic):', e);
            }

            try {
              const box = new THREE.Box3().setFromObject(gltf.scene);
              const size = box.getSize(new THREE.Vector3());
              const center = box.getCenter(new THREE.Vector3());
              const maxDim = Math.max(size.x, size.y, size.z);
              const fov = camera.fov * (Math.PI / 180);
              const cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * 1.5;
              camera.position.set(center.x, center.y + maxDim * 0.25, center.z + cameraZ);
              camera.lookAt(center);
              camera.updateProjectionMatrix();
              console.log('[guitarra] adjusted camera to frame model', { size, center, cameraZ });
            } catch (e) {
              console.warn('[guitarra] error framing model (dynamic):', e);
            }
          },
          undefined,
          error => {
            console.error('[guitarra] model load error (dynamic):', error);
          }
        );
      } catch (e) {
        console.error('[guitarra] GLTFLoader construction error (dynamic):', e);
      }
    }).catch(err => {
      console.error('[guitarra] dynamic import of GLTFLoader failed:', err);
    });
  }

  // store context on container so we can resize/stop later
  const ctx = {
    scene,
    camera,
    renderer,
    controls,
    cube,
    animate,
    stop: () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (controls && typeof controls.dispose === 'function') controls.dispose();
    }
  };
  container._guitarraContext = ctx;

  // if model was loaded earlier (before ctx created), attach it
  if (container._guitarraContextModel) {
    ctx.model = container._guitarraContextModel;
    delete container._guitarraContextModel;
  }

  // Attach scale slider (if present in the same window)
  try {
    const win = container.closest('.window');
    const sx = win ? win.querySelector('#guitarra-scale-x') : document.getElementById('guitarra-scale-x');
    const sy = win ? win.querySelector('#guitarra-scale-y') : document.getElementById('guitarra-scale-y');
    const sz = win ? win.querySelector('#guitarra-scale-z') : document.getElementById('guitarra-scale-z');
    const lightBtn = win ? win.querySelector('#guitarra-add-light') : document.getElementById('guitarra-add-light');
    const wireframeBtn = win ? win.querySelector('#guitarra-wireframe') : document.getElementById('guitarra-wireframe');
    const color = win ? win.querySelector('#guitarra-bg') : document.getElementById('guitarra-bg');

    const applyScaleXYZ = (x, y, z) => {
      const vx = parseFloat(x) || 1;
      const vy = parseFloat(y) || 1;
      const vz = parseFloat(z) || 1;
      if (ctx.model) {
        ctx.model.scale.set(vx, vy, vz);
      } else {
        cube.scale.set(vx, vy, vz);
      }
    };

    if (sx || sy || sz) {
      const STEPS = 10;
      const snapValue = (raw, el) => {
        const min = parseFloat(el.min || 0);
        const max = parseFloat(el.max || 1);
        const t = STEPS - 1;
        const ratio = (parseFloat(raw) - min) / (max - min || 1);
        const snappedRatio = Math.round(ratio * t) / t;
        const snapped = min + snappedRatio * (max - min);
        return Number(snapped.toFixed(3));
      };

      const readApply = () => {
        const vx = sx ? snapValue(sx.value, sx) : 1;
        const vy = sy ? snapValue(sy.value, sy) : 1;
        const vz = sz ? snapValue(sz.value, sz) : 1;
        if (sx) sx.value = vx;
        if (sy) sy.value = vy;
        if (sz) sz.value = vz;
        applyScaleXYZ(vx, vy, vz);
      };

      if (sx) sx.addEventListener('input', readApply);
      if (sy) sy.addEventListener('input', readApply);
      if (sz) sz.addEventListener('input', readApply);
      readApply();
    }

    if (color) {
      color.addEventListener('input', e => {
        try { renderer.setClearColor(e.target.value); } catch (err) { console.warn(err); }
      });
      try { renderer.setClearColor(color.value); } catch (err) {}
    }

    if (lightBtn) {
      lightBtn.addEventListener('click', () => {
        try {
          toggleCenterLight(container);
        } catch (err) { console.error('[guitarra] toggle light failed', err); }
      });
    }

    if (wireframeBtn) {
      wireframeBtn.addEventListener('click', () => {
        try {
          toggleWireframe(container);
        } catch (err) { console.error('[guitarra] toggle wireframe failed', err); }
      });
    }
  } catch (e) {
    console.warn('[guitarra] slider hookup failed:', e);
  }

  // start animation
  animate();

  return ctx;
}

function resizeGuitarraScene(container) {
  if (!container) return;
  const ctx = container._guitarraContext;
  if (!ctx) return;
  const { renderer, camera } = ctx;
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  console.log('[guitarra] resized renderer to', w, h);
  if (ctx.controls && typeof ctx.controls.update === 'function') ctx.controls.update();
}

// Toggle a point light placed near the scene center
function toggleCenterLight(container) {
  if (!container) return;
  const ctx = container._guitarraContext;
  if (!ctx) return;

  if (ctx.centerLight) {
    // Remove light and helper
    ctx.scene.remove(ctx.centerLight);
    if (ctx.centerLightHelper) ctx.scene.remove(ctx.centerLightHelper);
    ctx.centerLight = null;
    ctx.centerLightHelper = null;
    console.log('[guitarra] center light removed');
  } else {
    // Create new light
    const light = new THREE.PointLight(0xffff00, 1);
    if (ctx.model) {
      const box = new THREE.Box3().setFromObject(ctx.model);
      const center = box.getCenter(new THREE.Vector3());
      light.position.copy(center).add(new THREE.Vector3(0, 0.5, 0));
    } else {
      light.position.set(0, 1, 0);
    }
    ctx.scene.add(light);
    
    const helper = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00 })
    );
    helper.position.copy(light.position);
    ctx.scene.add(helper);
    
    ctx.centerLight = light;
    ctx.centerLightHelper = helper;
    console.log('[guitarra] center light added at', light.position);
  }
}

// Toggle wireframe mode with thick lines and contrasting color
function toggleWireframe(container) {
  if (!container) return;
  const ctx = container._guitarraContext;
  if (!ctx) return;

  const togglingMeshes = ctx.model ? [ctx.model] : [ctx.cube];
  ctx._wireframeMode = !(ctx._wireframeMode || false);

  // Get the background color to calculate contrasting wireframe color
  const bgColorHex = ctx.renderer.getClearColor().getHexString();
  const wireframeColor = getContrastingColor(bgColorHex);

  // Apply wireframe with thick edges geometry
  const applyWireframe = (obj) => {
    if (!obj.isMesh) {
      (obj.children || []).forEach(child => applyWireframe(child));
      return;
    }

    if (ctx._wireframeMode) {
      // Create edges geometry for thick wireframe
      if (!obj._edgesLine) {
        const edgesGeometry = new THREE.EdgesGeometry(obj.geometry);
        const edgesMaterial = new THREE.LineBasicMaterial({ color: wireframeColor, linewidth: 2 });
        obj._edgesLine = new THREE.LineSegments(edgesGeometry, edgesMaterial);
        obj._originalMaterial = obj.material;
        obj.add(obj._edgesLine);
      } else {
        // Update color if wireframe already exists
        obj._edgesLine.material.color.setHex(wireframeColor);
      }
      // Hide original material, show edges
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.visible = false);
      } else {
        obj.material.visible = false;
      }
      obj._edgesLine.visible = true;
    } else {
      // Show original material, hide edges
      if (obj._edgesLine) {
        obj._edgesLine.visible = false;
      }
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.visible = true);
      } else {
        obj.material.visible = true;
      }
    }

    (obj.children || []).forEach(child => applyWireframe(child));
  };

  togglingMeshes.forEach(obj => applyWireframe(obj));
  console.log('[guitarra] wireframe toggled to', ctx._wireframeMode, 'color:', wireframeColor);
}

// Calculate complementary color for good contrast
function getContrastingColor(hexColor) {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // If background is dark, use bright color; if bright, use dark color
  if (luminance > 0.5) {
    // Bright background - use dark wireframe
    return 0x1a1a1a; // Dark gray/black
  } else {
    // Dark background - use bright complementary color
    // Calculate complementary by inverting in HSL space
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    
    // Invert RGB for complementary effect
    const compR = 255 - r;
    const compG = 255 - g;
    const compB = 255 - b;
    
    // Convert back to hex
    const compHex = ((compR << 16) | (compG << 8) | compB);
    return compHex;
  }
}

// Attach morph target slider
function attachMorphTargetSlider(container, sceneObject, targetName, sliderId) {
  if (!container) return;
  const ctx = container._guitarraContext;
  if (!ctx) return;

  const win = container.closest('.window');
  const slider = win ? win.querySelector('#' + sliderId) : document.getElementById(sliderId);
  if (!slider) {
    console.warn('[guitarra] morph slider not found:', sliderId);
    return;
  }

  // Find mesh with morph targets
  let meshWithTarget = null;
  let targetIndex = -1;

  const searchForTarget = (obj) => {
    if (obj.isMesh && obj.morphTargetInfluences && obj.morphTargetDictionary) {
      const idx = obj.morphTargetDictionary[targetName];
      if (idx !== undefined) {
        meshWithTarget = obj;
        targetIndex = idx;
        return true;
      }
    }
    for (const child of (obj.children || [])) {
      if (searchForTarget(child)) return true;
    }
    return false;
  };

  const searchRoot = sceneObject || ctx.model || ctx.cube;
  if (searchRoot) searchForTarget(searchRoot);

  if (!meshWithTarget || targetIndex < 0) {
    console.warn('[guitarra] morph target not found:', targetName);
    return;
  }

  console.log('[guitarra] attached morph target slider for', targetName, 'index', targetIndex);

  // Store mesh info for animation loop
  ctx.morphTargetMeshes = [{ mesh: meshWithTarget, targetIndex }];
  ctx.morphTargetManual = false;

  // Slider interaction
  slider.addEventListener('mousedown', () => { ctx.morphTargetManual = true; });
  slider.addEventListener('mouseup', () => { ctx.morphTargetManual = false; });
  slider.addEventListener('touchstart', () => { ctx.morphTargetManual = true; });
  slider.addEventListener('touchend', () => { ctx.morphTargetManual = false; });

  slider.addEventListener('input', (e) => {
    meshWithTarget.morphTargetInfluences[targetIndex] = parseFloat(e.target.value);
  });
}



