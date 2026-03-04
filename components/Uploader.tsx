'use client'

import { useState, useRef, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'

export default function Uploader() {
  const [isReady, setIsReady] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  
  // We use a ref to hold the FFmpeg instance so it persists across renders
  const ffmpegRef = useRef(new FFmpeg())

  // Load FFmpeg into the browser as soon as the component mounts
  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpeg = ffmpegRef.current
      
      // Listen to progress to show to the user
      ffmpeg.on('progress', ({ progress }) => {
        console.log(`Processing: ${Math.round(progress * 100)}%`)
      })

      // Load the core webassembly files from the official CDN
      await ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
      })
      
      setIsReady(true)
    }

    loadFFmpeg()
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsProcessing(true)
    const ffmpeg = ffmpegRef.current

    try {
      // 1. Write the video file to FFmpeg's in-browser memory
      await ffmpeg.writeFile('input.mp4', await fetchFile(file))

      // 2. Run the command to strip audio and convert to MP3
      // -q:a 0 means highest quality audio
      // -map a means only grab the audio track
      await ffmpeg.exec(['-i', 'input.mp4', '-q:a', '0', '-map', 'a', 'output.mp3'])

      // 3. Read the resulting MP3 file from memory
    const audioData = await ffmpeg.readFile('output.mp3')
// We have to explicitly tell TypeScript that audioData is a Uint8Array
const dataArray = new Uint8Array(audioData as Uint8Array)
const audioBlob = new Blob([dataArray.buffer], { type: 'audio/mp3' })

      
      // 4. Create a local URL so we can play it back
      const url = URL.createObjectURL(audioBlob)
      setAudioUrl(url)

            // Create FormData to send to our API
      const formData = new FormData()
      formData.append('audio', audioBlob, 'hook.mp3')

      // Call our Next.js API route
      const response = await fetch('/api/score', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to score video')
      }

      const scoreData = await response.json()
      
      // For now, we will just log it to the console! 
      // Next, we will use D3.js to visualize this data.
      console.log("THE AI SCORE:", scoreData)

    } catch (error) {
      console.error('Error processing video:', error)
      alert("Could not extract audio. Make sure it's a valid MP4.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      
      {!isReady ? (
        <p className="text-gray-500 font-semibold animate-pulse">Loading Video Engine...</p>
      ) : (
        <>
          <label className="cursor-pointer bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition-all">
            Upload Finance Reel (MP4)
            <input 
              type="file" 
              accept="video/mp4,video/quicktime" 
              className="hidden" 
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
          </label>
          <p className="text-sm text-gray-500 mt-2">Maximum file size: 50MB</p>
        </>
      )}

      {isProcessing && (
        <div className="mt-6 text-center">
          <p className="text-blue-600 font-bold animate-pulse">Extracting Audio in Browser...</p>
        </div>
      )}

      {audioUrl && !isProcessing && (
        <div className="mt-6 flex flex-col items-center gap-4 w-full">
          <p className="text-green-600 font-bold">Audio Extracted Successfully!</p>
          {/* This audio player is just to prove it worked locally */}
          <audio src={audioUrl} controls className="w-full max-w-md" />
        </div>
      )}
    </div>
  )
}
