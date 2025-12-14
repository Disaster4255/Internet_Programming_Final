// 獲取畫布和 2D 繪圖環境
const canvas = document.getElementById('pongCanvas');

// 檢查畫布是否成功取得，以防在其他 HTML 檔案中執行報錯
if (!canvas) {
    console.error("找不到 ID 為 'pongCanvas' 的畫布元素！遊戲無法啟動。");
    // 停止執行後續程式碼
    throw new Error("Canvas element not found."); 
}

const ctx = canvas.getContext('2d');

// --- 遊戲參數設定 ---
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// 1. 球參數
const BALL_SIZE = 10;
let ball = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    dx: 3, // x 軸移動速度
    dy: 3, // y 軸移動速度
    radius: BALL_SIZE / 2,
};

// 2. 球拍參數
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const PADDLE_SPEED = 5;

// AI 削弱參數
const AI_SPEED_FACTOR = 0.7; // 電腦速度為玩家的 70%
const AI_DEAD_ZONE = 10;     // 當球接近球拍中心時，AI 停止移動 (模擬反應遲鈍)

let leftPaddle = {
    x: 10,
    y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    score: 0,
};

let rightPaddle = {
    x: WIDTH - 10 - PADDLE_WIDTH,
    y: HEIGHT / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    score: 0,
};

// 3. 用戶輸入控制
let keys = {};
document.addEventListener('keydown', (e) => {
    // 確保只捕獲 W 和 S 鍵，避免其他按鍵影響頁面滾動
    if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') {
        e.preventDefault(); 
    }
    keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});


// --- 遊戲功能函數 ---

// 1. 繪圖函數
function drawRect(x, y, w, h, color = 'white') {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.closePath();
}

function drawScore() {
    ctx.font = '30px Arial';
    ctx.fillStyle = 'white';
    // 左邊玩家得分
    ctx.fillText(leftPaddle.score, WIDTH / 4, 30); 
    // 右邊玩家得分
    ctx.fillText(rightPaddle.score, WIDTH * 3 / 4, 30); 
}

function drawNet() {
    for (let i = 0; i < HEIGHT; i += 15) {
        drawRect(WIDTH / 2 - 1, i, 2, 10);
    }
}

// 2. 更新球的位置和碰撞偵測
function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 球與上下邊界碰撞
    if (ball.y + ball.radius > HEIGHT || ball.y - ball.radius < 0) {
        ball.dy = -ball.dy;
    }

    // 球與左邊球拍碰撞
    if (ball.x - ball.radius < leftPaddle.x + leftPaddle.width &&
        ball.y > leftPaddle.y &&
        ball.y < leftPaddle.y + leftPaddle.height &&
        ball.dx < 0 // 確保球是向左移動
    ) {
        ball.dx = -ball.dx * 1.05; // 反彈並略微加速
    }

    // 球與右邊球拍碰撞
    if (ball.x + ball.radius > rightPaddle.x &&
        ball.y > rightPaddle.y &&
        ball.y < rightPaddle.y + rightPaddle.height &&
        ball.dx > 0 // 確保球是向右移動
    ) {
        ball.dx = -ball.dx * 1.05; // 反彈並略微加速
    }

    // 球出界 (得分)
    if (ball.x < 0) {
        rightPaddle.score++;
        resetBall();
    } else if (ball.x > WIDTH) {
        leftPaddle.score++;
        resetBall();
    }
}

// 3. 重置球到中心
function resetBall() {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    // 重置速度，並隨機發球方向
    ball.dx = 3 * (Math.random() > 0.5 ? 1 : -1);
    ball.dy = 3 * (Math.random() > 0.5 ? 1 : -1);
}

// 4. 更新球拍位置
function updatePaddles() {
    // 左邊球拍 (玩家控制)
    if (keys['w'] || keys['W']) {
        leftPaddle.y -= PADDLE_SPEED;
    }
    if (keys['s'] || keys['S']) {
        leftPaddle.y += PADDLE_SPEED;
    }

    // 限制左邊球拍不要超出邊界
    leftPaddle.y = Math.max(0, Math.min(leftPaddle.y, HEIGHT - PADDLE_HEIGHT));

    // 右邊球拍 (簡易 AI 控制 - 已經削弱)
    
    // 計算球拍中心位置
    const paddleCenter = rightPaddle.y + PADDLE_HEIGHT / 2;

    // 只有當球離球拍中心有足夠距離時才移動 (AI_DEAD_ZONE 模擬反應延遲)
    if (Math.abs(paddleCenter - ball.y) > AI_DEAD_ZONE) {
        
        if (paddleCenter < ball.y) {
            // 球在球拍下方，向下移動 (AI_SPEED_FACTOR 模擬速度較慢)
            rightPaddle.y += PADDLE_SPEED * AI_SPEED_FACTOR;
        } else if (paddleCenter > ball.y) {
            // 球在球拍上方，向上移動
            rightPaddle.y -= PADDLE_SPEED * AI_SPEED_FACTOR;
        }
    }

    // 限制右邊球拍不要超出邊界
    rightPaddle.y = Math.max(0, Math.min(rightPaddle.y, HEIGHT - PADDLE_HEIGHT));
}


// --- 遊戲主循環 ---
function gameLoop() {
    // 1. 清空畫布
    drawRect(0, 0, WIDTH, HEIGHT, 'black');

    // 2. 更新位置
    updatePaddles();
    updateBall();

    // 3. 繪製元素
    drawNet(); // 網線
    drawRect(leftPaddle.x, leftPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT); // 左拍
    drawRect(rightPaddle.x, rightPaddle.y, PADDLE_WIDTH, PADDLE_HEIGHT); // 右拍
    drawBall(); // 球
    drawScore(); // 得分

    // 循環呼叫自己 (約 60 FPS)
    requestAnimationFrame(gameLoop);
}

// 啟動遊戲
gameLoop();