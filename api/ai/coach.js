import { coachReply } from '../../server/minimax.js'
import { aiHandler } from '../../server/vercelHandler.js'

export default aiHandler(async (body) => ({ reply: await coachReply(body) }))
