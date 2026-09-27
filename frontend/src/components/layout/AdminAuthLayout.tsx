import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'

export function AdminAuthLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-body selection:bg-zinc-800 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-zinc-900 p-2 rounded-xl ring-1 ring-zinc-800 group-hover:ring-zinc-700 transition-all">
              <Shield className="w-8 h-8 text-zinc-100" />
            </div>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Secure access to MentorQ management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-zinc-900 py-8 px-4 shadow-2xl ring-1 ring-zinc-800 sm:rounded-2xl sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
