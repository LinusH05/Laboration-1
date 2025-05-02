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

const globalObject = require('./servermodules/game-modul');

const fs = require('fs');

let app = express();

let serverRespons;






//Extra från F3
app.listen(3000, function(req, res){
    console.log('Servern körs');
    
    serverRespons = res;
});

app.use('/public', express.static(__dirname + "/static"));
app.use(express.urlencoded( { extended : true }));
app.use(cookieParser());

app.get('/', function(request, response){

    console.log(request.method, request.url);
    
    response.sendFile(__dirname + '/static/html/loggain.html', function(err){
        //Felmeddelande
    });

    response.cookie('testCookie', 'true', { maxAge : 10000});

});

app.get('/reset', function(request, response){



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

            throw{
                message : "Nickname får inte vara undefined"
            }
        }

        //Om färg är undefined
        if(color1 == undefined){
            
            throw{
                message : "Färg får inte vara undefined"
            }
        }

        //Om nickname är för kort 
        if(nick1.length < 3 ){
                        
            throw{
                message : "Nickname måste vara minst 3 tecken långt"
            };
        }

        //Färg inte innehåller 7 tecken
        if (color1.length < 7) {

            throw{
                message : "Färg måste innehålla 7 tecken"
            }
        }

        //Färg är svart eller vit
        if(color1 === "#ffffff" || color1 === "#000000"){


            throw{
                elementColor1 : color1,
                message : "Färgen får inte vara svart eller vit"
            };
        }

        console.log("Ska fungera")

        if (globalObject.playerOneNick === null && globalObject.playerOneColor === null) {
            globalObject.playerOneNick = nick1;
            globalObject.playerOneColor = color1;
            
            response.cookie('nickName', nick1, {maxAge : 60 * 1000 * 120});
            response.cookie('nickName', color1, {maxAge : 60 * 1000 * 120}); //2 timmar

            console.log(nick1, color1, "Sparar undan player 1");
            response.redirect('/')
        } else if (globalObject.playerTwoNick === null && globalObject.playerTwoColor === null) {
            //Om spelare 1's nickname är samma som spelare 2's nickname
            if(globalObject.playerOneNick === nick1) {
                throw{
                    message : "Nickname redan taget!"
                }
            } else { globalObject.playerTwoNick = nick1; }

            //Om spelare 1 och spelare 2 har samma färg 
            if(globalObject.playerOneColor === color1) {
                throw {
                    message : "Färg redan tagen!"
                }
            } else { globalObject.playerTwoColor = color1;}

            
            console.log(nick1, color1, "Sparar undan player 2");
            response.writeHead(200, { "content-type" : "text/html" } )
            response.end('<h1>SPEL</h1>');
        } else {
            
        }

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
        

    } catch(errorMsg){


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