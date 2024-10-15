'use server'

export async function submitFeedback(role: string, rating: number, message: string) {
  // Here you would typically save the feedback to a database
  // For this example, we'll just log it
  console.log('Feedback received:', { role, rating, message })

  // Simulate a delay
  await new Promise(resolve => setTimeout(resolve, 1000))

  // In a real application, you would save this data to your database
  // For example:
  // await db.feedback.create({ data: { role, rating, message } })

  return { success: true }
}