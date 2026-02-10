function initGuitarraScene(container) {
  console.log('[guitarra] initGuitarraScene called with container:', container);
  if (!container) {
    container = document.getElementById("guitarra-canvas");
  }
  if (!container) {
    console.warn('[guitarra] no container found for guitarra-canvas');
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth/container.clientHeight, 0.1, 100);
  camera.position.set(0,1,3);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x222222);
  // make sure canvas is visible and not affected by inline styles
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);
  console.log('[guitarra] renderer appended, size:', container.clientWidth, container.clientHeight);

  const light = new THREE.DirectionalLight(0xffffff,1);
  light.position.set(5,5,5);
  scene.add(light);

  // ambient so the cube is visible from all sides
  const ambient = new THREE.AmbientLight(0x606060);
  scene.add(ambient);

  // --- Cube fallback / demo object ---
  const geometry = new THREE.BoxGeometry(1,1,1);
  const material = new THREE.MeshStandardMaterial({color: 0x8AC});
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(0, 0.5, 0);
  scene.add(cube);
  cube.scale.set(1.2,1.2,1.2);
  // ensure camera looks at the cube
  camera.lookAt(cube.position);

  const loader = new THREE.GLTFLoader();
  console.log('[guitarra] loading model: assets/models/guitarra.glb');
  loader.load(
    "assets/models/guitarra.glb",
    gltf => {
      console.log('[guitarra] model loaded', gltf);
      scene.add(gltf.scene);
      // if model loads, you may want to hide or reposition cube
      cube.visible = false;
      // model loaded; scene already animating
    },
    undefined,
    error => {
      console.error('[guitarra] model load error:', error);
      // still animate the cube even if model fails to load
      // errors don't stop the demo cube animation
    }
  );

  function animate() {
    requestAnimationFrame(animate);
    // Rotate demo cube
    cube.rotation.y += 0.01;
    renderer.render(scene,camera);
  }

  // Start animation loop immediately so the demo cube is visible
  animate();
}
