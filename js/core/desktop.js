document.addEventListener("DOMContentLoaded", () => {
  const icons = document.querySelectorAll(".icon");

  icons.forEach(icon => {
    icon.addEventListener("dblclick", () => {
      const app = icon.dataset.app;

      if (app === "guitarra") {
        // Creamos ventana
        const win = createWindow(
          "Proyecto Guitarra",
          '<div id="guitarra-canvas" style="width:400px;height:300px;"></div>'
        );

        // Inicializamos Three.js, pasando el contenedor creado
        const container = win.querySelector('#guitarra-canvas');
        console.log('[desktop] created window, guitarra container:', container);
        try {
          initGuitarraScene(container);
        } catch (e) {
          console.error('[desktop] initGuitarraScene error:', e);
        }
      }
    });
  });
});
