const mongoose = require('mongoose');


var ETH_price_schema = mongoose.Schema({
  name: String,
  price: { type: Number, require: true },
  time: Number,



})

module.exports = mongoose.model('eth_price', ETH_price_schema)