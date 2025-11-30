

const MagneticOrb = () => {
    const orbRef = React.useRef(null);
    const pos = React.useRef({ x: 0, y: 0 });
    const mouse = React.useRef({ x: 0, y: 0 });
    const currentAngle = React.useRef(0); // Store current angle for smoothing
    const currentStretch = React.useRef(0); // Store current stretch for smoothing
    const currentDeformAngle = React.useRef(0); // Store current deformation angle
    const currentHighlightAngle = React.useRef(0); // Separate smoothed angle for highlight
    const currentScale = React.useRef({ x: 1, y: 1 }); // Store current scale for smooth active deformation
    
    // Blob Animation State (JS-based for perfect smoothness)
    const blobPoints = React.useRef([50, 50, 50, 50, 50, 50, 50, 50]); // TL, TR, BR, BL (X then Y)
    const blobPhase = React.useRef(0);
    const stopTime = React.useRef(0); // Timestamp when movement stopped
    const activeTimer = React.useRef(null); // Timer for active state debounce
    const turbulenceRef = React.useRef(null); // Ref for SVG turbulence

    React.useEffect(() => {
        const orb = orbRef.current;

        const handleMouseMove = (e) => {
            let clientX = e.clientX;
            let clientY = e.clientY;

            const target = e.target.closest('.magnetic-target');
            if (target) {
                // ENTERING / ON TARGET
                if (activeTimer.current) {
                    clearTimeout(activeTimer.current);
                    activeTimer.current = null;
                }

                const rect = target.getBoundingClientRect();
                let centerX, centerY;

                if (target.tagName === 'INPUT' && target.type === 'range') {
                    // Special handling for sliders
                    const min = parseFloat(target.min) || 0;
                    const max = parseFloat(target.max) || 100;
                    const val = parseFloat(target.value) || 0;
                    const ratio = (val - min) / (max - min);
                    const thumbWidth = 16;
                    const availableWidth = rect.width - thumbWidth;
                    centerX = rect.left + (thumbWidth / 2) + (ratio * availableWidth);
                    centerY = rect.top + rect.height / 2;
                } else {
                    centerX = rect.left + rect.width / 2;
                    centerY = rect.top + rect.height / 2;
                }

                const isLarge = Math.max(rect.width, rect.height) > 150;
                // Reduced strength: Base 0.3 -> 0.1, Multipliers 1.5/3 -> 0.5/0.8
                // This provides a subtle "guidance" rather than a hard "snap"
                const strength = (parseFloat(target.dataset.magneticStrength) || 0.1) * (isLarge ? 0.5 : 0.8);

                mouse.current.x = clientX + (centerX - clientX) * strength;
                mouse.current.y = clientY + (centerY - clientY) * strength;

                if (!orb.classList.contains('active')) {
                    orb.classList.add('active');
                }
                // User Request: Reduce size even further (+15 -> +10, max 85 -> 80)
                const size = Math.min(Math.max(rect.width, rect.height) + 10, 80);
                orb.style.width = `${size}px`;
                orb.style.height = `${size}px`;
            } else {
                // LEAVING / OFF TARGET
                mouse.current.x = clientX;
                mouse.current.y = clientY;

                if (orb.classList.contains('active')) {
                    // Grace period: Don't shrink immediately to prevent flickering between gaps
                    if (!activeTimer.current) {
                        activeTimer.current = setTimeout(() => {
                            orb.classList.remove('active');
                            orb.style.width = '25px';
                            orb.style.height = '25px';
                            activeTimer.current = null;
                        }, 150); // 150ms grace period
                    }
                } else {
                    // Ensure inactive state (User Request: Slightly larger 20px -> 25px)
                    orb.style.width = '25px';
                    orb.style.height = '25px';
                }
            }
        };

            const loop = () => {
                // Calculate movement delta (velocity)
                const dx = mouse.current.x - pos.current.x;
                const dy = mouse.current.y - pos.current.y;

                // Apply smoothing (spring-like follow)
                const vx = dx * 0.25;
                const vy = dy * 0.25;

                pos.current.x += vx;
                pos.current.y += vy;

                // Physics for Droplet Deformation
                const speed = Math.sqrt(vx * vx + vy * vy);

                // --- Blob Shape Logic (JS Interpolation) ---
                blobPhase.current += 0.05; // Speed of wobble
                const t = blobPhase.current;

                // Animate Liquid Distortion (Random/Organic)
                if (turbulenceRef.current) {
                    const freqX = 0.01 + Math.sin(t * 0.02) * 0.005;
                    const freqY = 0.01 + Math.cos(t * 0.03) * 0.005;
                    turbulenceRef.current.setAttribute('baseFrequency', `${freqX} ${freqY}`);
                }

                // Generate organic target points for border-radius
                const wobbleTarget = [
                    50 + Math.sin(t) * 20,          // TL-x
                    50 + Math.cos(t * 0.8) * 20,    // TR-x
                    50 + Math.sin(t * 1.2) * 20,    // BR-x
                    50 + Math.cos(t * 0.9) * 20,    // BL-x
                    50 + Math.cos(t * 1.1) * 20,    // TL-y
                    50 + Math.sin(t * 0.7) * 20,    // TR-y
                    50 + Math.cos(t * 1.3) * 20,    // BR-y
                    50 + Math.sin(t * 0.6) * 20     // BL-y
                ];

                let currentTarget = wobbleTarget;
                let lerpSpeed = 0.02;

                if (speed > 0.5) {
                    // Moving: Target is perfect sphere
                    currentTarget = [50, 50, 50, 50, 50, 50, 50, 50];
                    lerpSpeed = 0.1;
                    stopTime.current = Date.now();
                } else {
                    // Stopped
                    const timeStopped = Date.now() - stopTime.current;
                    if (timeStopped < 500) {
                        currentTarget = [50, 50, 50, 50, 50, 50, 50, 50];
                        lerpSpeed = 0.1;
                    } else {
                        currentTarget = wobbleTarget;
                        lerpSpeed = 0.02;
                    }
                }

                // Interpolate current points towards target
                for (let i = 0; i < 8; i++) {
                    blobPoints.current[i] += (currentTarget[i] - blobPoints.current[i]) * lerpSpeed;
                }

                // Apply border-radius
                const p = blobPoints.current;
                if (orb) {
                    orb.style.borderRadius = `${p[0]}% ${p[1]}% ${p[2]}% ${p[3]}% / ${p[4]}% ${p[5]}% ${p[6]}% ${p[7]}%`;
                }

                // Calculate target angle
                let targetAngle = Math.atan2(vy, vx);

                // Smooth rotation interpolation
                let angleDiff = targetAngle - currentAngle.current;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

                if (speed > 0.5) {
                    currentAngle.current += angleDiff * 0.08;
                }

                // Stretch factor
                const stretch = Math.min(speed * 0.05, 0.5);
                
                // Magnetic Pull Deformation
                let targetStretch = 0;
                let targetDeformAngle = currentAngle.current;

                if (orb && orb.classList.contains('active')) {
                    const dx_mag = mouse.current.x - pos.current.x;
                    const dy_mag = mouse.current.y - pos.current.y;
                    const dist_mag = Math.sqrt(dx_mag * dx_mag + dy_mag * dy_mag);

                    targetStretch = Math.min(dist_mag * 0.005, 0.2);
                    targetDeformAngle = Math.atan2(dy_mag, dx_mag);
                }

                currentStretch.current += (targetStretch - currentStretch.current) * 0.1;

                let deformAngleDiff = targetDeformAngle - currentDeformAngle.current;
                while (deformAngleDiff > Math.PI) deformAngleDiff -= Math.PI * 2;
                while (deformAngleDiff < -Math.PI) deformAngleDiff += Math.PI * 2;
                currentDeformAngle.current += deformAngleDiff * 0.1;

                // Unified Scale Logic
                let targetScaleX = 1;
                let targetScaleY = 1;

                const isActive = orb && orb.classList.contains('active');

                if (isActive) {
                    const stretchX = Math.abs(vx) * 0.02;
                    const stretchY = Math.abs(vy) * 0.02;
                    targetScaleX = 1 + Math.min(stretchX, 0.3);
                    targetScaleY = 1 + Math.min(stretchY, 0.3);
                } else {
                    const inactiveBaseScale = 1 + stretch;
                    targetScaleX = inactiveBaseScale * (1 + currentStretch.current);
                    targetScaleY = inactiveBaseScale * (1 - currentStretch.current * 0.2);
                }

                currentScale.current.x += (targetScaleX - currentScale.current.x) * 0.05;
                currentScale.current.y += (targetScaleY - currentScale.current.y) * 0.05;

                // Apply Transform
                if (orb) {
                    orb.style.transform = `
                        translate3d(${pos.current.x}px, ${pos.current.y}px, 0) 
                        translate(-50%, -50%) 
                        scale(${currentScale.current.x}, ${currentScale.current.y})
                    `;
                }

                const specular = orb ? orb.querySelector('.liquid-glass-orb-specular') : null;
                const filterLayer = orb ? orb.querySelector('.liquid-glass-orb-filter') : null;

                if (orb) {
                    if (isActive) {
                        // Active State Specifics
                        const targetRotAngle = Math.atan2(vy, vx);
                        let hAngleDiff = targetRotAngle - currentHighlightAngle.current;
                        while (hAngleDiff > Math.PI) hAngleDiff -= Math.PI * 2;
                        while (hAngleDiff < -Math.PI) hAngleDiff += Math.PI * 2;
                        currentHighlightAngle.current += hAngleDiff * 0.02;
                        const rotAngle = currentHighlightAngle.current;

                        if (filterLayer) {
                            const fSx = 1.1 + Math.sin(t * 0.3) * 0.15; 
                            const fSy = 1.1 + Math.cos(t * 0.25) * 0.15;
                            filterLayer.style.transform = `rotate(${rotAngle}rad) scale(${fSx}, ${fSy})`;
                        }

                        if (specular) {
                            const offset = 5; 
                            const hx = Math.cos(rotAngle + Math.PI * 0.75) * offset;
                            const hy = Math.sin(rotAngle + Math.PI * 0.75) * offset;

                            orb.style.boxShadow = `0 0 25px rgba(255, 255, 255, 0.6)`;
                            specular.style.transform = 'none';
                            specular.style.boxShadow = `
                                inset ${hx}px ${hy}px 15px rgba(255, 255, 255, 1.0),
                                inset ${-hx}px ${-hy}px 15px rgba(0, 0, 0, 0.4)
                            `;
                        }
                    } else {
                        // Inactive State Specifics
                        const rotAngle = currentStretch.current > 0.01 ? currentDeformAngle.current : currentAngle.current;
                        const offset = 3;
                        const hx = Math.cos(rotAngle + Math.PI * 0.75) * offset;
                        const hy = Math.sin(rotAngle + Math.PI * 0.75) * offset;

                        orb.style.boxShadow = `
                            inset ${hx}px ${hy}px 4px rgba(255, 255, 255, 0.9),
                            inset ${-hx}px ${-hy}px 4px rgba(0, 0, 0, 0.2),
                            0 0 10px rgba(255, 255, 255, 0.3)
                        `;

                        if (specular) {
                            specular.style.transform = 'none';
                            specular.style.boxShadow = ''; 
                        }
                    }
                }

                requestAnimationFrame(loop);
            };

        const handleTouchMove = (e) => {
            if (e.touches.length > 0) {
                // Use the first touch point
                handleMouseMove({
                    clientX: e.touches[0].clientX,
                    clientY: e.touches[0].clientY,
                    target: document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY) || e.target
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: true });
        window.addEventListener('touchstart', handleTouchMove, { passive: true });

        const frameId = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchMove);
            cancelAnimationFrame(frameId);
            if (activeTimer.current) clearTimeout(activeTimer.current);
        };
    }, []);

    return (
        <>
            {/* Local Filter for Orb - Liquid Water Effect (Reduced Intensity) */}
            <svg style={{ display: 'none' }}>
                <filter id="orb-dist" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
                    <feTurbulence ref={turbulenceRef} type="turbulence" baseFrequency="0.01" numOctaves="3" seed="5" result="noise" />
                    {/* AA Step 1: Smooth the noise to prevent jagged displacement */}
                    <feGaussianBlur in="noise" stdDeviation="0.5" result="smoothNoise" />
                    {/* Increased scale from 8 to 12 for stronger distortion */}
                    <feDisplacementMap in="SourceGraphic" in2="smoothNoise" scale="12" xChannelSelector="R" yChannelSelector="G" result="distorted" />
                    {/* AA Step 2: Blur the result to smooth pixel edges */}
                    <feGaussianBlur in="distorted" stdDeviation="0.4" />
                </filter>
            </svg>

            <style>{`
                /* Orb Variant - Injected Styles */
                .liquid-glass-orb {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 25px;
                    height: 25px;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9999;
                    background: var(--lg-bg-color, rgba(255, 255, 255, 0.1));
                    overflow: hidden;
                    transition: width 0.8s cubic-bezier(0.19, 1, 0.22, 1), 
                                height 0.8s cubic-bezier(0.19, 1, 0.22, 1), 
                                background-color 0.3s;
                    will-change: transform, width, height, border-radius;
                }

                .liquid-glass-orb.active {
                    background: rgba(255, 255, 255, 0.01);
                    border: none;
                    mix-blend-mode: normal;
                    transition: width 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), 
                                height 0.6s cubic-bezier(0.25, 0.8, 0.25, 1), 
                                background-color 0.3s;
                }

                .liquid-glass-orb-blur {
                    position: absolute;
                    inset: 0;
                    z-index: 1;
                    border-radius: inherit;
                    opacity: 1;
                    transition: opacity 0.8s cubic-bezier(0.19, 1, 0.22, 1);
                    backdrop-filter: blur(1px) saturate(1.2);
                    -webkit-backdrop-filter: blur(1px) saturate(1.2);
                }

                .liquid-glass-orb.active .liquid-glass-orb-blur {
                    opacity: 0;
                }

                .liquid-glass-orb-filter {
                    position: absolute;
                    inset: -50%;
                    z-index: 0;
                    opacity: 0;
                    transition: opacity 0.8s cubic-bezier(0.19, 1, 0.22, 1);
                    border-radius: inherit;
                    backdrop-filter: saturate(1.5) contrast(1.05);
                    -webkit-backdrop-filter: saturate(1.5) contrast(1.05);
                }

                .liquid-glass-orb.active .liquid-glass-orb-filter {
                    opacity: 1;
                }

                .liquid-glass-orb-shadows {
                    position: absolute;
                    inset: 0;
                    z-index: 5;
                    border-radius: inherit;
                    pointer-events: none;
                    box-shadow: 
                        inset 2px 2px 6px rgba(255, 255, 255, 0.8),
                        inset -2px -2px 6px rgba(0, 0, 0, 0.1),
                        inset 0 0 15px rgba(255, 255, 255, 0.2),
                        0 4px 12px rgba(0, 0, 0, 0.15);
                }

                .liquid-glass-orb-specular {
                    position: absolute;
                    inset: 0;
                    z-index: 10;
                    opacity: 0;
                    transition: opacity 0.8s cubic-bezier(0.19, 1, 0.22, 1);
                    border-radius: inherit;
                    box-shadow: 
                        inset 5px 5px 12px rgba(255, 255, 255, 0.9),
                        inset -5px -5px 12px rgba(0, 0, 0, 0.2),
                        0 0 15px rgba(255, 255, 255, 0.4);
                }

                .liquid-glass-orb.active .liquid-glass-orb-specular {
                    opacity: 1;
                }
            `}</style>
            <div id="magnetic-orb" className="liquid-glass-orb" ref={orbRef}>
                <div className="liquid-glass-orb-blur"></div>
                <div className="liquid-glass-orb-filter" style={{ filter: 'url(#orb-dist)' }}></div>
                <div className="liquid-glass-orb-shadows"></div>
                <div className="liquid-glass-orb-specular"></div>
            </div>
        </>
    );
};
