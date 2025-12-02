import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // 检查本地存储中的用户信息
    const checkAuth = () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('user')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, _password: string) => {
    setIsLoading(true)
    try {
      // 简单的本地认证 - 在生产环境中应该调用真实API
      const storedUsers = localStorage.getItem('registeredUsers')
      const registeredUsers = storedUsers ? JSON.parse(storedUsers) : []

      const foundUser = registeredUsers.find((u: any) => u.email === email)

      if (!foundUser) {
        throw new Error('用户不存在')
      }

      const user: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name
      }

      setUser(user)
      localStorage.setItem('user', JSON.stringify(user))
    } catch (error) {
      throw new Error('登录失败')
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, _password: string, name: string) => {
    setIsLoading(true)
    try {
      // 简单的本地注册 - 在生产环境中应该调用真实API
      const storedUsers = localStorage.getItem('registeredUsers')
      const registeredUsers = storedUsers ? JSON.parse(storedUsers) : []

      // 检查用户是否已存在
      const existingUser = registeredUsers.find((u: any) => u.email === email)
      if (existingUser) {
        throw new Error('用户已存在')
      }

      const newUser = {
        id: Date.now().toString(),
        email,
        name
      }

      registeredUsers.push(newUser)
      localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers))

      const user: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      }

      setUser(user)
      localStorage.setItem('user', JSON.stringify(user))
    } catch (error) {
      throw new Error('注册失败')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
