var express = require('express')
var vuviewer = require('./controllers/vuviewer')

var app = express()

//set up template engine
app.set('view engine', 'hbs')

//static files
app.use(express.static('./public'))

//fire controller
vuviewer(app)

//listen to port
app.listen(3001)
console.log('You are listening to port 3001.')