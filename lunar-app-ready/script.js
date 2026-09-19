// Global Instances
let snrChartInstance = null;
let histChartInstance = null;
let moonGlobe = null;
let threeRenderer = null;
let threeScene = null;
let threeCamera = null;
let threeControls = null;
let animationFrame3D = null;
let uploadedImageDataUrl = '';

// Interactive Cursor & Background Parallax
const cursor = document.getElementById('cursor-glow');
const flashlight = document.getElementById('flashlight');
const galaxyBg = document.getElementById('galaxy-bg');

document.addEventListener('mousemove', (e) => {
    requestAnimationFrame(() => {
        if(cursor) { cursor.style.left = e.clientX + 'px'; cursor.style.top = e.clientY + 'px'; }
        if (flashlight) { flashlight.style.background = `radial-gradient(circle 500px at ${e.clientX}px ${e.clientY}px, transparent 0%, rgba(3, 5, 10, 0.98) 75%)`; }
        if(galaxyBg) {
            const xPos = (e.clientX / window.innerWidth - 0.5) * 30;
            const yPos = (e.clientY / window.innerHeight - 0.5) * 30;
            galaxyBg.style.transform = `translate(${-xPos}px, ${-yPos}px) scale(1.05)`;
        }
        const moonBg = document.getElementById('moon-bg');
        if(moonBg) {
            const xPosMoon = (e.clientX / window.innerWidth - 0.5) * 15;
            const yPosMoon = (e.clientY / window.innerHeight - 0.5) * 15;
            moonBg.style.transform = `translate(${-xPosMoon}px, ${-yPosMoon}px) scale(1.05)`;
        }
    });
});

const interactiveElements = document.querySelectorAll('button, a, .drop-zone, .tech-tag, .gallery-item');
interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
        if(cursor) { cursor.style.width = '500px'; cursor.style.height = '500px'; cursor.style.background = 'radial-gradient(circle, rgba(0, 243, 255, 0.1) 0%, rgba(0, 0, 0, 0) 70%)'; }
    });
    el.addEventListener('mouseleave', () => {
        if(cursor) { cursor.style.width = '300px'; cursor.style.height = '300px'; cursor.style.background = 'radial-gradient(circle, rgba(0, 243, 255, 0.05) 0%, rgba(0, 0, 0, 0) 70%)'; }
    });
});

// Sticky Nav Active Highlighting
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('#nav-links a');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href').substring(1) === entry.target.id) link.classList.add('active');
            });
        }
    });
}, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
sections.forEach(section => observer.observe(section));

// Accordions & Tabs
document.querySelectorAll('.accordion-header').forEach(acc => {
    acc.addEventListener('click', function() {
        const content = this.nextElementSibling;
        if (content.style.maxHeight) { content.style.maxHeight = null; } 
        else { document.querySelectorAll('.accordion-header').forEach(a => a.nextElementSibling.style.maxHeight = null); content.style.maxHeight = content.scrollHeight + "px"; }
    });
});
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        tabBtns.forEach(b => b.classList.remove('active')); tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active'); document.getElementById(target).classList.add('active');
    });
});

// Comparison Slider & Lens Logic
const sliderContainer = document.getElementById('slider-container');
const sliderHandle = document.getElementById('slider-handle');
const afterImg = document.getElementById('image-after');

