var bodyparser = require('body-parser')
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest


const Http = new XMLHttpRequest()
const bbourl = "https://www.bridgebase.com/tools/vugraph_linfetch.php"


module.exports = function(app){
    app.get('/vugraph-viewer/', function(req, res){
        Http.onreadystatechange = function(){
            if (Http.readyState === 4){
                res.send(Http.responseText)
            }
        }
        Http.open("GET", bbourl + `?id=${req.query.id}`, true)
        Http.send(null)
    })
}
