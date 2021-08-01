const socket = io();
let estado = false;
let userId;
let message = document.querySelector('#messagelog');
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
    socket.emit('active device',{comando:!listDevices[id].encendido,id:id});
}

const newUser = (idUser) => {
    socket.emit("new user")
}

const newDevice = (idUser) => {
    socket.emit("new device",{name:"device123",tipo:"foco"})
}


socket.on("user info",(data)=>{
    userId = data.id;
    console.log("entra")
    console.log(data.devices);
    listDevices = data.devices;
    updateInterface(data.devices);
});

socket.on("device info",(data)=>{
    userId = data.id;
    console.log(data);
});

socket.on("update devices",(data)=>{
    console.log(data);
    listDevices = data;
    updateInterface(data);
})

socket.on("device active",(data)=>{
    console.log(data);
    if(estado != data)
        estado = data;

    socket.emit("resDevice",estado)
    
        
})

socket.on("device change color",(data)=>{
    console.log(data);
})


document.querySelector("#user").addEventListener('click',()=>{
    newUser();
});



document.querySelector("#device").addEventListener('click',()=>{
    newDevice();
});

document.querySelector("#slide-color").addEventListener('input',(e)=>{
    document.querySelector('#device-interface').style.background = `rgb(${colors[e.target.value][0]},${colors[e.target.value][1]},${colors[e.target.value][2]})`
    socket.emit('change color',{color:colors[e.target.value],id:actualDevice});
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
