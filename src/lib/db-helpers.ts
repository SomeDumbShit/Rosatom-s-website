// Helpers for working with JSON arrays in SQLite

export function serializeArray(arr: string[] | null | undefined): string {
  if (!arr || arr.length === 0) return '[]'
  return JSON.stringify(arr)
}

export function deserializeArray(str: string | null | undefined): string[] {
  if (!str) return []
  try {
    const parsed = JSON.parse(str)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function serializeNGO(data: any) {
  return {
    ...data,
    categories: serializeArray(data.categories),
  }
}

export function deserializeNGO(ngo: any) {
  if (!ngo) return null
  return {
    ...ngo,
    categories: deserializeArray(ngo.categories),
  }
}

export function serializeEvent(data: any) {
  return {
    ...data,
    helpType: serializeArray(data.helpType),
  }
}

export function deserializeEvent(event: any) {
  if (!event) return null
  return {
    ...event,
    helpType: deserializeArray(event.helpType),
  }
}

export function serializeProject(data: any) {
  return {
    ...data,
    images: data.images ? serializeArray(data.images) : null,
  }
}

export function deserializeProject(project: any) {
  if (!project) return null
  return {
    ...project,
    images: deserializeArray(project.images),
  }
}
