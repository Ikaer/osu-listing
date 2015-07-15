
// set up ========================
var express  = require('express');
var app      = express();                               // create our app w/ express
var mongoose = require('mongoose');                     // mongoose for mongodb
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
var morgan = require('morgan');
// configuration =================

var nconf = require('nconf');
nconf.file({ file: 'config.json' });

mongoose.connect(nconf.get('mongodbPath'));

app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
app.use("/media", express.static(nconf.get('stuffPath')));
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());
app.use(morgan('dev'));
var fs = require('fs')
// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(__dirname + '/access.log', {flags: 'a'})
//app.use(morgan('dev'));
app.use(morgan('combined', {stream: accessLogStream}))

var Beatmap = require('./app/models/beatmap')
 require('./app/routes')(app);


// listen (start app with node server.js) ======================================
app.listen(8080);
console.log("App listening on port 8080");