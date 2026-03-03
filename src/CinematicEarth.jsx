import { useEffect, useRef } from "react";
import * as THREE from "three";
import * as d3 from "d3";
import { feature } from "topojson-client";

/* ─────────────────────────────────────────────────────────────────
   Builds a 2048×1024 equirectangular canvas texture:
     • Deep-navy ocean (#030d1e)
     • Land fill: dark-steel blue (#0f2a50)
     • Coastline + borders: electric blue (#3b7dd8)
     • Neural-network nodes + connection lines in cyan/blue
     • Subtle lat/lon grid
   Loaded async so the globe can appear immediately with a solid
   colour and the texture swaps in once the geodata arrives.
──────────────────────────────────────────────────────────────────── */
async function buildNeuralTexture() {
    const W = 2048;
    const H = 1024;
    const cv = document.createElement("canvas");
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");

    /* ── Ocean background ──────────────────────────────────────── */
    ctx.fillStyle = "#030d1e";
    ctx.fillRect(0, 0, W, H);

    /* ── Subtle lat/lon grid ───────────────────────────────────── */
    ctx.strokeStyle = "rgba(30, 80, 160, 0.20)";
    ctx.lineWidth = 0.7;
    for (let x = 0; x <= W; x += W / 18) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += H / 9) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    /* ── Fetch & draw land masses (topojson → GeoJSON → d3 path) ─ */
    try {
        const topo = await fetch(
            "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json"
        ).then((r) => r.json());

        const land = feature(topo, topo.objects.land);

        const projection = d3
            .geoEquirectangular()
            .scale(H / Math.PI)
            .translate([W / 2, H / 2]);

        const pathGen = d3.geoPath(projection, ctx);

        /* Land fill */
        ctx.beginPath();
        pathGen(land);
        ctx.fillStyle = "#0f2a50";
        ctx.fill();

        /* Coastline glow — two passes for a soft bloom */
        ctx.beginPath();
        pathGen(land);
        ctx.strokeStyle = "rgba(59, 125, 216, 0.35)";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        pathGen(land);
        ctx.strokeStyle = "#3b7dd8";
        ctx.lineWidth = 1;
        ctx.stroke();
    } catch (e) {
        /* If CDN fetch fails, fall back to a plain darker-blue land blob */
        console.warn("World-atlas fetch failed, using fallback texture.");
    }

    /* ── Neural-network nodes ──────────────────────────────────── */
    const NODE_COUNT = 170;
    const nodes = [];
    for (let i = 0; i < NODE_COUNT; i++) {
        const s = Math.sin(i * 127.1 + 311.7) * 43758.5;
        const rng = (n) => {
            const v = Math.sin(i * 127.1 + n * 311.7) * 43758.5;
            return v - Math.floor(v);
        };
        nodes.push({
            x: rng(0) * W,
            y: rng(1) * H,
            r: rng(2) * 2.5 + 1,
            b: rng(3) * 0.6 + 0.4,
        });
    }

    /* Connection lines */
    const MAX_D = 165;
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < MAX_D) {
                const a = (1 - d / MAX_D) * 0.4;
                ctx.strokeStyle = `rgba(60, 140, 240, ${a})`;
                ctx.lineWidth = 0.55;
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.stroke();
            }
        }
    }

    /* Node dots */
    for (const n of nodes) {
        const hue = 200 + n.b * 30; // 200–230 (cyan-blue range)
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
        grd.addColorStop(0, `hsla(${hue},100%,75%,${n.b * 0.85})`);
        grd.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `hsla(${hue},100%,92%,${n.b})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
    }

    /* Pole vignette */
    const vig = ctx.createLinearGradient(0, 0, 0, H);
    vig.addColorStop(0, "rgba(3,13,30,0.6)");
    vig.addColorStop(0.22, "rgba(3,13,30,0)");
    vig.addColorStop(0.78, "rgba(3,13,30,0)");
    vig.addColorStop(1, "rgba(3,13,30,0.6)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    const tex = new THREE.CanvasTexture(cv);
    return tex;
}

/* ─────────────────────────────────────────────────────────────────
   Main component
──────────────────────────────────────────────────────────────────── */
export default function CinematicEarth() {
    const mountRef = useRef(null);

    useEffect(() => {
        const el = mountRef.current;
        if (!el) return;

        let isMounted = true;
        let frameId;
        const disposables = [];

        const W = el.clientWidth;
        const H = el.clientHeight;

        /* ── Renderer ─────────────────────────────────────────────── */
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(W, H);
        renderer.setClearColor(0x000000, 0);
        el.appendChild(renderer.domElement);
        disposables.push(() => {
            renderer.dispose();
            if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
        });

        /* ── Scene / Camera ───────────────────────────────────────── */
        const scene = new THREE.Scene();
        // FoV 45°, canvas 440×440 → at camera z=3, orbit z=1.35
        // visible width at z=1.35 ≈ 1.37 world units  →  sprite 1.05 = ~77%
        const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
        camera.position.z = 3;

        /* ── Lights ───────────────────────────────────────────────── */
        scene.add(new THREE.AmbientLight(0x4488ff, 0.55));
        const key = new THREE.DirectionalLight(0x88ccff, 1.6);
        key.position.set(4, 3, 5);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0x00e5ff, 0.75);
        rim.position.set(-5, -1, -4);
        scene.add(rim);

        /* ── Earth globe (radius 0.72 — smaller) ─────────────────── */
        const R = 0.72;
        const earthGeo = new THREE.SphereGeometry(R, 72, 72);
        disposables.push(() => earthGeo.dispose());

        // Placeholder material (solid dark navy) while texture loads
        const earthMat = new THREE.MeshPhongMaterial({
            color: 0x030d1e,
            emissive: new THREE.Color(0x0a1a3f),
            emissiveIntensity: 0.5,
            specular: new THREE.Color(0x224488),
            shininess: 35,
        });
        disposables.push(() => earthMat.dispose());

        const earth = new THREE.Mesh(earthGeo, earthMat);
        scene.add(earth);

        /* Atmosphere */
        const atmMat = new THREE.MeshPhongMaterial({
            color: 0x007fff,
            transparent: true,
            opacity: 0.115,
            side: THREE.BackSide,
        });
        disposables.push(() => atmMat.dispose());
        scene.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.07, 48, 48), atmMat));

        /* Outer halo */
        const haloMat = new THREE.MeshPhongMaterial({
            color: 0x0044cc,
            transparent: true,
            opacity: 0.045,
            side: THREE.BackSide,
        });
        disposables.push(() => haloMat.dispose());
        scene.add(new THREE.Mesh(new THREE.SphereGeometry(R * 1.20, 48, 48), haloMat));

        /* ── INTELMAP text sprite ──────────────────────────────────── */
        // Canvas is 1024×180; sprite world-width 1.05 fits ~77% of viewport
        const txtCv = document.createElement("canvas");
        txtCv.width = 1024;
        txtCv.height = 180;
        const tctx = txtCv.getContext("2d");

        tctx.clearRect(0, 0, 1024, 180);
        tctx.font = "bold 108px 'Orbitron', 'Courier New', monospace";
        tctx.textAlign = "center";
        tctx.textBaseline = "middle";

        // Wide glow
        tctx.shadowColor = "#22d3ee";
        tctx.shadowBlur = 50;
        tctx.fillStyle = "rgba(34,211,238,0.3)";
        tctx.fillText("INTELMAP", 512, 90);

        tctx.shadowBlur = 24;
        tctx.fillStyle = "rgba(100,220,255,0.65)";
        tctx.fillText("INTELMAP", 512, 90);

        // Crisp core
        tctx.shadowBlur = 5;
        tctx.fillStyle = "#ddf4ff";
        tctx.fillText("INTELMAP", 512, 90);

        const txtTex = new THREE.CanvasTexture(txtCv);
        const spriteMat = new THREE.SpriteMaterial({
            map: txtTex,
            transparent: true,
            depthTest: false,
        });
        disposables.push(() => { txtTex.dispose(); spriteMat.dispose(); });

        const sprite = new THREE.Sprite(spriteMat);

        /* Base scale: width 1.05, height = 1.05 * (180/1024) ≈ 0.185 */
        const BASE_W = 1.05;
        const BASE_H = BASE_W * (180 / 1024);
        sprite.scale.set(BASE_W, BASE_H, 1);
        scene.add(sprite);

        /* ── Orbit: quarter-sweep from LEFT (−π/2) → FRONT (0) ───── */
        const ORBIT_R = 1.35;
        const START_A = -Math.PI / 2;  // left side
        const END_A = 0;             // centre front
        const DURATION = 2000;         // ms

        const t0 = performance.now();
        let done = false;

        function easeOut(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        /* ── Render loop ──────────────────────────────────────────── */
        function animate() {
            frameId = requestAnimationFrame(animate);
            earth.rotation.y += 0.0010;

            if (!done) {
                const rawT = Math.min((performance.now() - t0) / DURATION, 1);
                const e = easeOut(rawT);
                const angle = START_A + (END_A - START_A) * e;

                const sx = Math.sin(angle) * ORBIT_R;
                const sz = Math.cos(angle) * ORBIT_R;

                sprite.position.set(sx, 0, sz);

                // Subtle perspective scale: 0.88 when starting (side), 1.0 at front
                const ps = THREE.MathUtils.mapLinear(sz, 0, ORBIT_R, 0.88, 1.0);
                sprite.scale.set(BASE_W * ps, BASE_H * ps, 1);

                // Fade in as it comes to front
                spriteMat.opacity = THREE.MathUtils.clamp(
                    THREE.MathUtils.mapLinear(sz, 0, ORBIT_R * 0.55, 0.08, 1),
                    0.08, 1
                );

                if (rawT >= 1) {
                    done = true;
                    sprite.position.set(0, 0, ORBIT_R);
                    sprite.scale.set(BASE_W, BASE_H, 1);
                    spriteMat.opacity = 1;
                }
            }

            renderer.render(scene, camera);
        }

        animate();

        /* ── Load neural texture asynchronously ───────────────────── */
        buildNeuralTexture().then((tex) => {
            if (!isMounted) { tex.dispose(); return; }
            earthMat.map = tex;
            earthMat.color.set(0xffffff);
            earthMat.emissiveIntensity = 0.3;
            earthMat.needsUpdate = true;
            disposables.push(() => tex.dispose());
        });

        /* ── Cleanup ──────────────────────────────────────────────── */
        return () => {
            isMounted = false;
            cancelAnimationFrame(frameId);
            disposables.forEach((fn) => fn());
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{ width: "440px", height: "440px", position: "relative", flexShrink: 0 }}
        />
    );
}
