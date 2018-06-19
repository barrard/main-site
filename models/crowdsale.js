const mongoose = require('mongoose');


var Crowdsale_schema = mongoose.Schema({
  home_type:String,
  title:String,
  token: String,                                //2
  owner: String,                                //3
  goal: String,                                 //4
  wallet: String,                               //5
  rate: String,                                 //6
  weiRaised: String,                            //7
  vault: String,                                //8
  symbol: String,                               //9
  openingTime: Number,                          //10  
  closingTime: Number,                          //11
  name: String,                                 //12
  goal_reached: Boolean,                        //13
  is_canceled: String,                          //14
  hasClosed: String,                            //15    
  isFinalized: String,                          //16
  check_finalization_time_limit_done: Boolean,  //17
  transaction: String,
  photos: [String],
  address_line1: String,
  address_line2: String,
  city: String,
  region: String,
  postal_code: String,
  country: String,
  user_id: String,
  tax_id: String,
  description: Boolean,
  home_style: String,
  amount_money_needed: String,
  amount_down_payment: String,
  is_approved: {
    type: Boolean, default: false
  },
  is_deployed: {
    type: Boolean, default: false
  },
  time_user_created:String,
  last_updated:String,





})

module.exports = mongoose.model('Crowdsale', Crowdsale_schema)