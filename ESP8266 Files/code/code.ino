#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266WebServer.h> 
#include <EEPROM.h>
#include <ESP8266HTTPClient.h>

HTTPClient httpclient;
ESP8266WebServer server(80);
WiFiClient client;

//Global variables
String key = "a87ff679a2f3e71d9181a67b7542122c"; //DONT FORGET TO SET A KEY
String ssid;
String password;
String host;
String ard_str;
char c;
bool isConnectedToWifi;

enum State{

    CONNECTED,
    NOT_CONNECTED,
    TRYING,
    RESET
  
  };

void setState(State s){
  if(s == State::CONNECTED){
    digitalWrite(0, HIGH);
    digitalWrite(2, HIGH);
  }
  if(s == State::NOT_CONNECTED){
    digitalWrite(0, HIGH);
    digitalWrite(2, LOW);
  }
  if(s == State::TRYING){
    digitalWrite(0, LOW);
    digitalWrite(2, LOW);
  }
  if(s == State::RESET){
    digitalWrite(0, LOW);
    digitalWrite(2, HIGH);
  }
}

//Methods
void onPageRequest();
void onPagePostConnection();
void onPagePostHost();
bool connectToWifi(String& ssid, String& pwd); 
void writeConnection( const String &c_name, const String &c_pwd);
void getConnection(String* cname, String* cpwd);
void handleNotFound();
void sendDataToServer(String& data, String& key);
void writeHost(const String& _host);
void readHost(String* _host);

void setup() {
  // put your setup code here, to run once:
  Serial.begin(9600);
  pinMode(2, OUTPUT);
  pinMode(0, OUTPUT);
  setState(State::TRYING);
  //Obtem os dados da EEPROM
  getConnection(&ssid, &password);
  readHost(&host);
  
  //Tenta fazer a conexao WIFI
  if(connectToWifi(ssid, password)){
    WiFi.mode(WIFI_STA);
    isConnectedToWifi = true;
    setState(State::CONNECTED);
    //Retorna
    return;
  }
  //Não consegui me conectar a internet entao:
  isConnectedToWifi = false;
  setState(State::NOT_CONNECTED);
  WiFi.mode(WIFI_AP);
  //Tenta ativar o modo ACCESS POINT
  if(WiFi.softAP("Intell Soft Connect")){
    Serial.print("Acesse:\n192.168.4.1");

    //Inicia os metodos para o servidor
    server.on("/", HTTP_GET, onPageRequest);
    server.on("/setconnection", HTTP_GET, onPagePostConnection);
    server.on("/sethost", HTTP_GET, onPagePostHost);
    server.begin();
  }else{
    Serial.print("Erro no \ndispositivo");
  }
}

void loop() {
  // put your main code here, to run repeatedly:

  if(isConnectedToWifi){

  if(WiFi.status() == WL_CONNECTED){
    setState(State::CONNECTED);
  }else{
    setState(State::TRYING);
    delay(50);
    return;
  }
    
    ard_str = "";
  //LOOP QUANDO TEM NET
    while(Serial.available()){
      delay(5);
      c = Serial.read();
      if(c != '\n'){
        ard_str += c;
      }else{
        sendDataToServer(ard_str, key);
      }
    }
  //LOOP QUANDO N TEM NET
  }else{
    server.handleClient();
  }
}

void sendDataToServer(String& data, String& key){
  httpclient.begin(client,host + "datapost/" + key);
  httpclient.addHeader("content-type", "application/json");
  httpclient.POST("{\"data\": " + data + "}");
  if(httpclient.getString() != "{\"status\":\"ok\"}"){
    Serial.print("Dispositivo não\nativado!");
  }
  httpclient.end();
}

bool connectToWifi(String& ssid, String& pwd){
  WiFi.begin(ssid, pwd);
  long start_time = millis();
  bool cd = false;
  while(true){
    delay(500);
    if(millis() - start_time >= 15000){
      return false;
    }else{
      if(WiFi.status() == WL_CONNECTED){
        return true;
      }
    }
  }
}

