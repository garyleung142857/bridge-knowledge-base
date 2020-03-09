var cheerio = require("cheerio")
var linlink = "https://www.bridgebase.com/tools/vugraph_linfetch.php"
var mylink = "/vugraph-viewer/bboparse"

class VuList{
    constructor({str}){
        this.str = str
        this.arr = []
    }
    
    parse(){
        var $ = cheerio.load(this.str)
        var arr = new Array()
        $('tr').each(function(i, elem){
            var row = new Object()
            var td = $(this).children('td')
            if (td.length === 6){
                row.link = td.slice(0).eq(0).children('a').slice(1).eq(0).attr('href').replace(linlink, mylink)
                row.Date = td.slice(1).eq(0).text()
                row.event = td.slice(2).eq(0).text()
                row.segment = td.slice(3).eq(0).text()
                row.T1name = td.slice(4).eq(0).children('i').text()
                row.T2name = td.slice(5).eq(0).children('i').text()
                row.T1players = td.slice(4).eq(0).html().replace("<i>" + row.T1name + "</i><br>", "").replace("West-East", "").replace("South-North", "")
                row.T2players = td.slice(5).eq(0).html().replace("<i>" + row.T2name + "</i><br>", "").replace("West-East", "").replace("South-North", "")
                arr.push(row)
            }
        })
        this.arr = arr
    }

    get table(){
        this.parse()
        return {vulist: this.arr}
    }
}

module.exports = {VuList}