document.addEventListener('DOMContentLoaded', () => {
    // ------------------------------------
    // 1. Logo 首次加載動畫
    // ------------------------------------
    const mainLogoContainer = document.getElementById('main-logo-container');
    const loadingRing = document.querySelector('.loading-ring');

    // 啟動 Logo 動畫
    loadingRing.style.opacity = 1;
    // 監聽 CSS 動畫結束
    loadingRing.addEventListener('animationend', () => {
        mainLogoContainer.classList.add('loaded'); // 觸發 Logo 淡入
        loadingRing.style.display = 'none'; // 移除圓環
    });
    

    // ------------------------------------
    // 2. 功能區塊按鈕滾動動畫 (Intersection Observer)
    // ------------------------------------
    const featureButtons = document.querySelectorAll('.feature-button');
    
    // 使用 Intersection Observer 偵測元素是否進入可視區域
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const button = entry.target;
                
                // 檢查是否已經播放過動畫
                if (!button.classList.contains('animated')) {
                    // 1. 啟動圓餅圖填充動畫
                    button.classList.add('animate');
                    
                    // 2. 圓餅圖動畫結束後，觸發閃爍和文字顯示
                    // 這裡的 1500ms 應對應 CSS 中的動畫持續時間
                    setTimeout(() => {
                        button.classList.add('animate-complete');
                        // 標記為已動畫，避免重複播放
                        button.classList.add('animated'); 
                    }, 1500); 

                    // 停止觀察，因為動畫已經完成
                    observer.unobserve(button); 
                }
            }
        });
    }, {
        rootMargin: '0px',
        threshold: 0.1 // 當按鈕 10% 進入可視區域時觸發
    });

    // 將觀察器附加到每個按鈕上
    featureButtons.forEach(button => {
        observer.observe(button);
    });
});