const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "")

export function apiUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${API_URL}${normalizedPath}`
}

export function resolveMediaUrl(url) {
  if (!url) return null
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return apiUrl(url.startsWith("/") ? url : `/${url}`)
}

export function authHeaders(extra = {}) {
  const token = localStorage.getItem("token")
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  }
}

let refreshPromise = null

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh_token")
  if (!refreshToken) return null

  const response = await fetch(apiUrl("/api/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!response.ok) return null

  const data = await response.json()
  if (!data.access_token) return null

  localStorage.setItem("token", data.access_token)
  if (data.refresh_token) {
    localStorage.setItem("refresh_token", data.refresh_token)
  }
  return data.access_token
}

export async function apiFetch(path, options = {}) {
  const { skipAuth = false, retryOnUnauthorized = true, ...fetchOptions } = options
  const headers = { ...fetchOptions.headers }

  if (!skipAuth) {
    Object.assign(headers, authHeaders())
  }

  let response = await fetch(apiUrl(path), { ...fetchOptions, headers })

  if (response.status === 401 && retryOnUnauthorized && !skipAuth) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null
      })
    }

    const newToken = await refreshPromise
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`
      response = await fetch(apiUrl(path), { ...fetchOptions, headers })
    }
  }

  return response
}

export async function logoutUser() {
  const token = localStorage.getItem("token")
  if (token) {
    try {
      await apiFetch("/api/auth/logout", {
        method: "POST",
        retryOnUnauthorized: false,
      })
    } catch {
      // Ignore network errors during logout.
    }
  }

  localStorage.removeItem("token")
  localStorage.removeItem("refresh_token")
  localStorage.removeItem("user")
}
