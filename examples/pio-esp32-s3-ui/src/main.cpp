#include <Arduino.h>
#include <WiFi.h>
#include <LittleFS.h>
#include "WiFiManager.h"

WiFiManager wm;

bool serveStaticPath(const String &path, const String &contentType) {
  if (!wm.server) return false;
  if (!LittleFS.exists(path)) return false;
  File f = LittleFS.open(path, "r");
  if (!f) return false;
  wm.server->sendHeader(F("Cache-Control"), F("max-age=60, public"));
  wm.server->sendHeader(FPSTR(HTTP_HEAD_CORS), FPSTR(HTTP_HEAD_CORS_ALLOW_ALL));
  wm.server->streamFile(f, contentType);
  f.close();
  return true;
}

void registerUiRoutes() {
  if (!wm.server) return;
  wm.server->on("/", []() {
    if (!serveStaticPath(F("/index.html"), F("text/html"))) {
      wm.handleNotFound();
    }
  });
  wm.server->on("/assets/index-DMgoeVjO.css", []() {
    if (!serveStaticPath(F("/assets/index-DMgoeVjO.css"), F("text/css"))) wm.handleNotFound();
  });
  wm.server->on("/assets/index-DjCb5RS7.js", []() {
    if (!serveStaticPath(F("/assets/index-DjCb5RS7.js"), F("application/javascript"))) wm.handleNotFound();
  });
  wm.server->on("/vite.svg", []() {
    if (!serveStaticPath(F("/vite.svg"), F("image/svg+xml"))) wm.handleNotFound();
  });
  // fallback to WM handler if not matched; captive portal still applies
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println(F("[WM] S3 UI demo booting"));

  if (!LittleFS.begin(true)) {
    Serial.println(F("[WM] LittleFS mount failed"));
  } else {
    Serial.println(F("[WM] LittleFS mounted"));
  }

  // Optional cosmetic defaults
  wm.setEnableUpdate(false);
  wm.setShowInfoUpdate(false);
  wm.setShowInfoErase(false);
  wm.setConfigPortalBlocking(false); // keep loop() responsive

  wm.setWebServerCallback([]() {
    registerUiRoutes();
  });

  // Start AP/portal; credentials can be changed via UI config
  wm.autoConnect("ESP32_SETUP", "configureme");
  Serial.println(F("[WM] Portal active at 192.168.4.1 (default)"));
}

void loop() {
  wm.process(); // keep captive portal, APIs, and web UI responsive
}
