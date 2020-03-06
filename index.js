var express = require('express')
var hbs = require("express-handlebars")
var vuviewer = require('./controllers/vuviewer')

var app = express()
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: 'views/layouts',
    partialsDir: 'views/partials'
}))


//set up template engine
app.set('view engine', 'hbs')

//static files
app.use(express.static('public'))

//fire controller
vuviewer(app)

//listen to port
app.listen(3001)
console.log('You are listening to port 3001.')