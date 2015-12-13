var Q = require('q');
var User = require('./models/user');
var base64url = require('base64url');
var crypto = require('crypto');
var _ = require('underscore');
function AuthTools() {
    this.keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    this.diffNames = [
        'Duration',
        'HPDrainRate',
        'CircleSize',
        'OverallDifficulty',
        'ApproachRate',
        'DifficultyRating',
        'Hit_length',
        'PlayCount',
        'PlaySuccess',
        'FavouritedCount',
        'NegativeUserRating',
        'PositiveUserRating',
        'Approved_date',
        'Last_update',
        'Submitted_date'
    ]
}
AuthTools.prototype.randomStringAsBase64Url = function (size) {
    return base64url(crypto.randomBytes(size));
}
AuthTools.prototype.encode = function (input) {
    var that = this;
    var output = "";
    var chr1, chr2, chr3 = "";
    var enc1, enc2, enc3, enc4 = "";
    var i = 0;

    do {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);

        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
            enc4 = 64;
        }

        output = output +
            that.keyStr.charAt(enc1) +
            that.keyStr.charAt(enc2) +
            that.keyStr.charAt(enc3) +
            that.keyStr.charAt(enc4);
        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";
    } while (i < input.length);

    return output;
};
AuthTools.prototype.decode = function (input) {
    var that = this;
    var output = "";
    var chr1, chr2, chr3 = "";
    var enc1, enc2, enc3, enc4 = "";
    var i = 0;

    // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
    var base64test = /[^A-Za-z0-9\+\/\=]/g;
    if (base64test.exec(input)) {
        window.alert("There were invalid base64 characters in the input text.\n" +
            "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
            "Expect errors in decoding.");
    }
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    do {
        enc1 = that.keyStr.indexOf(input.charAt(i++));
        enc2 = that.keyStr.indexOf(input.charAt(i++));
        enc3 = that.keyStr.indexOf(input.charAt(i++));
        enc4 = that.keyStr.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;

        output = output + String.fromCharCode(chr1);

        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }

        chr1 = chr2 = chr3 = "";
        enc1 = enc2 = enc3 = enc4 = "";

    } while (i < input.length);

    return output;
}

AuthTools.prototype.updateUser = function (session) {
    var q = Q.defer();
    var that = this;
    if (session.isAuthenticated === true) {
        User.findOne({name: session.user.name}, function (err, user) {
            if (err === null) {
                if (user === null) {
                    session.isAuthenticated = false;
                    session.user = null;
                    session.simplifiedUser = that.getEmptySimplifiedUser();
                }
                else {
                    session.user = user;
                    session.simplifiedUser = that.simplifyUser(user)
                }
            }
            q.resolve(true);

        });
    }
    else {
        q.resolve();
    }
    return q.promise;
}
AuthTools.prototype.getEmptySimplifiedUser = function () {
    var that = this;
    var simplifiedUser = {
        isAuthenticated: false,
        name: 'anonymous',
        difficulties: [1, 2, 3, 4, 5],
        modes: [0, 1, 2, 3],
        fileExtensionsToExclude: [],
        playedBeatmaps: 0,
        user_id: null,
        disableStrict:false
    }
    _.each(that.diffNames, function (diffName) {
        var minProperty = 'min' + diffName;
        var maxProperty = 'max' + diffName;
        simplifiedUser[minProperty] = null;
        simplifiedUser[maxProperty] = null;
    });
    return simplifiedUser;
}


AuthTools.prototype.simplifyUser = function (mongoUser) {
    var that = this;
    var user = this.getEmptySimplifiedUser();

    user.isAuthenticated = true;
    user.name = mongoUser.name;
    user.user_id = mongoUser.user_id;
    if (mongoUser.difficulties) {
        user.difficulties = mongoUser.difficulties;
    }
    if (mongoUser.modes) {
        user.modes = mongoUser.modes;
    }
    if (mongoUser.playedBeatmaps) {
        user.playedBeatmaps = mongoUser.playedBeatmaps;
    }
    if (mongoUser.fileExtensionsToExclude) {
        user.fileExtensionsToExclude = mongoUser.fileExtensionsToExclude;
    }
    if(mongoUser.disableStrict){
        user.disableStrict = mongoUser.disableStrict;
    }
    if(mongoUser.pageSize){
        user.pageSize = mongoUser.pageSize;
    }
    if(mongoUser.sorting){
        user.sorting = mongoUser.sorting;
    }
    if(mongoUser.sortingDirection){
        user.sortingDirection = mongoUser.sortingDirection;
    }



    if (mongoUser.durationMin) {
        user.minDuration = mongoUser.durationMin;
    }
    if (mongoUser.durationMax) {
        user.maxDuration = mongoUser.durationMax;
    }
    _.each(that.diffNames, function (diffName) {
        if (diffName !== 'Duration') {
            var minProperty = 'min' + diffName;
            var maxProperty = 'max' + diffName;
            if (mongoUser[minProperty]) {
                user[minProperty] = mongoUser[minProperty];
            }
            if (mongoUser[maxProperty]) {
                user[maxProperty] = mongoUser[maxProperty];
            }
        }
    })
    return user;
}
module.exports = AuthTools;