# 起動方法

```bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

別のターミナルを起動

```bash
cd web_app_mirs2404
node server.js
```

別のターミナルを起動

```bash
ngrok start --all
```

script.jsのinitializeROS()のurlをngrokの-> http://localhost:9090の左側のものに書き換える。その後3000の方のurlを開けばOK
