# AriaBodas - Panel administrativo

Este es el proyecto real del panel de administrador. Aquí está lo que contiene:

- `index.html` — la página base
- `src/main.jsx` — arranca la aplicación
- `src/App.jsx` — componente principal
- `src/components/AdminPanel.jsx` — el panel que ves con tus bodas
- `src/lib/firebaseClient.js` — conexión a tu base de datos (aquí va tu configuración de Firebase)
- `src/index.css` — colores y tipografías de AriaBodas
- `firestore_estructura.txt` — cómo están organizados los datos (bodas, invitados, mesas)
- `firestore.rules` — reglas de seguridad (quién puede ver/editar qué)
- `functions/index.js` — funciones para que los invitados confirmen su RSVP sin necesitar cuenta

## Qué falta antes de que funcione con datos reales

1. Crear tu proyecto gratuito en console.firebase.google.com
2. Activar Firestore Database dentro de ese proyecto
3. Pegar las reglas de `firestore.rules` en Firebase Console > Firestore Database > Reglas
4. Copiar tu configuración de Firebase dentro de `src/lib/firebaseClient.js`
5. Publicar las funciones de `functions/index.js` (esto usa Firebase CLI, algo que ya conoces de Railway/Firebase)
6. Subir este proyecto a Vercel, Firebase Hosting, o Railway (como prefieras) para que quede en línea

Todo esto lo vemos juntos paso a paso cuando llegue el momento.
