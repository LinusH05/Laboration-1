'use strict';
//Filen app.js är den enda ni skall och tillåts skriva kod i.

    //Access med localhost:3000
    //nodemon app.js för konstant körning
    //Ctrl c för att stoppa terminalen/git
    //npm install - projektNamnet
    //node app.js för en körning
    //cd tictactoe

const express = require('express');

const jsDOM = require('jsdom');
const cookieParser = require('cookie-parser');

const globalObject = require('./servermodules/game-modul.js');


const {Server} = require('socket.io'); 

const fs = require('fs');

let app = express();

const httpserver = app.listen(3002, function(req, res){
    console.log('Servern körs');
});

const io = new Server(httpserver);

app.use('/public', express.static(__dirname + "/static"));
app.use(express.urlencoded( { extended : true }));
app.use(cookieParser('asdasdad'));

io.on('connection', function(socket) {

    const cookieHeader = socket.handshake.headers.cookie;
    const cookies = globalObject.parseCookies(cookieHeader);

    if (cookies.nickName && cookies.color) {

        console.log("Cookie nickname: " + cookies.nickName + " | ","Cookie color: " + cookies.color);

        if(globalObject.playerOneSocketId === null || globalObject.playerTwoSocketId === null){
            //Om spelare 1 eller 2 inte har ett socketId sparat
            
            //ERROR - SKA REDIGERAS
            if (globalObject.playerOneNick !== null && globalObject.playerTwoNick === null) {
                //Om spelare 1 är sparad men inte spelare 2
    
                globalObject.playerOneSocketId = socket.id;
                socket.join('room1');
    
            } else if (globalObject.playerOneNick !== null && globalObject.playerTwoNick !== null) {
                //Om spelare 1 och 2 är sparade
    
                globalObject.playerTwoSocketId = socket.id;
                socket.join('room2');
  
            }
        
        } else {

            //Disconnect vid 3e spelare
            console.log('Disconnect...')
            console.log('Redan två spelare anslutna!');
            socket.disconnect(true);

        }

        if (globalObject.playerOneSocketId !== null && globalObject.playerTwoSocketId !== null) {

            console.log("Nytt spel?");

            globalObject.resetGameArea();
    
            io.to('room1').emit('newGame', {
                "opponentNick" : globalObject.playerTwoNick,
                "opponentColor" : globalObject.playerTwoColor,
                "myColor" : globalObject.playerOneColor
            });
            console.log('Spelare 1 fick spelare 2 data');
            
            io.to('room2').emit('newGame', {
                "opponentNick" : globalObject.playerOneNick,
                "opponentColor" : globalObject.playerOneColor,
                "myColor" : globalObject.playerTwoColor
            });
            console.log('Spelare 2 fick spelare 1 data');

            globalObject.currentPlayer = 1;

            io.to("room1").emit('yourMove', null);

        }

    } else {

        console.log("Kakorna saknas!");
        socket.disconnect(true);

    }
    
    
/*
    socket.on(nickName,color, function(){
        const cookieHeader = socket.handshake.headers.cookie;
        const cookies = parseCookies(cookieHeader);
        const nickName = cookies.nickName;
        const color = cookies.color;

        
    })
    */

    socket.on('newMove', function(data) {

        console.log(data.cellId);

        if (socket.id === globalObject.playerOneSocketId) {

            globalObject.gameArea[data.cellId] = globalObject.playerOneNick;
            globalObject.currentPlayer = 2;
            
            io.to("room2").emit('yourMove', { "cellId" : data.cellId });

            console.log("Nu blir det spelare 2's tur");  
            
        } else {

            globalObject.gameArea[data.cellId] = globalObject.playerTwoNick;  
            globalObject.currentPlayer = 1;

            io.to("room1").emit('yourMove', { "cellId" : data.cellId });

            console.log("Nu blir det spelare 1's tur");

        }

        let result = globalObject.checkForWinner();

        if ( result === 0 ) {
            console.log("Spelet fortsätter");
        }
        else if( result === globalObject.playerOneNick){
            io.emit('gameover', globalObject.playerOneNick + " vann spelet");
        }
        else if( result === globalObject.playerTwoNick){
            io.emit('gameover', globalObject.playerTwoNick + " vann spelet");
        } else if(result === 3 ){
            io.emit('gameover', "Spelet är oavgjort");
        }

        if (result === globalObject.playerOneNick || result === globalObject.playerTwoNick || result === 3) {
            globalObject.playerOneSocketId = null;
            globalObject.playerTwoSocketId = null;
        }
        
    });
});



