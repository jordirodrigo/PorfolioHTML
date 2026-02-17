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

  // Improved lighting setup
  const light1 = new THREE.DirectionalLight(0xffffff, 1.5);
  light1.position.set(10, 10, 10);
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0xffffff, 0.8);
  light2.position.set(-10, 5, -10);
  scene.add(light2);

  const ambient = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambient);
  
  // Add a point light for extra fill
  const pointLight = new THREE.PointLight(0xffffff, 0.5);
  pointLight.position.set(5, 3, 5);
  scene.add(pointLight);

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
    
    // Update animation mixer if present (for skeletal/rigging animations)
    if (ctx.mixer && ctx.animClock) {
      const delta = ctx.animClock.getDelta();
      ctx.mixer.update(delta);
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
          // Attempt to repair normals/materials for problematic models
          try { fixModelMaterials(gltf.scene, MODEL_PATH); } catch (e) { console.warn('[guitarra] fixModelMaterials failed', e); }
          cube.visible = false;
          // store model reference for scaling and morph targets
          container._guitarraContextModel = gltf.scene;
          if (container._guitarraContext) {
            container._guitarraContext.model = gltf.scene;
            // Store animations from GLTF for rigging/skeletal animations
            if (gltf.animations && gltf.animations.length > 0) {
              container._guitarraContext.animations = gltf.animations;
              console.log('[guitarra] found', gltf.animations.length, 'animations');
            }
            // If wireframe mode was already active, apply it to the newly-loaded model
            if (container._guitarraContext._wireframeMode) {
              try { toggleWireframe(container, true); } catch (e) { console.warn('[guitarra] apply wireframe on model load failed', e); }
            }
          }
          
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
            try { fixModelMaterials(gltf.scene, MODEL_PATH); } catch (e) { console.warn('[guitarra] fixModelMaterials failed (dynamic)', e); }
            cube.visible = false;
            container._guitarraContextModel = gltf.scene;
            if (container._guitarraContext) {
              container._guitarraContext.model = gltf.scene;
              // Store animations from GLTF for rigging/skeletal animations
              if (gltf.animations && gltf.animations.length > 0) {
                container._guitarraContext.animations = gltf.animations;
                console.log('[guitarra] found', gltf.animations.length, 'animations (dynamic)');
              }
              if (container._guitarraContext._wireframeMode) {
                try { toggleWireframe(container, true); } catch (e) { console.warn('[guitarra] apply wireframe on model load failed', e); }
              }
            }
            
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
        try {
          renderer.setClearColor(e.target.value);
          // If wireframe mode is active, reapply to update wireframe color to contrast new background
          if (ctx._wireframeMode) {
            try { toggleWireframe(container, true); } catch (err2) { console.warn('[guitarra] reapply wireframe after bg change failed', err2); }
          }
        } catch (err) { console.warn(err); }
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
function toggleWireframe(container, mode) {
  if (!container) return;
  const ctx = container._guitarraContext;
  if (!ctx) return;

  const togglingMeshes = ctx.model ? [ctx.model] : [ctx.cube];
  if (typeof mode === 'boolean') ctx._wireframeMode = mode;
  else ctx._wireframeMode = !(ctx._wireframeMode || false);

  // Get the background color to calculate contrasting wireframe color
  let bgColorObj;
  try {
    if (ctx.renderer && typeof ctx.renderer.getClearColor === 'function') {
      bgColorObj = ctx.renderer.getClearColor(new THREE.Color());
    }
  } catch (e) {
    bgColorObj = null;
  }
  if (!bgColorObj) bgColorObj = new THREE.Color(0x222222);
  const bgColorHex = bgColorObj.getHexString();
  const wireframeColor = getContrastingColor(bgColorHex);

  // Apply wireframe by swapping materials (more reliable across models/browsers)
  const applyWireframe = (obj) => {
    if (!obj.isMesh) {
      (obj.children || []).forEach(child => applyWireframe(child));
      return;
    }

    // Ensure original material stored
    if (!obj._originalMaterial) obj._originalMaterial = obj.material;

    if (ctx._wireframeMode) {
      // Replace material(s) with a simple MeshBasicMaterial in wireframe mode
      const orig = obj._originalMaterial;
      if (Array.isArray(orig)) {
        obj.material = orig.map(o => {
          const m = new THREE.MeshBasicMaterial({ color: wireframeColor, wireframe: true });
          if (o && o.morphTargets) m.morphTargets = true;
          return m;
        });
      } else {
        const m = new THREE.MeshBasicMaterial({ color: wireframeColor, wireframe: true });
        if (orig && orig.morphTargets) m.morphTargets = true;
        obj.material = m;
      }
      // mark needs update
      if (Array.isArray(obj.material)) obj.material.forEach(m => { m.needsUpdate = true; });
      else obj.material.needsUpdate = true;

      // Add vertex points overlay for clearer vertex visualization
      try {
        if (!obj._vertexPoints) {
          const ptsMat = new THREE.PointsMaterial({ color: wireframeColor, size: 3, sizeAttenuation: false });
          // Use the mesh geometry directly for points (shared, lightweight)
          obj._vertexPoints = new THREE.Points(obj.geometry, ptsMat);
          obj.add(obj._vertexPoints);
        } else {
          if (obj._vertexPoints.material && obj._vertexPoints.material.color) obj._vertexPoints.material.color.setHex(wireframeColor);
          obj._vertexPoints.visible = true;
        }
      } catch (e) {
        console.warn('[guitarra] could not create vertex points for', obj, e);
      }
    } else {
      // Restore original material if present
      if (obj._originalMaterial) {
        obj.material = obj._originalMaterial;
        if (Array.isArray(obj.material)) obj.material.forEach(m => { m.needsUpdate = true; });
        else if (obj.material) obj.material.needsUpdate = true;
      }

      // Remove vertex points overlay if present
      if (obj._vertexPoints) {
        try {
          obj.remove(obj._vertexPoints);
          if (obj._vertexPoints.geometry && obj._vertexPoints.geometry.dispose) obj._vertexPoints.geometry.dispose();
          if (obj._vertexPoints.material && obj._vertexPoints.material.dispose) obj._vertexPoints.material.dispose();
        } catch (e) { /* ignore */ }
        obj._vertexPoints = null;
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

// Repair geometry normals and material settings for loaded models.
function fixModelMaterials(rootObj, modelPath) {
  if (!rootObj) return;
  const isCamisa = typeof modelPath === 'string' && modelPath.toLowerCase().includes('camisa');

  const applyToMesh = (mesh) => {
    try {
      if (mesh.geometry) {
        // Ensure normals exist
        const normals = mesh.geometry.attributes && mesh.geometry.attributes.normal;
        if (!normals || normals.count === 0) {
          try { mesh.geometry.computeVertexNormals(); } catch (e) { /* ignore */ }
        }
      }

      if (mesh.material) {
        const fixMaterial = (mat) => {
          try {
            // Prefer front faces to avoid seeing hidden faces through the mesh
            if (mat.side === undefined || mat.side === THREE.DoubleSide) mat.side = THREE.FrontSide;
            // Ensure depth writes/tests to avoid render ordering issues
            if (typeof mat.depthWrite === 'boolean') mat.depthWrite = true;
            if (typeof mat.depthTest === 'boolean') mat.depthTest = true;
            // If model is the camisa and material is roughly a fabric, keep double-sided? but prefer front
          } catch (e) { /* ignore */ }
        };

        if (Array.isArray(mesh.material)) mesh.material.forEach(fixMaterial);
        else fixMaterial(mesh.material);
      }
    } catch (e) { /* ignore per-mesh */ }
  };

  rootObj.traverse(obj => {
    if (obj.isMesh) applyToMesh(obj);
  });
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



