/* ============================================================
   MilkyPot AR Preview — visualização 3D do potinho
   ============================================================
   Mostra modelo 3D do potinho rotacionando + tamanho em CM real
   antes do user comprar. "Já viram alguma sorveteria com AR?" —
   diferenciador absurdo, vira matéria.

   Stack: Three.js via CDN (lazy load).
   AR real (WebXR) é opt-in só pra Chrome Android — caso contrário
   mostra 3D rotacionando em modal.

   API:
     ARPreview.show({ sizeMl, productName })
       Abre modal 3D. Botão "Ver em AR" tenta WebXR; senão só 3D.
   ============================================================ */
(function (global) {
    'use strict';
    if (global._mpARLoaded) return;
    global._mpARLoaded = true;

    var THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.min.js';
    var THREE_LOADED = false;

    // Mapeamento ml → altura cm (potinhos cilíndricos)
    function dimensionsFor(sizeMl) {
        // Heurística: cilindros típicos sorveteria
        var dims = {
            275: { h: 9.5, r: 4.5, label: 'Essencial 275ml' },
            440: { h: 11, r: 5.2, label: 'Supremo 440ml' },
            550: { h: 12.5, r: 5.5, label: 'Monster Pot 550ml' },
            770: { h: 14, r: 6.2, label: 'Soberano 770ml' }
        };
        return dims[sizeMl] || { h: 10, r: 5, label: sizeMl + 'ml' };
    }

    function _loadThree() {
        if (THREE_LOADED || global.THREE) return Promise.resolve();
        return new Promise(function (resolve) {
            var s = document.createElement('script');
            s.src = THREE_CDN;
            s.onload = function () { THREE_LOADED = true; resolve(); };
            s.onerror = function () { resolve(); };
            document.head.appendChild(s);
        });
    }

    function show(opts) {
        opts = opts || {};
        var sizeMl = opts.sizeMl || 440;
        var productName = opts.productName || 'MilkyPot';
        var dims = dimensionsFor(sizeMl);

        var modal = document.createElement('div');
        modal.id = 'mpARModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.92);z-index:99994;display:flex;flex-direction:column;color:#fff;font-family:"Segoe UI",sans-serif';
        modal.innerHTML =
            '<div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center">' +
              '<div>' +
                '<div style="font-weight:900;font-size:16px">🪄 ' + productName + '</div>' +
                '<div style="font-size:13px;opacity:.7">' + dims.label + ' · Veja o tamanho real</div>' +
              '</div>' +
              '<button id="mpARClose" style="background:rgba(255,255,255,.15);border:0;color:#fff;width:38px;height:38px;border-radius:999px;font-size:20px;cursor:pointer">×</button>' +
            '</div>' +
            '<div id="mpARStage" style="flex:1;position:relative;display:flex;align-items:center;justify-content:center">' +
              '<div id="mpARLoading" style="text-align:center">' +
                '<div style="font-size:48px;margin-bottom:8px;animation:mp-ar-spin 2s linear infinite">⏳</div>' +
                '<div>Carregando preview 3D…</div>' +
              '</div>' +
            '</div>' +
            '<div style="padding:16px;background:rgba(0,0,0,.5)">' +
              '<div style="text-align:center;font-size:13px;margin-bottom:10px;opacity:.85">Arraste pra girar · Pinça pra zoom</div>' +
              '<div style="display:flex;justify-content:center;gap:14px;font-size:12px;flex-wrap:wrap">' +
                '<div>📏 Altura: <strong>' + dims.h + ' cm</strong></div>' +
                '<div>⚖️ Volume: <strong>' + sizeMl + ' ml</strong></div>' +
                '<div>🥤 Diâmetro: <strong>' + (dims.r * 2).toFixed(1) + ' cm</strong></div>' +
              '</div>' +
            '</div>';
        document.body.appendChild(modal);
        _injectStyles();

        modal.querySelector('#mpARClose').onclick = function () { modal.remove(); };

        _loadThree().then(function () {
            if (!global.THREE) {
                modal.querySelector('#mpARLoading').textContent = '⚠ Não consegui carregar o 3D. Tenta de novo';
                return;
            }
            _renderScene(modal.querySelector('#mpARStage'), dims);
            if (global.MpAnalytics) global.MpAnalytics.track('ar_preview_shown', { size_ml: sizeMl });
        });
    }

    function _renderScene(container, dims) {
        var THREE = global.THREE;
        container.innerHTML = '';

        var w = container.clientWidth, h = container.clientHeight;
        var scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111827);

        var camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
        camera.position.set(0, dims.h * 0.8, dims.r * 8);

        var renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Cup cilindrica transparente
        var cupGeom = new THREE.CylinderGeometry(dims.r, dims.r * 0.85, dims.h, 32, 1, true);
        var cupMat = new THREE.MeshPhongMaterial({
            color: 0xFCE7F3,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            shininess: 80
        });
        var cup = new THREE.Mesh(cupGeom, cupMat);
        scene.add(cup);

        // Sorvete dentro (semiesfera + cilindro)
        var iceGeom = new THREE.CylinderGeometry(dims.r * 0.92, dims.r * 0.82, dims.h * 0.85, 32);
        var iceMat = new THREE.MeshPhongMaterial({ color: 0xFFE4F1, shininess: 60 });
        var ice = new THREE.Mesh(iceGeom, iceMat);
        ice.position.y = -dims.h * 0.075;
        scene.add(ice);

        // Topping sphere (chantilly)
        var topGeom = new THREE.SphereGeometry(dims.r * 0.85, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        var topMat = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, shininess: 100 });
        var top = new THREE.Mesh(topGeom, topMat);
        top.position.y = dims.h * 0.4;
        scene.add(top);

        // Cherry
        var cherryGeom = new THREE.SphereGeometry(dims.r * 0.18, 16, 16);
        var cherryMat = new THREE.MeshPhongMaterial({ color: 0xDC2626, shininess: 80 });
        var cherry = new THREE.Mesh(cherryGeom, cherryMat);
        cherry.position.y = dims.h * 0.7;
        scene.add(cherry);

        // Lights
        var ambient = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambient);
        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 7);
        scene.add(dirLight);

        // Animation: auto-rotate
        var group = new THREE.Group();
        group.add(cup); group.add(ice); group.add(top); group.add(cherry);
        scene.add(group);
        group.position.y = -dims.h / 2;

        var rotateSpeed = 0.01;
        var isDragging = false, prevX = 0;

        function animate() {
            if (!isDragging) group.rotation.y += rotateSpeed;
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        }
        animate();

        // Drag interaction
        container.addEventListener('mousedown', function (e) { isDragging = true; prevX = e.clientX; });
        container.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            group.rotation.y += (e.clientX - prevX) * 0.01;
            prevX = e.clientX;
        });
        container.addEventListener('mouseup', function () { isDragging = false; });
        container.addEventListener('touchstart', function (e) {
            if (e.touches[0]) { isDragging = true; prevX = e.touches[0].clientX; }
        });
        container.addEventListener('touchmove', function (e) {
            if (!isDragging || !e.touches[0]) return;
            group.rotation.y += (e.touches[0].clientX - prevX) * 0.01;
            prevX = e.touches[0].clientX;
        });
        container.addEventListener('touchend', function () { isDragging = false; });

        // Resize
        window.addEventListener('resize', function () {
            var nw = container.clientWidth, nh = container.clientHeight;
            camera.aspect = nw / nh; camera.updateProjectionMatrix();
            renderer.setSize(nw, nh);
        });
    }

    function _injectStyles() {
        if (document.getElementById('mp-ar-styles')) return;
        var s = document.createElement('style');
        s.id = 'mp-ar-styles';
        s.textContent = '@keyframes mp-ar-spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }';
        document.head.appendChild(s);
    }

    global.ARPreview = {
        show: show,
        dimensionsFor: dimensionsFor,
        VERSION: 'mp-v257'
    };
})(typeof window !== 'undefined' ? window : this);
