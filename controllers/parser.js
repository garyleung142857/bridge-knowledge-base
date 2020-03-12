const SUITS = ["S", "H", "D", "C"]
const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"]
const CARDINALS = ["S", "W", "N", "E"]
const STRAINS = ["C", "D", "H", "S", "N"]
const PDR = {"P": "P", "D": "X", "R": "R"}
const VUL = {"b": "Both", "e": "EW", "n": "NS", "o": "None"}
const TYPES = ["an", "mb", "mc", "md", "nt", "pc", "pg", "pn", "qx", "rs", "st", "sv", "vg"]
const DISPLAY = {
    "C": "<div class='clsymbol'> &#9827; </div>",
    "D": "<div class='disymbol'> &#9830; </div>",
    "H": "<div class='hesymbol'> &#9829; </div>",
    "S": "<div class='spsymbol'> &#9824; </div>",
    "N": "<div class='ntsymbol'> N </div>",
    "P": "P",
    "X": "Dbl",
    "R": "RD"
}
const bbo_viewer_link = "https://www.bridgebase.com/tools/handviewer.html?bbo=y&linurl=https://www.bridgebase.com/tools/vugraph_linfetch.php"

class Parser{
    constructor({str, id}){
        this.str = str
        this.id = id
        this.actions = this.parse_str(this.str)
        this.games = Array()
        this.meta = {
            vugraph: undefined,
            title: undefined,
            players: new Array(),
            results: new Array()
        }
    }

    parse_str(s){
        var actions = Array()
        var arr = s.split("|")
        for (let i = 0; i < arr.length - 2; i += 2) {
            actions.push({t: arr[i].trim(), d: arr[i+1].trim()})
        }
        return actions
    }

    parse(){
        var cur_game = new Game({})
        var cur_player = new Player()
        for (let i = 0; i < this.actions.length; i++) {
            var data = this.actions[i].d
            switch (this.actions[i].t) {
                case "an": // annotation
                    cur_player.bidding.set_notation(data)
                    break
                case "mb": // make bid
                    cur_player.bidding.add_call(data)
                    break;
                case "mc": // make claim
                    break
                case "md": // make deal
                    cur_game.board.deal = new Deal({str: data})
                    break
                case "nt": // notation (Do not bother)
                    break
                case "pc": // play card
                    break
                case "pg": // page (Do not bother)
                    break
                case "pn": // player names
                    this.meta.players = data.split(",")
                    break
                case "qx": // room
                    this.finish_game(cur_player, cur_game)
                    var cur_game = new Game({})
                    var cur_player = new Player()
                    cur_game.board.bdno = /\d+/.exec(data)[0]
                    if (data[0] === "c"){
                        cur_player.names = this.meta.players.slice(4)
                        cur_player.result.set_result(this.meta.results[parseInt(cur_game.board.bdno) * 2 + 1])
                    } else {
                        cur_player.names = this.meta.players.slice(0, 4)
                        cur_player.result.set_result(this.meta.results[parseInt(cur_game.board.bdno) * 2])
                    }
                    break
                case "rs": // result
                    var arr = []
                    for(var j=0; j<parseInt(this.meta.vugraph[3]) * 2; ++j) arr.push("");
                    this.meta.results = arr.concat(data.split(","))
                    while (this.meta.results.length < parseInt(this.meta.vugraph[4]) * 2 + 1) {
                        this.meta.results.push("")
                    }
                    break
                case "st": // start
                    break
                case "sv": // set vul
                    cur_game.board.vul = new Vul(data)
                    break
                case "vg": // vugraph
                    this.meta.vugraph = data.split(",")
                    this.meta.title = "<a href=" + bbo_viewer_link + "?id=" + this.id + " target='_blank'> " + this.meta.vugraph[0] + " " + this.meta.vugraph[1] + ": " + this.meta.vugraph[5] + " vs " + this.meta.vugraph[7] + "</a>"
                    break
                default:
                    break;
            }
        }
        this.finish_game(cur_player, cur_game)
        this.games.shift()
    }

    finish_game(cur_player, cur_game){
        if(this.games.length > 0){
            cur_player.bidding.set_dealer(cur_game.board.deal.dealer)
            cur_player.bidding.make_bidding_table()
        }
        var temp = false
        for (let i = 0; i < this.games.length; i++) {
            var e = this.games[i]
            if(e.board.bdno === cur_game.board.bdno && e.board.vul.str === cur_game.board.vul.str && e.board.deal.s === cur_game.board.deal.s){
                temp = true
                this.games[i].players.push(cur_player)
            }
        }
        if (temp !== true){
            cur_game.players.push(cur_player)
            this.games.push(cur_game)
        }
    }

    get get_games(){
        this.parse()
        return {vu: this}
    }
}

class Card {
    constructor({str, suit, rank}){
        if (typeof str !== 'undefined'){
            this.suit = str[0].toUpperCase()
            this.rank = str[1]
        } else {
            this.suit = suit.toUpperCase()
            this.rank = rank
        }
    }
}

class Suit {
    constructor({str, suit, ranks}){
        if (typeof str !== 'undefined'){
            this.ranks = Array.from({length: RANKS.length}, i => false)
            for (let i = 0; i < str.length; i++){
                for (let j = 0; j < RANKS.length; j++){
                    if (str[i].toUpperCase() == RANKS[j]){
                        this.ranks[j] = true
                    }
                }
            }
        } else {
            this.rank = ranks
        }
        this.s = ""
        this.str = ""
        this.suit = suit
        if (typeof this.suit !== 'undefined'){
            this.str = DISPLAY[suit]
        }
        for (let i = 0; i < RANKS.length; i++) {
            if (this.ranks[i]){
                this.s += RANKS[i]
            }
        }
        this.str += this.s
        this.len = this.ranks.filter(i => i === true).length
    }
}


