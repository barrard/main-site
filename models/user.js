
const bcrypt = require('bcryptjs')

var mongoose = require('mongoose')
mongoose.connect('mongodb://localhost/qaltfi')
  .then(connection => {
    // logger.log('Connected to MongoDB')
  })
  .catch(error => {
    logger.log(error.message)
  })
var user_schema = mongoose.Schema({
  email: {
    type: String,
    unique: true
  },
  firstname:String,
  lastname:String,
  profile_img:String,
  password:String,
  current_address:{
    address_line1:String,
    address_line2:String,
    city:String,
    region:String,
    postal_code:String,
    country:String
  },
  has_wallet: {
    type: Boolean,
    default: false
  },
  crowdsale_init: {
    type: Boolean,
    default: false
  },
  crowdsale_started: {
    type: Boolean,
    default: false
  },
  crowdsale_id:String,
  public_addresses:[String],
  youtube_url:String,
  website:String,
  user_bio:String,
  income: String,
  assets: String,
  education: String,
  credit_score: String,
  background_check: String
})



user_schema.methods.generateHash = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null)
}
user_schema.methods.validPassword = function (password) {
  return bcrypt.compareSync(password, this.password)
}

const User = module.exports = mongoose.model('User', user_schema)

module.exports.get_user_by_id = (id, cb) => {
  User.findById(id, cb)
}
module.exports.get_user_by_email = (email, cb) => {
  const query = { email: email }
  User.findOne(query, cb)
} 

module.exports.compare_password = (password, hash, cb) => {
  bcrypt.compare(password, hash, (err, is_match)=>{
    if(err)logger.log(err)
    cb(null, is_match)
  })
} 

module.exports.create_user = (new_user, cb)=>{
  bcrypt.genSalt(10, (err, salt)=>{
    bcrypt.hash(new_user.password, salt, (err, hash)=>{
      new_user.password = hash
      new_user.save(cb)


    })
  })
}