app.get('/', function(request, response){

    console.log(request.method, request.url);
    
    if (request.cookies.color && request.cookies.nickName) {

        response.sendFile(__dirname + '/static/html/index.html', function(err){
            //Felmeddelande
        });
    
    } else {
        
        response.sendFile(__dirname + '/static/html/loggain.html', function(err){
            //Felmeddelande
        });
    }

});

app.get('/reset', function(request, response){

    if (request.cookies.color && request.cookies.nickName) {
        response.clearCookie('nickName');
        response.clearCookie('color');
        console.log("Kakor rensade");
    }

    globalObject.playerOneNick = null
    globalObject.playerOneColor = null
    globalObject.playerOneSocketId = null
    globalObject.playerTwoNick = null
    globalObject.playerTwoColor = null
    globalObject.playerTwoSocketId = null
    globalObject.currentPlayer = null
    globalObject.timerId = null
    console.log("Värden i globalObject rensade");

    response.redirect('/');

});

app.post('/', function(request, response) {

    /**response.writeHead(200, { 'Content-Type' : 'text/html' });
    response.end('<h1>Test</h1>');**/

    let nick1, color1;

    try{

        if(request.body !== undefined){

            nick1 = request.body.nick_1;
            color1 = request.body.color_1;

        }

        //Om nickname är undefined
        if(nick1 == undefined){

            throw { message : "Nickname saknas!" }

        }

        //Om färg är undefined
        if(color1 == undefined){
            
            throw { message : "Färg saknas!" }

        }

        //Om nickname är för kort 
        if(nick1.length < 3 ){
                        
            throw { message : "Nickname måste vara minst 3 tecken långt" }

        }

        //Färg inte innehåller 7 tecken
        if (color1.length < 7) {

            throw { message : "Färg ska innehålla 7 tecken!" }
        }

        //Färg är svart eller vit
        if(color1 === "#ffffff" || color1 === "#000000"){

            throw { message : "Ogiltig färg!" }

        }

        if (globalObject.playerOneNick === null && globalObject.playerOneColor === null) {
            //Om spelare 1 inte är sparad

            globalObject.playerOneNick = nick1;
            globalObject.playerOneColor = color1;
            console.log(nick1, color1, "Sparar undan spelare 1");

            response.cookie('nickName', nick1, {maxAge : 60 * 1000 * 120, httpOnly : true});
            response.cookie('color', color1, {maxAge : 60 * 1000 * 120, httpOnly : true});
            console.log("Sparar cookies för spelare 1");

        } else if (globalObject.playerTwoNick === null && globalObject.playerTwoColor === null) {
            //Om spelare 2 inte är sparad

            //Om spelare 1's nickname är samma som spelare 2's nickname
            if(globalObject.playerOneNick === nick1) {

                throw { message : "Nickname redan taget!" }

            }

            //Om spelare 1 och spelare 2 har samma färg 
            if(globalObject.playerOneColor === color1) {

                throw { message : "Färg redan tagen!" }

            }

            globalObject.playerTwoNick = nick1;
            globalObject.playerTwoColor = color1;
            console.log(nick1, color1, "Sparar undan spelare 2");

            response.cookie('nickName', nick1, {maxAge : 60 * 1000 * 120, httpOnly : true});
            response.cookie('color', color1, {maxAge : 60 * 1000 * 120, httpOnly : true});
            console.log("Sparar cookies för spelare 2");

        } else { console.log("Två spelare redan sparade"); }

        response.redirect('/');

        /**
        //Om spelare 1's nickname är samma som spelare 2's nickname
        if(globalObject.playerOneNick === globalObject.playerTwoNick) {
            
            throw{
                message : "Nickname redan taget!"
            }
        }
        //Om spelare 1 och spelare 2 har samma färg
        if(globalObject.playerOneColor === globalObject.playerTwoColor) {
            throw {
                message : "Färg redan tagen!"
            }
        }
        **/
        
        
        //response.cookie('NickName', nick1, {maxAge : 60 * 1000 * 120});
        //response.cookie('NickName', color1, {maxAge : 60 * 1000 * 120}); //2 timmar
        

    } catch(errorMsg) {


        fs.readFile(__dirname + '/static/html/loggain.html', function(err, data){

            let serverDOM = new jsDOM.JSDOM(data);

            serverDOM.window.document.querySelector('#errorMsg').textContent = errorMsg.message;
            serverDOM.window.document.querySelector('#nick_1').setAttribute("value", nick1);
            serverDOM.window.document.querySelector('#color_1').setAttribute("value", color1);
            data = serverDOM.serialize();
            response.send(data);
            
        });
    
    }


});
