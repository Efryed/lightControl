var webSocketServer = require('ws').Server;
const express = require("express");

let devicesList = {};

let guid = () => {
    let s4 = () => {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

//App setup

const PORT = 5000;
const app = express();
const server = app.listen(PORT,()=>{
    console.log(`Listening on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

//Static files

app.use(express.static("./public"));
 
//Socket

var socket = new webSocketServer({ port: 3000 });
//Sirve para poder manejar los eventos como si se tratara de la libreria de Socket.io
let eventhandler = {};
let io = {};

io.on = (event,callback)=>{
    eventhandler[event] = callback;
}

//Devuelve el socket basado en el id
io.findSocket = (id)=>{
    let soc;
    socket.clients.forEach(client=>{
        if(client.id == id){
            soc =  client;
        }
    }); 

    return soc;
}
//Envia mensaje a todos los usuarios
io.sendMessageUsers = (event,data)=>{
    socket.clients.forEach(client=>{
        if(client.user){
            client.send(JSON.stringify({
                event:event,
                data:data
            }))
        }
    });    
}
//Envia mensaje a cualquier cliente basandose en el id
io.sendMessage = (event,id,data)=>{
    socket.clients.forEach(client=>{
        if(client.id == id){
            client.send(JSON.stringify({
                event:event,
                data:data
            }))
        }
    }); 
}
//Envia mensaje a los ESP basandose en id
io.sendMessageEsp = (event,id,data)=>{
    socket.clients.forEach(client=>{
        if(client.id == id){
            client.send(`${event+data}`)
        }
    }); 
}


//io.on manejan los mensaje enviados por los clientes

io.on("new user", (data)=>{
    data.socket.user = true;
    console.log("usuario conectado");
    data.socket.tipo = 1;
    io.sendMessage("user info",data.socket.id,{id:data.socket.id,devices:devicesList});
});

io.on("new device",(data)=>{
    data.socket.user = false;
    data.socket.esp = false;
    console.log("dispositivo conectado");
    data.socket.tipo = 2;
    devicesList[data.socket.id] = {
        name: data.data.name,
        estado:"online",
        encendido: false,
        tipo: data.data.tipo
    }
    io.sendMessage("device info",data.socket.id,{id:data.socket.id,encendido:devicesList[data.socket.id].encendido});
    io.sendMessageUsers("update devices",devicesList);
    
    // console.log(JSON.stringify(data, null, 2));
});

io.on("new device esp",(data)=>{
    data.socket.user = false;
    data.socket.esp = true;
    console.log("dispositivo conectado");
    data.socket.tipo = 2;
    devicesList[data.socket.id] = {
        name: data.data.name,
        estado:"online",
        encendido: false,
        tipo: data.data.tipo
    }
    io.sendMessageEsp("0",data.socket.id,'f');
    io.sendMessageUsers("update devices",devicesList);
    
    // console.log(JSON.stringify(data, null, 2));
});

io.on("change color",(data)=>{
    if(io.findSocket(data.data.id).esp)
        io.sendMessageEsp("2",data.data.id,data.data.color);
    else
        io.sendMessage("2",data.data.id,data.data.color);
});

io.on("active device",(data)=>{
    if(io.findSocket(data.data.id).esp){
        io.sendMessageEsp("1",data.data.id,data.data.comando);
    }
    else    
        io.sendMessage("1",data.data.id,data.data.comando);
})

io.on("resDevice",(data)=>{
    devicesList[data.socket.id].encendido = data.data;
    io.sendMessageUsers("update devices",devicesList);
});

io.on("ping",(data)=>{
    console.log("ping")
    data.socket.isAlive = true;
})


//Verifica que los dispositivos no esten deconectados
const interval = setInterval(()=>{
    socket.clients.forEach(ws => {
        if(ws.esp){
            if (ws.isAlive === false){
                 return ws.terminate();
            }
            ws.isAlive = false;
        }
    });
}, 5000);
 

//Escucha si un dispositivo se ha conectado al servidor
socket.on('connection', function (socketObject) {
    console.log("Dispositivo conectado");
    socketObject.id = guid();
    socketObject.user = false;

    //Escucha si un dispositivo a enviado un mensaje
    socketObject.on('message', function (message) {
        //Para que el manejador de eventos funciones la respuesta debe ser un json con por lo menos el atributo event y el atributo data
        eventhandler[JSON.parse(message).event]({idSocket: socketObject.id,socket:socketObject,data:JSON.parse(message).data});
    });
    
    //Escuecha si un dispositivo se ha desconectado
    socketObject.on('close', function (c, d) {
        console.log(`El usuario: ${socketObject.id} se desconecto`);
        if(socketObject.tipo == 2){
            delete devicesList[socketObject.id];
            io.sendMessageUsers("update devices",devicesList);
        }
    });
});

 
console.log('Server started');