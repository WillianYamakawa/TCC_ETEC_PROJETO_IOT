#define IS_SENSOR_DEBUG_MODE false   

#include<Wire.h>
#include<LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 16, 2);

int statePins[2] = {4, 5};
int voltagepin = 8;
int sensor = A2;
int printCount = 8;
unsigned long lastServerUpdate;
float accumulator = 0;
float accumulatorCount = 0;

enum State{

    CONNECTED,
    NOT_CONNECTED,
    TRYING,
    RESET
  
 };

enum Voltage{
  v110,
  v220
};

Voltage getVoltage(){
  if(digitalRead(voltagepin) == HIGH){
    return Voltage::v220;
  }else{
    return Voltage::v110;
  }
}

void setWelcomePage(LiquidCrystal_I2C* l){
  byte arraybyte[8][8] = {
    {0x00,0x00,0x00,0x03,0x0F,0x1C,0x18,0x01},
    {0x00,0x00,0x0F,0x1F,0x18,0x00,0x0F,0x1F},
    {0x00,0x00,0x1E,0x1F,0x03,0x00,0x1E,0x1F},
    {0x00,0x00,0x00,0x18,0x1E,0x0F,0x07,0x10},
    {0x03,0x03,0x00,0x00,0x00,0x00,0x00,0x00},
    {0x18,0x00,0x07,0x0E,0x1C,0x00,0x01,0x03},
    {0x03,0x00,0x1C,0x0E,0x07,0x00,0x10,0x18},
    {0x00,0x18,0x18,0x00,0x00,0x00,0x00,0x00}
    };

  for(int i = 0; i < 8; i++){
    l->createChar(i, arraybyte[i]);
  }

  l->clear();
  for(int i = 0; i < 8; i++){
    l->setCursor(i < 4 ? i + 6 : i + 2, i < 4 ? 0 : 1);
    l->write(i);
  }

  l->setCursor(0, 0);
  l->print("CONNE");
  l->setCursor(11, 0);
  l->print("CTING");
}

State getState(){
  if(digitalRead(statePins[0]) == 1 && digitalRead(statePins[1]) == 1){
    return State::CONNECTED;
  }
  if(digitalRead(statePins[0]) == 1 && digitalRead(statePins[1]) == 0){
    return State::NOT_CONNECTED;
  }
  if(digitalRead(statePins[0]) == 0 && digitalRead(statePins[1]) == 0){
    return State::TRYING;
  }
  if(digitalRead(statePins[0]) == 0 && digitalRead(statePins[1]) == 1){
    return State::RESET;
  }
  return State::TRYING;
}

void printMessage(State s){
  String str;
  if(s == State::CONNECTED){
    return;
  }
  if(s == State::NOT_CONNECTED){
    str = "Acesse:\n192.168.4.1";
  }
  if(s == State::TRYING){
    str = "Nao conectado\nao Wi-Fi";
  }
  if(s == State::RESET){
    str = "Reinicie o\ndispositivo";
  }
  lcd.clear();
  lcd.setCursor(0, 0);
  int index = str.indexOf('\n');
  if(index != -1){
    lcd.print(str.substring(0, index));
    lcd.setCursor(0, 1);
    lcd.print(str.substring(index + 1, str.length()));
  }else{
    lcd.print(str);
  }
}

void printValue(String& str){
  int leftgap = floor((16 - (str.length() + 8)) / 2);
  lcd.clear();
  lcd.setCursor(leftgap, 0);
  lcd.print("Valor: "+str+"W");
  lcd.setCursor(5, 1);
  lcd.print(getVoltage() == Voltage::v110 ? "110v" : "220v");
}

float a(float b){
  return b < 0 ? -b : b;
}

float getSensorValue(){
  float multiplier = getVoltage() == Voltage::v110 ? 6.60f : 13.20f;
  float total = 0;
  for(int i = 0; i < 120;i++){
    total += a(analogRead(sensor) - 512);
    delayMicroseconds(15000);
  }
  float r = total/120 * multiplier * 1.2f;
  return r > multiplier ? r : 0.f;
}

void setup() {
  // put your setup code here, to run once:
  
  Serial.begin(9600);
  pinMode(sensor, INPUT);

  //Tratamentos do lcd
  lcd.init();
  lcd.backlight();

  #if IS_SENSOR_DEBUG_MODE == true

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(" Entrou em modo ");
  lcd.setCursor(0, 1);
  lcd.print("  SENSOR DEBUG  ");

  #endif


  #if IS_SENSOR_DEBUG_MODE == false
  
  
  //Seta os pinos
  pinMode(statePins[0], INPUT);
  pinMode(statePins[1], INPUT);
  pinMode(voltagepin, INPUT_PULLUP);

  //Ativar a pagina de boas vindas
  setWelcomePage(&lcd);

  //Fica na pagina até o esp dar um feedback
  int waiting = 0;
  while(getState() == State::TRYING){// MISSING CODE
    if(waiting >= 17){
      delay(200);
      continue;
    }
    delay(1500);
    lcd.setCursor(waiting, 1);
    lcd.print("_");
    if(waiting == 5){
      waiting = 10;
    }else{
      waiting++;
    }
  }
  lastServerUpdate = millis();
  delay(10);
  #endif
  
}

void loop() {
  // put your main code here, to run repeatedly:
  #if IS_SENSOR_DEBUG_MODE == false
  
  //Checa se há alguma mensagem ao usuario
  State s = getState();
  if(s == State::CONNECTED) printCount = 0;
  if(printCount >= 8 && s != State::CONNECTED){
    printCount = 0;
    printMessage(s);
    delay(4000);
    return;
  }
  printCount++;

  //Printa o valor
  String v = String(getSensorValue());
  printValue(v);
  float f = v.toFloat();
  if(f > 0){
    accumulator += f;
    accumulatorCount++;
  }
  
  
  //Checa se esta na hora de mandar dados ao servidor
  int difference = millis() - lastServerUpdate;
  if(difference <= 0) return;
  if(difference > 20000){
    if(getState() != State::CONNECTED) return;
    if(accumulatorCount == 0) return;
    lastServerUpdate = millis();
    String ss = String(accumulator / accumulatorCount);
    Serial.print(ss + '\n');
    accumulator = 0;
    accumulatorCount = 0;
  }

  #else

  Serial.println(getSensorValue());

  #endif
  
}
