import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Uploader from '@/components/Uploader' // <-- Add this import

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">FinanceReel Score</h1>
          <div className="bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
            <p className="text-blue-700 font-bold text-sm">Credits: {profile?.credits}</p>
          </div>
        </header>
        
        <main>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-6">Score a new Hook</h2>
            
            {/* The FFmpeg component goes here! */}
            <Uploader />
            
          </div>
        </main>
      </div>
    </div>
  )
}
