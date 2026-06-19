import { Hono } from 'hono'
import { MODELS, getAllModels } from '@repogen/shared'

const app = new Hono()

// GET /v1/models - List all available models
app.get('/models', (c) => {
  const models = getAllModels()

  const data = models.map((model) => ({
    id: model.id,
    object: 'model' as const,
    created: 1700000000, // Placeholder timestamp
    owned_by: 'repogen',
    permission: [],
    root: model.id,
    parent: null,
    // repogen extensions
    repogen: {
      context_length: model.context_length,
      input_price_per_m: model.input_price_per_m,
      output_price_per_m: model.output_price_per_m,
      providers: model.providers,
      privacy_tiers: model.privacy_tiers,
      supports_streaming: model.supports_streaming,
      supports_tools: model.supports_tools,
    },
  }))

  return c.json({
    object: 'list',
    data,
  })
})

// GET /v1/models/:model - Get a specific model
app.get('/models/:model', (c) => {
  const modelId = c.req.param('model')
  const model = MODELS[modelId]

  if (!model) {
    return c.json(
      {
        error: {
          message: `The model '${modelId}' does not exist`,
          type: 'not_found_error',
          param: 'model',
          code: 'model_not_found',
        },
      },
      404
    )
  }

  return c.json({
    id: model.id,
    object: 'model',
    created: 1700000000,
    owned_by: 'repogen',
    permission: [],
    root: model.id,
    parent: null,
    repogen: {
      context_length: model.context_length,
      input_price_per_m: model.input_price_per_m,
      output_price_per_m: model.output_price_per_m,
      providers: model.providers,
      privacy_tiers: model.privacy_tiers,
      supports_streaming: model.supports_streaming,
      supports_tools: model.supports_tools,
    },
  })
})

export { app as models }
