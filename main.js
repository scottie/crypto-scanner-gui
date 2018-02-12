const {app, BrowserWindow, Menu, ipcMain} = require('electron')
const path = require('path')
const url = require('url')
var request = require('request');
var score = 0;

let mainWindow = null;
let addWindow = null;
var token = null;

//Listen for app to be ready
app.on('ready', function(){
    //create new main window
    mainWindow = new BrowserWindow({});
    // Load our HTML file into window
    mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'mainWindow.html'),
        protocol:'file',
        slashes: true
    })); //flie://direname/mainWindow.html

    //quit app when closes
    mainWindow.on('closed', function(){
        app.quit();
    });
    //build menu from template
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    //insert the menu
    Menu.setApplicationMenu(mainMenu);

});

//handle create add window
function createAddWindow(){
    //create new main window
    addWindow = new BrowserWindow({
        width:300,
        height:400,
        title:'Start Scanner'
    });
    // Load our HTML file into window
    addWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'addWindow.html'),
        protocol:'file',
        slashes: true
    })); //flie://direname/mainWindow.html
    
    //Garbage collection handle
    addWindow.on('close', function(){
        addWindow = null;
    });
}

// catch signalscore:add socket
ipcMain.on('signalscore:add', function(e, theScore){
    //mainWindow.webContents.send(':log', "Starting Scanner using, Timeframe: " + timeframe);
    //scanIt(timeframe, "ADA/BTC", token);  
    score = theScore 
});


// catch timeframe:add socket
ipcMain.on('timeframe:add', function(e, timeframe){
    addWindow.close();
    mainWindow.webContents.send('logger:log', "Starting Scanner using, Timeframe: " + timeframe);
    scanIt(timeframe, "ADA/BTC", token);   
});

// catch token socket
ipcMain.on('token', function(e, theToken){    
    token = theToken;   
});

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }

  function instantGratification( fn, delay ) {
    fn();
    setInterval( fn, delay );
}

function scanIt(timeFrame, symbol, token){
    
    symbol = symbol.replace('/','');
    if(timeFrame == "1m" || timeFrame == "5m" || timeFrame == "30m" || timeFrame == "1h" || timeFrame == "1d" ){
        
        var miliSecondTimeFrame = 1000;
        if(timeFrame == "1m"){
            miliSecondTimeFrame = 60000;
        }
        if(timeFrame == "5m"){
            miliSecondTimeFrame = 300000;
        }
        if(timeFrame == "30m"){
            miliSecondTimeFrame = 1800000;
        }

        if(timeFrame == "1h"){
            miliSecondTimeFrame = 3600000;
        }

        if(timeFrame == "1d"){
            miliSecondTimeFrame = 86400000;
        }


        if(symbol.length >= 8){
            return "Error: Symbol/Instrument is to long, it should be 3 or 4 letters then 3, ie: QTUM/BTC or ADA/ETH"
            mainWindow.webContents.send('logger:log', "Error: Symbol/Instrument is to long, it should be 3 or 4 letters then 3, ie: QTUM/BTC or ADA/ETH");
        }

        mainWindow.webContents.send('logger:log', "Running scanner on timeframe " + timeFrame);
        var theUrl= null;
        var marketsURL = "http://45.32.131.45:1337/api/markets?token=" + token;
        instantGratification(function(){
            mainWindow.webContents.send('logger:log', timeFrame + " is up, searching again on new candles, " + miliSecondTimeFrame.toString());
            request(marketsURL, function (error, response, body) {
                //console.log('error:', error); // Print the error if one occurred
                //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                //console.log('body:', body); // Print the HTML for the Google homepage.
                if(error == null){
                    var theJson = JSON.parse(body)
                    mainWindow.webContents.send('timeframe:change', "  " + timeFrame);
                    var winners = [];
                    for(var item in theJson){
                        if(item.indexOf("BTC") != -1){  
                            //console.log(item);
                            item = item.replace("/","");
                            var theUrl = "http://45.32.131.45:1337/api/scan/" +  item + '/' + timeFrame + '?token=' + token;
                            request(theUrl, function (error, response, body) {
                                //console.log('error:', error); // Print the error if one occurred
                                //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                                //console.log('body:', body); // Print the HTML for the Google homepage.
                                if(error == null){
                                    if(item.indexOf("Failed") == -1){
                                        try{
                                            var theJson = JSON.parse(body)
                                            //console.log(theJson); // Print the HTML for the Google homepage.
                                            //console.log(body);
                                            mainWindow.webContents.send('logger:log', "Scanning " + theJson['sym'] + ", Score: " + theJson['scottsScore']);
                                            console.log(theJson['sym'] + " | " + theJson['scottsScore']);
                                            if(parseInt(theJson['scottsScore']) >= score){
                                                winners.push(theJson['sym']);
                                                mainWindow.webContents.send('scannerResults:add', body); 
                                                                           
                                            }

                                        }catch(e){
                                            //mainWindow.webContents.send('logger:log', item + " Error: " + e);
                                        }
                                        
                                    }
                                }else{
                                    //console.log('error:', error); // Print the error if one occurred
                                    return error;
                                }
                            });
                        }
                        
                    } // Print the HTML for the Google homepage.
                    //mainWindow.webContents.send('scannerResults:add', body);
                    //mainWindow.webContents.send('timeframe:change', "  " + timeFrame);

                    mainWindow.webContents.send('logger:log', "Signals Found: " + winners);
                    mainWindow.webContents.send('logger:log', "waiting for timeframe count...");
                    console.log("Signals Found: " + winners); 
                    console.log("waiting for timeframe count...");


                }else{
                    console.log('error:', error); // Print the error if one occurred
                    //mainWindow.webContents.send('scannerResults:add', body);
                    return error;
                }
            });    
          }, miliSecondTimeFrame); // this will log 'hi' every half second until you clear the interval
      
        
    }else{
        return "Error: Bad timeframe, try 5m, 30m, 1h or 1d...";
    }

}
//create menu template
const mainMenuTemplate = [    
    {
        label:'File',
        submenu:[
            {
                label: 'Start Scanner',
                click(){
                    createAddWindow();
                }
            },
            {
                label: 'Clear Scanner',
                click(){
                    mainWindow.webContents.send('scannerResults:clear');
                }
            },
            {
                label: 'Quit',
                accelerator: process.platform == 'darwin' ? 'Command+Q' : 'Ctrl+Q',//mac, windows = win32
                click(){
                    app.quit();
                }
            }
        ]
    }
];

// if mac, add empty object to menu
if(process.platform == 'darwin'){
    mainMenuTemplate.unshift({}); 
    //fix for max showing electron and not showing File (or first item of menu) just put empty first item
}

// add developer tools item if not in production
if(process.env.NODE_ENV !== 'production'){
    mainMenuTemplate.push({
        label: 'Dev Tools',
        submenu: [
            {
                label: 'toggle DevTools',
                accelerator: process.platform == 'darwin' ? 'Command+i' : 'Ctrl+i',//mac, windows = win32
                click(item, focusedWindow){
                    focusedWindow.toggleDevTools();
                }
            },
            {
                role: 'reload'
            }
        ]

        });
}