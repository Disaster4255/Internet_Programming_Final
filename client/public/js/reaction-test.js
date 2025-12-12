document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('test-container');
    const indicator = document.getElementById('test-indicator');
    const message = document.getElementById('test-message');

    let state = 'waiting'; // 'waiting' (初始), 'red' (等待綠色), 'green' (可點擊), 'result' (顯示結果)
    let timeoutId = null;
    let startTime = 0;

    const transitionToRed = () => {
        state = 'red';
        container.style.backgroundColor = '#1a1a1a'; // 確保背景是暗色
        message.textContent = '';
        indicator.style.backgroundColor = 'red';
        indicator.textContent = '等待中';
        
        // 隨機延遲 1 到 5 秒
        const delay = Math.random() * 4000 + 1000; // 1000ms (1s) 到 5000ms (5s)
        
        timeoutId = setTimeout(transitionToGreen, delay);
    };

    const transitionToGreen = () => {
        if (state === 'red') {
            state = 'green';
            indicator.style.backgroundColor = '#4CAF50'; // 變綠
            indicator.textContent = '點擊！';
            startTime = performance.now(); // 開始計時
        }
    };

    const handleFastClick = () => {
        clearTimeout(timeoutId); // 清除綠色轉換的定時器
        state = 'result';
        indicator.style.backgroundColor = 'red';
        message.textContent = '太快了，重新點擊一次以重來';
        indicator.textContent = '❌';
        indicator.style.transition = 'none'; // 移除過渡，使顏色立即變化
    };

    const handleResultClick = () => {
        if (state === 'green') {
            // 正常計時結束
            const endTime = performance.now();
            const reactionTime = (endTime - startTime); // 毫秒
            
            state = 'result';
            indicator.style.backgroundColor = '#4CAF50';
            message.textContent = `你的反應時間是: ${(reactionTime / 1000).toFixed(3)} 秒`;
            indicator.textContent = '✅';
            
        } else if (state === 'red') {
            // 點擊太快
            handleFastClick();
            
        } else if (state === 'waiting' || state === 'result') {
            // 重新開始
            transitionToRed();
        }
    };

    container.addEventListener('click', handleResultClick);
});