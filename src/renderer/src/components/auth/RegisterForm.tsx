import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card'
import { AlertCircle } from 'lucide-react'

export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const { register, isLoading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('密码不匹配')
      return
    }

    if (password.length < 6) {
      setError('密码至少需要6个字符')
      return
    }

    try {
      await register(email, password, name)
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请重试')
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-muted/50 p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1 text-center'>
          <div className='mx-auto h-12 w-12 rounded-lg bg-primary flex items-center justify-center mb-4'>
            <span className='text-primary-foreground font-bold text-xl'>T</span>
          </div>
          <CardTitle className='text-2xl'>注册 Trends Fusion</CardTitle>
          <CardDescription>创建您的账户开始使用</CardDescription>
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
              <Label htmlFor='name'>姓名</Label>
              <Input
                id='name'
                type='text'
                placeholder='您的姓名'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
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
              <Label htmlFor='password'>密码</Label>
              <Input
                id='password'
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder='至少6个字符'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>确认密码</Label>
              <Input
                id='confirmPassword'
                type='password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder='再次输入密码'
              />
            </div>
          </CardContent>
          <CardFooter className='flex flex-col space-y-4'>
            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? '注册中...' : '注册'}
            </Button>
            <p className='text-center text-sm text-muted-foreground'>
              已有账户？{' '}
              <Link to='/auth/login' className='text-primary hover:underline'>
                立即登录
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
