function initGuitarraScene() {
  const container = document.getElementById("guitarra-canvas");
  if (!container) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth/container.clientHeight, 0.1, 100);
  camera.position.set(0,1,3);

  const renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff,1);
  light.position.set(5,5,5);
  scene.add(light);

  const loader = new THREE.GLTFLoader();
  loader.load(
    "assets/models/guitarra.glb",
    gltf => {
      scene.add(gltf.scene);
      animate();
    },
    undefined,
    error => console.error(error)
  );

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene,camera);
  }
}
