require('dotenv').config()
const express = require('express')
const cors = require('cors')

const cellsRouter = require('./routes/cells')
const operatorsRouter = require('./routes/operators')

const app = express()
const PORT = process.env.PORT || 3001

// Don't advertise the framework in response headers.
app.disable('x-powered-by')

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
// Every body this API accepts is a few short strings (cell name, invite
// code, Riot ID); a tight limit rejects oversized payloads before parsing.
app.use(express.json({ limit: '16kb' }))

app.use('/api/cells', cellsRouter)
app.use('/api/operators', operatorsRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OPERATIONAL', classification: 'UNCLASSIFIED' })
})

// Unknown routes get a JSON 404 instead of Express's HTML "Cannot GET" page.
app.use((_req, res) => {
  res.status(404).json({ error: 'NO SUCH FILE' })
})

// Last-resort handler. Express 5 forwards rejected async handlers here;
// without it the default handler can leak a stack trace outside production.
// Body-parser rejections (malformed JSON, oversized payload) carry their own
// 4xx status; anything else is an unexpected server fault.
// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity
app.use((err, _req, res, _next) => {
  if (err.status && err.status < 500) {
    return res.status(err.status).json({ error: 'MALFORMED REQUEST' })
  }
  console.error('[LEGION] Unhandled route error:', err)
  res.status(500).json({ error: 'INTERNAL ERROR' })
})

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[LEGION] Server operational on port ${PORT}`)
  })
}

module.exports = app
