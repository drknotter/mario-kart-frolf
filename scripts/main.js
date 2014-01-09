var powerNames = ["banana","blooper","bullet-bill","golden-mushroom","green-shell","lightning","mushroom","red-shell","spiny-shell","star","double-banana","double-green-shell","double-mushroom","double-red-shell"];
var listNames = ["Banana","Blooper","Bullet Bill","Golden Mushroom","Green Shell","Lightning","Mushroom","Red Shell","Spiny Shell","Star","Double Banana","Double Green Shell","Double Mushroom","Double Red Shell"];

var rulesText = ["The closest player whose disc lands within 5 yards of your disc before your next throw must throw his next shot with their non-dominant hand.",
                 "Every other player must close his eyes, spin once, and keep his eyes closed for his next shot.",
                 "You may choose to use another player's drive as your own. This power must be used before your first drive.",
                 "You may take five steps before each of your shots on this hole.",
                 "You may take two throws on your next shot, and choose between them. This does not override other effects in play.",
                 "Every other player must throw all of his shots on this hole while standing on one leg, with the exception of his drive.",
                 "You may take one step before your next shot.",
                 "A player whose score is currently better than yours must throw their next shot with his dominant hand in a style you choose.",
                 "The current score leader must take his next shot on this hole with his back facing towards the basket.",
                 "You may take five steps before each shot this hole, and every player whose disc is within 10 yards of your disc must throw his next shot with their non-dominant hand. You are unaffected by any powers triggered by another player.",
                 "The closest player whose disc lands within 5 yards of your disc before your next throw must throw his next shot with their non-dominant hand. You may use this power up to two times.",
                 "You may take two throws on your next shot, and choose between them. You may use this power up to two times.",
                 "You may take one step before your next shot. You may use this power up to two times.",
                 "A player whose score is currently better than yours must throw their next shot on this hole with his dominant hand in a style you choose. You may use this power up to two times."
                 ];

var soundNames = ["item_roulette_lockin"];

var probabilities = [function(p){return 30*exponential(1.00,0.10,p);}, // banana
                     function(p){return  5*exponential(0.25,0.10,p);}, // blooper
                     function(p){return 25*exponential(0.00,0.05,p);}, // bullet bill
                     function(p){return 10*exponential(0.00,0.15,p);}, // golden mushroom
                     function(p){return 15*exponential(0.10,0.15,p);}, // green shell
                     function(p){return 10*exponential(0.30,0.10,p);}, // lightning
                     function(p){return 20*exponential(0.75,0.10,p);}, // mushroom
                     function(p){return 10*exponential(0.50,0.15,p);}, // red shell
                     function(p){return  5*exponential(0.40,0.10,p);}, // spiny shell
                     function(p){return 15*exponential(0.10,0.05,p);}, // star
                     function(p){return 15*exponential(1.00,0.10,p);}, // double banana
                     function(p){return  7*exponential(0.10,0.15,p);}, // double green shell
                     function(p){return 10*exponential(0.75,0.10,p);}, // double mushroom
                     function(p){return  5*exponential(0.50,0.15,p);}];// double red shell

function exponential(m,d,x) { return Math.exp(-(x-m)*(x-m)/(2*d*d)); };
function totalProb(p) {
    var total = 0;
    for( var i=0; i<probabilities.length; i++ ) {
        total += probabilities[i](p);
    }
    return total;
}
function randomIndex(p) {
    var t = totalProb(p);
    var uniform = Math.random();
    var sum = 0.0;
    for( var i=0; i<probabilities.length; i++ ) {
        sum += probabilities[i](p)/t;
        if( uniform < sum )
            return i;
    }
    return -1; // this shouldn't happen
}

var boxBorderWidth = 15;
var tabRLMargin = 10;
var tabBoxPadding = 15;

var spinFPS = 8;
var blinkFPS = 5;
var spinDuration = 3.3;
var blinkDuration = 8/blinkFPS;

var images = new Array();
var sounds = new Array();

var numPlayers = 0;
var currentPlayer = -1;

