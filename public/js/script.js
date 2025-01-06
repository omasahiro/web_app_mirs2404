// タイムテーブルのデータ
const schedule = [
    { date: "2024/12/20", time: "10:00 - 12:00", location: "A棟1階ロビー" },
    { date: "2024/12/20", time: "13:00 - 15:00", location: "B棟3階廊下" },
    { date: "2024/12/21", time: "11:00 - 14:00", location: "C棟エントランス" },
];

// DOMContentLoadedイベントで初期化
document.addEventListener('DOMContentLoaded', function() {
    // スケジュールテーブルの初期化
    initializeScheduleTable();
    
    // マップ画像の読み込み完了を待つ
    const mapImage = document.querySelector('.map-image');
    if (mapImage.complete) {
        initializeROS();
    } else {
        mapImage.addEventListener('load', initializeROS);
    }
});

// スケジュールテーブルの初期化
function initializeScheduleTable() {
    const tableBody = document.querySelector("#schedule-table tbody");
    if (!tableBody) return;

    schedule.forEach(entry => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${entry.date}</td>
            <td>${entry.time}</td>
            <td>${entry.location}</td>
        `;
        tableBody.appendChild(row);
    });
}

// ROS接続の初期化
function initializeROS() {
    var ros = new ROSLIB.Ros({
        url : `ws://${window.location.hostname}:9090`
    });

    setupROSCallbacks(ros);
    initializePositionSubscriber(ros);
}

// ROSのコールバック設定
function setupROSCallbacks(ros) {
    ros.on('connection', function() {
        console.log('Connected to websocket server.');
        updateConnectionStatus('接続済み', 'green');
    });

    ros.on('error', function(error) {
        console.log('Error connecting to websocket server:', error);
        updateConnectionStatus('接続エラー', 'red');
    });

    ros.on('close', function() {
        console.log('Connection to websocket server closed.');
        updateConnectionStatus('切断', 'orange');
    });
}

// 接続状態表示の更新
function updateConnectionStatus(text, color) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.textContent = text;
        statusElement.style.color = color;
    }
}

// 位置情報購読の初期化
function initializePositionSubscriber(ros) {
    var positionTopic = new ROSLIB.Topic({
        ros: ros,
        name: '/amcl_pose',
        messageType: 'geometry_msgs/PoseWithCovarianceStamped'
    });

    positionTopic.subscribe(function(message) {
        processPositionMessage(message);
    });
}

// 位置情報メッセージの処理
function processPositionMessage(message) {
    const position = message.pose.pose.position;
    const orientation = message.pose.pose.orientation;
    
    // 四元数からオイラー角に変換
    const theta = Math.atan2(
        2.0 * (orientation.w * orientation.z + orientation.x * orientation.y),
        1.0 - 2.0 * (orientation.y * orientation.y + orientation.z * orientation.z)
    );
    
    const mapImage = document.querySelector('.map-image');
    if (!mapImage) return;

    const mapWidth = mapImage.clientWidth;
    const mapHeight = mapImage.clientHeight;
    
    // 座標変換のパラメータ
    const mapResolution = 0.05; // メートル/ピクセル
    const mapOriginX = -10;     // マップの原点X座標（メートル）
    const mapOriginY = -10;     // マップの原点Y座標（メートル）
    
    // ピクセル座標への変換
    const pixelX = ((position.x - mapOriginX) / mapResolution) * (mapWidth / 800);
    const pixelY = mapHeight - ((position.y - mapOriginY) / mapResolution) * (mapHeight / 600);
    
    updateRobotPosition(pixelX, pixelY, -theta);
}

// ロボット位置マーカーの更新
function updateRobotPosition(x, y, theta) {
    const robotMarker = document.getElementById('robot-marker');
    const mapImage = document.querySelector('.map-image');
    
    if (!robotMarker || !mapImage) {
        console.error('Required elements not found');
        return;
    }

    const mapRect = mapImage.getBoundingClientRect();
    const markerSize = Math.max(mapRect.width * 0.02, 10);
    
    robotMarker.style.width = `${markerSize}px`;
    robotMarker.style.height = `${markerSize}px`;

    // マーカーの位置とサイズを更新
    robotMarker.style.left = `${x - markerSize/2}px`;
    robotMarker.style.top = `${y - markerSize/2}px`;
    robotMarker.style.transform = `rotate(${theta}rad)`;

    // デバッグ情報
    console.log('Robot position updated:', {
        mapWidth: mapRect.width,
        mapHeight: mapRect.height,
        markerSize: markerSize,
        x: x,
        y: y,
        theta: theta
    });
}