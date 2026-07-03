import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getAuth } from 'firebase/auth'

// IMPORTANTE - Jorge: cuando crees tu proyecto en Firebase Console,
// te va a dar un objeto de configuración parecido a este. Lo copias
// completo y lo pegas aquí abajo, reemplazando estos valores de ejemplo.

const firebaseConfig = {
  apiKey: 'AIzaSyApppfMcuD1t_CoILDecwK7DnMHp89g2E4',
  authDomain: 'ariabodas-admin.firebaseapp.com',
  projectId: 'ariabodas-admin',
  storageBucket: 'ariabodas-admin.firebasestorage.app',
  messagingSenderId: '725357936875',
  appId: '1:725357936875:web:788cf3eaf2ca35d165feae',
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const functions = getFunctions(app)
export const auth = getAuth(app)
