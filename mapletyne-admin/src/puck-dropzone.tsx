'use client'

import { DropZone } from '@measured/puck'

export function PuckDropZone({ zone }: { zone: string }) {
  return <DropZone zone={zone} />
}
