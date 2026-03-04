import { login, signup } from './actions'

export default async function LoginPage(props: { searchParams: Promise<{ message: string }> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
      <form className="flex w-full max-w-md flex-col justify-center gap-4 rounded-xl bg-white p-8 shadow-lg border border-gray-100">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-4">FinanceReel Score</h1>
        
        <label className="text-sm font-semibold text-gray-700" htmlFor="email">Email</label>
        <input
          className="rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          name="email"
          placeholder="creator@example.com"
          required
        />
        
        <label className="text-sm font-semibold text-gray-700 mt-2" htmlFor="password">Password</label>
        <input
          className="rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        
        <div className="flex flex-col gap-2 mt-4">
          <button formAction={login} className="rounded-md bg-blue-600 px-4 py-2 text-white font-semibold hover:bg-blue-700 transition-all">
            Sign In
          </button>
          <button formAction={signup} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 font-semibold hover:bg-gray-50 transition-all">
            Create Account
          </button>
        </div>

        {searchParams?.message && (
          <p className="mt-4 text-center text-sm text-red-600 bg-red-50 p-2 rounded-md">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  )
}
