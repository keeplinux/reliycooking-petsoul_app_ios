#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <WiFi.h>
#include <ArduinoJson.h>
#include <mbedtls/gcm.h>
#include "device_config.h"

static const char *SERVICE="28a00001-8c31-4a3b-9d61-425350455431";
static const char *INFO="28a00002-8c31-4a3b-9d61-425350455431";
static const char *CONFIG="28a00003-8c31-4a3b-9d61-425350455431";
static const char *STATUS_UUID="28a00004-8c31-4a3b-9d61-425350455431";
BLECharacteristic *infoChar, *statusChar;
SemaphoreHandle_t mutex;
uint8_t key[32];
String challenge, incoming, ssid, password, requestId;
uint16_t nextFrame=0;
bool connected=false, used=false, pending=false, joining=false;
unsigned long started=0;

String toHex(const uint8_t *p,size_t n){String s; for(size_t i=0;i<n;i++){char b[3];snprintf(b,3,"%02x",p[i]);s+=b;} return s;}
bool fromHex(const String &s,uint8_t *out,size_t n){if(s.length()!=n*2)return false;for(size_t i=0;i<n;i++){char a=s[i*2],b=s[i*2+1];if(!isxdigit(a)||!isxdigit(b))return false;char t[3]={a,b,0};out[i]=strtoul(t,nullptr,16);}return true;}
void newChallenge(){uint8_t bytes[16];esp_fill_random(bytes,16);challenge=toHex(bytes,16);used=false;incoming="";nextFrame=0;JsonDocument info;info["v"]=1;info["sn"]=DEVICE_SN;info["productId"]=DEVICE_PRODUCT;info["challenge"]=challenge;String json;serializeJson(info,json);infoChar->setValue(json.c_str());}

