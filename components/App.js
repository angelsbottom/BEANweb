const { useState, useEffect, useRef, useMemo } = React;

const Latex = ({ children, displayMode = false }) => {
    const [html, setHtml] = useState(children);
    useEffect(() => {
        if (window.katex) {
            setHtml(window.katex.renderToString(children, { throwOnError: false, displayMode }));
        }
    }, [children, displayMode]);
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

const MOBILE_TARGET_WIDTH = 800;

const pages = [
    { 
        id:'intro', 
        title:"BEANet", 
        subtitle:"Redefining the Efficiency-Accuracy Frontier", 
        content: (
            <div className="space-y-6">
                <div className="text-lg text-gray-300 border-l-4 border-red-500 pl-6 leading-relaxed">
                    Bridging the gap between binary efficiency and full-precision accuracy. BEANet achieves <span className="text-red-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.8)] font-bold text-xl">77.1%</span> ImageNet Top-1 Accuracy, challenging the dominance of ResNet-50.
                </div>
                <div className="text-sm text-gray-400 font-light">
                    By addressing the <span className="text-white font-medium">Information Bottleneck</span> in traditional BNNs, we introduce a novel hierarchical architecture that preserves feature richness while maximizing hardware efficiency.
                </div>
            </div>
        ), 
        visualComp:IntroChart 
    },
    { 
        id:'adabin', 
        title:"Adaptive Binarization", 
        subtitle:"Minimizing Quantization Error", 
        content: (
            <div className="space-y-6">
                <div className="text-gray-300 leading-relaxed">
                    Standard <code className="text-sky-400 font-mono">Sign(x)</code> binarization is rigid. We introduce <span className="text-sky-300 font-bold drop-shadow-[0_0_5px_rgba(14,165,233,0.5)]">AdaBin</span>, a learnable activation function that adapts to distribution shifts:
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="text-center font-mono text-lg text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        <Latex displayMode={true}>{'x_b = \\alpha \\cdot \\text{Sign}(x - \\beta)'}</Latex>
                    </div>
                    <div className="mt-2 text-[10px] text-center text-gray-500 uppercase tracking-widest">
                        α: Scaling Factor &nbsp;|&nbsp; β: Shift Parameter
                    </div>
                </div>
                <div className="text-xs text-gray-400 italic">
                    Implemented via highly efficient <span className="text-white">XNOR + Bitcount</span> operations on hardware.
                </div>
            </div>
        ), 
        visualComp:AdaBinSim 
    },
    { 
        id:'exste', 
        title:"ExSTE", 
        subtitle:"Exponential Soft-Through Estimator", 
        content: (
            <div className="space-y-6">
                <div className="text-gray-300">
                    Overcoming the <span className="text-red-400">gradient mismatch</span> problem. ExSTE dynamically evolves the gradient approximation during training, transitioning from Identity to Sign:
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="text-center font-mono text-sm text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]">
                        <Latex displayMode={true}>{'\\frac{\\partial y}{\\partial x} = \\frac{o \\cdot e^{-o|x|}}{1 - e^{-o}}'}</Latex>
                    </div>
                    <div className="text-center text-[10px] text-gray-500 font-mono mt-2 tracking-widest">
                        <Latex>{'\\text{Condition: } |x| \\le 1.5'}</Latex>
                    </div>
                </div>
                <div className="text-sm text-gray-400">
                    This ensures <span className="text-white font-bold">stable convergence</span> and accurate weight updates, unlocking the full potential of binary networks.
                </div>
            </div>
        ), 
        visualComp:ExSTEDemo 
    },
    { 
        id:'arch', 
        title:"BEANet Architecture", 
        subtitle:"Macro-Micro Hierarchical Design", 
        content: (
            <div className="space-y-6">
                <div className="text-gray-300">
                    A dual-path topology balancing receptive field and feature density.
                </div>
                <ul className="space-y-3 text-sm text-gray-400">
                    <li className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9]"></span>
                        <span><strong className="text-white">Efficient Processor:</strong> Depthwise operations for spatial aggregation.</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></span>
                        <span><strong className="text-white">Performance Processor:</strong> Dense operations for channel mixing.</span>
                    </li>
                </ul>
                <div className="text-xs text-gray-500 border-t border-white/10 pt-4 mt-2">
                    Click the interactive diagram to explore the <span className="text-white">Stem, Stages, and Processors</span> in detail.
                </div>
            </div>
        ), 
        visualComp:ArchitectureUltimate 
    },
    { 
        id:'results', 
        title:"Experiments", 
        subtitle:"SOTA Performance Validation", 
        content: (
            <div className="space-y-6">
                <div className="text-gray-300">
                    Extensive benchmarking on <span className="text-white font-bold">ImageNet-1K</span> and <span className="text-white font-bold">CIFAR-10</span> confirms BEANet's superiority.
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-red-900/10 border border-red-500/30 rounded-lg text-center">
                        <div className="text-xs text-red-300 uppercase tracking-wider">vs ReActNet</div>
                        <div className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">+2.3%</div>
                    </div>
                    <div className="p-3 bg-sky-900/10 border border-sky-500/30 rounded-lg text-center">
                        <div className="text-xs text-sky-300 uppercase tracking-wider">vs AdaBin</div>
                        <div className="text-xl font-black text-white drop-shadow-[0_0_10px_rgba(14,165,233,0.5)]">+1.5%</div>
                    </div>
                </div>
                <div className="text-sm text-gray-400">
                    Achieving state-of-the-art accuracy with comparable FLOPs, proving that <span className="text-white italic">binary need not mean compromised</span>.
                </div>
            </div>
        ), 
        visualComp:ExperimentsRevamped 
    }
];

