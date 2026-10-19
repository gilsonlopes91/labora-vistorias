import { vi } from 'vitest'

vi.mock('@/lib/pocketbase/client', () => ({
  default: {
    collection: () => ({}),
    filter: (texto: string) => texto,
    files: { getURL: () => '' },
  },
}))
