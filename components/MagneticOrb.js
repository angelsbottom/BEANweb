const { useState, useEffect, useRef, useMemo } = React;

const MagneticOrb = () => {
    const orbRef = useRef(null);
    const pos = useRef({ x: 0, y: 0 });
    const mouse = useRef({ x: 0, y: 0 });
    const currentAngle = useRef(0); // Store current angle for smoothing
    const currentStretch = useRef(0); // Store current stretch for smoothing
    const currentDeformAngle = useRef(0); // Store current deformation angle
    const currentHighlightAngle = useRef(0); // Separate smoothed angle for highlight

    useEffect(() => {
        const orb = orbRef.current;
        
        const handleMouseMove = (e) => {
            let clientX = e.clientX;
            let clientY = e.clientY;
            
            const target = e.target.closest('.magnetic-target');
            if (target) {
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
                const strength = (parseFloat(target.dataset.magneticStrength) || 0.3) * (isLarge ? 1.5 : 3);
                
                mouse.current.x = clientX + (centerX - clientX) * strength;
                mouse.current.y = clientY + (centerY - clientY) * strength;
                
                if (!orb.classList.contains('active')) {
                    orb.classList.add('active');
                    // Randomize animation start point for unique shape every time
                    orb.style.animationDelay = `-${Math.random() * 4}s`;
                }
                const size = Math.min(Math.max(rect.width, rect.height) + 20, 80);
                orb.style.width = `${size}px`; 
                orb.style.height = `${size}px`;
            } else {
                mouse.current.x = clientX;
                mouse.current.y = clientY;
                
                orb.classList.remove('active');
                orb.style.width = '20px'; 
                orb.style.height = '20px';
            }
        };

        const loop = () => {
            // Calculate movement delta (velocity)
            const dx = mouse.current.x - pos.current.x;
            const dy = mouse.current.y - pos.current.y;
            
            // Apply smoothing (spring-like follow)
            // Increased from 0.15 to 0.25 for better responsiveness (User Request)
            const vx = dx * 0.25;
            const vy = dy * 0.25;
            
            pos.current.x += vx;
            pos.current.y += vy;

            // Physics for Droplet Deformation
            const speed = Math.sqrt(vx * vx + vy * vy);
            
            // Calculate target angle
            let targetAngle = Math.atan2(vy, vx);
            
            // Smooth rotation interpolation
            // Handle angle wrapping (-PI to PI)
            let angleDiff = targetAngle - currentAngle.current;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            // Only update angle if moving fast enough to have a clear direction
            if (speed > 0.5) {
                // Slower rotation smoothing for "drifting" feel (0.15 -> 0.08)
                // This makes the orb translate in the new direction BEFORE fully rotating to face it
                currentAngle.current += angleDiff * 0.08;
            }

            // Stretch factor: 0 at rest, increases with speed
            // Speed NO LONGER increases size for active orb (User request)
            const stretch = Math.min(speed * 0.05, 0.5); 
            
            // Magnetic Pull Deformation
            // If active (attached), calculate pull vector from orb center to true mouse position
            let targetStretch = 0;
            let targetDeformAngle = currentAngle.current;

            if (orb && orb.classList.contains('active')) {
                const dx_mag = mouse.current.x - pos.current.x;
                const dy_mag = mouse.current.y - pos.current.y;
                const dist_mag = Math.sqrt(dx_mag * dx_mag + dy_mag * dy_mag);
                
                // Stretch based on how far the mouse pulls the orb
                targetStretch = Math.min(dist_mag * 0.005, 0.2); 
                targetDeformAngle = Math.atan2(dy_mag, dx_mag);
            }

            // Smoothly interpolate stretch
            currentStretch.current += (targetStretch - currentStretch.current) * 0.1;

            // Smoothly interpolate deformation angle
            let deformAngleDiff = targetDeformAngle - currentDeformAngle.current;
            while (deformAngleDiff > Math.PI) deformAngleDiff -= Math.PI * 2;
            while (deformAngleDiff < -Math.PI) deformAngleDiff += Math.PI * 2;
            currentDeformAngle.current += deformAngleDiff * 0.1;

            // Inactive Scale (Speed increases size)
            const inactiveBaseScale = 1 + stretch;
            const inactiveScaleX = inactiveBaseScale * (1 + currentStretch.current);
            const inactiveScaleY = inactiveBaseScale * (1 - currentStretch.current * 0.2);

            const specular = orb ? orb.querySelector('.orb-specular') : null;
            const filterLayer = orb ? orb.querySelector('.orb-filter') : null;
            const isActive = orb && orb.classList.contains('active');

            if (orb) {
                if (isActive) {
                    // Active State: 
                    // 1. No rotation of the shape (container).
                    // 2. No general size increase with speed.
                    // 3. Directional stretch based on movement (X/Y independent to avoid rotation).
                    
                    // Calculate stretch based on velocity components directly
                    // vx, vy are already smoothed velocities
                    const stretchX = Math.abs(vx) * 0.02; // Tune sensitivity
                    const stretchY = Math.abs(vy) * 0.02;
                    
                    // Limit stretch to avoid extreme distortion
                    const sX = 1 + Math.min(stretchX, 0.3);
                    const sY = 1 + Math.min(stretchY, 0.3);

                    // Morph to circle when moving fast
                    const speedMag = Math.sqrt(vx*vx + vy*vy);
                    if (speedMag > 2) {
                        orb.classList.add('moving-fast');
                    } else {
                        orb.classList.remove('moving-fast');
                    }

                    orb.style.transform = `
                        translate3d(${pos.current.x}px, ${pos.current.y}px, 0) 
                        translate(-50%, -50%) 
                        scale(${sX}, ${sY})
                    `;
                    
                    // Rotate Highlight AND Shader together
                    if (specular || filterLayer) {
                        const targetRotAngle = Math.atan2(vy, vx); // Use velocity direction for highlight
                        
                        // Ultra-slow smoothing for highlight rotation
                        let hAngleDiff = targetRotAngle - currentHighlightAngle.current;
                        while (hAngleDiff > Math.PI) hAngleDiff -= Math.PI * 2;
                        while (hAngleDiff < -Math.PI) hAngleDiff += Math.PI * 2;
                        currentHighlightAngle.current += hAngleDiff * 0.02; 

                        const rotAngle = currentHighlightAngle.current;

                        // 1. Rotate Shader Layer
                        if (filterLayer) {
                            filterLayer.style.transform = `rotate(${rotAngle}rad)`;
                        }

                        // 2. Rotate Highlight (via box-shadow to preserve shape)
                        if (specular) {
                            // Calculate offsets for "Top-Left" highlight rotated by angle
                            const offset = 6;
                            const hx = Math.cos(rotAngle + Math.PI * 0.75) * offset;
                            const hy = Math.sin(rotAngle + Math.PI * 0.75) * offset;

                            specular.style.transform = 'none'; 
                            specular.style.boxShadow = `
                                inset ${hx}px ${hy}px 8px rgba(255, 255, 255, 0.9),
                                inset ${-hx}px ${-hy}px 8px rgba(0, 0, 0, 0.2),
                                0 0 15px rgba(255, 255, 255, 0.4),
                                inset 0 0 20px rgba(255, 255, 255, 0.2)
                            `;
                        }
                    }
                } else {
                    // Inactive State: Container rotates for speed stretch
                    orb.style.transform = `
                        translate3d(${pos.current.x}px, ${pos.current.y}px, 0) 
                        translate(-50%, -50%) 
                        rotate(${currentStretch.current > 0.01 ? currentDeformAngle.current : currentAngle.current}rad) 
                        scale(${inactiveScaleX}, ${inactiveScaleY})
                    `;
                    // Reset highlight rotation/shadow
                    if (specular) {
                        specular.style.transform = 'none';
                        specular.style.boxShadow = ''; // Revert to CSS
                    }
                    // Reset filter rotation
                    if (filterLayer) {
                        filterLayer.style.transform = 'none';
                    }
                }
                
                // Always a circle (border-radius handles the oval shape via scale or animation)
                // orb.style.borderRadius = '50%'; // Handled by CSS animation in active state
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
        };
    }, []);

    return (
        <>
            {/* Local Filter for Orb - Weaker Distortion */}
            <svg style={{ display: 'none' }}>
                <filter id="orb-dist" x="0%" y="0%" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
                    <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
                    <feDisplacementMap in="SourceGraphic" in2="blurred" scale="30" xChannelSelector="R" yChannelSelector="G">
                        {/* Animate distortion scale to match liquid shape morphing */}
                        <animate attributeName="scale" values="30; 50; 20; 40; 30" dur="6s" repeatCount="indefinite" />
                    </feDisplacementMap>
                </filter>
            </svg>
            <style>{`
                @keyframes liquid-shape {
                    0% { border-radius: 63% 37% 54% 46% / 55% 48% 52% 45%; }
                    25% { border-radius: 40% 60% 54% 46% / 49% 60% 40% 51%; }
                    50% { border-radius: 54% 46% 38% 62% / 49% 70% 30% 51%; }
                    75% { border-radius: 61% 39% 55% 45% / 61% 38% 62% 39%; }
                    100% { border-radius: 63% 37% 54% 46% / 55% 48% 52% 45%; }
                }

                #magnetic-orb {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 9999;
                    
                    /* Base Orb Styles (Restored) */
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(3px);
                    -webkit-backdrop-filter: blur(3px);
                    
                    box-shadow: 
                        inset 2px 2px 4px rgba(255, 255, 255, 0.9),
                        inset -2px -2px 4px rgba(0, 0, 0, 0.2),
                        0 0 10px rgba(255, 255, 255, 0.3);

                    overflow: hidden; /* Clip inner layers */
                    
                    transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), 
                                height 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), 
                                background-color 0.3s;
                    will-change: transform, width, height, border-radius;
                }

                /* Inner Layers for Liquid Effect */
                .orb-filter {
                    position: absolute;
                    inset: -50%; /* Make larger to cover rotation */
                    z-index: 0;
                    opacity: 0; /* Hidden by default */
                    transition: opacity 0.3s;
                    /* The Liquid Distortion Magic */
                    backdrop-filter: blur(0px) saturate(1.8) contrast(1.2) brightness(1.1);
                    -webkit-backdrop-filter: blur(0px) saturate(1.8) contrast(1.2) brightness(1.1);
                    filter: url(#orb-dist);
                }

                .orb-specular {
                    position: absolute;
                    inset: 0;
                    z-index: 1;
                    opacity: 0;
                    transition: opacity 0.3s;
                    border-radius: inherit; /* Inherit irregular shape from parent */
                    box-shadow: 
                        inset 4px 4px 8px rgba(255, 255, 255, 0.9),
                        inset -4px -4px 8px rgba(0, 0, 0, 0.2),
                        0 0 15px rgba(255, 255, 255, 0.4),
                        inset 0 0 20px rgba(255, 255, 255, 0.2);
                }

                #magnetic-orb.active {
                    background: rgba(255, 255, 255, 0.02);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    mix-blend-mode: normal;
                    /* Remove base blur when active */
                    backdrop-filter: none;
                    -webkit-backdrop-filter: none;
                    
                    /* Liquid Shape Animation */
                    animation: liquid-shape 6s ease-in-out infinite;
                    transition: border-radius 0.3s ease-out, width 0.3s, height 0.3s, background-color 0.3s;
                }

                #magnetic-orb.active.moving-fast {
                    animation: none;
                    border-radius: 50%;
                }

                #magnetic-orb.active .orb-filter,
                #magnetic-orb.active .orb-specular {
                    opacity: 1;
                }
            `}</style>
            <div id="magnetic-orb" ref={orbRef}>
                <div className="orb-filter"></div>
                <div className="orb-specular"></div>
            </div>
        </>
    );
};
