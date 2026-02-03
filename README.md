/PortfolioHTML
│
├─ index.html                # Escritorio principal (Windows XP)
│
├─ /css
│   ├─ reset.css             # Reset / normalize
│   ├─ desktop.css           # Estilos del escritorio XP
│   ├─ windows.css           # Ventanas, barras, botones
│   └─ projects.css          # Estilos específicos de proyectos
│
├─ /js
│   ├─ core
│   │   ├─ desktop.js        # Lógica del escritorio (iconos, doble click)
│   │   ├─ windowManager.js  # Crear, mover, cerrar ventanas
│   │   └─ soundManager.js   # Sonidos UI (abrir, cerrar, error)
│   │
│   ├─ ui
│   │   ├─ taskbar.js        # Barra de inicio
│   │   ├─ startMenu.js      # Menú inicio
│   │   └─ controls.js       # Sliders, botones, toggles
│   │
│   ├─ projects
│   │   ├─ guitarra
│   │   │   ├─ guitarraScene.js   # Three.js escena guitarra
│   │   │   ├─ guitarraUI.js      # Botones (play, wireframe, escala)
│   │   │   └─ guitarraAudio.js   # Música y sincronización
│   │   │
│   │   ├─ katana
│   │   │   ├─ katanaScene.js
│   │   │   ├─ katanaUI.js
│   │   │   └─ katanaFX.js
│   │   │
│   │   └─ projectLoader.js  # Carga dinámica de proyectos
│   │
│   └─ main.js               # Punto de entrada JS
│
├─ /assets
│   ├─ /images
│   │   ├─ icons             # Iconos del escritorio
│   │   ├─ wallpapers        # Fondos estilo XP
│   │   └─ ui                # Botones, barras, etc.
│   │
│   ├─ /models
│   │   ├─ guitarra.glb
│   │   ├─ katana.glb
│   │   └─ props
│   │
│   ├─ /textures
│   │   ├─ guitarra
│   │   ├─ metal
│   │   └─ backgrounds
│   │
│   ├─ /audio
│   │   ├─ ui                # Clicks, abrir ventana
│   │   ├─ guitarra
│   │   └─ katana
│   │
│   └─ /fonts
│       └─ tahoma.ttf
│
├─ /pages
│   ├─ cv.html               # CV
│   ├─ about.html            # Sobre mí
│   └─ contact.html          # Contacto
│
├─ /vendor
│   ├─ three.min.js
│   └─ winbox.min.js         # (si decides usarlo)
│
└─ README.md