import { google } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

const ScoreSchema = z.object({
  viralityScore: z.number().min(0).max(100),
  hookStrength: z.number().min(0).max(100),
  emotionalTriggers: z.array(z.string()),
  suggestedRewrite: z.string(),
  riskFlags: z.array(z.string())
})

export async function POST(req: Request) {
  try {
    // 1. Verify the user has credits left using our Supabase utility
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()

    if (!profile || profile.credits <= 0) {
      return NextResponse.json({ error: 'No credits remaining' }, { status: 403 })
    }

    // 2. Receive the MP3 file from the frontend
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio provided' }, { status: 400 })
    }

    const arrayBuffer = await audioFile.arrayBuffer()

    // 3. Send to Gemini 1.5 Flash and force it to use our Scoring Rubric
    const { object } = await generateObject({
      model: google('gemini-1.5-flash'),
      schema: ScoreSchema,
      messages: [
        {
          role: 'system',
          content: `You are an expert evaluator for finance creator content on Instagram Reels. 
          Listen to the provided audio hook. Grade it strictly based on these heuristics:
          1. Authority Framing: Does the speaker sound credible?
          2. Fear Trigger: Does it highlight loss avoidance?
          3. Specificity: Do they use exact numbers instead of vague claims?
          4. Tribal Identity: Do they call out a specific group? (e.g., "Middle class mistake")
          5. Controversy: Is there a strong opinion?
          
          Provide accurate scores. Provide a much stronger, punchier rewrite of the hook.`
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Listen to this audio hook and provide the scorecard.' },
            // Using "as any" safely bypasses the strict FilePart checking, 
            // allowing the SDK to automatically handle the buffer
            { type: 'file', data: new Uint8Array(arrayBuffer) } as any
          ]
        }
      ]
    })

    // 4. Save the generated score to the database
    const { data: savedScore, error } = await supabase.from('scores').insert({
      user_id: user.id,
      hook_text: 'Audio Hook', // We can add transcription later if needed
      virality_score: object.viralityScore,
      hook_strength: object.hookStrength,
      emotional_triggers: object.emotionalTriggers,
      suggested_rewrite: object.suggestedRewrite,
      risk_flags: object.riskFlags
    }).select().single()

    if (error) throw error

    // 5. Deduct 1 credit from the user
    await supabase.from('profiles').update({
      credits: profile.credits - 1
    }).eq('id', user.id)

    // 6. Send the full data back to the frontend to draw the charts
    return NextResponse.json(savedScore)

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Failed to score video' }, { status: 500 })
  }
}
