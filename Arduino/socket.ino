#include <Arduino.h>

#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <Hash.h>

WebSocketsClient webSocket;


#define USE_SERIAL Serial
#define MESSAGE_INTERVAL 2000
#define HEARTBEAT_INTERVAL 25000

const char* ssid = "";
const char* password = "";

uint64_t messageTimestamp = 0;
uint64_t heartbeatTimestamp = 0;
bool isConnected = false;
bool estado = false;
char* id = "";
bool comillas = false;
bool prin = false;

int r = 0;
int g = 0;
int b = 0;
int indice = 0;
String tmp = "";

void changeColor(int r,int g,int b){
  analogWrite(D0, b);
 analogWrite(D1, g);
 analogWrite(D2, r);
}

void apagar(){
  if(estado){
    digitalWrite(D0,HIGH);
    digitalWrite(D1,HIGH);
    digitalWrite(D2,HIGH);
  }else{
    digitalWrite(D0,LOW);
    digitalWrite(D1,LOW);
    digitalWrite(D2,LOW);
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t lenght) {
    switch(type) {
        case WStype_DISCONNECTED:
            USE_SERIAL.printf("[WSc] Disconnected!\n");
            isConnected = false;
            break;
        case WStype_CONNECTED: //Cuando se haya conectado con el servidor, enviara un mensaje de autenticacion.
            {
                USE_SERIAL.printf("[WSc] Connected to url: %s\n",  payload);
                isConnected = true;
                webSocket.sendTXT("{\"event\":\"new device esp\",\"data\":{\"name\":\"ESP2866\",\"tipo\":\"esp\"}}");
            }
            break;
        case WStype_TEXT: //Se ejecuta cuendo el servidor a enviado un mensaje de texto
            USE_SERIAL.println("mensage:");
            USE_SERIAL.printf("%s\n",payload);

            switch(payload[0]){ //Dependiendo el tipo de mensaje ejecuta diferentes opciones
              case '0': // Caso 0, es la respuesta del servidor despues de haberse identificado.
                if(payload[1] == 't'){
                  estado = true;
                }else{
                  estado = false;
                }
                apagar();
                break;
              case '1': // Caso 1, es la instruccion para encender o apagar el led.
                if(payload[1] == 't'){
                  if(estado != true){
                    estado = true;
                  }
                  webSocket.sendTXT("{\"event\":\"resDevice\",\"data\":true}"); //Envia una respuesta al servidor indicando el estado del led
                }else{
                  if(estado != false){
                    estado = false;
                  }
                  webSocket.sendTXT("{\"event\":\"resDevice\",\"data\":false}"); //Envia una respuesta al servidor indicando el estado del led
                }
                apagar();
                break;
              case '2': //Caso 2, sirve para cambiar el color del led.
                tmp = "";
                indice = 0;
                USE_SERIAL.printf("%s\n",payload);
                for(int i = 1;i < lenght;i++){
                  if(payload[i] == ','){
                    if(indice == 0){
                      r = tmp.toInt();
                    }
                    if(indice == 1){
                      g = tmp.toInt();
                    }
                    indice++;
                    tmp = "";
                  }else{
                    tmp += String((char)payload[i]);
                  }
                }
                if(indice == 2){
                   b = tmp.toInt();
                }
                USE_SERIAL.printf("RGB: %d%d%d\n",r,g,b);
                changeColor(r,g,b);
                break;
            }
            break;
        case WStype_BIN:
            USE_SERIAL.printf("[WSc] get binary lenght: %u\n", lenght);
            hexdump(payload, lenght);
            break;
    }

}

void setup() {
    USE_SERIAL.begin(115200);

    USE_SERIAL.setDebugOutput(true);

    USE_SERIAL.println();
    USE_SERIAL.println();
    USE_SERIAL.println();

      for(uint8_t t = 4; t > 0; t--) {
          USE_SERIAL.printf("[SETUP] BOOT WAIT %d...\n", t);
          USE_SERIAL.flush();
          delay(1000);
      }

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid,password);
    Serial.print("Conectando a: \t");
    Serial.println(ssid);
    while(WiFi.status() != WL_CONNECTED){
      delay(200);
      Serial.print('.');
    }

    USE_SERIAL.println("conectado");
    
    webSocket.begin("192.168.1.69", 3000); //Inicia la conexion con el servidor.
    webSocket.onEvent(webSocketEvent); //Enlaza los eventos por defecto con la función webSocketEvent()

    pinMode(D0, OUTPUT);  
    pinMode(D1, OUTPUT);
    pinMode(D2, OUTPUT);
}

void loop() {
    webSocket.loop();
    if(isConnected) {
        uint64_t now = millis(); // Manda un mensaje al servidor cada 2 segundos para mantener la conexión.
        if(now - messageTimestamp > MESSAGE_INTERVAL) {
            messageTimestamp = now;
            webSocket.sendTXT("{\"event\":\"ping\",\"data\":false}");
        }
    }
}
