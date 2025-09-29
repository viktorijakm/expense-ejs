require('dotenv').config()
require('express-async-errors')

const express = require('express')
const app = express()
const path = require('path')

// extra Security packages
const helmet = require('helmet')
const cors = require('cors')
const xss = require('xss-clean')
const rateLimiter = require('express-rate-limit')

// DB and Middleware
const connectDB = require('./db/connect')
const authenticateUser = require('./middleware/authentication')
const notFoundMiddleware = require('./middleware/not-found')
const errorHandlerMiddleware = require('./middleware/error-handler')


const swaggerUI = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');


// Routes
const authRouter = require('./routes/auth')
const expensesRouter = require('./routes/expenses')

// Middleware
app.use(express.json())
app.use(helmet())
app.use(cors())
app.use(xss())
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
)

// Static folder for frontend (optional)
app.use(express.static(path.join(__dirname, 'public')))

// Routes
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/expenses', authenticateUser, expensesRouter)

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// Root route
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'login.html')))

// Error handling
app.use(notFoundMiddleware)
app.use(errorHandlerMiddleware)

// Start server
const port = process.env.PORT || 3000
const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI)
    app.listen(port, () => console.log(`Server listening on port ${port}...`))
  } catch (error) {
    console.log(error)
  }
}

start()
