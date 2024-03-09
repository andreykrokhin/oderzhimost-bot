const { Schema, model } = require('mongoose')

const UsersSchema = new Schema({
  tgId: { type: Number, unique: true },
  name: { type: String },
  referalTgId: { type: String },
  // wallet: { type: Number },
  signUpDate: { type: Date },
  // totems: { type: Number },
  // keys: { type: Number },
  saleStartDate: { type: Date },
  latestFunnelMsg: { type: Number },
  latestFunnelDate: { type: Date },   // Дата отправки последнего сообщения по воронке
  startDayHour: { type: Number },   // Время начала следующего дня, когда можно рассылать сообщения
  paidModule: { type: Number },    // Оплаченные ступени
  isActive: { type: Boolean },    // Оплативший пользователь, которому можно отправлять сообщения
})

module.exports = model('Users', UsersSchema)
