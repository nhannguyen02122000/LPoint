import { init_schema, i } from '@instantdb/react'
import schema from './schema'

// Initialize InstantDB with the schema.
// Use the app ID from environment variables.
// This client is used server-side (Route Handlers, Server Components).
//
// On the client side, wrap your component tree with <InstantProvider> instead
// (imported from '@instantdb/react' and instantiated with the same appId).

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID ?? ''

if (!APP_ID) {
  throw new Error(
    'NEXT_PUBLIC_INSTANTDB_APP_ID is not set. ' +
    'Add it to your .env.local file.'
  )
}

const db = init_schema({ appId: APP_ID, schema })

export default db
