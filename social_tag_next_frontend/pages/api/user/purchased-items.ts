import { NextRequest, NextResponse } from 'next/server'
import { getSession } from 'next-auth/react'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET(request: NextRequest) {
  const session = await getSession({ req: request })

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { db } = await connectToDatabase()
  const usersCollection = db.collection('users')

  try {
    const user = await usersCollection.findOne({ email: session.user.email })
    return NextResponse.json({ purchasedItems: user.purchasedItems || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching purchased items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession({ req: request })

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { db } = await connectToDatabase()
  const usersCollection = db.collection('users')

  try {
    const { purchasedItems } = await request.json()
    await usersCollection.updateOne(
      { email: session.user.email },
      { $set: { purchasedItems } }
    )
    return NextResponse.json({ message: 'Purchased items updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Error updating purchased items' }, { status: 500 })
  }
}