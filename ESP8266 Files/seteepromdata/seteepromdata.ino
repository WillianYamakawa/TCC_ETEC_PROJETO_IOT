#include <EEPROM.h>


void writeConnection( const String &c_name, const String &c_pwd);
void writeHost(const String& _host);

void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  writeConnection(String("YOUR SSID"), String("YOUR PASSWORD"));
  writeHost(String("THE SERVER URL"));
}

void loop() {
  // put your main code here, to run repeatedly:
  Serial.println("Pronto!");
  delay(1000);
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
