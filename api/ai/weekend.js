import { weekendStrategy } from '../../server/minimax.js'
import { aiHandler } from '../../server/vercelHandler.js'

export default aiHandler(async (body) => ({ strategy: await weekendStrategy(body) }))