const useScale = () => {
    const [scale, setScale] = useState(1);
    const [visualScale, setVisualScale] = useState(1);
    const [textScale, setTextScale] = useState(1);
    const [mobileScale, setMobileScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            // Check for portrait mode (mobile/tablet vertical)
            const isPortrait = window.innerHeight / window.innerWidth > 0.75;
            
            if (isPortrait) {
                setScale(1);
                setVisualScale(1);
                setTextScale(1);

                // Mobile Scaling: Ensure content fits in narrow screens
                // Use a larger virtual width to maintain the spacious desktop layout,
                // then scale the entire container down to fit the mobile screen.
                const targetWidth = MOBILE_TARGET_WIDTH; 
                const padding = 80; 
                const availableWidth = window.innerWidth - padding;
                
                if (availableWidth < targetWidth) {
                    setMobileScale(availableWidth / targetWidth);
                } else {
                    setMobileScale(1);
                }
            } else {
                setMobileScale(1);
                // Scale based on 1440px width for landscape
                const s = window.innerWidth / 1440;
                setScale(s);

                // Calculate visual scale to fit height
                const effectiveH = window.innerHeight / s;
                const reservedSpace = 180; // Header + margins
                const availableH = effectiveH - reservedSpace;
                const targetBaseH = 600; // Reduced to 640 to be less aggressive

                let vScale = 1;
                if (availableH < targetBaseH) {
                    vScale = availableH / targetBaseH;
                }
                setVisualScale(vScale);

                // Increase text size if visual is shrinking, to balance the layout
                // Cap the boost to avoid excessive sizing
                if (vScale < 1) {
                    setTextScale(1 + Math.min((1 - vScale) * 0.6, 0.25));
                } else {
                    setTextScale(1);
                }
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return { scale, visualScale, textScale, mobileScale };
};

const App = () => {
    const { scale, visualScale, textScale, mobileScale } = useScale();
    const [curr, setCurr] = useState(0);
    const [anim, setAnim] = useState(false);
    // State to track layout mode
    const [isLandscape, setIsLandscape] = useState(true);
    const [navHover, setNavHover] = useState(null);
    const navRef = useRef(null);

    useEffect(() => {
        // Determine if we are in landscape mode based on aspect ratio > 1
        const checkLayout = () => {
            setIsLandscape((window.innerWidth / window.innerHeight) > (4/3));
        };
        // Initial check
        checkLayout();
        
        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, []);
    
    const go = (i) => { 
        if(i>=0 && i<pages.length && !anim) { 
            setAnim(true); setTimeout(() => { setCurr(i); setAnim(false); }, 500); 
        }
    };
    
    const Visual = pages[curr].visualComp;

    // Conditional Style for Global Scaling
    const containerStyle = scale === 1 ? {
        width: '100%',
        minHeight: '100vh'
    } : {
        width: '1440px',
        minHeight: `${window.innerHeight / scale}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
    };

    return (
        <>
            <MagneticOrb /> 
            <NeuralBackground />
            <div style={containerStyle}>
                <div className={`w-full relative select-none text-[#e0e0e0] font-['Inter'] transition-all duration-500 ${isLandscape ? 'min-h-full flex flex-col' : 'min-h-full flex flex-col'}`}>
                    
                    {/* Header */}
                    <div className="flex justify-between items-center px-8 py-2 z-20 h-12 shrink-0">
                        <div className="font-black tracking-widest text-sky-500 text-lg magnetic-target cursor-pointer" onClick={()=>go(0)}>BEANET_ULTIMATE</div>
                        <div 
                            ref={navRef}
                            className="flex gap-6 py-4 px-9 magnetic-target cursor-pointer" // Increased gap and padding
                            data-magnetic-strength="0.4"
                            onMouseMove={(e) => {
                                if (!navRef.current) return;
                                const rect = navRef.current.getBoundingClientRect();
                                const rectWidth = rect.width / scale;
                                const rectLeft = rect.left / scale;
                                const mouseX = e.clientX / scale;
                                const x = mouseX - rectLeft;
                                const idx = Math.min(Math.max(Math.floor((x / rectWidth) * pages.length), 0), pages.length - 1);
                                setNavHover(idx);
                            }}
                            onTouchMove={(e) => {
                                if (!navRef.current || !e.touches[0]) return;
                                const rect = navRef.current.getBoundingClientRect();
                                const rectWidth = rect.width / scale;
                                const rectLeft = rect.left / scale;
                                const mouseX = e.touches[0].clientX / scale;
                                const x = mouseX - rectLeft;
                                const idx = Math.min(Math.max(Math.floor((x / rectWidth) * pages.length), 0), pages.length - 1);
                                setNavHover(idx);
                            }}
                            onMouseLeave={() => setNavHover(null)}
                            onTouchEnd={() => {
                                // Optional: trigger navigation on touch end if we want drag-to-select
                                if (navHover !== null && navHover !== curr) go(navHover);
                                setNavHover(null);
                            }}
                            onClick={(e) => {
                                // Robust click handling for both mouse and touch (if touch didn't trigger move)
                                if (!navRef.current) return;
                                const rect = navRef.current.getBoundingClientRect();
                                const rectWidth = rect.width / scale;
                                const rectLeft = rect.left / scale;
                                const mouseX = e.clientX / scale;
                                const x = mouseX - rectLeft;
                                const idx = Math.min(Math.max(Math.floor((x / rectWidth) * pages.length), 0), pages.length - 1);
                                if (idx !== curr) go(idx);
                            }}
                        >
                            {pages.map((_,i)=>(
                                <div key={i} 
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        (navHover !== null ? navHover === i : curr === i) 
                                        ? 'w-28 bg-sky-500 shadow-[0_0_10px_#38bdf8]' 
                                        : 'w-7 bg-gray-700'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Main Content - Responsive Layout Switch */}
                    <div className={`flex-1 relative z-10 px-8 transition-all duration-500 ${isLandscape ? 'flex flex-row items-start' : 'flex flex-col pb-24'}`}>
                        
                        {/* Text Section */}
                        <div 
                            className={`transition-all duration-500 ${isLandscape ? 'w-[35%] pr-12 h-full flex flex-col justify-start pt-12 pointer-events-none' : 'w-full mb-8 mt-4'}`}
                            style={isLandscape ? { transform: `scale(${textScale})`, transformOrigin: 'top left' } : {}}
                        >
                            <div className={`transition-all duration-700 transform ${anim?'opacity-0 -translate-y-8':'opacity-100 translate-y-0'}`}>
                                <div className="glass-capsule mb-6">
                                    <div className="glass-filter"></div>
                                    <div className="glass-overlay" style={{ background: 'rgba(14, 165, 233, 0.1)' }}></div>
                                    <div className="glass-specular"></div>
                                    <div className="glass-content gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
                                        <span className="text-sky-300 text-xs font-bold tracking-widest">SECTION 0{curr+1}</span>
                                    </div>
                                </div>
                                <h1 className={`${isLandscape ? 'text-5xl' : 'text-3xl'} font-black text-white mb-4 leading-tight`}>{pages[curr].title}</h1>
                                <h2 className="text-lg font-light text-gray-400 mb-6 font-mono">{pages[curr].subtitle}</h2>
                                <div className="pointer-events-auto leading-relaxed opacity-90">{pages[curr].content}</div>
                            </div>
                        </div>

                    {/* Visual Section */}
                        <div className={`relative flex transition-all duration-500 ${isLandscape ? 'justify-end items-start flex-1 pl-4 h-full pt-4' : 'justify-center items-center w-full min-h-[50vh] overflow-hidden'}`}>
                                <div className={`w-full rounded-3xl p-1 shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform flex flex-col border border-white/10 flex-shrink-0
                                    ${anim?'opacity-0 scale-95 translate-x-20':'opacity-100 scale-100 translate-x-0'}
                                    ${curr === 0 ? 'aspect-[4/3] min-h-[600px]' : 'min-h-[50vh]'}
                                `}
                                style={{
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    backgroundColor: 'rgba(20, 20, 30, 0.4)',
                                    transform: isLandscape ? `scale(${visualScale})` : `scale(${mobileScale})`,
                                    transformOrigin: isLandscape ? 'top right' : 'top center',
                                    width: (!isLandscape && mobileScale < 1) ? `${MOBILE_TARGET_WIDTH}px` : '100%'
                                }}
                                >
                                    <div className="w-full flex-1 rounded-2xl overflow-hidden relative flex flex-col">
                                        <div className="relative w-full flex-1 flex flex-col"> {/* Removed overflow-hidden to allow expansion */}
                                            {Visual && <Visual isActive={!anim} />}
                                        </div>
                                    </div>
                                    
                                </div>
                        </div>
                    </div>

                    {/* SVG Filter for Liquid Glass */}
                    <svg style={{ display: 'none' }}>
                        <filter id="lg-dist" x="0%" y="0%" width="100%" height="100%">
                            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
                            <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
                            <feDisplacementMap in="SourceGraphic" in2="blurred" scale="70" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                    </svg>


                </div>
            </div>

            {/* Navigation Buttons - Fixed to Viewport Bottom Right */}
            <div 
                className="fixed bottom-8 right-8 flex gap-4 z-50"
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'bottom right'
                }}
            >
                <style>{`
                    .glass-btn {
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 5rem;
                        height: 5rem;
                        border-radius: 9999px;
                        overflow: hidden;
                        cursor: pointer;
                        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 2.2);
                        box-shadow: 0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1);
                    }
                    .glass-capsule {
                        position: relative;
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        padding: 0.5rem 1.5rem;
                        border-radius: 9999px;
                        overflow: hidden;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
                    }
                    .glass-btn:hover {
                        transform: scale(1.1);
                    }
                    .glass-btn:disabled {
                        opacity: 0;
                        pointer-events: none;
                    }
                    .glass-filter {
                        position: absolute;
                        inset: 0;
                        z-index: 0;
                        backdrop-filter: blur(0px);
                        filter: url(#lg-dist);
                        isolation: isolate;
                    }
                    .glass-overlay {
                        position: absolute;
                        inset: 0;
                        z-index: 1;
                        background: rgba(255, 255, 255, 0.1);
                    }
                    .glass-specular {
                        position: absolute;
                        inset: 0;
                        z-index: 2;
                        border-radius: inherit;
                        overflow: hidden;
                        box-shadow: inset 1px 1px 0 rgba(255, 255, 255, 0.4), inset 0 0 5px rgba(255, 255, 255, 0.4);
                    }
                    .glass-content {
                        position: relative;
                        z-index: 3;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                `}</style>
                
                <button onClick={()=>go(curr-1)} disabled={curr===0} className="glass-btn magnetic-target group">
                    <div className="glass-filter"></div>
                    <div className="glass-overlay"></div>
                    <div className="glass-specular"></div>
                    <div className="glass-content">
                        <Icons.ArrowLeft className="text-white group-hover:-translate-x-1 transition-transform"/>
                    </div>
                </button>
                
                <button onClick={()=>go(curr+1)} disabled={curr===pages.length-1} className="glass-btn magnetic-target group">
                    <div className="glass-filter"></div>
                    <div className="glass-overlay"></div>
                    <div className="glass-specular"></div>
                    <div className="glass-content">
                        <Icons.ArrowRight className="text-white group-hover:translate-x-1 transition-transform"/>
                    </div>
                </button>
            </div>
        </>
    );
};
