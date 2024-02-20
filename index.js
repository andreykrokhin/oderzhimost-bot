require('dotenv').config()

const mongoose = require('mongoose')

const { TgBot } = require('./bot')

const start = async () => {
  const dbUrl = process.env.IS_PROD
    ? process.env.DB_URL
    : process.env.DB_LOCAL_URL
  
  try {
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log('> mongoose success')

    TgBot.launch()
  } catch(e) {
    throw new Error(e)
  }
}

start()
