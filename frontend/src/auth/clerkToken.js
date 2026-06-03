let clerkTokenGetter = null

export function setClerkTokenGetter(getter) {
  clerkTokenGetter = typeof getter === 'function' ? getter : null
}

export async function getClerkBearerToken() {
  if (!clerkTokenGetter) return null
  try {
    return await clerkTokenGetter()
  } catch {
    return null
  }
}
