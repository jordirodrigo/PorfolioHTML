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

        // Inicializamos Three.js
        initGuitarraScene();
      }
    });
  });
});
