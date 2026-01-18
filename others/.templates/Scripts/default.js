       // --- オープニング制御ロジック (追加) ---
        function handleOpeningAnimation() {
            const overlay = document.getElementById('opening-overlay');
            const body = document.body;
            
            // リファラ（遷移元）を取得
            const referrer = document.referrer;
            const currentHostname = window.location.hostname;
            
            // 判定：リファラが空、もしくはホスト名が異なる場合に表示
            let showOpening = false;
            if (!referrer) {
                showOpening = true; // 直接入力・ブックマーク
            } else {
                const referrerUrl = new URL(referrer);
                if (referrerUrl.hostname !== currentHostname) {
                    showOpening = true; // 別サイトからの流入
                }
            }

            if (showOpening) {
                overlay.style.display = 'flex';
                // 3秒後にフェードアウト開始
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.style.visibility = 'hidden';
                        body.classList.remove('opening-active');
                    }, 800);
                }, 2500);
            } else {
                // 同じドメイン内の場合は即座に非表示
                overlay.style.display = 'none';
                body.classList.remove('opening-active');
            }
        }

        const state = {};

        function initSlideshow(id) {
            const container = document.getElementById(id);
            if (!container) return;

            const slides = container.querySelectorAll('.slide');
            const slideCount = slides.length;
            
            const showControlsParam = container.getAttribute('data-controls') !== 'false';
            const shouldShowControls = showControlsParam && slideCount > 1;

            if (!shouldShowControls) {
                container.classList.add('hide-controls');
            }

            const dotsContainer = container.querySelector('.slideshow-dots');
            if (dotsContainer && shouldShowControls) {
                dotsContainer.innerHTML = ''; 
                for (let i = 0; i < slideCount; i++) {
                    const dot = document.createElement('div');
                    dot.className = 'dot' + (i === 0 ? ' active' : '');
                    dot.onclick = () => goToSlide(id, i);
                    dotsContainer.appendChild(dot);
                }
            }

            const wrapper = container.querySelector('.slideshow-wrapper');
            wrapper.style.width = (slideCount * 100) + '%';
            slides.forEach(s => s.style.width = (100 / slideCount) + '%');

            state[id] = {
                current: 0,
                count: slideCount,
                timer: null,
                progress: 0,
                duration: 5000,
                active: shouldShowControls
            };

            if (shouldShowControls) resetTimer(id);
            updateVisuals(id);
        }

        function goToSlide(id, index) {
            const s = state[id];
            if (!s) return;
            
            s.current = (index + s.count) % s.count;
            updateVisuals(id);
            s.progress = 0;
            if (s.active) resetTimer(id);
        }

        function updateVisuals(id) {
            const s = state[id];
            const container = document.getElementById(id);
            const wrapper = container.querySelector('.slideshow-wrapper');
            const dots = container.querySelectorAll('.dot');
            const slides = container.querySelectorAll('.slide');
            
            const offset = s.current * (100 / s.count);
            wrapper.style.transform = `translateX(-${offset}%)`;
            
            dots.forEach((dot, i) => dot.classList.toggle('active', i === s.current));
            
            slides.forEach((slide, i) => {
                const cap = slide.querySelector('.slide-caption');
                if (cap) {
                    if (i === s.current) {
                        cap.style.opacity = '1';
                        cap.style.transform = 'translateY(0)';
                    } else {
                        cap.style.opacity = '0';
                        cap.style.transform = 'translateY(20px)';
                    }
                }
            });
        }

        function moveSlide(id, step) {
            if (state[id]) goToSlide(id, state[id].current + step);
        }

        function resetTimer(id) {
            if (state[id].timer) clearInterval(state[id].timer);
            state[id].timer = setInterval(() => {
                const container = document.getElementById(id);
                if (container && !container.matches(':hover')) {
                    state[id].progress += 1;
                    const bar = container.querySelector('.slide-progress');
                    if (bar) bar.style.width = `${state[id].progress}%`;
                    
                    if (state[id].progress >= 100) {
                        moveSlide(id, 1);
                    }
                }
            }, state[id].duration / 100);
        }

        window.onload = function() {
            // オープニングアニメーションの実行
            handleOpeningAnimation();
            
            // スライドショーの初期化
            document.querySelectorAll('.slideshow-container').forEach(el => initSlideshow(el.id));
        };