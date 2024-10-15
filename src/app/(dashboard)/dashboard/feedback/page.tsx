'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Star } from "lucide-react"
import { submitFeedback } from './actions'

const roles = [
  "Architect",
  "Designer",
  "Home Owner",
  "Other"
]

export default function FeedbackForm() {
  const [role, setRole] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      await submitFeedback(role, rating, message)
      setSubmitStatus('success')
      setMessage('')
      setRole('')
      setRating(0)
    } catch (error) {
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Feedback Form</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="role">I am a:</Label>
          <Select value={role} onValueChange={setRole} required>
            <SelectTrigger id="role" className="w-full">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="rating">Rate our app:</Label>
          <div className="flex items-center space-x-1" id="rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <Button
                key={star}
                type="button"
                variant="ghost"
                size="sm"
                className={`p-0 ${
                  star <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300'
                } transition-colors duration-150`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star className={`h-6 w-6 ${
                  star <= (hoverRating || rating) ? 'fill-yellow-400' : 'fill-gray-300'
                }`} />
                <span className="sr-only">{star} stars</span>
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="message">Feedback</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Please enter your feedback here"
            required
            className="min-h-[100px]"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
        {submitStatus === 'success' && (
          <p className="text-green-600 text-center">Thank you for your feedback!</p>
        )}
        {submitStatus === 'error' && (
          <p className="text-red-600 text-center">An error occurred. Please try again.</p>
        )}
      </form>
    </div>
  )
}