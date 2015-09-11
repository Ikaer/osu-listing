// http://thatextramile.be/blog/2012/01/stop-storing-passwords-already/

var mongoose = require('mongoose'),
    crypto = require('crypto'),
    uuid = require('node-uuid'),
    Schema = mongoose.Schema,
    UserScore = require('./userScore'),
    UserRecent = require('./userRecent');

var userSchema = new Schema({
    name: {type: String, required: true, unique: true},
    email: {type: String, required: true},
    user_id: {type: Number, required: true},
    salt: {type: String, required: true, default: uuid.v1},
    passwdHash: {type: String, required: true},
    mailVerification: String,
    mailHasBeenVerified:Boolean,
    resetPasswordHash:String,
    scores:[UserScore.schema],
    recents:[UserRecent.schema],
    beatmaps : [Number],
    difficulties : {type:[Number], default:[1,2,3,4,5]},
    modes:{type:[Number], default:[0,1,2,3]},
    creationDate:Date,
    playedBeatmaps:{type:Number, default:0},
    fileExtensionsToExclude:{type: [String], default:[]},
    durationMin:{type:Number, default:null},
    durationMax:{type:Number, default:null},
    minHPDrainRate: {type:Number, default:null},
    maxHPDrainRate: {type:Number, default:null},
    minCircleSize: {type:Number, default:null},
    maxCircleSize: {type:Number, default:null},
    minOverallDifficulty: {type:Number, default:null},
    maxOverallDifficulty: {type:Number, default:null},
    minApproachRate: {type:Number, default:null},
    maxApproachRate: {type:Number, default:null}
});

var hash = function (passwd, salt) {
    return crypto.createHmac('sha256', salt).update(passwd).digest('hex');
};

userSchema.methods.setPassword = function (passwordString) {
    this.passwdHash = hash(passwordString, this.salt);
};

userSchema.methods.isValidPassword = function (passwordString) {
    return this.passwdHash === hash(passwordString, this.salt);
};

mongoose.model('User', userSchema);
module.exports = mongoose.model('User');