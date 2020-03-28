// var bodyparser = require('body-parser')
var Parser = require('./parser.js').Parser
var VuList = require('./vulist.js').VuList
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest


const bbourl = "https://www.bridgebase.com/tools/vugraph_linfetch.php"
const bbovuarchive = "http://www.bridgebase.com/vugraph_archives/vugraph_archives.php"

module.exports = function(app){
    
    app.get('/vugraph-viewer/', function(req, res){
        const xhr = new XMLHttpRequest()
        xhr.onreadystatechange = function(){
            if (xhr.readyState == 4){
                vuList = new VuList({str: xhr.responseText})
                res.render('vulist', vuList.table)
            }
        }
        xhr.responseType = "document"
        xhr.open("GET", bbovuarchive, true)
        xhr.send(null)
    })
        
    app.get('/vugraph-viewer/bboparse/', function(req, res){
        const xhr = new XMLHttpRequest()
        xhr.onreadystatechange = function(){
            // console.log(xhr.status, xhr.readyState)
            if (xhr.readyState == 4){
                // console.log(xhr.responseText)
                parser = new Parser({str: xhr.responseText, id: req.query.id})
                res.render('vuview', parser.get_games)
            }
        }
        // xhr.onload = function(){
        // }
        xhr.open("GET", bbourl + `?id=${req.query.id}`, true)
        xhr.send(null)
    })
}
