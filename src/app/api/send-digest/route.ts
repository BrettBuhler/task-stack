import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { buildDigestEmail } from './email-template'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const DIGEST_API_KEY = process.env.DIGEST_API_KEY ?? ''

const FREQUENCY_HOURS: Record<string, number> = {
  daily: 24,
  weekly: 24 * 7,
  monthly: 24 * 30,
}

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[send-digest] RESEND_API_KEY not set — skipping email to ${to}`)
    return false
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Task Stack <digest@taskstack.app>',
        to,
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[send-digest] Resend API error (${res.status}): ${body}`)
      return false
    }

    return true
  } catch (err) {
    console.error('[send-digest] Failed to send email:', err)
    return false
  }
}

function isEligible(frequency: string, lastSentAt: string | null): boolean {
  const thresholdHours = FREQUENCY_HOURS[frequency]
  if (!thresholdHours) return false
  if (!lastSentAt) return true

  const elapsed = Date.now() - new Date(lastSentAt).getTime()
  return elapsed >= thresholdHours * 60 * 60 * 1000
}

export async function POST(request: NextRequest) {
  // Verify API key
  const apiKey = request.headers.get('x-api-key')
  if (!DIGEST_API_KEY || apiKey !== DIGEST_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const supabase = createServiceClient()

  // 1. Get users with email digests enabled
  const { data: preferences, error: prefError } = await supabase
    .from('email_preferences')
    .select('*')
    .eq('enabled', true)

  if (prefError) {
    console.error('[send-digest] Error fetching preferences:', prefError)
    return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 })
  }

  if (!preferences || preferences.length === 0) {
    return NextResponse.json({ message: 'No users with digests enabled', sent: 0 })
  }

  // 2. Filter to eligible users based on frequency + last_sent_at
  const eligible = preferences.filter(p =>
    isEligible(p.frequency, p.last_sent_at)
  )

  if (eligible.length === 0) {
    return NextResponse.json({ message: 'No users eligible for digest at this time', sent: 0 })
  }

  let sentCount = 0
  const errors: string[] = []

  for (const pref of eligible) {
    const userId = pref.user_id

    // 3. Fetch user email from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user?.email) {
      errors.push(`Could not get email for user ${userId}`)
      continue
    }

    // 4. Fetch pending tasks (not done)
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, description, status, priority')
      .eq('user_id', userId)
      .neq('status', 'done')
      .order('priority', { ascending: false })

    if (taskError) {
      errors.push(`Error fetching tasks for user ${userId}: ${taskError.message}`)
      continue
    }

    // 5. Fetch upcoming follow-ups (not yet notified)
    const { data: followUps, error: fuError } = await supabase
      .from('follow_ups')
      .select('id, title, due_date, task_id, tasks(title)')
      .eq('user_id', userId)
      .eq('notified', false)
      .order('due_date', { ascending: true })

    if (fuError) {
      errors.push(`Error fetching follow-ups for user ${userId}: ${fuError.message}`)
      continue
    }

    const formattedFollowUps = (followUps ?? []).map(f => ({
      id: f.id,
      title: f.title,
      due_date: f.due_date,
      task_title: (f as Record<string, unknown>).tasks
        ? ((f as Record<string, unknown>).tasks as { title: string })?.title
        : undefined,
    }))

    // 6. Build and send email
    const html = buildDigestEmail({
      tasks: tasks ?? [],
      followUps: formattedFollowUps,
      userName: user.user_metadata?.full_name ?? user.email?.split('@')[0],
    })

    const taskCount = tasks?.length ?? 0
    const fuCount = formattedFollowUps.length
    const subject = `Task Stack Digest: ${taskCount} task${taskCount !== 1 ? 's' : ''} pending${fuCount > 0 ? `, ${fuCount} follow-up${fuCount !== 1 ? 's' : ''}` : ''}`

    const sent = await sendEmail(user.email, subject, html)

    if (sent) {
      // 7. Update last_sent_at
      await supabase
        .from('email_preferences')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('user_id', userId)

      sentCount++
    } else if (!RESEND_API_KEY) {
      // Still update last_sent_at in dev mode to prevent re-triggering
      await supabase
        .from('email_preferences')
        .update({ last_sent_at: new Date().toISOString() })
        .eq('user_id', userId)
    }
  }

  return NextResponse.json({
    message: `Digest complete`,
    eligible: eligible.length,
    sent: sentCount,
    errors: errors.length > 0 ? errors : undefined,
  })
}
