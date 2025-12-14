// 獲取畫布和 2D 繪圖環境
const canvas = document.getElementById('billiardsCanvas');
if (!canvas) throw new Error("Canvas element not found.");
const ctx = canvas.getContext('2d');

// 建議將 HTML 中的畫布寬高調整為 900x450 或 1000x500，以獲得更好的比例
const WIDTH = 900; 
const HEIGHT = 450;
canvas.width = WIDTH;
canvas.height = HEIGHT;

// --- 遊戲參數設定 ---
const BALL_RADIUS = 10;
const FRICTION = 0.99; // 摩擦力係數
const MAX_VELOCITY = 15; // 最大擊球速度

// 定義球的物件結構
function Ball(x, y, color, number, isCue = false) {
    this.x = x;
    this.y = y;
    this.vx = 0; 
    this.vy = 0; 
    this.color = color;
    this.number = number;
    this.radius = BALL_RADIUS;
    this.isCue = isCue;
}

// --- 1. 增加六個標準球袋 (Pockets) ---
const POCKET_RADIUS = 25;
const pockets = [
    // 邊角袋
    { x: 0, y: 0, radius: POCKET_RADIUS },           
    { x: WIDTH, y: 0, radius: POCKET_RADIUS },       
    { x: 0, y: HEIGHT, radius: POCKET_RADIUS },      
    { x: WIDTH, y: HEIGHT, radius: POCKET_RADIUS },  
    // 中袋
    { x: WIDTH / 2, y: 0, radius: POCKET_RADIUS },   
    { x: WIDTH / 2, y: HEIGHT, radius: POCKET_RADIUS },
];

// --- 2. 初始化 15 顆球 (8-Ball Rack) ---

// 創建所有球 (1-15 號球)
function createBalls() {
    let newBalls = [];
    newBalls.push(new Ball(200, HEIGHT / 2, 'white', 0, true)); // 白球 (0號)
    
    // 撞球擺位參數
    const rackStartX = WIDTH * 0.75;
    const spacing = BALL_RADIUS * 2 * 0.866; // 0.866 = sqrt(3)/2
    
    // 標準 8-Ball 擺位
    const layout = [
        [1], 
        [2, 3], // 2. 隨意花色/素色
        [4, 8, 5], // 3. 兩邊花色/素色，中間黑球(8)
        [6, 7, 9, 10], 
        [11, 12, 13, 14, 15] // 5. 兩邊花色/素色
    ];
    
    let currentY = HEIGHT / 2;
    let ballNum = 1;
    let ballsToPlace = [1, 15, 2, 14, 3, 13, 4, 12, 5, 11, 6, 10, 7, 9]; // 非8號球的順序
    let index = 0;
    
    for (let row = 0; row < layout.length; row++) {
        let yOffset = (row * spacing) / 2;
        let x = rackStartX + row * spacing * 1.732; // 1.732 = 2 * sin(60deg)
        
        for (let col = 0; col < layout[row].length; col++) {
            let y = currentY + (col * BALL_RADIUS * 2) - yOffset;
            let number = 0;
            let color = '';
            
            if (row === 2 && col === 1) {
                number = 8;
                color = 'black';
            } else if (ballNum <= 15) {
                number = ballsToPlace[index];
                index++;
                
                if (number === 0) continue; // 跳過已放置的球
                
                if (number < 8) {
                    color = (number % 2 === 0) ? 'red' : 'blue'; // 素色球 (1-7)
                } else {
                    color = (number % 2 === 0) ? 'pink' : 'green'; // 花色球 (9-15)
                }
            }

            if (number !== 0) {
                newBalls.push(new Ball(x, y, color, number));
            }
        }
    }
    return newBalls;
}

let balls = createBalls();
let cueBall = balls[0];

// --- 撞球桿控制狀態 (與之前相同) ---
let isAiming = false;
let mousePos = { x: 0, y: 0 };
let shotPower = 0;
let shotAngle = 0;


// --- 核心物理函數 ---

// 繪製球 (增加編號)
function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
    
    // 繪製球編號
    if (ball.number > 0) {
        ctx.fillStyle = ball.isCue ? 'black' : 'white';
        ctx.font = 'bold 8px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ball.number, ball.x, ball.y);
    }
}

// 繪製球袋
function drawPockets() {
    ctx.fillStyle = '#121212'; // 深色，模擬球袋洞
    for (const pocket of pockets) {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, pocket.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
    }
}