$(function() {

        // preload assets
        for( var i=0; i<powerNames.length; i++ ) {
            images.push(new Image());
            images[images.length-1].src = "images/"+powerNames[i]+".jpg";
        }
        for( var i=0; i<soundNames.length; i++ ) {
            sounds.push(new Audio());
            sounds[sounds.length-1].src = "sounds/"+soundNames[i]+".ogg";
        }

        $(window).resize(fit);

        $("#powerSelect").append("<option value=''></option>");
        for( var i=0; i<powerNames.length; i++ ) 
            $("#powerSelect").append("<option value='"+powerNames[i]+"'>"+listNames[i]+"</option>");
        $("#powerSelect").on("change",function() {
                if( this.value != "" )
                    $("#powerBox").css({"background-image": "url(images/"+this.value+".jpg)"});
                else
                    $("#powerBox").css({"background-image": "none"});
                showPowerRules(powerNames.indexOf(this.value));
            });
        //$('#powerSelect').css({'position': 'absolute', 'text-align': 'center'});

        $("#powerBox").css({
                "border-style": "outset",
                "border-width": boxBorderWidth+"px",
                "border-color": "#666666", 
                "background-color": "white",
                "background-position": "center",
                "background-size": "auto 100%",
                "background-repeat": "no-repeat",
                "position":"absolute"});
        $("#powerBox").mousedown(function(){
                $(this).css({"border-style":"inset"});
            });
        $("#powerBox").on("mouseup",startSpin);

        $('#tabBox').css({'position': 'absolute'});
        $('.tabTitle').css({'position': 'absolute',
                    'background-color': '#666666',
                    'margin': '0px '+tabRLMargin+'px 0px '+tabRLMargin+'px',
                    'display': 'table',
                    'cursor': 'pointer'});
        $('.tabTitle').css('opacity',function(i){ return i==0?1.0:0.5; });
        $('.tabTitle p').css({'display': 'table-cell',
                    'vertical-align': 'middle'});

        $('.tabTitle').mousedown(function(){
                switch( $(this).index() ) {
                case 0:
                    showPlayerList();
                    break;
                case 1:
                    showPowerRules($('#powerSelect').val());
                    break;
                }
            });

        $('#rulesBox').css({'visibility': 'hidden',
                    'position': 'absolute',
                    'background-color': '#666666',
                    'padding': tabBoxPadding+'px',
                    'margin-bottom': '15px'});

        $('#playerListBox').css({'visibility': 'visible',
                    'position': 'absolute',
                    'background-color': '#666666',
                    'padding': tabBoxPadding+'px',
                    'margin-bottom': '15px'});

        $('#addPlayer').css({'padding':'5px',
                    'background-color': '#888888',
                    'margin-top': tabBoxPadding+'px',
                    'cursor': 'pointer'});
        $('#addPlayer').mousedown(function() {
                addPlayer(); 
            });

        fit();
});

function startSpin() {

    var playerScoreDivs = $('.playerScore');
    var bestScore = 1000000, worstScore = -1000000, myScore = 0;
    var score;
    for( var i=0; i<playerScoreDivs.length; i++ ) {
        score = parseInt($(playerScoreDivs[i]).html());
        if( score > worstScore )
            worstScore = score;
        if( score < bestScore )
            bestScore = score;
        if( i == currentPlayer )
            myScore = score;
    }

    var position = bestScore<worstScore ? (myScore-worstScore)/(bestScore-worstScore) : 1.0;
    
    var indexOrder = [], unchosenIndices = [], r;
    for( var i=0; i<powerNames.length; i++ ) {
        unchosenIndices.push(i);
    }
    r = randomIndex(position);
    indexOrder.push(unchosenIndices[r]);
    unchosenIndices.splice(r,1);

    var s=unchosenIndices.length;
    for( var i=0; i<s; i++ ) {
        r = Math.floor(Math.random()*unchosenIndices.length);
        indexOrder.push(unchosenIndices[r]);
        unchosenIndices.splice(r,1);
    }

    $("#powerBox").css({"border-style":"outset"});
    $("#powerBox").off("mouseup");
    $("#rules").html("");
    //sounds[0].play();

    spinPowerBox(indexOrder,0);
}

