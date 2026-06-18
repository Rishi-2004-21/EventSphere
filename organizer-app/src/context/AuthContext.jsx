import { createContext, useContext, useReducer, useEffect } from 'react'

const AuthContext = createContext(null)

const initialTheme = localStorage.getItem('organizer_theme') || 'dark'
// Apply theme immediately to avoid flash of wrong colors
document.documentElement.setAttribute('data-theme', initialTheme)
document.body.setAttribute('data-theme', initialTheme)

const initialState = {
  auth: {
    currentUser: null,
    isLoggedIn: false
  },
  theme: initialTheme
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      sessionStorage.setItem('tixque_user', JSON.stringify(action.payload))
      return {
        ...state,
        auth: {
          currentUser: action.payload,
          isLoggedIn: true
        }
      }
    case 'LOGOUT':
      sessionStorage.removeItem('tixque_user')
      return {
        ...state,
        auth: {
          currentUser: null,
          isLoggedIn: false
        }
      }
    case 'UPDATE_USER':
      const updatedUser = { ...state.auth.currentUser, ...action.payload }
      sessionStorage.setItem('tixque_user', JSON.stringify(updatedUser))
      return {
        ...state,
        auth: {
          ...state.auth,
          currentUser: updatedUser
        }
      }
    case 'INIT':
      return {
        ...state,
        auth: {
          currentUser: action.payload,
          isLoggedIn: true
        }
      }
    case 'TOGGLE_THEME':
      const newTheme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('organizer_theme', newTheme)
      document.documentElement.setAttribute('data-theme', newTheme)
      document.body.setAttribute('data-theme', newTheme)
      return {
        ...state,
        theme: newTheme
      }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const saved = sessionStorage.getItem('tixque_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        dispatch({ type: 'INIT', payload: parsed })
      } catch (e) {
        sessionStorage.removeItem('tixque_user')
      }
    }
  }, [])

  function login(user) {
    dispatch({ type: 'LOGIN', payload: user })
  }

  function logout() {
    dispatch({ type: 'LOGOUT' })
  }

  function updateUser(updates) {
    dispatch({ type: 'UPDATE_USER', payload: updates })
  }

  function toggleTheme() {
    dispatch({ type: 'TOGGLE_THEME' })
  }

  const value = {
    currentUser: state.auth.currentUser,
    isLoggedIn: state.auth.isLoggedIn,
    theme: state.theme,
    login,
    logout,
    updateUser,
    toggleTheme
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