// 繪製球桿瞄準線 (保持不變)
function drawAimingLine() {
    // ... (保持之前的 drawAimingLine 邏輯不變) ...
    if (!isAiming) return;

    const dx = mousePos.x - cueBall.x;
    const dy = mousePos.y - cueBall.y;
    shotPower = Math.min(Math.sqrt(dx * dx + dy * dy), 200); 
    shotAngle = Math.atan2(dy, dx);
    
    const lineX = cueBall.x + Math.cos(shotAngle + Math.PI) * (BALL_RADIUS + 5); 
    const lineY = cueBall.y + Math.sin(shotAngle + Math.PI) * (BALL_RADIUS + 5);

    const endX = lineX + Math.cos(shotAngle + Math.PI) * shotPower * 0.8;
    const endY = lineY + Math.sin(shotAngle + Math.PI) * shotPower * 0.8;

    ctx.strokeStyle = `rgba(255, 255, 255, ${shotPower / 200})`; 
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(lineX, lineY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.closePath();
}

// 更新球的位置和摩擦力 (保持不變)
function updateBall(ball) {
    if (Math.abs(ball.vx) < 0.05 && Math.abs(ball.vy) < 0.05) {
        ball.vx = 0;
        ball.vy = 0;
        return;
    }
    
    ball.vx *= FRICTION;
    ball.vy *= FRICTION;

    ball.x += ball.vx;
    ball.y += ball.vy;
}

// 牆壁碰撞偵測 (保持不變)
function handleWallCollision(ball) {
    // 左右牆壁
    if (ball.x + ball.radius > WIDTH || ball.x - ball.radius < 0) {
        ball.vx *= -1;
        if (ball.x < ball.radius) ball.x = ball.radius;
        if (ball.x > WIDTH - ball.radius) ball.x = WIDTH - ball.radius;
    }
    
    // 上下牆壁
    if (ball.y + ball.radius > HEIGHT || ball.y - ball.radius < 0) {
        ball.vy *= -1;
        if (ball.y < ball.radius) ball.y = ball.radius;
        if (ball.y > HEIGHT - ball.radius) ball.y = HEIGHT - ball.radius;
    }
}

// 球與球碰撞偵測 (保持不變)
function handleBallCollision(ball1, ball2) {
    // ... (保持之前的 handleBallCollision 邏輯不變) ...
    const dx = ball2.x - ball1.x;
    const dy = ball2.y - ball1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < ball1.radius + ball2.radius) {
        const nx = dx / distance;
        const ny = dy / distance;
        const kx = ball1.vx - ball2.vx;
        const ky = ball1.vy - ball2.vy;
        const impulse = nx * kx + ny * ky;

        if (impulse > 0) {
            ball1.vx -= impulse * nx;
            ball1.vy -= impulse * ny;
            ball2.vx += impulse * nx;
            ball2.vy += impulse * ny;

            const overlap = ball1.radius + ball2.radius - distance;
            ball1.x -= overlap * 0.5 * nx;
            ball1.y -= overlap * 0.5 * ny;
            ball2.x += overlap * 0.5 * nx;
            ball2.y += overlap * 0.5 * ny;
        }
    }
}

// 球進袋偵測 (更新進袋邏輯)
function checkPocketed() {
    let ballsToRemove = [];
    let cueBallPocketed = false;

    for (let i = 0; i < balls.length; i++) {
        const ball = balls[i];
        for (const pocket of pockets) {
            const dx = pocket.x - ball.x;
            const dy = pocket.y - ball.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < pocket.radius) {
                // 球進袋
                if (ball.isCue) {
                    cueBallPocketed = true;
                } else if (ball.number === 8) {
                    alert("遊戲結束！八號球進袋！");
                    balls = createBalls(); // 遊戲重置
                    return; 
                } else {
                    // 一般球進袋
                    ballsToRemove.push(i);
                }
            }
        }
    }
    
    // 處理進袋的球
    if (ballsToRemove.length > 0 || cueBallPocketed) {
        // 先移除所有非白球
        for (let i = ballsToRemove.length - 1; i >= 0; i--) {
            balls.splice(ballsToRemove[i], 1);
        }

        // 白球進袋後的處理 (簡化為重新放置)
        if (cueBallPocketed) {
            alert("白球進袋! 請將白球重新放在開球線後方 (左側四分之一處)。");
            cueBall.x = 200; 
            cueBall.y = HEIGHT / 2;
            cueBall.vx = 0;
            cueBall.vy = 0;
            
            // 重新找到新的白球參考 (因為陣列可能已變動，雖然這裡白球不會被移除)
            cueBall = balls.find(b => b.isCue); 
        }
    }
}


// --- 事件處理 (保持不變) ---

canvas.addEventListener('mousedown', (e) => {
    // ... (保持之前的 mousedown 邏輯不變) ...
    const isMoving = balls.some(b => b.vx !== 0 || b.vy !== 0);
    if (!isMoving) {
        isAiming = true;
        // 確保 mousePos 使用 offsetX/Y
        const rect = canvas.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
    }
});

canvas.addEventListener('mousemove', (e) => {
    // ... (保持之前的 mousemove 邏輯不變) ...
    if (isAiming) {
        const rect = canvas.getBoundingClientRect();
        mousePos.x = e.clientX - rect.left;
        mousePos.y = e.clientY - rect.top;
    }
});

canvas.addEventListener('mouseup', () => {
    // ... (保持之前的 mouseup 邏輯不變) ...
    if (isAiming) {
        const angle = shotAngle + Math.PI;
        const velocity = (shotPower / 200) * MAX_VELOCITY; 

        cueBall.vx = Math.cos(angle) * velocity;
        cueBall.vy = Math.sin(angle) * velocity;
        
        isAiming = false;
        shotPower = 0;
    }
});

// --- 遊戲主循環 ---

function gameLoop() {
    // 1. 清空畫布 (畫布背景是撞球桌顏色，所以需要清空)
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // 2. 繪製球袋 (先繪製，避免被球覆蓋)
    drawPockets();

    // 3. 處理瞄準線
    drawAimingLine();
    
    // 4. 更新所有球的位置
    for (let i = 0; i < balls.length; i++) {
        updateBall(balls[i]);
    }
    
    // 5. 處理碰撞與進袋
    checkPocketed(); // 進袋偵測必須在碰撞處理之前執行，但為了簡化，放在這裡
    
    for (let i = 0; i < balls.length; i++) {
        handleWallCollision(balls[i]);
        
        // 球與球碰撞
        for (let j = i + 1; j < balls.length; j++) {
            handleBallCollision(balls[i], balls[j]);
        }
    }

    // 6. 繪製所有球
    for (let i = 0; i < balls.length; i++) {
        drawBall(balls[i]);
    }

    // 循環呼叫自己
    requestAnimationFrame(gameLoop);
}

// 啟動遊戲
gameLoop();