function spinPowerBox(indexOrder,frameNumber) {
    
    if( frameNumber < spinFPS*spinDuration ) {
        $("#powerBox").css({"background-image": "url(images/"+powerNames[indexOrder[frameNumber%indexOrder.length]]+".jpg)"});
        setTimeout(function(){spinPowerBox(indexOrder,frameNumber+1);},1000/spinFPS);
    } else {
        //sounds[1].play();
        if( indexOrder[0] == -1 )
            $("#rules").html("");
        else
            $("#rules").html(rulesText[indexOrder[0]]);
        blinkBackgroundImage(indexOrder[0],0);
    }
    
}

function blinkBackgroundImage(randomIndex,frameNumber) {
    if( frameNumber < blinkFPS*blinkDuration ) {
        if( frameNumber % 2 == 0 )
            $("#powerBox").css({"background-image": "none"});
        else
            $("#powerBox").css({"background-image": "url(images/"+powerNames[randomIndex]+".jpg)"});
        setTimeout(function(){blinkBackgroundImage(randomIndex,frameNumber+1);},1000/blinkFPS);
    } else {
        $("#powerBox").css({"background-image": "url(images/"+powerNames[randomIndex]+".jpg)"});
        $("#powerBox").on("mouseup",function(){
                selectPlayer(++currentPlayer);
                $("#powerBox").off("mouseup");
                $("#powerBox").on("mouseup",startSpin);
            });
    }
}

function randomBackgroundImage() {
    var randomIndex = Math.floor(Math.random()*powerNames.length);
    $("#powerBox").css({"background-image": "url(images/"+powerNames[randomIndex]+".jpg)"});
}

function showPowerRules(index) {
    $('#rulesBox').css({'visibility': 'visible'});
    $('#playerListBox').css({'visibility': 'hidden'});
    $('.tabTitle').css('opacity',function(i){return i==1?1.0:0.5;});
    if( index == -1 )
        $("#rules").html("");
    else
        $("#rules").html(rulesText[index]);
}

function showPlayerList() {
   $('#rulesBox').css({'visibility': 'hidden'});
   $('#playerListBox').css({'visibility': 'visible'});
   $('.tabTitle').css('opacity',function(i){return i==0?1.0:0.5;});
}

function addPlayer() {
    
    var name = prompt("Enter player name","Player "+(numPlayers+1));
    $('#playerList').append('<div class=\"player\"><div class=\"removePlayer\">x</div><div class=\"playerName\">'+name+'</div><div class=\"playerScore\">0</div><div class=\"plusOne\">+</div><div class=\"minusOne\">-</div></div>');
    
    var newPlayer = $('.player').last();
    newPlayer.mousedown(function(){selectPlayer($(this).index());});
    newPlayer.find('.removePlayer').css({'background-color': '#333333',
                'cursor': 'pointer'});
    newPlayer.find('.removePlayer').mousedown(function(){removePlayer(this);});
    newPlayer.find('.plusOne').css({'background-color': '#333333',
                'cursor': 'pointer'});
    newPlayer.find('.plusOne').mousedown(function(){addToScore(this,1);});
    newPlayer.find('.minusOne').css({'background-color': '#333333',
                'cursor': 'pointer'});
    newPlayer.find('.minusOne').mousedown(function(){addToScore(this,-1);});

    numPlayers++;
    fit();
    sortPlayers();
    selectPlayer(0);
}

function removePlayer(element) {
    $(element).parent().remove();
    numPlayers--;
    selectPlayer(0);
}

function addToScore(element,addition) {
    var newScore = parseInt($(element).parent().find('.playerScore').html())+addition;
    $(element).parent().find('.playerScore').html(newScore>0?'+'+newScore:newScore);
    sortPlayers();
}

function selectPlayer(index) {
    if( index < 0 || index >= numPlayers )
        currentPlayer = 0;
    else
        currentPlayer = index;
    $('.player').css('background-color',function(i){return i==currentPlayer?'#888888':'#666666';});
    $("#powerBox").css({"background-image": "none"});
    $("#rules").html("");
    $('#powerSelect').val(0);

    $("#powerBox").off("mouseup");
    $("#powerBox").on("mouseup",startSpin);
}