class Hand {
    constructor({str, suits, player}){
        this.suits = {S: Suit, H: Suit, D: Suit, C: Suit}
        if (typeof str !== 'undefined'){
            var temp = Array()
            for (let i = 0; i < str.length; i++) {
                if (SUITS.includes(str[i])){
                    temp.push(str[i])
                } else {
                    temp[temp.length - 1] += str[i]
                }
            }
            for (let i = 0; i < temp.length; i++) {
                this.suits[temp[i][0]] = new Suit({str: temp[i].slice(1), suit: temp[i][0]})
            }
        }
        this.s = this.suits.S.s + this.suits.H.s + this.suits.D.s + this.suits.C.s
    }
}

class Deal {
    constructor({str, hands, dealer}){
        this.hands = {S: Hand, W: Hand, N: Hand, E: Hand}
        if (typeof str !== 'undefined'){
            this.dealer = CARDINALS[str[0] - 1]
            var s = str.slice(1)
            var temp = s.split(",")
            for (let i = 0; i < CARDINALS.length; i++){
                this.hands[CARDINALS[i]] = new Hand({str: temp[i]})
            }
        } else {
            this.hands = hands
            this.dealer = dealer
        }
        this.s = this.dealer + this.hands.S.s + this.hands.W.s + this.hands.N.s + this.hands.E.s
    }
}

class Vul {
    constructor(str){
        this.str = VUL[str]
        this.vulEW = ["b", "e"].includes(str)
        this.vulNS = ["b", "n"]. includes(str)
    }
}

class Board {
    constructor({bdno, vul, deal}){
        this.bdno = bdno
        this.vul = vul
        this.deal = deal
    }
}

class Game {
    constructor(){
        this.board = new Board({})
        this.players = new Array()
    }
}

class Call {
    constructor({str, level, strain, alerted}){
        if (typeof str !== 'undefined'){
            if (str[0].toUpperCase() in PDR){
                this.level = ""
                this.strain = PDR[str[0].toUpperCase()]
            } else {
                this.level = str[0]
                this.strain = str[1].toUpperCase()
            } 
            if (str[str.length - 1] === "!"){
                this.alerted = true
            } else {
                this.alerted = false
            }
        } else {
            this.level = level
            this.strain = strain
            this.alerted = alerted
        }
        this.disp = {str: this.level + DISPLAY[this.strain], alerted: this.alerted}
        this.notation = {
            num: null,
            str: null
        }
    }

    set_notation(num, str){
        this.notation.num = num
        this.notation.str = str
        this.disp.str += "<sup>" +  this.notation.num + "</sup>"
    }

}

class Bidding{
    constructor(){
        this.sequence = Array()
        this.notation_num = 1
        this.dealer = undefined
        this.bidding_table = undefined
        this.bidding_notation = new Array()
    }

    add_call(s){this.sequence.push(new Call({str: s}))}

    unescape_notation(s){
        var t = s
        for (let i = 0; i < SUITS.length; i++) {
            var pattern = RegExp("\\!" + SUITS[i], "gi")
            t = t.replace(pattern, DISPLAY[SUITS[i]])
        }
        return t
    }

    set_notation(s){
        this.sequence[this.sequence.length - 1].set_notation(this.notation_num, s)
        this.bidding_notation.push(`${this.notation_num}: ${this.unescape_notation(s)}`)
        this.notation_num++
    }

    set_dealer(s){this.dealer = s}

    make_bidding_table(){
        var q = Array()  // just a queue
        var header = new Array("W", "N", "E", "S")

        for (let i = 0; i < header.indexOf(this.dealer); i++) {
            q.push(" ")
        }

        for (let i = 0; i < this.sequence.length; i++) {
            q.push(this.sequence[i].disp)
        }

        while (q.length % 4 !== 0) {
            q.push(" ")
        }

        var t = Array()  // The output 2d table
        for (let i = 0; i < q.length; i = i + 4) {
            var r = new Array(q[i], q[i+1], q[i+2], q[i+3]) 
            t.push({row: r})
        }

        this.bidding_table = t
    }

}

class Player{
    constructor(){
        this.names = new Array()
        this.bidding = new Bidding()
        this.play = new Play()
        this.result = new Result()
    }
}

class Play{

}

class Result{
    constructor(){
        this.level = undefined
        this.strain = undefined
        this.declarer = undefined
        this.pdr = undefined
        this.res = undefined
        this.str = ""
    }
    
    set_result(str){
        if (str.length > 0 || typeof str !== 'undefined'){
            if (str.toUpperCase() === "PASS"){
                this.level = 0
                this.strain = "P"
                this.str = "Passout"
            } else {
                this.level = parseInt(str[0])
                this.strain = str[1]
                this.declarer = str[2]
                if (str[3].toUpperCase() === "X") {
                    if (str[4].toUpperCase() === "X"){
                        this.pdr = "XX"
                    } else {
                        this.pdr = "X"
                    }
                } else {
                    this.pdr = ""
                }
                if (str.slice(-1) === "=" || str.slice(-1) === "0"){
                    this.res = "="
                } else {
                    this.res = str.slice(-2)
                }
                this.str = this.level + DISPLAY[this.strain] + this.pdr + this.declarer + " " + this.res
            }
        }
    }
}

module.exports = {Parser}