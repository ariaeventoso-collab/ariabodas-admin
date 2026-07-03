import PlantillaClasica from './PlantillaClasica'
import PlantillaJardinBotanico from './PlantillaJardinBotanico'

// ============================================
// REGISTRO DE PLANTILLAS
// Cada boda tiene un campo "plantilla_id" que dice cuál usar.
// Para agregar una plantilla nueva (ej. diseñada en Lovable):
//   1. Crea el archivo PlantillaNombre.jsx en esta misma carpeta
//   2. Impórtalo aquí arriba
//   3. Agrégalo al objeto de abajo con un id corto (ej. "moderna")
// No hay que tocar nada más - PublicInvitation.jsx la reconoce sola.
// ============================================

export const plantillas = {
  clasica: PlantillaClasica,
  jardin_botanico: PlantillaJardinBotanico,
}

export const plantillaPorDefecto = 'clasica'
