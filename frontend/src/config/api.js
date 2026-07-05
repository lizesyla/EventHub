// URL-ja e backend-it - vjen nga variabla e environment-it VITE_API_URL
// Nëse s'është vendosur (p.sh. gjatë zhvillimit lokal), përdor localhost si default
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
