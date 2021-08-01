//Se hace la conexion con el servidor
let socket = new WebSocket("ws://192.168.1.69:3000");
let m;


//Sirve para poder manejar los eventos como si se tratara de la libreria de Socket.io
let eventhandler = {};
let io = {};

io.on = (event,callback)=>{
    eventhandler[event] = callback;
}

io.emit = (event,data)=>{
    socket.send(JSON.stringify({
            event:event,
            data:data
    }))
}

//app

let estado = false;
let userId;
let colors = [];
let actualDevice = '';
let listDevices = {};

function createArray(){
    let array = [];
    let tmp = [];
    let e = 0;

    for(let i = 0;i < 256;i++){
        tmp[i] = [255,i,0];
    }

    array = array.concat(tmp);
    e = 0;
    for(let i = 254;i > -1;i--){
        tmp[e] = [i,255,0];
        e++;
    }

    array = array.concat(tmp);

    for(let i = 0;i < 256;i++){
        tmp[i] = [0,255,i];
    }

    array = array.concat(tmp);
    e = 0;
    for(let i = 254;i > -1;i--){
        tmp[e] = [0,i,255];
        e++;
    }

    array = array.concat(tmp);

    for(let i = 1;i < 256;i++){
        tmp[i] = [i,0,255];
    }

    array = array.concat(tmp);

    return array;
}

//Actualiza la interfaz
function updateInterface(data){
    let t = '';
    Object.entries(data).forEach(([key,value]) => {
        t += `<div class="device" >
        <p class="device-name">${value.name}</p>
        <div class="clic" onclick="enterDevice('${key}')">

        </div>
        <div class="button ${value.encendido == true ? 'on':'off'}" onclick="activeDevice('${key}')">
            <p>${value.encendido == true ? 'Encendido':'Apagado'}</p>
        </div>
    </div>`
    });

    document.querySelector('#main-interface').innerHTML = t;
    if(actualDevice == '')
        return
    document.querySelector('.switch-device').style.background = listDevices[actualDevice].encendido == true ? 'green':'gray';
    document.querySelector('.switch-device').innerText = listDevices[actualDevice].encendido == true ? 'OFF':'ON';
    document.querySelector('#device-interface').style.background = listDevices[actualDevice].encendido == true ? 'rgb(255,255,255)':'rgb(0,0,0)'
}

function enterDevice(id){
    console.log(id);
    actualDevice = id;
    document.querySelector('#main-interface').style.display = 'none';
    document.querySelector('#device-interface').style.display = 'block';
    document.querySelector('.switch-device').style.background = listDevices[id].encendido == true ? 'green':'gray';
    document.querySelector('.switch-device').innerText = listDevices[id].encendido == true ? 'OFF':'ON';
}

function activeDevice(id){
    io.emit('active device',{comando:!listDevices[id].encendido,id:id});
}

const newUser = (idUser) => {
    io.emit("new user")
}

const newDevice = (idUser) => {
    io.emit("new device",{name:"device123",tipo:"foco"})
}

//Se encarga de escuchar las respuestas del servidor

io.on("user info",(data)=>{
    userId = data.id;
    console.log("entra")
    console.log(data.devices);
    listDevices = data.devices;
    updateInterface(data.devices);
});

io.on("device info",(data)=>{
    userId = data.id;
    console.log(data);
});

io.on("update devices",(data)=>{
    console.log(data);
    listDevices = data;
    updateInterface(data);
})

io.on("1",(data)=>{
    console.log("entra")
    console.log(data);
    if(estado != data)
        estado = data;

    io.emit("resDevice",estado)
    
        
})

io.on("2",(data)=>{
    console.log(data);
})


document.querySelector("#user").addEventListener('click',()=>{
    newUser();
});



document.querySelector("#device").addEventListener('click',()=>{
    newDevice();
});

document.querySelector("#slide-color").addEventListener('input',(e)=>{
    //Obtiene el valor del color de la barra de progreso y la manda al servidor.
    document.querySelector('#device-interface').style.background = `rgb(${colors[e.target.value][0]},${colors[e.target.value][1]},${colors[e.target.value][2]})`
    io.emit('change color',{color:colors[e.target.value],id:actualDevice});
});

document.querySelector('.atras').addEventListener('click',()=>{
    actualDevice = '';
    document.querySelector('#main-interface').style.display = 'flex';
    document.querySelector('#device-interface').style.display = 'none';

});

document.querySelector('.switch-device').addEventListener('click',()=>{
    activeDevice(actualDevice);
})

colors = createArray();




//Socket
//Funciones principales del Socket

socket.onopen = function(e) {
    console.log("[open] Connection established");
    console.log("Sending to server");

};

socket.onmessage = (event)=>{
    console.log(JSON.parse(event.data))
    //Para que el manejador de eventos funciones la respuesta debe ser un json con por lo menos el atributo event y el atributo data
    eventhandler[JSON.parse(event.data).event](JSON.parse(event.data).data);
};

socket.onclose = function(event) {
  if (event.wasClean) {
    console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
  } else {
    // e.g. server process killed or network down
    // event.code is usually 1006 in this case
    console.log('[close] Connection died');
  }
};

socket.onerror = function(error) {
  console.log(`[error] ${error.message}`);
};