if (sliderContainer) {
    let isDragging = false;
    let isPanning = false;
    let zoomScale = 1;
    let panX = 0, panY = 0;
    let startX = 0, startY = 0;
    const zoomWrapper = document.getElementById('zoom-wrapper');
    const visualPane = document.querySelector('.visual-pane');
    const magnifier = document.getElementById('magnifier');
    
    function updateZoom() {
        if(zoomWrapper) zoomWrapper.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
    }

    sliderContainer.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomDelta = -e.deltaY * 0.001;
        zoomScale = Math.max(1, Math.min(zoomScale + zoomDelta, 5));
        if (zoomScale === 1) { panX = 0; panY = 0; }
        updateZoom();
    });

    const handleMove = (clientX, clientY) => {
        const rect = sliderContainer.getBoundingClientRect();
        let x = clientX - rect.left; let y = clientY - rect.top;
        if (x < 0) x = 0; if (x > rect.width) x = rect.width;
        
        if (sliderContainer.classList.contains('active-lens') && magnifier) {
            magnifier.style.left = x + 'px'; magnifier.style.top = y + 'px';
            const zoom = 3;
            // Get actual coordinates within the zoomed image
            const imgX = (x - panX) / zoomScale;
            const imgY = (y - panY) / zoomScale;
            magnifier.style.backgroundImage = `url("${uploadedImageDataUrl}")`;
            magnifier.style.backgroundSize = `${rect.width * zoom}px ${rect.height * zoom}px`;
            magnifier.style.backgroundPosition = `-${(imgX * zoom) - 75}px -${(imgY * zoom) - 75}px`;
        } else {
            const percent = (x / rect.width) * 100;
            sliderHandle.style.left = `${percent}%`;
            afterImg.style.clipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`;
        }
    };

    sliderContainer.addEventListener('mousedown', (e) => { 
        if (e.target.closest('#slider-handle') || zoomScale === 1 || sliderContainer.classList.contains('active-lens')) {
            isDragging = true; 
            handleMove(e.clientX, e.clientY); 
        } else {
            isPanning = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
        }
    });
    window.addEventListener('mouseup', () => { isDragging = false; isPanning = false; });
    window.addEventListener('mousemove', (e) => { 
        if (sliderContainer.classList.contains('active-lens')) handleMove(e.clientX, e.clientY);
        else if (isDragging) handleMove(e.clientX, e.clientY); 
        else if (isPanning) {
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            updateZoom();
        }
    });
}

// View Toggles (Simultaneous)
const toggleBtns = document.querySelectorAll('.toggle-btn');
const clearBtn = document.getElementById('btn-clear');
const container3d = document.getElementById('canvas-3d-container');

clearBtn.addEventListener('click', () => {
    toggleBtns.forEach(b => b.classList.remove('active'));
    sliderContainer.className = 'slider-container'; // clear active-*
    container3d.classList.add('hidden');
    const handleLeft = document.getElementById('slider-handle').style.left || '50%';
    document.getElementById('after-img-layer').style.clipPath = `polygon(0 0, ${handleLeft} 0, ${handleLeft} 100%, 0 100%)`;
});

toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const mode = btn.getAttribute('data-view');
        
        if (mode === '3d') {
            if (btn.classList.contains('active')) {
                sliderContainer.classList.add('active-3d');
                container3d.classList.remove('hidden');
                if(!threeRenderer) init3DCrater(); 
            } else {
                sliderContainer.classList.remove('active-3d');
                container3d.classList.add('hidden');
            }
        } else {
            if (btn.classList.contains('active')) {
                sliderContainer.classList.add(`active-${mode}`);
                if (mode === 'lens') document.getElementById('after-img-layer').style.clipPath = `polygon(0 0, 100% 0, 100% 100%, 0 100%)`;
            } else {
                sliderContainer.classList.remove(`active-${mode}`);
                if (mode === 'lens') {
                    const handleLeft = document.getElementById('slider-handle').style.left || '50%';
                    document.getElementById('after-img-layer').style.clipPath = `polygon(0 0, ${handleLeft} 0, ${handleLeft} 100%, 0 100%)`;
                }
            }
        }
    });
});

function showToast(msg, type="error") {
    const toast = document.createElement('div'); toast.className = `toast-notification ${type}`; toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); }, 5000);
    setTimeout(() => { toast.remove(); }, 6000);
}

// Data Visualization Initialization
function initCharts() {
    if(snrChartInstance) return; // already initialized
    
    Chart.defaults.color = '#64748b';
    Chart.defaults.font.family = "'Fira Code', monospace";
    
    // SNR Line Chart
    const ctxSNR = document.getElementById('snrChart');
    if (ctxSNR) {
        snrChartInstance = new Chart(ctxSNR.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['t0', 't1', 't2', 't3', 't4', 't5'],
                datasets: [{
                    label: 'SNR (dB)',
                    data: [0, 0, 0, 0, 0, 0],
                    borderColor: '#00f3ff',
                    backgroundColor: 'rgba(0, 243, 255, 0.1)',
                    borderWidth: 2, fill: true, tension: 0.4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                animation: { duration: 400 },
                scales: { y: { min: 0, max: 35, grid: { color: 'rgba(255,255,255,0.05)' } }, x: { display: false } },
                plugins: { legend: { display: false } }
            }
        });
    }

    // Histogram Bar Chart
    const ctxHist = document.getElementById('histogramChart');
    if (ctxHist) {
        histChartInstance = new Chart(ctxHist.getContext('2d'), {
            type: 'bar',
            data: {
                labels: Array.from({length: 20}, (_, i) => i),
                datasets: [
                    { label: 'Raw', data: Array(20).fill(0), backgroundColor: 'rgba(255, 51, 102, 0.6)' },
                    { label: 'Enhanced', data: Array(20).fill(0), backgroundColor: 'rgba(0, 255, 136, 0.6)' }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { y: { display: false }, x: { display: false } },
                plugins: { legend: { position: 'top', labels: { color: '#64748b', boxWidth: 10 } } }
            }
        });
    }
}

// 3D Lunar Context Globe Initialization
function initGlobe() {
    const globeContainer = document.getElementById('globe-container');
    if (!globeContainer || moonGlobe || typeof Globe === 'undefined') return;
    
    moonGlobe = Globe()
        (globeContainer)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-moon.jpg') // Lunar Texture
        .backgroundColor('rgba(0,0,0,0)')
        .showAtmosphere(false)
        .pointOfView({ lat: 0, lng: 0, altitude: 2.5 });
        
    moonGlobe.controls().autoRotate = true;
    moonGlobe.controls().autoRotateSpeed = 1.0;
    
    const overlay = document.getElementById('coord-overlay');
    function updateCoords() {
        if(moonGlobe && overlay && overlay.style.opacity === '1') {
            const pov = moonGlobe.pointOfView();
            const latStr = Math.abs(pov.lat).toFixed(2) + '° ' + (pov.lat >= 0 ? 'N' : 'S');
            const lonStr = Math.abs(pov.lng).toFixed(2) + '° ' + (pov.lng >= 0 ? 'E' : 'W');
            
            if(Math.abs(pov.lat + 89.9) < 20 && Math.abs(pov.altitude - 0.8) < 1.0) {
                overlay.innerHTML = `TARGET: SHACKLETON CRATER <br> LAT: ${latStr} | LON: ${lonStr}`;
            } else {
                overlay.innerHTML = `LUNAR SURFACE <br> LAT: ${latStr} | LON: ${lonStr}`;
            }
        }
        requestAnimationFrame(updateCoords);
    }
    updateCoords();
}

function targetLunarSouthPole() {
    if (!moonGlobe) return;
    const target = { lat: -89.9, lng: 0 };
    
    moonGlobe.ringsData([{ lat: target.lat, lng: target.lng }])
        .ringColor(() => '#00f3ff')
        .ringMaxRadius(8)
        .ringPropagationSpeed(3)
        .ringRepeatPeriod(800);
        
    moonGlobe.pointOfView({ lat: target.lat, lng: target.lng, altitude: 0.8 }, 2000);
    
    const overlay = document.getElementById('coord-overlay');
    if (overlay) {
        setTimeout(() => overlay.style.opacity = '1', 1000);
    }
}

// 3D Crater Flythrough Initialization (Three.js)
function init3DCrater() {
    const container = document.getElementById('canvas-3d-container');
    if(!container || !uploadedImageDataUrl || typeof THREE === 'undefined') return;
    container.innerHTML = ''; 
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    threeScene = new THREE.Scene();
    threeCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    threeCamera.position.set(0, 45, 60);
    
    threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    threeRenderer.setSize(width, height);
    threeRenderer.setClearColor(0x000000, 0); // Transparent to see space behind
    container.appendChild(threeRenderer.domElement);
    
    threeControls = new THREE.OrbitControls(threeCamera, threeRenderer.domElement);
    threeControls.enableDamping = true;
    threeControls.maxPolarAngle = Math.PI / 2 - 0.1; // Restrict below ground
    threeControls.autoRotate = true;
    threeControls.autoRotateSpeed = 0.5;
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    threeScene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 50, 20);
    threeScene.add(dirLight);
    
    // Create Plane & Displacement Map
    const geometry = new THREE.PlaneGeometry(100, 100, 256, 256); 
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(uploadedImageDataUrl, (texture) => {
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            displacementMap: texture,
            displacementScale: 15, // Creates the 3D relief
            wireframe: false,
            roughness: 0.9,
            metalness: 0.1
        });
        
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        threeScene.add(plane);
        
        // Render Loop
        if(animationFrame3D) cancelAnimationFrame(animationFrame3D);
        const animate3D = function () {
            animationFrame3D = requestAnimationFrame(animate3D);
            if(container.classList.contains('hidden')) return; // pause if hidden to save GPU
            threeControls.update();
            threeRenderer.render(threeScene, threeCamera);
        };
        animate3D();
    });
}

// Processing Logic
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const processingUI = document.getElementById('processing-ui');
const resultUI = document.getElementById('result-ui');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const steps = document.querySelectorAll('.step');
const radar = document.getElementById('radar');

dropZone.addEventListener('click', () => fileInput.click());
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, e => {e.preventDefault(); e.stopPropagation();}, false));
['dragenter', 'dragover'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false));
['dragleave', 'drop'].forEach(eventName => dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false));

dropZone.addEventListener('drop', handleDrop, false);
fileInput.addEventListener('change', function() {
    if(this.files.length) {
        if(this.files.length > 1) showToast(`Batch processing ${this.files.length} items. Rendering first item.`, "success");
        readFile(this.files[0]);
    }
});

document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
        uploadedImageDataUrl = item.getAttribute('data-src');
        startProcessing();
    });
});

function handleDrop(e) {
    const dt = e.dataTransfer;
    if (dt.files && dt.files.length > 0) {
        if(dt.files.length > 1) showToast(`Batch processing ${dt.files.length} items in queue.`, "success");
        readFile(dt.files[0]);
    }
}

function readFile(file) {
    if (!file.type.match('image.*')) { showToast('Please upload an image file.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { uploadedImageDataUrl = e.target.result; startProcessing(); };
    reader.readAsDataURL(file);
}

const cmdOutput = document.getElementById('cmd-output');
function addCmdLine(text, type='info') {
    if(!cmdOutput) return;
    const p = document.createElement('div'); p.className = `cmd-line ${type}`; p.textContent = `> ${text}`;
    cmdOutput.appendChild(p); cmdOutput.scrollTop = cmdOutput.scrollHeight;
}
const mockLogs = [
    "INIT: Frame Ingestion & Sensor Noise Pre-processing...",
    "CALCULATING: Dark Current Subtraction & Flat-Field...",
    "CALIBRATING: Radiometric Normalization...",
    "ISRO OHRC Sensor Matrix Loaded [OK]",
    "ANALYZING: Extreme Low-Light Region (PSR)...",
    "STABILIZING: Anscombe Transform applied...",
    "DENOISING: Passing tensor to Restormer Architecture...",
    "DENOISING: Iteration 120/120... Converged.",
    "REVERTING: Inverse Transform & CLAHE...",
    "VALIDATING: Cross-referencing Topography...",
    "SUCCESS: Target verified. Rendering Output."
];

function startProcessing() {
    if(Math.random() < 0.15) { showToast("SYSTEM WARNING: Image Overexposed.\nBypassing extreme low-light enhancement to prevent pixel washout."); return; }

    initCharts(); // Initialize canvases

    radar.classList.remove('hidden');
    setTimeout(() => {
        radar.classList.add('hidden');
        dropZone.style.display = 'none';
        processingUI.classList.remove('hidden');
        
        progressBar.style.width = '0%'; progressPercent.textContent = '0%';
        steps.forEach(s => s.className = 'step pending');
        if(cmdOutput) cmdOutput.innerHTML = '';
        
        // Reset SNR Chart Data for start
        snrChartInstance.data.datasets[0].data = [2, 0, 0, 0, 0, 0];
        snrChartInstance.update();
        
        simulateProcessing();
    }, 1000);
}

function simulateProcessing() {
    let currentStep = 0;
    function nextStep() {
        if (currentStep > 0) { steps[currentStep-1].classList.remove('active'); steps[currentStep-1].classList.add('done'); }
        if (currentStep < steps.length) {
            steps[currentStep].classList.remove('pending'); steps[currentStep].classList.add('active');
            
            addCmdLine(mockLogs[currentStep*2] || "Processing...", "info");
            setTimeout(() => addCmdLine(mockLogs[currentStep*2 + 1] || "Done", "success"), 400);
            
            // Animate SNR Chart climbing
            const targetSNR = 2 + (currentStep * 5) + Math.random(); // 2 up to ~27
            snrChartInstance.data.datasets[0].data[currentStep + 1] = parseFloat(targetSNR.toFixed(1));
            snrChartInstance.update();

            const duration = Math.random() * 800 + 800;
            const targetPercent = Math.round(((currentStep + 1) / steps.length) * 100);
            updateProgress(progressBar.style.width, targetPercent, duration);
            
            setTimeout(() => { currentStep++; nextStep(); }, duration);
        } else {
            progressPercent.textContent = 'COMPLETE'; progressPercent.style.color = 'var(--accent-green)'; progressBar.style.background = 'var(--accent-green)';
            addCmdLine("PIPELINE COMPLETED. RENDERING TELEMETRY.", "success");
            
            setTimeout(() => {
                processingUI.classList.add('hidden');
                resultUI.classList.remove('hidden');
                document.getElementById('image-before').src = uploadedImageDataUrl;
                document.getElementById('image-after').src = uploadedImageDataUrl;
                
                // Finalize Histogram Data
                const rawHist = Array.from({length:20}, () => Math.random() * 100).map((v,i) => i<5 ? v*3 : v*0.1); 
                const enhHist = Array.from({length:20}, () => Math.random() * 50 + 20); 
                histChartInstance.data.datasets[0].data = rawHist;
                histChartInstance.data.datasets[1].data = enhHist;
                histChartInstance.update();

                // Target South Pole on Globe
                initGlobe();
                setTimeout(() => { targetLunarSouthPole(); }, 500);
                
                // Pre-warm WebGL (but don't display it yet)
                if(threeRenderer) {
                    const container3d = document.getElementById('canvas-3d-container');
                    container3d.innerHTML = '';
                    threeRenderer = null; // force rebuild on next toggle to refresh texture
                }
            }, 800);
        }
    }
    nextStep();
}

function updateProgress(start, end, duration) {
    let startVal = parseFloat(start) || 0; let startTime = null;
    function animate(currentTime) {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const currentVal = startVal + progress * (end - startVal);
        progressBar.style.width = currentVal + '%'; progressPercent.textContent = Math.round(currentVal) + '%';
        if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
}

const resetBtn = document.getElementById('reset-demo-btn');
if(resetBtn) {
    resetBtn.addEventListener('click', () => {
        resultUI.classList.add('hidden'); dropZone.style.display = 'block'; fileInput.value = '';
        sliderHandle.style.left = `50%`; afterImg.style.clipPath = `polygon(0 0, 50% 0, 50% 100%, 0 100%)`;
        viewBtns.forEach(b => b.classList.remove('active')); viewBtns[0].classList.add('active');
        visualPane.classList.remove('view-mode-edge', 'view-mode-thermal', 'view-mode-lens');
        document.getElementById('canvas-3d-container').classList.add('hidden');
        sliderContainer.classList.add('view-mode-normal');
    });
}
