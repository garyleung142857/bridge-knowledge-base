var bodyparser = require('body-parser')
var Parser = require('./parser.js').Parser
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest


const Http = new XMLHttpRequest()
const bbourl = "https://www.bridgebase.com/tools/vugraph_linfetch.php"


module.exports = function(app){
    app.get('/vugraph-viewer/', function(req, res){
        Http.onreadystatechange = function(){
            if (Http.readyState === 4){
                parser = new Parser(Http.responseText)
                res.render('vuview', parser.get_games)
            }
        }
        Http.open("GET", bbourl + `?id=${req.query.id}`, true)
        Http.send(null)
    })
}
