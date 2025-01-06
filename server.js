// server.js
const express = require('express');
const app = express();
const path = require('path');

// 静的ファイルの提供
app.use(express.static(path.join(__dirname, 'public')));

// サーバーのIPアドレスとポート設定
const PORT = 3000;
const HOST = '0.0.0.0';  // すべてのネットワークインターフェースでリッスン

app.listen(PORT, HOST, () => {
    console.log(`Server is running at http://${HOST}:${PORT}`);
});