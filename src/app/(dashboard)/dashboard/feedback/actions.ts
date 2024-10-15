// 'use server'

// export async function submitFeedback(role: string, rating: number, message: string) {
//   // Here you would typically save the feedback to a database
//   // For this example, we'll just log it
//   console.log('Feedback received:', { role, rating, message })

//   // Simulate a delay
//   await new Promise(resolve => setTimeout(resolve, 1000))

//   // In a real application, you would save this data to your database
//   // For example:
//   // await db.feedback.create({ data: { role, rating, message } })

//   return { success: true }
// }

'use server'

// import { db } from '@/lib/db'
// import { feedback } from '@/lib/schema'

import { db } from "@/app/server/db";
import { feedback } from "@/app/server/db/schema";

import { eq } from 'drizzle-orm'

export async function submitFeedback(userId: string, userEmail: string, role: string, rating: number, message: string) {
  console.log('Feedback received:', { userId, userEmail, role, rating, message })

  try {
    const result = await db.insert(feedback).values({
      userId,
      userEmail,
      role,
      rating,
      message,
    }).returning({ id: feedback.id })

    console.log('Feedback saved with ID:', result[0].id)

    return { success: true, id: result[0].id }
  } catch (error) {
    console.error('Error saving feedback:', error)
    return { success: false, error: 'Failed to save feedback' }
  }
}