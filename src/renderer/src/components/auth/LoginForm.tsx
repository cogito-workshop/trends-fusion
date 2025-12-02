import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { AlertCircle } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试')
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-muted/50 p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1 text-center'>
          <div className='mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4'>
            <span className='text-primary-foreground font-bold text-xl'>T</span>
          </div>
          <CardTitle className='text-2xl'>登录 Trends Fusion</CardTitle>
          <CardDescription>使用您的账户登录以继续</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className='space-y-4'>
            {error && (
              <div className='flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive'>
                <AlertCircle className='h-4 w-4' />
                {error}
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='email'>邮箱</Label>
              <Input
                id='email'
                type='email'
                placeholder='your@email.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className='space-y-2'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='password'>密码</Label>
                <Link to='/auth/forgot-password' className='text-sm text-primary hover:underline'>
                  忘记密码？
                </Link>
              </div>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className='flex flex-col space-y-4'>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? '登录中...' : '登录'}
            </Button>
            <p className='text-center text-sm text-muted-foreground'>
              还没有账户？{' '}
              <Link to='/auth/register' className='text-primary hover:underline'>
                立即注册
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
