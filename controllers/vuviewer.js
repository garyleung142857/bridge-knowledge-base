// var bodyparser = require('body-parser')
var Parser = require('./parser.js').Parser
var VuList = require('./vulist.js').VuList
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest


const oReq = new XMLHttpRequest()
const xhr = new XMLHttpRequest()
const bbourl = "https://www.bridgebase.com/tools/vugraph_linfetch.php"
const bbovuarchive = "http://www.bridgebase.com/vugraph_archives/vugraph_archives.php"

module.exports = function(app){
    
    app.get('/vugraph-viewer/', function(req, res){
        
        xhr.onreadystatechange = function(){
            if (xhr.readyState === 4){
                vuList = new VuList({str: xhr.responseText})
                res.render('vulist', vuList.table)
            }
        }
        xhr.responseType = "document"
        xhr.open("GET", bbovuarchive, true)
        xhr.send(null)
    })

    app.get('/vugraph-viewer/bboparse/', function(req, res){
        oReq.onreadystatechange = function(){
            if (oReq.readyState === 4){
                parser = new Parser({str: oReq.responseText, id: req.query.id})
                res.render('vuview', parser.get_games)
            }
        }
        oReq.open("GET", bbourl + `?id=${req.query.id}`, true)
        oReq.send(null)
    })
}