function sortPlayers() {

    var playerScoreDivs = $('.playerScore');
    var scores = new Array(playerScoreDivs.length);
    var newOrder = new Array(playerScoreDivs.length);

    var players = $('.player');
    players.detach().sort(function(a,b){
            var aScore = parseInt($(a).find('.playerScore').html());
            var bScore = parseInt($(b).find('.playerScore').html());
            return aScore - bScore;
        });
    $('#playerList').append(players);

}

function fit() {
    
    var windowWidth = $(window).width();
    var windowHeight = $(window).height();
    var min = windowWidth<windowHeight ? windowWidth : windowHeight;

    var totalWidth = 0.7*min;
    var gridWidth = 0.15*totalWidth;
    var gridHeight = gridWidth;
    var offsetLeft = (windowWidth-totalWidth)/2;
    
    $('#powerBox').css({'width': (totalWidth-2*boxBorderWidth)+'px',
                'height': (totalWidth-2*boxBorderWidth)+'px',
                'top': (0.5*gridHeight)+'px',
                'left': offsetLeft+'px'});

    $('#tabBox').css({'width': totalWidth+'px',
                'top': (gridHeight+totalWidth)+'px',
                'left': offsetLeft+'px'});
    $('.tabTitle').css({'width': (totalWidth/2-2*tabRLMargin)+'px',
                'height': gridHeight+'px',
                'overflow': 'hidden',
                'font-size': 0.4*gridHeight+'px'});
    $('.tabTitle').css('left',function(i){return i*totalWidth/2;});

    $('#rulesBox').css({'top': (gridHeight-1)+'px',
                'width': (totalWidth-2*tabBoxPadding)+'px',
                'font-size': 0.3*gridHeight+'px'});
    $('#powerSelect').css({'width': (totalWidth-2*tabBoxPadding)+'px',
                'height': gridHeight+'px',
                'font-size': (0.4*gridHeight)+'px'});

    $('#playerListBox').css({'top': (gridHeight-1)+'px',
                'width': (totalWidth-2*tabBoxPadding)+'px'});
    $('#addPlayer').css({'font-size': 0.4*gridHeight+'px'});

    $('.player').css({'width':(totalWidth-2*tabBoxPadding)+'px', 
                'display': 'table',
                'margin-bottom': '10px'});
    $('.player div').css({'display': 'inline-block',
                'font-size': 0.4*gridHeight+'px',
                'vertical-align': 'middle'});

    var playerRMargin = 5;
    var totalPlayerWidth = totalWidth-2*tabBoxPadding-4*playerRMargin-1;
    $('.removePlayer').css({'height': (0.5*gridHeight)+'px',
                'width': (totalPlayerWidth/8)+'px',
                'margin-right': playerRMargin+'px',
                'padding': (0.1*gridHeight)+'px 0px '+(0.1*gridHeight)+'px 0px'});
    $('.playerName').css({'width':(totalPlayerWidth/2)+'px',
                'height': (0.5*gridHeight)+'px',
                'font-size': 0.4*gridHeight+'px',
                'padding': '0px',
                'margin': '0px',
                'margin-right': playerRMargin+'px',
                'padding': (0.1*gridHeight)+'px 0px '+(0.1*gridHeight)+'px 0px'});
    $('.playerScore').css({'width':(totalPlayerWidth/8)+'px',
                'height': (0.5*gridHeight)+'px',
                'margin-right': playerRMargin+'px',
                'padding': (0.1*gridHeight)+'px 0px '+(0.1*gridHeight)+'px 0px'});
    $('.plusOne').css({'width':(totalPlayerWidth/8)+'px',
                'height': (0.5*gridHeight)+'px',
                'margin-right': playerRMargin+'px',
                'padding': (0.1*gridHeight)+'px 0px '+(0.1*gridHeight)+'px 0px'});
    $('.minusOne').css({'width':(totalPlayerWidth/8)+'px',
                'height': (0.5*gridHeight)+'px',
                'padding': (0.1*gridHeight)+'px 0px '+(0.1*gridHeight)+'px 0px'});

}
