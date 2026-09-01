import PlantillaClasica from './PlantillaClasica'
import PlantillaJardinBotanico from './PlantillaJardinBotanico'
import PlantillaGaleriaElegante from './PlantillaGaleriaElegante'
import PlantillaPaolaYJorge from './PlantillaPaolaYJorge'

// ============================================
// REGISTRO DE PLANTILLAS
// Cada boda tiene un campo "plantilla_id" que dice cuál usar.
// Para agregar una plantilla nueva (ej. diseñada en Lovable):
//   1. Crea el archivo PlantillaNombre.jsx en esta misma carpeta
//   2. Impórtalo aquí arriba
//   3. Agrégalo al objeto de abajo con un id corto (ej. "moderna")
// No hay que tocar nada más - PublicInvitation.jsx la reconoce sola.
//
// "paola_y_jorge" es una plantilla DEDICADA, solo para ese evento
// (nombres, fecha e itinerario están escritos directo en el archivo).
// ============================================

export const plantillas = {
  clasica: PlantillaClasica,
  jardin_botanico: PlantillaJardinBotanico,
  galeria_elegante: PlantillaGaleriaElegante,
  paola_y_jorge: PlantillaPaolaYJorge,
}

export const plantillaPorDefecto = 'clasica'
