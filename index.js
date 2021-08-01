const express = require("express");
const socket = require("socket.io");

const salaUsuarios = "usuarios";

let devicesList = {};

//App setup

const PORT = 3000;
const app = express();
const server = app.listen(PORT,()=>{
    console.log(`Listening on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});

//Static files

app.use(express.static("./public"));

//Socket setup
const io = socket(server);

io.on("connection",(socket)=>{
    console.log("Dispositivo conectado");
    
    console.log(socket.id);
    socket.on("new user", (data)=>{
        console.log("usuario conectado");
        socket.tipo = 1;
        socket.join(salaUsuarios);
        io.to(socket.id).emit("user info",{id:socket.id,devices:devicesList})
    });

    socket.on("new device",(data)=>{
        console.log("dispositivo conectado");
        socket.tipo = 2;
        devicesList[socket.id] = {
            name: data.name,
            estado:"online",
            encendido: false,
            tipo: data.tipo
        }
        io.to(socket.id).emit("device info",{id:socket.id,encendido:devicesList[socket.id].encendido});
        io.to(salaUsuarios).emit("update devices",devicesList);
    });

    socket.on("change color",(data)=>{
        console.log(data);
        io.to(data.id).emit("device change color",data.color);
    });

    socket.on("active device",(data)=>{
        console.log(data);
        io.to(data.id).emit("device active",data.comando);
    })

    socket.on("resDevice",(data)=>{
        devicesList[socket.id].encendido = data;
        io.to(salaUsuarios).emit("update devices",devicesList);
    });

    socket.on("disconnect",()=>{
        if(socket.tipo == 2){
            delete devicesList[socket.id];
            io.to(salaUsuarios).emit("update devices",devicesList);
        }else{    
            socket.leave(salaUsuarios);
        }
    })

    socket.emit("reply","Hola desde el servidor")
});

