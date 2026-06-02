import { createContext, useContext, useReducer, useEffect } from 'react'

const AuthContext = createContext(null)

const initialState = {
  auth: {
    currentUser: null,
    isLoggedIn: false
  }
}

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      localStorage.setItem('eventsphere_user', JSON.stringify(action.payload))
      return {
        ...state,
        auth: {
          currentUser: action.payload,
          isLoggedIn: true
        }
      }
    case 'LOGOUT':
      localStorage.removeItem('eventsphere_user')
      return {
        ...state,
        auth: {
          currentUser: null,
          isLoggedIn: false
        }
      }
    case 'UPDATE_USER':
      const updatedUser = { ...state.auth.currentUser, ...action.payload }
      localStorage.setItem('eventsphere_user', JSON.stringify(updatedUser))
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
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const saved = localStorage.getItem('eventsphere_user')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        dispatch({ type: 'INIT', payload: parsed })
      } catch (e) {
        localStorage.removeItem('eventsphere_user')
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

  const value = {
    currentUser: state.auth.currentUser,
    isLoggedIn: state.auth.isLoggedIn,
    login,
    logout,
    updateUser
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
