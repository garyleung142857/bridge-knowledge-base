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
            players: new Array()
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
                    if (data[0] === "c"){
                        cur_player.names = this.meta.players.slice(4)
                    } else {
                        cur_player.names = this.meta.players.slice(0, 4) 
                    }
                    cur_game.board.bdno = /\d+/.exec(data)[0]
                    break
                case "rs": // result
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
            cur_game.players.push(cur_player)
        }
        this.games.push(cur_game)
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
        this.str = ""
        this.suit = suit
        if (typeof this.suit !== 'undefined'){
            this.str = DISPLAY[suit]
        }
        for (let i = 0; i < RANKS.length; i++) {
            if (this.ranks[i]){
                this.str += RANKS[i]
            }
        }        
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
        // this.players = players
    }
}

class Game {
    constructor(){
        this.board = new Board({})
        // this.bidding = new Bidding()
        // this.play = new Play()
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
        this.str = this.level + DISPLAY[this.strain]
        this.notation = {
            num: null,
            str: null
        }
    }

    set_notation(num, str){
        this.notation.num = num
        this.notation.str = str
        this.str += "<sup>" +  this.notation.num + "</sup>"
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

    add_call(s){
        this.sequence.push(new Call({str: s}))
    }

    set_notation(s){
        this.sequence[this.sequence.length - 1].set_notation(this.notation_num, s)
        this.bidding_notation.push(`${this.notation_num}: ${s}`)
        this.notation_num ++
    }

    set_dealer(s){
        this.dealer = s
    }

    make_bidding_table(){
        var q = Array()  // just a queue
        var header = new Array("W", "N", "E", "S")

        for (let i = 0; i < header.indexOf(this.dealer); i++) {
            q.push(" ")
        }

        for (let i = 0; i < this.sequence.length; i++) {
            q.push(this.sequence[i].str)
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

}

var test_hand = "SA3HQJ7DQ9743C986"
var test_deal = "3SJTHJ5DAK43CKT982,SKQ7HKQ97DT76CQ75,SA92HA842DQJ5CAJ6,S86543HT63D982C43"
var test_str = `vg|Gabi Pleven Teams,Round 5_11,I,1,32,Avesta,0,Struma,0| rs|,,,,,,,,,,,,,,,,2HN+1,1NSx=,3CN+2,3HW-4,3SE+1,4SE=,4SW-1,4SW-1,3NN+3,3NN=,3HW-1,2HW=,1NS=,2CW-2,4HE+1,4SE+1,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,| pn|Ferov,Dunev,Andonov,Kovandzhiy,Slavov,Alexandrov,Videnova,Georgiev|pg|| qx|o9|st||md|3SK97H96DQJT98CA42,SAQJ5HKT4DA7CKJT5,ST86HAQ832DK52C73,S432HJ75D643CQ986|sv|e|mb|p|mb|p|mb|1D!|mb|d|mb|1H|mb|p|mb|1N|mb|d|mb|2H|mb|p|mb|p|mb|p|pc|c6|pc|c2|pc|cK|pc|c3|pg|| pc|cJ|pc|c7|pc|c8|pc|cA|pg|| pc|h6|pc|h4|pc|hQ|pc|h7|pg|| pc|d2|pc|d3|pc|dQ|pc|dA|pg|| pc|c5|pc|h2|pc|c9|pc|c4|pg|| pc|hA|pc|h5|pc|h9|pc|hT|pg|| pc|h3|pc|hJ|pc|s7|pc|hK|pg|| pc|cT|pc|h8|pc|cQ|pc|s9|pg|| pc|dK|pc|d4|pc|d8|pc|d7|pg|| mc|9|pg|| qx|c9|st||md|3SK97H96DQJT98CA42,SAQJ5HKT4DA7CKJT5,ST86HAQ832DK52C73,S432HJ75D643CQ986|sv|e|mb|p|mb|p|mb|1D!|mb|d|mb|r|mb|p|mb|1N|mb|d|mb|p|mb|p|mb|p|pc|cJ|pc|c3|pc|c6|pc|c2|pg|| pc|c5|pc|c7|pc|c9|pc|cA|pg|| pc|h6|pc|h4|pc|hQ|pc|h7|pg|| pc|d2|pc|d6|pc|dQ|pc|dA|pg|| pc|cK|pc|h2|pc|c8|pc|c4|pg|| pc|cT|pc|h3|pc|cQ|pc|s7|pg|| pc|s4|pc|s9|pc|sJ|pc|s6|pg|| pc|d7|pc|dK|pc|d3|pc|d8|pg|| pc|d5|pc|d4|pc|d9|pc|s5|pg|| pc|dJ|pc|hT|pc|s8|pc|s2|pg|| pc|dT|pc|hK|pc|sT|pc|s3|pg|| pc|h9|pc|sQ|pc|hA|pc|h5|pg|| pc|h8|pc|hJ|pc|sK|pc|sA|pg|| pg|| qx|o10|st||md|4SQ98HA87DQJ832CJ4,ST753H9532DK64CQ3,SA4HJT6D5CAKT9876,SKJ62HKQ4DAT97C52|sv|b|nt|vugraphzgs: http://bridge.bg/en/tournaments_results/3887-Otbor%D0%B5n-turnir-GABI-2018-Pl%D0%B5v%D0%B5n|pg|| nt|vugraphzgs: current standings after 4 rounds|pg|| mb|1D!|mb|p|mb|p|mb|3C|mb|p|mb|p|mb|p|pc|c5|pc|cJ|pc|cQ|pc|cA|pg|| pc|sA|pc|s2|pc|s8|pc|s3|pg|| pc|s4|pc|sK|pc|s9|pc|s5|pg|| pc|s6|pc|sQ|pc|s7|pc|d5|pg|| pc|dQ|pc|dK|pc|c6|pc|d7|pg|| pc|cK|pc|c2|pc|c4|pc|c3|pg|| pc|cT|pc|d9|pc|d2|pc|d4|pg|| pc|c9|pc|sJ|pc|d3|pc|d6|pg|| pc|c8|pc|dT|pc|d8|pc|h2|pg|| pc|hJ|pc|hQ|pc|hA|pc|h5|pg|| pc|h8|pc|h3|pc|h6|pc|hK|pg|| mc|11|pg|| qx|c10|st||md|4SQ98HA87DQJ832CJ4,ST753H9532DK64CQ3,SA4HJT6D5CAKT9876,SKJ62HKQ4DAT97C52|sv|b|mb|1D!|mb|p|mb|1H|mb|3C|mb|d|mb|p|mb|3H|mb|p|mb|p|mb|p|pc|cK|pc|c2|pc|c4|pc|c3|pg|| pc|cA|pc|c5|pc|cJ|pc|cQ|pg|| pc|cT|pc|hK|pc|d3|pc|d4|pg|| pc|d7|pc|d8|pc|dK|pc|d5|pg|| pc|s3|pc|s4|pc|sJ|pc|sQ|pg|| pc|s9|pc|s5|pc|sA|pc|s2|pg|| pc|hJ|pc|hQ|pc|hA|pc|h2|pg|| pc|dQ|pc|d6|pc|h6|pc|d9|pg|| pc|c9|pc|dT|pc|h7|pc|h9|pg|| pc|s7|pc|hT|pc|s6|pc|s8|pg|| mc|5|pg|| qx|o11|st||md|1S64H8DAKT975CK982,SAQ9HQJ75D643CQJ7,ST7HKT964DJ8CT643,SKJ8532HA32DQ2CA5|sv|o|mb|1D|mb|d|mb|1H|mb|d|mb|2D|mb|p|mb|p|mb|3S|mb|p|mb|p|mb|p|pc|dA|pc|d3|pc|d8|pc|d2|pg|| pc|h8|pc|hQ|pc|h6|pc|h3|pg|| pc|sA|pc|s7|pc|s2|pc|s4|pg|| pc|sQ|pc|sT|pc|s3|pc|s6|pg|| pc|c7|pc|c3|pc|cA|pc|c2|pg|| pc|c5|pc|cK|pc|cJ|pc|c4|pg|| pc|dK|pc|d4|pc|dJ|pc|dQ|pg|| mc|10|pg|| qx|c11|st||md|1S64H8DAKT975CK982,SAQ9HQJ75D643CQJ7,ST7HKT964DJ8CT643,SKJ8532HA32DQ2CA5|sv|o|mb|1D!|mb|d|mb|1H|mb|4S|mb|p|mb|p|mb|p|pc|dK|pc|d3|pc|d8|pc|d2|pg|| pc|dA|pc|d4|pc|dJ|pc|dQ|pg|| pc|h8|pc|hQ|pc|hK|pc|hA|pg|| pc|s3|pc|s4|pc|sA|pc|s7|pg|| pc|sQ|pc|sT|pc|s5|pc|s6|pg|| pc|d6|pc|h4|pc|s2|pc|d5|pg|| pc|c5|pc|cK|pc|c7|pc|c3|pg|| mc|10|nt|vugraphb1: current standings after 4 rounds|pg|| nt|vugraphb1: http://bridge.bg/en/tournaments_results/3887-Otbor%D0%B5n-turnir-GABI-2018-Pl%D0%B5v%D0%B5n|pg|| pg|| qx|o12|st||md|2S954HK65DQ7CJT532,SA8632HA9D86432C8,SK7HJT743DAJT95C6,SQJTHQ82DKCAKQ974|sv|n|mb|2S|mb|p|mb|4S|mb|p|mb|p|mb|p|pc|c6|pc|cA|pc|c5|pc|c8|pg|| pc|dK|pc|d7|pc|d2|pc|dA|pg|| pc|h4|pc|hQ|pc|hK|pc|hA|pg|| pc|d3|pc|dJ|pc|sT|pc|dQ|pg|| pc|cK|pc|c2|pc|h9|pc|s7|pg|| pc|sK|pc|sJ|pc|s5|pc|sA|pg|| pc|d4|pc|d5|pc|sQ|pc|h6|pg|| pc|cQ|pc|c3|pc|d6|pc|h3|pg|| pc|c9|pc|cT|pc|s2|pc|h7|pg|| pc|s8|pc|d9|pc|c4|pc|s9|pg|| pc|cJ|pc|s3|pc|hT|pc|c7|pg|| pc|s6|pc|hJ|pc|h2|pc|s4|pg|| pc|d8|pc|dT|pc|h8|pc|h5|pg|| pg|| qx|c12|st||md|2S954HK65DQ7CJT532,SA8632HA9D86432C8,SK7HJT743DAJT95C6,SQJTHQ82DKCAKQ974|sv|n|mb|2S!|mb|p|mb|4S|mb|p|mb|p|mb|p|pc|hJ|pc|hQ|pc|hK|pc|hA|pg|| pc|c8|pc|c6|pc|cA|pc|c2|pg|| pc|cK|pc|c3|pc|h9|pc|s7|pg|| pc|dA|pc|dK|pc|d7|pc|d2|pg|| pc|hT|pc|h2|pc|h5|pc|s2|pg|| pc|d3|pc|d5|pc|sT|pc|dQ|pg|| pc|h8|pc|h6|pc|s3|pc|h3|pg|| pc|d4|pc|d9|pc|sJ|pc|c5|pg|| pc|c4|pc|cT|pc|s8|pc|sK|pg|| pc|h7|pc|c7|pc|cJ|pc|s6|pg|| pc|d6|pc|dT|pc|sQ|pc|s4|pg|| pc|cQ|pc|s5|pc|sA|pc|h4|pg|| pc|d8|pc|dJ|pc|c9|pc|s9|pg|| pg|| qx|o13|st||md|3SJTHJ5DAK43CKT982,SKQ7HKQ97DT76CQ75,SA92HA842DQJ5CAJ6,S86543HT63D982C43|sv|b|mb|1N|mb|p|mb|3N|mb|p|mb|p|mb|p|pc|s4|pc|sT|pc|sQ|pc|sA|pg|| pc|d5|pc|d2|pc|dA|pc|d6|pg|| pc|cT|pc|c5|pc|c6|pc|c3|pg|| pc|c2|pc|c7|pc|cJ|pc|c4|pg|| pc|cA|pc|h6|pc|c8|pc|cQ|pg|| pc|s2|pc|s3|pc|sJ|pc|sK|pg|| pc|hK|pc|hA|pc|h3|pc|h5|pg|| pc|s9|pc|s5|pc|hJ|pc|s7|pg|| pc|dQ|pc|d8|pc|d3|pc|d7|pg|| pc|dJ|pc|d9|pc|dK|pc|dT|pg|| mc|12|pg|| qx|c13|st||md|3SJTHJ5DAK43CKT982,SKQ7HKQ97DT76CQ75,SA92HA842DQJ5CAJ6,S86543HT63D982C43|sv|b|mb|1N|mb|p|mb|3N|mb|p|mb|p|mb|p|pc|h6|pc|hJ|pc|hQ|pc|h4|pg|| pc|hK|pc|h8|pc|h3|pc|h5|pg|| pc|h9|pc|hA|pc|hT|pc|sT|pg|| pc|cJ|pc|c3|pc|c2|pc|cQ|pg|| pc|h7|pc|h2|pc|s6|pc|sJ|pg|| pc|sK|mc|9|pg|| qx|c14|st||md|4SQT984H8DA8CKJ432,SK65HAKT95D652C75,SA3HQJ7DQ9743C986,SJ72H6432DKJTCAQT|sv|o|mb|1D!|mb|1S|mb|2H|mb|p|mb|p|mb|p|pc|sA|pc|s2|pc|s4|pc|s5|pg|| pc|s3|pc|s7|pc|s8|pc|sK|pg|| pc|hA|pc|h7|pc|h2|pc|h8|pg|| pc|hK|pc|hJ|pc|h3|pc|c3|pg|| pc|d2|pc|d4|pc|dT|pc|dA|pg|| pc|sQ|pc|s6|pc|c8|pc|sJ|pg|| pc|d8|pc|d5|pc|d3|pc|dJ|pg|| pc|dK|pc|c2|pc|d6|pc|d7|pg|| pc|h4|pc|s9|pc|h9|pc|hQ|pg|| pc|c9|pc|cQ|pc|cK|mc|8|pg|| qx|o15|st||md|1SAJ9H63DQ965CAJ86,SQ5HA75D8432C9753,ST876HQJ82DAJ7CT4,SK432HKT94DKTCKQ2|sv|n|mb|1D!|mb|p|mb|1H|mb|d|mb|1N|mb|p|mb|p|mb|p|pc|c7|pc|c4|pc|cQ|pc|cA|pg|| pc|d5|pc|d2|pc|dJ|pc|dK|pg|| pc|cK|pc|c6|pc|c5|pc|cT|pg|| pc|c2|pc|cJ|pc|c3|pc|s6|pg|| pc|h3|pc|h5|pc|hJ|pc|hK|pg|| pc|s2|pc|s9|pc|sQ|pc|s7|pg|| pc|c9|pc|d7|pc|s3|pc|c8|pg|| pc|d3|pc|dA|pc|dT|pc|d6|pg|| pc|s8|pc|s4|pc|sJ|pc|s5|pg|| mc|7|pg|| qx|c15|st||md|1SAJ9H63DQ965CAJ86,SQ5HA75D8432C9753,ST876HQJ82DAJ7CT4,SK432HKT94DKTCKQ2|sv|n|mb|1D!|mb|p|mb|1H|mb|p|mb|1N|mb|p|mb|p|mb|d|mb|p|mb|2C|mb|p|mb|p|mb|p|pc|hQ|pc|h4|pc|h3|pc|hA|pg|| pc|c3|pc|c4|pc|cK|pc|c6|pg|| pc|s2|pc|s9|pc|sQ|pc|s6|pg|| pc|c5|pc|cT|pc|cQ|pc|cA|pg|| pc|d5|pc|d2|pc|dA|pc|dT|pg|| pc|sT|pc|sK|pc|sA|pc|s5|pg|| pc|cJ|pc|c7|pc|d7|pc|c2|pg|| pc|d6|pc|d3|pc|dJ|pc|dK|pg|| pc|s3|pc|sJ|pc|c9|pc|s7|pg|| pc|h5|pc|h2|pc|h9|pc|h6|pg|| pc|hK|pc|c8|mc|6|pg|| qx|o16|st||md|2SQ9H42DKQJT875CA4,SAKH83DA643CJT972,SJ32HAJ7D92CKQ653,ST87654HKQT965DC8|sv|e|mb|1D!|mb|p|mb|1H|mb|3D|mb|p|mb|p|mb|3S|mb|p|mb|3N|mb|p|mb|4H|mb|p|mb|p|mb|p|pc|dK|pc|dA|pc|d2|pc|c8|pg|| pc|h3|pc|h7|pc|hK|pc|h2|pg|| pc|s4|pc|s9|pc|sA|pc|s3|pg|| pc|h8|pc|hA|pc|h5|pc|h4|pg|| pc|cQ|pc|h6|pc|c4|pc|c2|pg|| pc|hQ|pc|d5|pc|d3|pc|hJ|pg|| pc|s5|pc|sQ|pc|sK|pc|s2|pg|| pc|c7|pc|c3|pc|h9|pc|cA|pg|| mc|11|pg|| qx|c16|st||md|2SQ9H42DKQJT875CA4,SAKH83DA643CJT972,SJ32HAJ7D92CKQ653,ST87654HKQT965DC8|sv|e|nt|vugraphb1: Last board here. TY ALL. See you after about 30 min. for round 6|pg|| mb|1D!|mb|p|mb|1S|mb|4D|mb|p|mb|p|mb|4H|mb|p|mb|4S|mb|p|mb|p|mb|p|pc|dK|pc|dA|pc|d2|pc|c8|pg|| pc|sA|pc|s2|pc|s4|pc|s9|pg|| pc|sK|pc|s3|pc|s5|pc|sQ|pg|| pc|h3|pc|h7|pc|h9|pc|h2|pg|| pc|hK|pc|h4|pc|h8|pc|hA|pg|| mc|11|pg||`

// console.log(parser(test_str))
// console.log(new Card({str: 'S9'}))
// console.log(new Card({str: 'dK'}))
// console.log(new Card({suit: 'c', rank: 'A'}))
// console.log(new Suit({str: 'A762'}))
// console.log(new Hand({str: test_hand}))
// var d = new Deal({str: test_deal})
// console.log(d)
// console.log(d.hands.S)
// console.log(new Call({str: '1N!'}))
// console.log(new Call({str: 'p'}))
// console.log(new Call({str: '6S!'}))
// console.log(new Call({str: 'd'}))
// console.log(new Call({str: 'r!'}))
// var b = new Bidding()
// b.add_call("1S!")
// b.set_notation("Forcing")
// b.add_call("P")
// b.add_call("P")
// console.log(b)
// console.log(b.sequence[0])
// console.log(new Vul("b"))
// var b = new Board({})
// b.bdno = 19
// console.log(b)

// var p = new Parser(test_str)
// console.log(p.bds)

module.exports = {Parser}