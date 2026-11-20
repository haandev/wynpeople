import { wyndbase } from '../wyndbase'

/** The public address of a profile picture (auth.users.picture holds attachment ids), or undefined. */
export function pictureSrc(picture: unknown, size: 48 | 96 | 192 | 512 = 96): string | undefined {
  const id = Array.isArray(picture) ? (picture[0] as string | undefined) : undefined
  return id ? wyndbase.storage.getPictureUrl(id, { size }) : undefined
}
