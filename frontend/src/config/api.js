const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!API_BASE_URL) {
  console.warn("VITE_API_BASE_URL is not set. Falling back to http://localhost:8000")
}

export const apiUrl = (path = "") => {
  const base = (API_BASE_URL || "http://localhost:8000").replace(/\/$/, "")
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${base}${normalizedPath}`
}