//developer only!!!
void writeHost(const String& _host){
  EEPROM.begin(300);
  byte len = _host.length();
  EEPROM.write(200, len);
  for (int i = 0; i < len; i++)
  {
    EEPROM.write(201 + i, _host[i]);
  }
  EEPROM.end();
}

void readHost(String* _host){
  EEPROM.begin(300);
  int len = EEPROM.read(200);
  *_host = "";
  for(int i = 0; i < len;i++){
    *_host += (char)EEPROM.read(201 + i);
  }
  EEPROM.end();
}

void writeConnection( const String &c_name, const String &c_pwd)
{
  EEPROM.begin(300);
  byte namelen = c_name.length();
  byte pwdlen = c_pwd.length();
  EEPROM.write(0, namelen);
  EEPROM.write(1, pwdlen);
  for (int i = 0; i < namelen; i++)
  {
    EEPROM.write(2 + i, c_name[i]);
  }
  for (int i = 0; i < pwdlen; i++)
  {
    EEPROM.write(2 + namelen + i, c_pwd[i]);
  }
  EEPROM.end();
}

void getConnection(String* cname, String* cpwd){
  EEPROM.begin(300);
  int namelen = EEPROM.read(0);
  int pwdlen = EEPROM.read(1);
  *cname = "";
  *cpwd = "";
  for(int i = 0; i < namelen;i++){
    *cname += (char)EEPROM.read(2 + i);
  }
  for(int i = 0; i < pwdlen;i++){
    *cpwd += (char)EEPROM.read(2 + i + namelen);
  }
  EEPROM.end();
}

void handleNotFound(){
  server.send(404, "text/plain", "404: Not found");
}

void onPageRequest(){
  server.send(200, "text/html", "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta http-equiv='X-UA-Compatible' content='IE=edge'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>Document</title><style>.hidden{display: none;}*{font-size: 20px;font-family:Arial, Helvetica, sans-serif;font-weight: 500;}h2{font-size: 40px;font-weight: 700;color: rgb(32, 32, 32);}.main{text-align: center;}button{padding: 5px 40px 5px 40px;border: none;border-radius: 20px;background-color: rgb(24, 199, 141);margin-top: 20px;color: white;cursor: pointer;transition: .3s;}button:hover{transform: scale(1.1);transition: .3s;}input{padding: 8px 15px 8px 15px;border: 1px solid rgba(0, 0, 0, 0.644);border-radius: 10px;outline: none;}</style></head><body><div class='main'><h2 class='title'>Configure sua conexão</h2><p>"+key+"</p><p>Nome da rede</p><input type='text' id='ssid' placeholder='Nome'><p>Senha</p><input type='text' id='password' placeholder='Senha'><br><button id='btnmain'>Salvar</button><div class='dev'><p>Host</p><input type='text' id='host' placeholder='Host'><br><button id='btndev'>Salvar</button></div></div><script>document.getElementById('btnmain').onclick = () =>{let ssid = document.getElementById('ssid').value;let pwd = document.getElementById('password').value;if(!ssid || !pwd) return;window.location.href = `/setconnection?ssid=${ssid}&pwd=${pwd}`;};document.getElementById('btndev').onclick = () =>{let host = document.getElementById('host').value;if(!host) return;window.location.href = `/sethost?host=${host}`;}</script></body></html>");
}

void onPagePostConnection(){
  String _ssid = server.arg("ssid");
  String _pwd = server.arg("pwd");
  if(_ssid.length() <= 0 || _ssid.length() > 50 || _pwd.length() <= 0 || _pwd.length() > 50){
    server.send(404, "text/html", "Dados inválidos");
    return;
  }
  server.send(200, "text/html", "Salvo com sucesso!");
  server.close();
  writeConnection(_ssid, _pwd);
  Serial.print("Reinicie o seu dispositivo!");
  setState(State::RESET);
}

void onPagePostHost(){
  String _host = server.arg("host");
  if(_host.length() <= 0 || _host.length() > 70){
    server.send(404, "text/html", "Dados inválidos");
  }
  server.send(200, "text/html", "Host salvo com sucesso!");
  server.close();
  writeHost(_host);
  Serial.print("Reinicie o seu dispositivo!");
  setState(State::RESET);
}
