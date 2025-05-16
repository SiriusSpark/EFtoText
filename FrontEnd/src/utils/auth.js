const TokenKey = 'User-Token'

export function getToken() {
  return localStorage.getItem(TokenKey)
}

export function setToken(token) {
  if (!token || typeof token !== 'string') {
    console.error('Invalid token format:', token)
    return
  }
  return localStorage.setItem(TokenKey, token)
}

export function removeToken() {
  return localStorage.removeItem(TokenKey)
} 