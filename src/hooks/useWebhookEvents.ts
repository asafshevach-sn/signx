/**
 * Polls /api/events every 12 seconds and fires toast notifications + awards
 * achievement points for signing events.
 */
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import client from '../api/client'
import { awardPoints } from './useAchievements'
import { isUserDoc } from './useUserDocs'

const POLL_INTERVAL = 12_000 // 12 s

const EVENT_LABELS: Record<string, string> = {
  'document.completed':       '🎉 Document fully signed!',
  'invite.signed':            '✍️ Recipient signed',
  'invite.email_delivery_failed': '⚠️ Email delivery failed',
  'document.opened':          '👁️ Document opened',
  'invite.created':           '📨 Invite created',
  'invite.sent':              '📨 Invite sent',
  'invite.resent':            '📨 Invite resent',
  'document.updated':         null as any, // silent
}

export function useWebhookEvents(userId: string | undefined) {
  const lastSeenRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!userId) return

    const poll = async () => {
      try {
        const { data } = await client.get('/events', {
          params: { since: lastSeenRef.current },
        })
        const events: any[] = data.events || []
        if (data.serverTime) lastSeenRef.current = data.serverTime

        for (const evt of events) {
          const label = EVENT_LABELS[evt.event]
          if (label === null) continue // explicitly silenced
          if (!label) continue         // unknown / not configured

          // Only surface events for documents owned by this user
          if (evt.docId && userId && !isUserDoc(userId, evt.docId)) continue

          const docPart = evt.docName ? ` — ${evt.docName}` : ''
          const signerPart = evt.signerEmail ? ` by ${evt.signerEmail}` : ''
          toast(label + signerPart + docPart, {
            duration: 6000,
            icon: evt.event.includes('failed') ? '❌' : '📄',
          })

          // Award points when a document is fully completed
          if (evt.event === 'document.completed') {
            awardPoints(userId, 25, 'signed')
          }
        }
      } catch {
        // Silently ignore — polling is best-effort
      }
    }

    // Run once immediately, then on interval
    poll()
    const id = setInterval(poll, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [userId])
}
