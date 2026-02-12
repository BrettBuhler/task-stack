interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in_progress' | 'done'
  priority: number
}

interface FollowUp {
  id: string
  title: string
  due_date: string
  task_title?: string
}

interface DigestData {
  tasks: Task[]
  followUps: FollowUp[]
  userName?: string
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusLabel(status: string): string {
  switch (status) {
    case 'todo': return 'To Do'
    case 'in_progress': return 'In Progress'
    default: return status
  }
}

function statusColor(status: string): string {
  switch (status) {
    case 'todo': return '#a78bfa'
    case 'in_progress': return '#00f0ff'
    default: return '#71717a'
  }
}

function priorityDots(priority: number): string {
  if (priority <= 0) return ''
  const dots = Array.from({ length: Math.min(priority, 3) }, () =>
    '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#f59e0b;margin-right:2px;"></span>'
  ).join('')
  return `<span style="margin-left:8px;">${dots}</span>`
}

export function buildDigestEmail({ tasks, followUps, userName }: DigestData): string {
  const greeting = userName ? `Hey ${userName}` : 'Hey there'
  const now = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  const todoTasks = tasks.filter(t => t.status === 'todo')
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress')

  const taskSection = (label: string, items: Task[], status: string) => {
    if (items.length === 0) return ''
    const rows = items
      .sort((a, b) => b.priority - a.priority)
      .map(t => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #1a1a2e;">
            <span style="color:#e4e4e7;font-size:14px;">${t.title}</span>
            ${priorityDots(t.priority)}
            ${t.description ? `<br/><span style="color:#71717a;font-size:12px;">${t.description.slice(0, 80)}${t.description.length > 80 ? '...' : ''}</span>` : ''}
          </td>
        </tr>
      `).join('')

    return `
      <div style="margin-bottom:24px;">
        <h3 style="color:${statusColor(status)};font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;font-family:'Courier New',monospace;">
          ${label} <span style="color:#71717a;">(${items.length})</span>
        </h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d1a;border-radius:8px;border:1px solid #1a1a2e;">
          ${rows}
        </table>
      </div>
    `
  }

  const followUpSection = followUps.length === 0 ? '' : `
    <div style="margin-bottom:24px;">
      <h3 style="color:#f59e0b;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0;font-family:'Courier New',monospace;">
        Upcoming Follow-ups <span style="color:#71717a;">(${followUps.length})</span>
      </h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d1a;border-radius:8px;border:1px solid #1a1a2e;">
        ${followUps
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
          .map(f => `
            <tr>
              <td style="padding:8px 12px;border-bottom:1px solid #1a1a2e;">
                <span style="color:#e4e4e7;font-size:14px;">${f.title}</span>
                <br/>
                <span style="color:#f59e0b;font-size:12px;">Due: ${formatDate(f.due_date)}</span>
                ${f.task_title ? `<span style="color:#71717a;font-size:12px;"> &middot; ${f.task_title}</span>` : ''}
              </td>
            </tr>
          `).join('')}
      </table>
    </div>
  `

  const noItems = tasks.length === 0 && followUps.length === 0
  const emptyState = noItems ? `
    <div style="text-align:center;padding:32px;color:#71717a;">
      <p style="font-size:16px;margin:0;">All clear! No pending tasks or follow-ups.</p>
    </div>
  ` : ''

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Task Stack Digest</title>
</head>
<body style="margin:0;padding:0;background:#06060e;font-family:'Courier New',Courier,monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#06060e;padding:24px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 24px 16px;text-align:center;">
              <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:2px;">
                <span style="color:#00f0ff;">TASK</span><span style="color:#e4e4e7;"> STACK</span>
              </h1>
              <p style="margin:4px 0 0;color:#71717a;font-size:12px;">${now}</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 24px 24px;background:#0a0a1a;border:1px solid rgba(0,240,255,0.1);border-radius:12px;">
              <p style="color:#e4e4e7;font-size:15px;margin:24px 0 20px;">
                ${greeting}, here's your digest:
              </p>
              ${emptyState}
              ${taskSection('In Progress', inProgressTasks, 'in_progress')}
              ${taskSection('To Do', todoTasks, 'todo')}
              ${followUpSection}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;text-align:center;">
              <p style="margin:0;color:#52525b;font-size:11px;">
                You received this because email digests are enabled in your Task Stack settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
