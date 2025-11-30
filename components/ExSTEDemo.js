

const ExSTEDemo = () => {
    const [exponent, setExponent] = React.useState(-2);
    const [isHovering, setIsHovering] = React.useState(false);
    const canvasRef = React.useRef(null);
    const [animSpeed, setAnimSpeed] = React.useState(0);
    const direction = React.useRef(1); // 1 = increasing, -1 = decreasing
    const phase = React.useRef(0); // Phase for harmonic motion
    
    const sliderRef = React.useRef(null);
    const speedFactor = React.useRef(1); // 1 = full speed, 0 = stopped
    const isDragging = React.useRef(false);
    const exponentRef = React.useRef(exponent); // Keep track of latest value for loop

    // Update ref on render
    exponentRef.current = exponent;

    // Mouse/Touch Move to calculate proximity speed
    const handleMove = (clientX, clientY) => {
        if (!sliderRef.current) return;
        const rect = sliderRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const dist = Math.sqrt(Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2));
        
        // Distance thresholds
        const maxDist = 300; // Full speed at 300px+
        const minDist = 50;  // Stop at 50px
        
        let factor = (dist - minDist) / (maxDist - minDist);
        factor = Math.max(0, Math.min(1, factor));
        
        speedFactor.current = factor;
    };

    const handleMouseMove = (e) => handleMove(e.clientX, e.clientY);
    
    const handleTouchMove = (e) => {
        if (e.touches && e.touches.length > 0) {
            handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    };

    // Auto-Animation Effect
    React.useEffect(() => {
        let animationFrameId;
        let prevTime = performance.now();

        const animate = (time) => {
            const deltaTime = (time - prevTime) / 1000; // seconds
            prevTime = time;

            if (isDragging.current) {
                // Sync phase to current manual value so we resume smoothly
                // x = -0.5 - 1.5 * cos(phi)
                // cos(phi) = (x + 0.5) / -1.5
                const currentVal = Math.max(-2, Math.min(1, exponentRef.current));
                const cosPhi = (currentVal + 0.5) / -1.5;
                const clampedCos = Math.max(-1, Math.min(1, cosPhi));
                let basePhi = Math.acos(clampedCos);
                
                // We don't know direction during drag, assume increasing (0-PI) or keep previous?
                // Let's just set it to basePhi (increasing part of wave) for simplicity
                phase.current = basePhi;
                
                setAnimSpeed(0);
            } else {
                // Apply speed factor to omega
                // Base Omega = PI / 10
                const currentOmega = (Math.PI / 10) * speedFactor.current;
                
                if (currentOmega > 0.0001) {
                    // Increment phase
                    phase.current += currentOmega * deltaTime;
                    if (phase.current > 2 * Math.PI) phase.current -= 2 * Math.PI;

                    // Calculate new position
                    const next = -0.5 - 1.5 * Math.cos(phase.current);
                    
                    // Calculate instantaneous speed
                    // v = 1.5 * omega * sin(phase)
                    const velocity = 1.5 * currentOmega * Math.sin(phase.current);
                    const currentSpeed = Math.abs(velocity);

                    // Update direction
                    if (phase.current < Math.PI) {
                        direction.current = 1;
                    } else {
                        direction.current = -1;
                    }

                    setExponent(next);
                    setAnimSpeed(currentSpeed);
                } else {
                    setAnimSpeed(0);
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animationFrameId = requestAnimationFrame(animate);
        
        // Global mouse up to stop dragging state
        const handleGlobalMouseUp = () => { isDragging.current = false; };
        window.addEventListener('mouseup', handleGlobalMouseUp);
        window.addEventListener('touchend', handleGlobalMouseUp);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
            window.removeEventListener('touchend', handleGlobalMouseUp);
        };
    }, []);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        
        // Fix: Use clientWidth/Height for logical size
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        
        canvas.width = w * dpr; 
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        ctx.clearRect(0,0,w,h);
        // User requested range 10^[-2, 1]
        const o = Math.pow(10, exponent); 
        const denom = 1 - Math.exp(-o);
        // Dynamic Y-Axis based on Peak Gradient
        // Gradient at x=0 is o / denom (removed 1.5 scaling)
        const peakGradient = o / denom;
        
        const yMin = -2.0;
        const yMax = Math.max(2.5, peakGradient * 1.2); // Ensure fit
        const yRange = yMax - yMin;
        
        const toScreenX = x => (x+2)/4*w; const toScreenY = y => h - ((y - yMin) / yRange) * h;
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]); ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '10px monospace';
        
        // Adaptive Grid
        const gridStep = yRange > 20 ? 5 : (yRange > 10 ? 2 : 1);
        const startGrid = Math.ceil(yMin / gridStep) * gridStep;
        const endGrid = Math.floor(yMax / gridStep) * gridStep;
        
        for(let i = startGrid; i <= endGrid; i += gridStep) {
            const yPos = toScreenY(i); ctx.beginPath(); ctx.moveTo(0, yPos); ctx.lineTo(w, yPos); ctx.stroke(); ctx.fillText(i, w - 5, yPos - 2);
        }
        ctx.setLineDash([]);
        ctx.strokeStyle = '#475569'; ctx.lineWidth=1.5; 
        ctx.beginPath(); ctx.moveTo(0, toScreenY(0)); ctx.lineTo(w, toScreenY(0)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(toScreenX(0), 0); ctx.lineTo(toScreenX(0), h); ctx.stroke();
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth=3; ctx.beginPath();
        // denom is already calculated above
        // Calculate the value at x=1.5 to clamp to
        // Formula: Sign(x) * (1 - exp(-o|x|)) / (1 - exp(-o))
        const y_limit = (1 - Math.exp(-o * 1.5)) / denom;

        for(let px=0; px<=w; px++) {
            const x = (px/w)*4 - 2;
            let y = 0;
            // Removed 1.5 scaling to match the formula image
            if(Math.abs(x)>0.001) y = (x>0?1:-1)*(1-Math.exp(-o*Math.abs(x)))/denom;
            // Clamp to value at 1.5 for |x| > 1.5
            if(Math.abs(x)>1.5) y = x>0 ? y_limit : -y_limit;
            ctx.lineTo(px, toScreenY(y));
        }
        ctx.stroke();
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth=2; ctx.beginPath();
        for(let px=0; px<=w; px++) {
            const x = (px/w)*4 - 2;
            let dy = 0;
            // Gradient should be o at x=0 (removed 1.5 scaling)
            if(Math.abs(x)<=1.5) dy = (o*Math.exp(-o*Math.abs(x)))/denom;
            ctx.lineTo(px, toScreenY(dy));
        }
        ctx.stroke();
    }, [exponent]);

    // Calculate thumb position percentage
    const percent = ((exponent - (-2)) / (1 - (-2))) * 100;

    return (
        <div 
            className="flex flex-col items-center w-full h-full gap-6"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
        >


            <style>{`
                /* Hide Default Range Thumb */
                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    opacity: 0;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                }
                input[type=range]::-moz-range-thumb {
                    opacity: 0;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    border: none;
                }
            `}</style>

            <div className="relative w-full aspect-[16/10] bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-inner flex-none">
                <canvas ref={canvasRef} className="w-full h-full block" />
                <div className="absolute top-4 left-4 text-right space-y-1 bg-black/60 p-2 rounded-lg border border-white/10 backdrop-blur-sm">
                    <div className="text-sky-400 text-xs font-mono font-bold flex items-center gap-2"><div className="w-3 h-1 bg-sky-400 rounded"></div> Forward F(x)</div>
                    <div className="text-amber-400 text-xs font-mono font-bold flex items-center gap-2"><div className="w-3 h-1 bg-amber-400 rounded"></div> Gradient F'(x)</div>
                </div>
            </div>
            <div className="w-full max-w-lg p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-2 relative z-50 pointer-events-auto">
                <div className="flex justify-between text-xs font-mono text-gray-400"><span>Soft (10^-2)</span><span>Hard (10^1)</span></div>
                
                <div className="relative w-full h-6 flex items-center" ref={sliderRef}>
                    {/* The Actual Input (Invisible Thumb) */}
                    <input 
                        type="range" 
                        min="-2" 
                        max="1" 
                        step="0.01" 
                        value={exponent} 
                        onChange={e=>setExponent(parseFloat(e.target.value))} 
                        onMouseDown={() => isDragging.current = true}
                        onTouchStart={() => isDragging.current = true}
                        className="w-full magnetic-target cursor-pointer relative z-20 opacity-0" // Opacity 0 to hide default, but keep events
                        style={{ height: '24px', margin: 0 }}
                    />
                    
                    {/* Track Line (Visual) */}
                    <div className="absolute left-0 right-0 h-1 bg-gray-700 rounded-full z-0 pointer-events-none"></div>
                    <div className="absolute left-0 h-1 bg-sky-500 rounded-full z-0 pointer-events-none" style={{ width: `${percent}%` }}></div>

                    {/* Custom Liquid Thumb */}
                    <LiquidGlass 
                        className="liquid-glass-thumb z-10"
                        style={{ 
                            left: `calc(${percent}% - 12px)`, 
                            transform: !isHovering 
                                ? `scale(${1 + animSpeed * 1.2})` 
                                : `scale(1)` 
                        }}
                        filterConfig={{ scale: 8, freq: "0.05" }}
                    />
                </div>

                <div className="text-center mt-2">
                    <span className="font-mono text-lg text-white font-bold tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                        o = {Math.pow(10, exponent).toFixed(2)}
                    </span>
                </div>
            </div>
        </div>
    );
};
