import crossRefs from '../data/cross-references.json'

export function resolveCrossRef(id) {
  return crossRefs.references?.[id] || null
}

export function resolveCrossRefs(ids) {
  if (!ids || !Array.isArray(ids)) return []
  return ids
    .map(id => {
      const ref = resolveCrossRef(id)
      return ref ? { id, ...ref } : null
    })
    .filter(Boolean)
}
