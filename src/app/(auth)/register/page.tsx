'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
// Wir importieren den bereits konfigurierten Client
import { supabase } from '@/supabaseClient';
import Link from 'next/link'

export default function RegisterPage() {
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Die Zeile "const supabase = createClient()" wurde entfernt, 
  // da wir supabase oben bereits importiert haben.

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/login?message=Check your email to confirm your account')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg border border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-2">ElectroBrain OS</h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">Create your account</p>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 bg-gray-700 text-white border border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none transition"
          />
          
          {error && <p className="text-red-500 text-sm">{error}</p>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}