bool decryptRequest(const String &raw, String &plain){
 JsonDocument envelope;if(deserializeJson(envelope,raw)||envelope["v"].as<int>()!=1)return false;
 String cipher=envelope["cipher"].as<String>(),nonceHex=envelope["nonce"].as<String>();
 if(cipher.length()<32||cipher.length()>2048||cipher.length()%2)return false;
 size_t length=cipher.length()/2;uint8_t nonce[12],bytes[1024],output[1024];
 if(!fromHex(nonceHex,nonce,12)||!fromHex(cipher,bytes,length))return false;
 String aad=String(DEVICE_SN)+":"+challenge+":request";
 mbedtls_gcm_context ctx;mbedtls_gcm_init(&ctx);mbedtls_gcm_setkey(&ctx,MBEDTLS_CIPHER_ID_AES,key,256);
 int err=mbedtls_gcm_auth_decrypt(&ctx,length-16,nonce,12,(const uint8_t*)aad.c_str(),aad.length(),bytes+length-16,16,bytes,output);mbedtls_gcm_free(&ctx);
 if(err)return false;output[length-16]=0;plain=String((char*)output);memset(output,0,sizeof(output));return true;
}
void respond(bool success,const String &error=""){
 JsonDocument doc;doc["requestId"]=requestId;doc["status"]=success?"connected":"failed";doc["ssid"]=ssid;
 if(success)doc["ip"]=WiFi.localIP().toString();else doc["error"]=error;
 String plain;serializeJson(doc,plain);uint8_t nonce[12],tag[16],cipher[1024];esp_fill_random(nonce,12);
 String aad=String(DEVICE_SN)+":"+challenge+":response";
 mbedtls_gcm_context ctx;mbedtls_gcm_init(&ctx);mbedtls_gcm_setkey(&ctx,MBEDTLS_CIPHER_ID_AES,key,256);
 int err=mbedtls_gcm_crypt_and_tag(&ctx,MBEDTLS_GCM_ENCRYPT,plain.length(),nonce,12,(const uint8_t*)aad.c_str(),aad.length(),(const uint8_t*)plain.c_str(),cipher,16,tag);mbedtls_gcm_free(&ctx);
 if(err)return;JsonDocument envelope;envelope["v"]=1;envelope["nonce"]=toHex(nonce,12);envelope["cipher"]=toHex(cipher,plain.length())+toHex(tag,16);String raw;serializeJson(envelope,raw);
 for(size_t offset=0,index=0;offset<raw.length()&&connected;offset+=18,index++){uint8_t packet[20];size_t n=min((size_t)18,raw.length()-offset);packet[0]=index;packet[1]=offset+n>=raw.length()?1:0;memcpy(packet+2,raw.c_str()+offset,n);statusChar->setValue(packet,n+2);statusChar->notify();delay(20);}
}
class ServerCallbacks:public BLEServerCallbacks{
 void onConnect(BLEServer*) override {xSemaphoreTake(mutex,portMAX_DELAY);connected=true;newChallenge();xSemaphoreGive(mutex);}
 void onDisconnect(BLEServer*) override {xSemaphoreTake(mutex,portMAX_DELAY);connected=false;pending=false;joining=false;password="";incoming="";xSemaphoreGive(mutex);BLEDevice::startAdvertising();}
};
class ConfigCallbacks:public BLECharacteristicCallbacks{
 void onWrite(BLECharacteristic *characteristic) override {
  std::string value=characteristic->getValue();if(value.size()<3||value.size()>20)return;
  xSemaphoreTake(mutex,portMAX_DELAY);
  if(!connected||used){xSemaphoreGive(mutex);return;}
  uint8_t index=(uint8_t)value[0],last=(uint8_t)value[1];
  if(index==0){incoming="";nextFrame=0;}
  if(index!=nextFrame++||last>1){incoming="";nextFrame=0;xSemaphoreGive(mutex);return;}
  for(size_t i=2;i<value.size();i++)incoming+=value[i];
  if(incoming.length()>2048){incoming="";nextFrame=0;xSemaphoreGive(mutex);return;}
  if(last){String plain;if(decryptRequest(incoming,plain)){JsonDocument doc;if(!deserializeJson(doc,plain)&&doc["requestId"].is<const char*>()&&doc["ssid"].is<const char*>()&&doc["password"].is<const char*>()){
   String s=doc["ssid"].as<String>(),p=doc["password"].as<String>(),r=doc["requestId"].as<String>();
   if(s.length()>0&&s.length()<=32&&p.length()>=8&&p.length()<=63&&r.length()<=64){used=true;ssid=s;password=p;requestId=r;pending=true;}
  }}plain="";incoming="";nextFrame=0;}
  xSemaphoreGive(mutex);
 }
};
void setup(){
 Serial.begin(115200);mutex=xSemaphoreCreateMutex();
 if(!fromHex(DEVICE_KEY_HEX,key,32)){Serial.println("Invalid factory configuration");while(true)delay(1000);}
 WiFi.mode(WIFI_STA);WiFi.persistent(true);WiFi.begin();
 BLEDevice::init(std::string("SF-")+DEVICE_SN);BLEServer *server=BLEDevice::createServer();server->setCallbacks(new ServerCallbacks());
 BLEService *service=server->createService(SERVICE);infoChar=service->createCharacteristic(INFO,BLECharacteristic::PROPERTY_READ);
 BLECharacteristic *config=service->createCharacteristic(CONFIG,BLECharacteristic::PROPERTY_WRITE);config->setCallbacks(new ConfigCallbacks());
 statusChar=service->createCharacteristic(STATUS_UUID,BLECharacteristic::PROPERTY_NOTIFY);statusChar->addDescriptor(new BLE2902());
 newChallenge();service->start();BLEAdvertising *advertising=BLEDevice::getAdvertising();advertising->addServiceUUID(SERVICE);advertising->setScanResponse(true);advertising->start();
 Serial.println("Silifield provisioning ready; credentials are never logged.");
}
void loop(){
 xSemaphoreTake(mutex,portMAX_DELAY);
 if(pending){pending=false;WiFi.begin(ssid.c_str(),password.c_str());password="";joining=true;started=millis();}
 if(joining&&connected){if(WiFi.status()==WL_CONNECTED){joining=false;respond(true);}else if(millis()-started>30000){joining=false;respond(false,"设备无法连接 WiFi，请检查密码和 2.4GHz 网络");}}
 xSemaphoreGive(mutex);delay(20);
}
