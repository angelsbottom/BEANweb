

const Latex = ({ children, displayMode = false }) => {
    const [html, setHtml] = React.useState(children);
    React.useEffect(() => {
        if (window.katex) {
            setHtml(window.katex.renderToString(children, { throwOnError: false, displayMode }));
        }
    }, [children, displayMode]);
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

const MOBILE_TARGET_WIDTH = 800;

const pages = [
    {
        id: 'intro',
        title: "Binary Enhanced Adaptive Network (BEANet)",
        subtitle: "Redefining the Efficiency-Accuracy Frontier",
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
        visualComp: IntroChart
    },
    {
        id: 'adabin',
        title: "Evolution of Binarization",
        subtitle: "From Standard to Optimized",
        content: (
            <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                    {/* Standard */}
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">1. Standard (XNOR-Net)</span>
                            <span className="text-xs text-gray-500 font-mono">Fixed Threshold</span>
                        </div>
                        <div className="text-center font-mono text-sm text-gray-300">
                            <Latex>{'x_b = \\alpha \\cdot \\text{Sign}(x)'}</Latex>
                        </div>
                    </div>

                    {/* Adaptive */}
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm group hover:bg-white/10 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sky-400 font-bold text-xs uppercase tracking-wider">2. Adaptive (AdaBin)</span>
                            <span className="text-xs text-gray-500 font-mono">Learnable Shift</span>
                        </div>
                        <div className="text-center font-mono text-sm text-sky-200">
                            <Latex>{'x_b = \\alpha_{learn} \\cdot \\text{Sign}(x - \\beta_{learn})'}</Latex>
                        </div>
                    </div>

                    {/* Optimized */}
                    <div className="p-3 bg-green-900/20 rounded-lg border border-green-500/30 backdrop-blur-sm group hover:bg-green-900/30 transition-colors">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-green-400 font-bold text-xs uppercase tracking-wider">3. Optimized (Ours)</span>
                            <span className="text-xs text-green-500/80 font-mono">Analytical Optimal</span>
                        </div>
                        <div className="text-center font-mono text-sm text-green-300">
                            <Latex>{'\\alpha^* = \\text{Mean}(|x - \\bar{x}|)'}</Latex>
                        </div>
                        <div className="mt-1 text-[10px] text-center text-green-500/60">
                            Minimizes L1 Quantization Error
                        </div>
                    </div>
                </div>
            </div>
        ),
        visualComp: AdaBinSim
    },
    {
        id: 'exste',
        title: "Exponential Straight-Through Estimator (ExSTE)",
        subtitle: "Exponential Soft-Through Estimator",
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
        visualComp: ExSTEDemo
    },
    {
        id: 'arch',
        title: "BEANet Architecture",
        subtitle: "Macro-Micro Hierarchical Design",
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
        visualComp: ArchitectureUltimate
    },
    {
        id: 'results',
        title: "Experiments",
        subtitle: "SOTA Performance Validation",
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
        visualComp: ExperimentsRevamped
    }
];

const useScale = () => {
    const [scale, setScale] = React.useState(1);
    const [visualScale, setVisualScale] = React.useState(1);
    const [textScale, setTextScale] = React.useState(1);
    const [mobileScale, setMobileScale] = React.useState(1);
    const [textWidth, setTextWidth] = React.useState(35);

    React.useEffect(() => {
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
                const padding = 0; // Reduced to 0 to fully fill horizontal edge
                const availableWidth = window.innerWidth - padding;

                if (availableWidth < targetWidth) {
                    setMobileScale((availableWidth / targetWidth) * 0.97);
                } else {
                    setMobileScale(0.97);
                }
            } else {
                setMobileScale(1);
                // Scale based on 1440px width for landscape
                const s = window.innerWidth / 1440;
                setScale(s);

                // Calculate visual scale to fit height (fill vertical space)
                const effectiveH = window.innerHeight / s;
                const targetBaseH = 680; // Base height of visual content
                const baseVisualWidth = 907; // Base width (approx 4/3 of 680)

                // 1. Calculate ideal scale to fill height
                // We subtract a small buffer (e.g. 40px) for margins/padding if needed, 
                // but user said "fill right side", so we aim for full height.
                let idealVScale = effectiveH / targetBaseH;

                // 2. Calculate required width at this scale
                const reqWidth = baseVisualWidth * idealVScale;

                // 3. Calculate remaining width for text
                const availTextWidth = 1440 - reqWidth;
                let textWidthPercent = (availTextWidth / 1440) * 100;

                // 4. Check constraints (Text compressed?)
                const minTextWidthPercent = 30; // Minimum 30% width for text
                
                let finalVScale = idealVScale;
                let finalTextWidth = textWidthPercent;

                if (textWidthPercent < minTextWidthPercent) {
                    // Text is too compressed, clamp it
                    finalTextWidth = minTextWidthPercent;
                    
                    // Recalculate max allowed visual scale
                    const maxAvailVisualWidth = 1440 * (1 - (minTextWidthPercent / 100));
                    // Add a small buffer to prevent exact edge touching/rounding errors
                    const safeAvailWidth = maxAvailVisualWidth - 20; 
                    finalVScale = safeAvailWidth / baseVisualWidth;
                }

                // Apply values
                // Ensure text width isn't too large either (e.g. on very short screens)
                // If screen is very short, idealVScale is small, reqWidth is small, textWidth becomes huge.
                // We might want to cap text width at say 50%?
                if (finalTextWidth > 50) finalTextWidth = 50;

                setTextWidth(finalTextWidth);
                
                // User Request: Reduce overall landscape visual scale by 5%
                const reducedScale = finalVScale * 0.95;
                setVisualScale(reducedScale);

                // Text Scale: Match visual scale but with floor
                setTextScale(Math.max(reducedScale, 0.75));
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return { scale, visualScale, textScale, mobileScale, textWidth };
};

const App = () => {
    const { scale, visualScale, textScale, mobileScale, textWidth } = useScale();
    const [curr, setCurr] = React.useState(0);
    const [anim, setAnim] = React.useState(false);
    // State to track layout mode
    const [isLandscape, setIsLandscape] = React.useState(true);
    const [navHover, setNavHover] = React.useState(null);
    const navRef = React.useRef(null);

    React.useEffect(() => {
        // Determine if we are in landscape mode based on aspect ratio > 1
        const checkLayout = () => {
            setIsLandscape((window.innerWidth / window.innerHeight) > (4 / 3));
        };
        // Initial check
        checkLayout();

        window.addEventListener('resize', checkLayout);
        return () => window.removeEventListener('resize', checkLayout);
    }, []);

    const go = (i) => {
        if (i >= 0 && i < pages.length && !anim) {
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
                    <div className={`flex z-20 shrink-0 transition-all duration-500 ${isLandscape ? 'justify-between items-center px-8 py-2 h-12' : 'flex-col items-center justify-center pt-6 pb-2 gap-4'}`}>
                        <div className="font-black tracking-widest text-sky-500 text-3xl magnetic-target cursor-pointer" onClick={() => go(0)}>BEANet</div>
                        <div
                            className={`flex items-center transition-all duration-300 magnetic-target ${isLandscape ? 'mr-4' : ''}`}
                            data-magnetic-strength="0.1"
                            onMouseLeave={() => setNavHover(null)}
                            style={!isLandscape ? {
                                transform: `scale(${Math.min(1, (window.innerWidth - 32) / 350)})`,
                                transformOrigin: 'center top'
                            } : {}}
                        >
                            {pages.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => go(i)}
                                    onMouseEnter={() => setNavHover(i)}
                                    className="relative py-6 px-4 group focus:outline-none"
                                >
                                    <div
                                        className={`h-1.5 rounded-full transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${(navHover !== null ? navHover === i : curr === i)
                                            ? 'w-24 bg-sky-500 shadow-[0_0_15px_#38bdf8]'
                                            : 'w-8 bg-gray-700 group-hover:bg-gray-500'
                                            }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content - Responsive Layout Switch */}
                    <div className={`flex-1 relative z-10 transition-all duration-500 ${isLandscape ? 'px-8 flex flex-row items-start' : 'px-0 flex flex-col pb-24'}`}>

                        {/* Text Section */}
                        <div
                            className={`transition-all duration-500 ${isLandscape ? 'pr-12 h-full flex flex-col justify-start pt-12 pointer-events-none' : 'w-full mb-8 mt-4 px-8'}`}
                            style={isLandscape ? { width: `${textWidth}%`, transform: `scale(${textScale})`, transformOrigin: 'top left' } : {}}
                        >
                            <div className={`transition-all duration-700 transform ${anim ? 'opacity-0 -translate-y-8' : 'opacity-100 translate-y-0'}`}>
                                <LiquidGlass 
                                    className="liquid-glass-capsule mb-6 !py-0 !px-4" 
                                    overlayStyle={{ background: 'rgba(14, 165, 233, 0.1)' }}
                                >
                                    <div className="flex items-center justify-center gap-3">
                                        <span className="text-sky-300 text-4xl font-light tracking-wide font-tall leading-none pb-1">SECTION 0{curr + 1}</span>
                                    </div>
                                </LiquidGlass>
                                <h1 className={`${isLandscape ? 'text-4xl' : 'text-2xl'} font-black text-white mb-4 leading-tight`}>{pages[curr].title}</h1>
                                <h2 className="text-lg font-light text-gray-400 mb-6 font-mono">{pages[curr].subtitle}</h2>
                                <div className="pointer-events-auto leading-relaxed opacity-90">{pages[curr].content}</div>
                            </div>
                        </div>

                        {/* Visual Section */}
                        <div className={`relative flex transition-all duration-500 ${isLandscape ? 'justify-end items-start flex-1 pl-4 h-full pt-0' : 'justify-center items-center w-full min-h-[50vh]'}`}>
                            <div className={`w-full shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform flex flex-col border border-white/10 flex-shrink-0
                                    rounded-3xl p-1
                                    ${anim ? 'opacity-0 scale-95 translate-x-20' : 'opacity-100 scale-100 translate-x-0'}
                                    ${curr === 0 ? 'aspect-[4/3] min-h-[600px]' : 'min-h-[50vh]'}
                                `}
                                style={{
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)',
                                    backgroundColor: 'rgba(20, 20, 30, 0.4)',
                                    transform: isLandscape ? `scale(${visualScale})` : `scale(${mobileScale})`,
                                    transformOrigin: isLandscape ? 'top right' : 'top center',
                                    width: isLandscape ? '907px' : (mobileScale < 1 ? `${MOBILE_TARGET_WIDTH}px` : '100%')
                                }}
                            >
                                <div className={`w-full flex-1 relative flex flex-col rounded-2xl`}>
                                    <div className="relative w-full flex-1 flex flex-col"> {/* Removed overflow-hidden to allow expansion */}
                                        {Visual && <Visual isActive={!anim} />}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>




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


                <LiquidGlass 
                    as="button"
                    onClick={() => go(curr - 1)} 
                    disabled={curr === 0} 
                    className="liquid-glass-btn w-20 h-20 rounded-full magnetic-target group disabled:opacity-0 disabled:pointer-events-none flex items-center justify-center"
                >
                    <Icons.ArrowLeft className="text-white w-10 h-10 group-hover:-translate-x-1 transition-transform" />
                </LiquidGlass>

                <LiquidGlass 
                    as="button"
                    onClick={() => go(curr + 1)} 
                    disabled={curr === pages.length - 1} 
                    className="liquid-glass-btn w-20 h-20 rounded-full magnetic-target group disabled:opacity-0 disabled:pointer-events-none flex items-center justify-center"
                >
                    <Icons.ArrowRight className="text-white w-10 h-10 group-hover:translate-x-1 transition-transform" />
                </LiquidGlass>
            </div>
        </>
    );
};
