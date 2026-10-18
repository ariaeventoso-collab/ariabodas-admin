// Quita acentos y mayúsculas para comparar textos:
// "Héctor Peña" -> "hector pena"
export function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

// true si TODAS las palabras buscadas aparecen en el nombre, sin importar
// acentos, mayúsculas ni el orden: "hector lopez" encuentra "López, Héctor"
export function coincideBusqueda(nombre, busqueda) {
  const palabras = normalizar(busqueda).split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return true
  const n = normalizar(nombre)
  return palabras.every(p => n.includes(p))
}
