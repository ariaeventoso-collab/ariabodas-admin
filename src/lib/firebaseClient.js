import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getAuth } from 'firebase/auth'

// IMPORTANTE - Jorge: cuando crees tu proyecto en Firebase Console,
// te va a dar un objeto de configuración parecido a este. Lo copias
// completo y lo pegas aquí abajo, reemplazando estos valores de ejemplo.

const firebaseConfig = {
  apiKey: 'PEGA_AQUI_TU_API_KEY',
  authDomain: 'PEGA_AQUI_TU_AUTH_DOMAIN',
  projectId: 'PEGA_AQUI_TU_PROJECT_ID',
  storageBucket: 'PEGA_AQUI_TU_STORAGE_BUCKET',
  messagingSenderId: 'PEGA_AQUI_TU_SENDER_ID',
  appId: 'PEGA_AQUI_TU_APP_ID',
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const functions = getFunctions(app)
export const auth = getAuth(app)
