/** Points & levelling system. Points stored per-user in localStorage. */

export interface Level {
  level: number
  name: string
  emoji: string
  minPoints: number
}

export const LEVELS: Level[] = [
  { level: 1,  emoji: '🐣', name: 'Ink Hatchling',       minPoints: 0    },
  { level: 2,  emoji: '📝', name: 'Paper Cub',            minPoints: 15   },
  { level: 3,  emoji: '✍️', name: 'Dotted Rookie',        minPoints: 35   },
  { level: 4,  emoji: '📄', name: 'Field Scout',          minPoints: 65   },
  { level: 5,  emoji: '🖊️', name: 'Clause Padawan',       minPoints: 110  },
  { level: 6,  emoji: '📋', name: 'Scroll Squire',        minPoints: 175  },
  { level: 7,  emoji: '🤝', name: 'Deal Dabbler',         minPoints: 260  },
  { level: 8,  emoji: '🎯', name: 'Sign Seeker',          minPoints: 370  },
  { level: 9,  emoji: '🔏', name: 'Seal Squire',          minPoints: 510  },
  { level: 10, emoji: '⚖️', name: 'Balance Keeper',       minPoints: 680  },
  { level: 11, emoji: '🛡️', name: 'Legal Shield',         minPoints: 890  },
  { level: 12, emoji: '🎖️', name: 'Contract Cadet',       minPoints: 1150 },
  { level: 13, emoji: '🗝️', name: 'Clause Keeper',        minPoints: 1460 },
  { level: 14, emoji: '🏹', name: 'Deal Archer',          minPoints: 1830 },
  { level: 15, emoji: '⚡', name: 'Signature Spark',      minPoints: 2270 },
  { level: 16, emoji: '🔮', name: 'Agreement Mage',       minPoints: 2790 },
  { level: 17, emoji: '🌟', name: 'Document Star',        minPoints: 3400 },
  { level: 18, emoji: '🦅', name: 'Legal Eagle',          minPoints: 4110 },
  { level: 19, emoji: '🎩', name: 'Maestro of Ink',       minPoints: 4930 },
  { level: 20, emoji: '🦁', name: 'Contract Lion',        minPoints: 5870 },
  { level: 21, emoji: '🌈', name: 'Rainbow Signor',       minPoints: 6940 },
  { level: 22, emoji: '🌙', name: 'Moonlit Scribe',       minPoints: 8150 },
  { level: 23, emoji: '☀️', name: 'Solar Signmaster',     minPoints: 9510 },
  { level: 24, emoji: '👑', name: 'The Legendary Signor', minPoints: 11030 },
]

export type PointAction = 'upload' | 'send' | 'signed' | 'template'

export const POINT_VALUES: Record<PointAction, number> = {
  upload: 5,
  send: 10,
  signed: 25,
  template: 15,
}

function key(userId: string) { return `signx_pts_${userId}` }

export function getPoints(userId: string): number {
  if (!userId) return 0
  return parseInt(localStorage.getItem(key(userId)) || '0', 10)
}

export function awardPoints(userId: string, pts: number, _action?: string) {
  if (!userId) return
  const current = getPoints(userId)
  localStorage.setItem(key(userId), String(current + pts))
  // Dispatch event so components can react
  window.dispatchEvent(new CustomEvent('signx:points', { detail: { userId, pts, total: current + pts } }))
}

export function getLevelForPoints(pts: number): Level {
  let current = LEVELS[0]
  for (const lvl of LEVELS) {
    if (pts >= lvl.minPoints) current = lvl
    else break
  }
  return current
}

export function getNextLevel(pts: number): Level | null {
  const cur = getLevelForPoints(pts)
  return LEVELS.find(l => l.level === cur.level + 1) || null
}

export function getLevelProgress(pts: number): number {
  const cur = getLevelForPoints(pts)
  const next = getNextLevel(pts)
  if (!next) return 100
  const range = next.minPoints - cur.minPoints
  const earned = pts - cur.minPoints
  return Math.round((earned / range) * 100)
}
