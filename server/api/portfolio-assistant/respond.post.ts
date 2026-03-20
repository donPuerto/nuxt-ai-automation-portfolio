import type {
  PortfolioAssistantRequest,
} from '../../utils/portfolio-assistant/types'
import { buildPortfolioAssistantResponse } from '../../utils/portfolio-assistant/build-response'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<PortfolioAssistantRequest>(event)
    const response = buildPortfolioAssistantResponse(body ?? {})

    return {
      ok: true,
      message: 'Portfolio assistant response ready.',
      response,
    }
  }
  catch (error) {
    console.error('portfolio assistant respond failed', error)

    return {
      ok: false,
      message: 'We could not load the portfolio response right now.',
    }
  }
})
