

const AdaBinSim = ({ isActive }) => {
    const canvasRef = React.useRef(null);
    const [method, setMethod] = React.useState('standard');
    const [activeTab, setActiveTab] = React.useState('standard');
    const particlesRef = React.useRef([]);
    const animationRef = React.useRef({ 
        mode: 'DROP', // DROP, WAIT, CLUSTER, SCATTER, REVEAL
        thresholdOpacity: 1,
        lineProgress: 1,
        colorMix: 1,
        timer: 0,
        targetMethod: null,
        visualThreshold: 0
    });
    
    // Configuration
    const BASELINE_OFFSET = 100; 
    const VIEW_RANGE = 2;
    const PARTICLE_RADIUS = 3;
    const STACK_OVERLAP = 3.0; 
    
    // Initialization
    const generateParticles = () => {
        const ps = [];
        let z = 0; 
        while(z>=0.2 || z <=-0.2 || (z<=0.05 && z>=-0.05)) z = Math.random();
        for (let i = 0; i < 200; i++) {
            // Box-Muller N(0, 2)
            let u = 0, v = 0; 
            while(u === 0) u = Math.random(); 
            while(v === 0) v = Math.random();
            let val = Math.sqrt(-1.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * Math.sqrt(2) + z;
            
            ps.push({ 
                val, 
                x: 0, 
                y: -20 - Math.random() * 200, 
                vx: 0, 
                vy: (8 + Math.random() * 10) * 0.7, // Reduced by 30%
                binX: 0, binY: 0, 
                jitterPhase: Math.random() * Math.PI * 2,
                colorStrength: 1,
                colorDelay: Math.random() * 0.5 // Random delay 0-0.5s for color reveal
            });
        }
        particlesRef.current = ps;
        animationRef.current.mode = 'DROP';
        animationRef.current.thresholdOpacity = 1;
    };

    // Trigger switch sequence
    const switchMethod = (newMethod) => {
        if (newMethod === activeTab || animationRef.current.mode === 'SCATTER' || animationRef.current.mode === 'DROP') return;
        
        setActiveTab(newMethod);
        // Start transition sequence: SCATTER -> switch method -> CLUSTER
        animationRef.current.mode = 'SCATTER';
        animationRef.current.targetMethod = newMethod;
    }

    React.useEffect(() => { if(isActive) generateParticles(); }, [isActive]);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animId, w, h;
        
        const handleResize = () => {
            const wLogical = canvas.clientWidth;
            const hLogical = canvas.clientHeight;
            
            if (!wLogical || !hLogical) return;
            
            const dpr = window.devicePixelRatio || 1;
            w = wLogical; 
            h = hLogical;
            
            if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
                canvas.width = w * dpr; 
                canvas.height = h * dpr;
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            }
        };

        const resizeObserver = new ResizeObserver(() => handleResize());
        resizeObserver.observe(canvas);
        
        handleResize();

        const render = () => {
            if(!w) return;
            ctx.clearRect(0,0,w,h); 
            ctx.font = '12px JetBrains Mono, monospace';

            const floorY = h - BASELINE_OFFSET;
            const mapX = v => (v / (VIEW_RANGE * 2) + 0.5) * w;
            
            // 1. Logic Update based on Mode
            const anim = animationRef.current;
            
            // Calculate Stats & Thresholds
            let sum = 0; particlesRef.current.forEach(p=>sum+=p.val);
            const mean = sum/particlesRef.current.length;
            
            let threshold = 0, barPosNeg = 0, barPosPos = 0;
            let alpha = 0, beta = 0;
            let totalError = 0;

            // Calculate Optimal Alpha first for reference
            let sumAbsDiff = 0; 
            particlesRef.current.forEach(p => sumAbsDiff += Math.abs(p.val - mean));
            const optimalAlpha = sumAbsDiff / particlesRef.current.length;

            // Calculate Standard Deviation for AdaBin
            let sumSqDiff = 0;
            particlesRef.current.forEach(p => sumSqDiff += Math.pow(p.val - mean, 2));
            const stdDev = Math.sqrt(sumSqDiff / particlesRef.current.length);

            if (method === 'standard') {
                // Standard: Threshold = 0, Alpha = Mean(|x|)
                beta = 0;
                threshold = 0;
                let sumAbs = 0; particlesRef.current.forEach(p => sumAbs += Math.abs(p.val));
                alpha = sumAbs / particlesRef.current.length;
            } else if (method === 'adabin') {
                // AdaBin: Alpha is Standard Deviation (as per user request)
                beta = mean;
                threshold = beta;
                alpha = stdDev; 
            } else {
                // Optimized: Analytical solution (Mean Absolute Deviation)
                beta = mean;
                threshold = beta;
                alpha = optimalAlpha;
            }

            barPosNeg = beta - alpha; 
            barPosPos = beta + alpha;

            // Smoothly interpolate visual threshold for sliding animation (only if not switching methods)
            if (anim.mode !== 'REVEAL') {
                anim.visualThreshold += (threshold - anim.visualThreshold) * 0.1;
            } else {
                anim.visualThreshold = threshold; // Snap instantly for new method reveal
            }

            // Calculate Total Error (L2)
            particlesRef.current.forEach(p => {
                const reconstructed = (p.val >= threshold) ? (beta + alpha) : (beta - alpha);
                totalError += Math.pow(p.val - reconstructed, 2);
            });

            // Calculate counts for display
            let currentNegCount = 0;
            let currentPosCount = 0;
            particlesRef.current.forEach(p => {
                if (p.val >= threshold) currentPosCount++; else currentNegCount++;
            });

            // --- Phase Logic ---
            let settledCount = 0;

            if (anim.mode === 'DROP') {
                    particlesRef.current.forEach(p => {
                        const targetX = mapX(p.val);
                        p.x = p.x === 0 ? targetX : p.x + (targetX - p.x) * 0.07; // Reduced by 30% 
                        p.y += p.vy;
                        if(p.y >= floorY) { p.y = floorY; settledCount++; }
                    });
                    if (settledCount > particlesRef.current.length * 0.95) {
                        anim.mode = 'CLUSTER'; 
                    }
            } 
            else if (anim.mode === 'SCATTER') {
                // Animate Line shrinking from top to bottom
                anim.lineProgress = Math.max(0, anim.lineProgress - 0.04);
                // Fade out text info
                anim.thresholdOpacity = Math.max(0, anim.thresholdOpacity - 0.05);
                
                let readyToSwitch = true;
                const startDropping = anim.lineProgress <= 0.1;

                const lineTopY = h - (h * anim.lineProgress);

                particlesRef.current.forEach(p => {
                    const targetX = mapX(p.val);
                    const targetY = floorY;
                    
                    // Fade color if above shrinking line
                    if (p.y < lineTopY) {
                        p.colorStrength = Math.max(0, p.colorStrength - 0.15);
                    }

                    if (startDropping) {
                        // Drop to floor (Slower: 0.08)
                        p.x += (targetX - p.x) * 0.08; 
                        p.y += (targetY - p.y) * 0.08;
                    } else {
                        // Hold formation (Cluster behavior)
                        p.x += (p.binX - p.x) * 0.1; 
                        p.y += (p.binY - p.y) * 0.1;
                        // Breathing
                        const t = Date.now() * 0.002;
                        p.x += Math.sin(t + p.jitterPhase) * 0.05;
                        p.y += Math.cos(t + p.jitterPhase) * 0.05;
                    }
                    
                    if (Math.abs(p.x - targetX) > 1 || Math.abs(p.y - targetY) > 1) readyToSwitch = false;
                });

                if (readyToSwitch && anim.lineProgress <= 0) {
                    setMethod(anim.targetMethod);
                    anim.mode = 'REVEAL'; 
                    anim.lineProgress = 0;
                    anim.colorMix = 0;
                    anim.thresholdOpacity = 1; 
                }
            }
            else if (anim.mode === 'REVEAL') {
                // Animate Line from bottom to top
                anim.lineProgress = Math.min(1, anim.lineProgress + 0.05);
                // Animate Color global timer (0 to 1.5 to cover delays)
                anim.colorMix = Math.min(1.5, anim.colorMix + 0.015);
                
                // --- Sync Clustering Logic ---
                let negs = [], poss = [];
                particlesRef.current.forEach(p => {
                    if (p.val >= threshold) poss.push(p); else negs.push(p);
                });
                
                const diameter = PARTICLE_RADIUS * 2;
                
                // Negative Bin
                const negCenterX = mapX(barPosNeg);
                negs.forEach((p, i) => {
                    p.binX = negCenterX + (Math.sin(i * 123.1) * 24); 
                    p.binY = floorY - (i * diameter / STACK_OVERLAP) - PARTICLE_RADIUS; 
                });
                // Positive Bin
                const posCenterX = mapX(barPosPos);
                poss.forEach((p, i) => {
                    p.binX = posCenterX + (Math.sin(i * 321.3) * 24);
                    p.binY = floorY - (i * diameter / STACK_OVERLAP) - PARTICLE_RADIUS;
                });

                // Delay clustering by ~0.5s (anim.colorMix increments by 0.015, so 0.5 is ~33 frames)
                if (anim.colorMix > 0.5) {
                    particlesRef.current.forEach(p => {
                        p.x += (p.binX - p.x) * 0.03; // Slow clustering
                        p.y += (p.binY - p.y) * 0.03;
                    });
                } else {
                    // Breathing while waiting
                    particlesRef.current.forEach(p => {
                        const t = Date.now() * 0.002;
                        p.x += Math.sin(t + p.jitterPhase) * 0.02;
                    });
                }

                if (anim.lineProgress >= 1 && anim.colorMix >= 1.5) {
                    anim.mode = 'CLUSTER';
                    // Reset particle strength for stability
                    particlesRef.current.forEach(p => p.colorStrength = 1);
                }
            }
            else if (anim.mode === 'CLUSTER') {
                // anim.thresholdOpacity = Math.min(1, anim.thresholdOpacity + 0.035); // Handled in REVEAL

                let negs = [], poss = [];
                particlesRef.current.forEach(p => {
                    if (p.val >= threshold) poss.push(p); else negs.push(p);
                });
                
                const diameter = PARTICLE_RADIUS * 2;
                
                // Negative Bin
                const negCenterX = mapX(barPosNeg);
                negs.forEach((p, i) => {
                    p.binX = negCenterX + (Math.sin(i * 123.1) * 24); 
                    p.binY = floorY - (i * diameter / STACK_OVERLAP) - PARTICLE_RADIUS; 
                });
                // Positive Bin
                const posCenterX = mapX(barPosPos);
                poss.forEach((p, i) => {
                    p.binX = posCenterX + (Math.sin(i * 321.3) * 24);
                    p.binY = floorY - (i * diameter / STACK_OVERLAP) - PARTICLE_RADIUS;
                });

                particlesRef.current.forEach(p => {
                    p.x += (p.binX - p.x) * 0.03; 
                    p.y += (p.binY - p.y) * 0.03;
                    
                    if (Math.abs(p.x - p.binX) < 5 && Math.abs(p.y - p.binY) < 5) {
                        // Smooth, slow breathing motion instead of frantic jitter
                        const t = Date.now() * 0.002;
                        p.x += Math.sin(t + p.jitterPhase) * 0.05;
                        p.y += Math.cos(t + p.jitterPhase) * 0.05;
                    }
                });
            }


            // --- Drawing ---
            
            // Axes
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath(); ctx.moveTo(0, floorY); ctx.lineTo(w, floorY); ctx.stroke();
            const centerX = mapX(0);
            ctx.beginPath(); ctx.moveTo(centerX, 0); ctx.lineTo(centerX, h); ctx.stroke();

            // Particles
            particlesRef.current.forEach(p => {
                const isPos = p.val >= threshold;
                // Interpolate color
                // Gray: 107, 114, 128 (#6b7280)
                // Blue: 56, 189, 248 (#38bdf8)
                // Red: 244, 63, 94 (#f43f5e)
                let r = 107, g = 114, b = 128;
                
                let t = p.colorStrength !== undefined ? p.colorStrength : 1;
                if (anim.mode === 'REVEAL') {
                    // Apply delay: effective t = (globalMix - delay) clamped 0-1
                    // Scale factor 2 to make individual transition fast once started
                    const delay = p.colorDelay !== undefined ? p.colorDelay : 0;
                    t = Math.max(0, Math.min(1, (anim.colorMix - delay) * 2));
                }

                if (isPos) {
                    r = 107 + (56 - 107) * t;
                    g = 114 + (189 - 114) * t;
                    b = 128 + (248 - 128) * t;
                } else {
                    r = 107 + (244 - 107) * t;
                    g = 114 + (63 - 114) * t;
                    b = 128 + (94 - 128) * t;
                }
                ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`;
                ctx.beginPath(); 
                ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI*2); 
                ctx.fill();
            });

            // Threshold Line & Info
            if (anim.thresholdOpacity > 0.01 || anim.mode === 'REVEAL') {
                const splitX = mapX(anim.visualThreshold);
                ctx.save();
                ctx.globalAlpha = anim.thresholdOpacity;
                
                // Threshold Line (Grows from bottom)
                const visibleH = h * anim.lineProgress;
                ctx.beginPath(); 
                ctx.moveTo(splitX, h); 
                ctx.lineTo(splitX, h - visibleH);
                
                let lineColor = '#9ca3af';
                if (method === 'adabin') lineColor = '#38bdf8';
                if (method === 'optimized') lineColor = '#4ade80';
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 2; ctx.setLineDash([6,6]); ctx.stroke(); 
                
                // Text Info (Only show when line is mostly visible)
                if (anim.lineProgress > 0.8) {
                    ctx.globalAlpha = (anim.lineProgress - 0.8) * 5; // Fade in text at end of line reveal
                    
                    ctx.textAlign = 'left';
                    
                    // Method Label
                    ctx.font = 'bold 24px Inter';
                    ctx.fillStyle = lineColor;
                    let label = 'Standard';
                    if (method === 'adabin') label = 'Adaptive (Learnable)';
                    if (method === 'optimized') label = 'Optimized (Analytical)';
                    ctx.fillText(label, splitX + 15, 40);
                    
                    // Alpha Value
                    ctx.font = '18px JetBrains Mono';
                    ctx.fillStyle = '#9ca3af';
                    ctx.fillText(`α = ${alpha.toFixed(3)}`, splitX + 15, 70);

                    // Total Error
                    ctx.font = 'bold 18px JetBrains Mono';
                    ctx.fillStyle = 'white';
                    ctx.fillText(`L2 Error: ${totalError.toFixed(2)}`, splitX + 15, 100);
                }

                ctx.restore();
            }

            // --- Display Count Numbers (Only in CLUSTER mode) ---
            if (anim.mode === 'CLUSTER' && anim.thresholdOpacity > 0.8) {
                ctx.save();
                ctx.globalAlpha = anim.thresholdOpacity;
                ctx.font = 'bold 16px JetBrains Mono';
                ctx.textAlign = 'center';
                
                // Draw Neg Count
                const diameter = PARTICLE_RADIUS * 2;
                const negTopY = floorY - (currentNegCount * diameter / STACK_OVERLAP);
                ctx.fillStyle = '#f43f5e'; 
                ctx.fillText(currentNegCount, mapX(barPosNeg), negTopY - 15);

                // Draw Pos Count
                const posTopY = floorY - (currentPosCount * diameter / STACK_OVERLAP);
                ctx.fillStyle = '#38bdf8'; 
                ctx.fillText(currentPosCount, mapX(barPosPos), posTopY - 15);
                
                ctx.restore();
            }

            animId = requestAnimationFrame(render);
        };
        render(); 
        return () => { 
            cancelAnimationFrame(animId); 
            resizeObserver.disconnect();
        };
    }, [method]);

    return (
            <div className="w-full h-full flex flex-col gap-6 items-center justify-center">
                <div className="relative w-full aspect-[16/11] bg-black/40 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-inner flex-none">
                    <canvas ref={canvasRef} className="w-full h-full block" />
                    <div className="absolute top-2 left-2 z-10 flex flex-col bg-black/60 p-2 rounded-[2rem] border-4 border-white/10 backdrop-blur-xl shadow-2xl magnetic-target" data-magnetic-strength="0.05">
                        <div 
                            className={`absolute left-2 right-2 top-2 rounded-[1.5rem] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] border-[3px] ${
                                activeTab === 'standard' ? 'bg-white/10 border-white/40 shadow-[0_0_15px_rgba(255,255,255,0.2)]' :
                                activeTab === 'adabin' ? 'bg-sky-500/20 border-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.3)]' :
                                'bg-green-500/20 border-green-400/50 shadow-[0_0_20px_rgba(74,222,128,0.3)]'
                            }`}
                            style={{
                                height: '64px',
                                transform: `translateY(${activeTab === 'standard' ? '0px' : activeTab === 'adabin' ? '64px' : '128px'})`
                            }}
                        ></div>
                        <button onClick={() => switchMethod('standard')} className={`relative z-10 w-32 h-16 rounded-[1.5rem] text-xl font-black tracking-wide transition-all duration-300 ${activeTab==='standard'?'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]':'text-gray-500 hover:text-gray-300'}`}>Standard</button>
                        <button onClick={() => switchMethod('adabin')} className={`relative z-10 w-32 h-16 rounded-[1.5rem] text-xl font-black tracking-wide transition-all duration-300 ${activeTab==='adabin'?'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]':'text-gray-500 hover:text-sky-400/50'}`}>Adaptive</button>
                        <button onClick={() => switchMethod('optimized')} className={`relative z-10 w-32 h-16 rounded-[1.5rem] text-xl font-black tracking-wide transition-all duration-300 ${activeTab==='optimized'?'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]':'text-gray-500 hover:text-green-400/50'}`}>Optimized</button>
                    </div>
                    <LiquidGlass 
                        as="button"
                        onClick={generateParticles} 
                        className="liquid-glass-btn magnetic-target group absolute bottom-[5.5rem] left-2 rounded-full w-20 h-20"
                    >
                        <Icons.Refresh className="w-8 h-8 text-white group-hover:rotate-180 transition-transform duration-700"/>
                    </LiquidGlass>
                </div>
                <div className="text-[10px] text-gray-500 font-mono">
                    Quantization Error = Σ (Full_Precision - Binary_Reconstruction)²
                </div>
            </div>
    );
};
