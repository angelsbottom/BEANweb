

const ExperimentsRevamped = () => {
    const [tab, setTab] = React.useState('imagenet');
    const [imgScale, setImgScale] = React.useState('Nano'); // Nano, Tiny, Small, Medium, Large
    const [expandedItem, setExpandedItem] = React.useState(null); // { type, index }
    const [expandedSection, setExpandedSection] = React.useState(null); // 'structural' or 'optimization'

    const tabs = ['imagenet', 'cifar', 'ablation'];
    const containerRef = React.useRef(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [startX, setStartX] = React.useState(0);
    const [dragOffset, setDragOffset] = React.useState(0);

    // Drag handlers
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX('touches' in e ? e.touches[0].clientX : e.clientX);
    };

    React.useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isDragging) return;
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const delta = clientX - startX;
            setDragOffset(delta);
        };

        const handleMouseUp = () => {
            if (!isDragging) return;
            setIsDragging(false);
            
            // Calculate threshold for switching
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth / 3;
                if (Math.abs(dragOffset) > width / 2) {
                    const currentIndex = tabs.indexOf(tab);
                    if (dragOffset > 0 && currentIndex < tabs.length - 1) {
                        setTab(tabs[currentIndex + 1]);
                    } else if (dragOffset < 0 && currentIndex > 0) {
                        setTab(tabs[currentIndex - 1]);
                    }
                }
            }
            setDragOffset(0);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging, startX, dragOffset, tab]);

    // Data extracted from Table II
    const imagenetData = {
        'Nano': [
            { name: 'XNOR-Net', params: 4.2, ops: 1.47, acc: 51.2 },
            { name: 'Bi-Real-18', params: 4.2, ops: 1.65, acc: 56.4 },
            { name: 'RAD-BNN-18', params: 4.3, ops: 1.74, acc: 65.6 },
            { name: 'AdaBin-18', params: 4.35, ops: 1.70, acc: 66.4 },
            { name: 'BEANet-nano', params: 4.09, ops: 0.34, acc: 66.8, highlight: true, badge: 'SOTA' }
        ],
        'Tiny': [
            { name: 'Bi-Real-34', params: 5.1, ops: 1.94, acc: 62.2 },
            { name: 'ReCU-34', params: 5.1, ops: 1.94, acc: 65.1 },
            { name: 'APD-BNN-34', params: 5.4, ops: 1.94, acc: 66.8 },
            { name: 'BNext-18', params: 5.4, ops: 1.64, acc: 68.4 },
            { name: 'BEANet-tiny', params: 5.4, ops: 0.51, acc: 70.5, highlight: true, badge: 'SOTA' }
        ],
        'Small': [
            { name: 'ReActNet-A', params: 7.4, ops: 0.87, acc: 69.4 },
            { name: 'AdaBin-A', params: 7.9, ops: 0.88, acc: 70.4 },
            { name: 'INSTA-BNN+', params: 8.9, ops: 0.96, acc: 72.2 },
            { name: 'BEANet-small', params: 7.53, ops: 0.71, acc: 72.4, highlight: true, badge: 'SOTA' }
        ],
        'Medium': [
            { name: 'BNext-T', params: 13.3, ops: 0.89, acc: 72.4 },
            { name: 'BEANet-medium', params: 10.5, ops: 1.08, acc: 74.6, highlight: true, badge: 'SOTA' }
        ],
        'Large': [
            { name: 'MeliusNet-59', params: 17.4, ops: 5.32, acc: 71.0 },
            { name: 'AdaBin-59', params: 17.4, ops: 5.34, acc: 71.6 },
            { name: 'BNext-S', params: 26.7, ops: 1.90, acc: 76.1 },
            { name: 'BEANet-large', params: 17.0, ops: 1.86, acc: 77.1, highlight: true, badge: 'SOTA' }
        ]
    };

    // Data from Table III & IV
    const cifarData = [
        { 
            title: "ResNet-20 (CIFAR-10)", 
            data: [
                { name: "DSQ", acc: 84.1 },
                { name: "IR-Net", acc: 86.5 },
                { name: "BiPer", acc: 87.5 },
                { name: "AdaBin", acc: 88.2 },
                { name: "BEANet", acc: 88.52, highlight: true }
            ]
        },
        { 
            title: "STE Variants (ResNet-18)", 
            data: [
                { name: "Piecewise", acc: 85.81 },
                { name: "EDE", acc: 89.35 },
                { name: "ReSTE", acc: 89.56 },
                { name: "ExSTE (Ours)", acc: 90.37, highlight: true }
            ]
        }
    ];

    // Data from Table V (Component Impact - Negative Deltas)
    // Baseline: BEANet-nano (Stage 3) = 63.96%
    const componentImpact = [
        { name: "Replace ABConv w/ BConv", delta: -2.23, desc: "Standard Binary Conv" },
        { name: "Replace Float SE w/ Binary SE", delta: -2.18, desc: "Quantized SE" },
        { name: "Remove SE Module", delta: -1.76, desc: "No Channel Attn" },
        { name: "Use SPR instead of SE", delta: -0.87, desc: "Complex Attn Module" },
        { name: "Pre-norm Architecture", delta: -0.64, desc: "BN before Conv" },
        { name: "Pre-Pool Downsampling", delta: -0.57, desc: "Early Pooling" },
        { name: "Replace Hybrid Act w/ PReLU", delta: -0.36, desc: "Less Flexible Act" },
    ];

    // Data from Table VI (Optimization Gains - Positive Deltas)
    const trainingGains = [
        { name: "Baseline (CE Loss)", val: 62.19, delta: 0 },
        { name: "+ Distillation", val: 63.44, delta: 1.25 },
        { name: "+ GT Correction", val: 63.58, delta: 0.14 },
        { name: "+ Cosine Weight", val: 63.96, delta: 0.38 },
        { name: "+ Long Training (512ep)", val: 66.83, delta: 2.87 }
    ];

    return (
        <div className="w-full flex flex-col gap-6 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]">
            <style>{`
                @keyframes slideInUpShort {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-in-up { animation: slideInUpShort 0.5s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
                
                @keyframes shimmer {
                    0% { transform: translateX(-150%) skewX(-20deg); }
                    100% { transform: translateX(250%) skewX(-20deg); }
                }
                .animate-shimmer { animation: shimmer 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }

                @keyframes wiggle {
                    0%, 100% { transform: rotate(0deg); }
                    25% { transform: rotate(0.5deg); }
                    75% { transform: rotate(-0.5deg); }
                }
                .animate-wiggle { animation: wiggle 6s ease-in-out infinite; }
            `}</style>
            <div 
                ref={containerRef}
                className="relative flex p-2 bg-white/5 rounded-full self-center backdrop-blur-sm border border-white/10 w-full max-w-2xl shadow-2xl overflow-hidden"
            >
                {/* Buttons (Layer 0 - Under Glass - Always Visible) */}
                {tabs.map((key, idx) => {
                    // Calculate opacity based on glass distance to prevent ghosting
                    let opacity = 1;
                    if (containerRef.current) {
                        const width = containerRef.current.offsetWidth / 3;
                        const currentIdx = tabs.indexOf(tab);
                        const glassPos = currentIdx * width + dragOffset;
                        const btnPos = idx * width;
                        const dist = Math.abs(glassPos - btnPos);
                        // Hide text when glass is covering it (dist < 40% of width), fade in after
                        opacity = Math.max(0, Math.min(1, (dist - width * 0.4) / (width * 0.2)));
                    } else {
                        // Fallback for initial render
                        opacity = tab === key ? 0 : 1;
                    }

                    return (
                        <button 
                            key={key} 
                            onClick={() => !isDragging && setTab(key)} 
                            className="relative z-0 flex-1 flex items-center justify-center px-6 py-5 rounded-full text-4xl font-tall font-bold tracking-wider uppercase magnetic-target text-gray-500 hover:text-gray-300 antialiased"
                            style={{ 
                                opacity,
                                transition: isDragging ? 'color 300ms ease' : 'opacity 1.5s cubic-bezier(0.23,1,0.32,1), color 300ms ease',
                                backfaceVisibility: 'hidden'
                            }}
                        >
                            {key}
                        </button>
                    );
                })}

                {/* Liquid Glass Background (Layer 10 - Overlay) */}
                <div 
                    className={`absolute top-2 bottom-2 z-10 rounded-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleMouseDown}
                    style={{
                        width: 'calc((100% - 16px) / 3)',
                        left: tab === 'imagenet' ? '8px' : tab === 'cifar' ? 'calc(8px + (100% - 16px) / 3)' : 'calc(8px + 2 * (100% - 16px) / 3)',
                        transform: isDragging ? `translateX(${dragOffset}px)` : 'none',
                        transition: isDragging ? 'none' : 'all 1.5s cubic-bezier(0.23,1,0.32,1)',
                        backfaceVisibility: 'hidden',
                        perspective: '1000px',
                        WebkitFontSmoothing: 'antialiased'
                    }}
                >
                    <LiquidGlass 
                        className={`w-full h-full rounded-full ${!isDragging ? 'animate-wiggle' : ''}`}
                        overlayStyle={{ 
                            background: tab === 'imagenet' ? 'rgba(14, 165, 233, 0.3)' : 
                                       tab === 'cifar' ? 'rgba(168, 85, 247, 0.3)' : 
                                       'rgba(239, 68, 68, 0.3)' 
                        }}
                        filterConfig={{ scale: 40, freq: "0.001 0.001" }}
                        distortContent={true}
                        contentClassName="!p-0 w-full h-full relative"
                    >
                        {/* Stationary Distorted Layer: Moves opposite to the pill to appear fixed */}
                        <div 
                            className="flex h-full items-center absolute top-0"
                            style={{ 
                                width: 'calc(300% + 16px)', 
                                left: tab === 'imagenet' ? '-8px' : tab === 'cifar' ? 'calc(-8px - 100%)' : 'calc(-8px - 200%)',
                                transform: isDragging ? `translateX(${-dragOffset}px)` : 'none',
                                transition: isDragging ? 'none' : 'left 1.5s cubic-bezier(0.23,1,0.32,1), transform 1.5s cubic-bezier(0.23,1,0.32,1)'
                            }}
                        >
                             {tabs.map((key) => (
                                <div key={key} className="flex-1 flex items-center justify-center">
                                    <span className="text-4xl font-tall font-bold tracking-wider uppercase text-white opacity-90 antialiased">
                                        {key}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </LiquidGlass>
                </div>
            </div>
            
            <div key={tab} className="w-full bg-black/20 border border-white/5 rounded-2xl p-6 relative animate-slide-in-up">
                
                {/* IMAGENET TAB */}
                {tab === 'imagenet' && (
                    <div className="animate-fade-in">
                        <div className="flex gap-2 mb-6 border-b border-white/10 pb-2 overflow-x-auto">
                            {Object.keys(imagenetData).map(scaleKey => (
                                <button 
                                    key={scaleKey} 
                                    onClick={()=>setImgScale(scaleKey)}
                                    className={`px-4 py-1 rounded-full text-xs font-mono transition-colors magnetic-target ${imgScale===scaleKey ? 'bg-white text-black font-bold' : 'text-gray-500 hover:text-white'}`}
                                >
                                    {scaleKey}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-12 gap-4 text-[10px] text-gray-500 uppercase font-mono mb-2 px-2">
                            <div className="col-span-3">Model</div>
                            <div className="col-span-2 text-right">Params (MB)</div>
                            <div className="col-span-2 text-right">OPs ($10^8$)</div>
                            <div className="col-span-5 pl-4">Top-1 Accuracy (%)</div>
                        </div>

                        <div key={imgScale} className="flex flex-col gap-3">
                            {imagenetData[imgScale].map((d, i) => (
                                <div key={i} 
                                     className={`grid grid-cols-12 gap-4 items-center p-3 rounded-lg border ${d.highlight ? 'border-sky-500/50 bg-sky-900/10' : 'border-transparent bg-white/5'} hover:bg-white/10 transition-all magnetic-target group animate-slide-in-up`}
                                     style={{animationDelay: `${i * 100}ms`}}
                                >
                                    <div className={`col-span-3 text-xs ${d.highlight ? 'text-sky-400 font-bold' : 'text-gray-300'}`}>
                                        {d.name} {d.badge && <span className="ml-2 px-1.5 py-0.5 bg-red-500 text-white text-[9px] rounded font-bold">{d.badge}</span>}
                                    </div>
                                    <div className="col-span-2 text-right text-xs font-mono text-gray-400">{d.params}</div>
                                    <div className="col-span-2 text-right text-xs font-mono text-gray-400">{d.ops}</div>
                                    <div className="col-span-5 pl-4 relative h-6">
                                            <div className="h-full bg-gray-800 rounded-sm overflow-hidden relative">
                                                <div 
                                                className={`h-full flex items-center justify-end pr-2 transition-all duration-1000 ${d.highlight ? 'bg-sky-500' : 'bg-gray-600 group-hover:bg-gray-500'}`} 
                                                style={{width: `${(d.acc/80)*100}%`}}
                                                >
                                                    <span className="text-[10px] text-white font-bold drop-shadow-md">{d.acc}%</span>
                                                </div>
                                            </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-[10px] text-gray-500 text-center">Data Source: Table II of BEANet Paper. OPs = FLOPs + 1/64 BOPs.</p>
                    </div>
                )}

                {/* CIFAR TAB */}
                {tab === 'cifar' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in h-full content-start">
                        {cifarData.map((section, idx) => (
                            <div key={idx} className="flex flex-col gap-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b border-white/10 pb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                                    {section.title}
                                </h3>
                                <div className="grid gap-3">
                                    {section.data.map((d, i) => (
                                        <div key={i} 
                                             className={`relative p-3 rounded-xl border backdrop-blur-sm transition-all duration-500 magnetic-target group animate-fade-in-up
                                                ${d.highlight ? 'bg-sky-900/20 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.15)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}
                                             `}
                                             style={{animationDelay: `${i * 100}ms`}}
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <span className={`text-xs font-bold ${d.highlight ? 'text-sky-300' : 'text-gray-400'}`}>{d.name}</span>
                                                <span className={`text-xs font-mono ${d.highlight ? 'text-white font-black' : 'text-gray-500'}`}>{d.acc}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-1000 ${d.highlight ? 'bg-gradient-to-r from-sky-500 to-sky-300 shadow-[0_0_10px_#0ea5e9]' : 'bg-gray-600 group-hover:bg-gray-500'}`}
                                                    style={{width: `${(d.acc/92)*100}%`}}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div className="col-span-1 md:col-span-2 mt-4">
                            <div className="p-4 border border-yellow-500/30 bg-yellow-900/10 rounded-xl flex items-start gap-3 animate-fade-in-up" style={{animationDelay: '600ms'}}>
                                <Icons.Zap className="text-yellow-400 shrink-0 mt-0.5" size={16} />
                                <div>
                                    <p className="text-xs text-yellow-200 mb-1 font-bold">Insight: ExSTE Stability</p>
                                    <p className="text-[10px] text-gray-400 leading-relaxed">ExSTE achieves <span className="text-white font-bold">90.37%</span> on ResNet-18, outperforming ReSTE and EDE by providing a smoother gradient transition from Identity to Sign function.</p>
                                </div>
                            </div>
                        </div>
                        </div>
                )}

                {/* ABLATION TAB (VERTICAL LAYOUT) */}
                {tab === 'ablation' && (
                    <div className="w-full h-full flex flex-col gap-4 p-2 overflow-y-auto no-scrollbar animate-fade-in-up">
                        
                        {/* Section 1: Structural Dependencies */}
                        {/* Section 1: Structural Dependencies */}
                        <div className="flex flex-col bg-white/5 rounded-2xl border border-white/5 overflow-hidden shrink-0 animate-fade-in-up transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{animationDelay: '100ms'}}>
                            {/* Section Header */}
                            <button 
                                onClick={() => {
                                    setExpandedSection(expandedSection === 'structural' ? null : 'structural');
                                    setExpandedItem(null); // Reset expanded item when toggling section
                                }}
                                className={`flex items-center justify-between p-4 w-full text-left transition-all duration-500 magnetic-target group
                                    ${expandedSection === 'structural' ? 'bg-white/5' : 'hover:bg-white/5'}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl border transition-all duration-500 ${expandedSection === 'structural' ? 'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                                        <Icons.Layers size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`text-sm font-bold tracking-wider uppercase transition-colors duration-300 ${expandedSection === 'structural' ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>Structural Dependencies</h3>
                                        <p className="text-[10px] text-red-300/70 font-mono mt-0.5">COMPONENT CRITICALITY ANALYSIS</p>
                                    </div>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/10 transition-all duration-500 ${expandedSection === 'structural' ? 'bg-white text-black rotate-180' : 'bg-black/20 text-gray-400'}`}>
                                    <Icons.ChevronDown size={14} />
                                </div>
                            </button>

                            {/* Section Content */}
                            <div className={`transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${expandedSection === 'structural' ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-4 pt-2 space-y-2 border-t border-white/5">
                                    {componentImpact.map((item, idx) => {
                                        const isExpanded = expandedItem?.type === 'structural' && expandedItem?.index === idx;
                                        const isDimmed = expandedItem && !isExpanded;
                                        const intensity = Math.min(Math.abs(item.delta) / 2.5, 1); 

                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => setExpandedItem(isExpanded ? null : {type: 'structural', index: idx})}
                                                className={`relative rounded-xl border transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] cursor-pointer magnetic-target group/item overflow-hidden
                                                    ${isExpanded ? 'h-36 bg-red-950/40 border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.15)] z-10 scale-[1.02] my-3' : 'h-12 bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'}
                                                    ${isDimmed ? 'opacity-40 grayscale scale-[0.98] blur-[0.5px]' : 'opacity-100'}
                                                `}
                                            >
                                                {/* Shimmer Effect */}
                                                {isExpanded && (
                                                    <div className="absolute inset-0 z-0 pointer-events-none">
                                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent animate-shimmer w-[50%] h-full"></div>
                                                    </div>
                                                )}

                                                {/* Background Gradient */}
                                                <div 
                                                    className={`absolute top-0 right-0 bottom-0 bg-gradient-to-l from-red-900/20 to-transparent transition-all duration-1000 ${isExpanded ? 'w-full opacity-20' : 'opacity-100'}`}
                                                    style={{ width: isExpanded ? '100%' : `${intensity * 100}%` }}
                                                ></div>

                                                <div className="relative z-10 px-4 py-3 h-full flex flex-col justify-between">
                                                    <div className="flex justify-between items-center w-full">
                                                        <div className="flex flex-col justify-center h-6">
                                                            <span className={`font-bold transition-all duration-500 ${isExpanded ? 'text-base text-white translate-y-0' : 'text-xs text-gray-300 group-hover/item:text-white'}`}>
                                                                {item.name}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            {!isExpanded && (
                                                                <span className="text-[9px] text-gray-500 font-mono opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                                                                    {item.desc}
                                                                </span>
                                                            )}
                                                            <span className={`font-mono font-black text-red-400 transition-all duration-500 ${isExpanded ? 'text-2xl drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]' : 'text-xs'}`}>
                                                                {item.delta}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Expanded Content */}
                                                    <div className={`transition-all duration-500 delay-75 flex flex-col gap-3 ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute bottom-0'}`}>
                                                        <div className="w-full h-px bg-gradient-to-r from-red-500/50 to-transparent"></div>
                                                        <div className="text-xs text-gray-300 leading-relaxed">
                                                            <span className="text-red-400 font-bold mr-1">Analysis:</span>
                                                            {item.desc}. Removing or altering this component results in a significant performance drop, highlighting its critical role in the BEANet architecture.
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Optimization Trajectory */}
                        <div className="flex flex-col bg-white/5 rounded-2xl border border-white/5 overflow-hidden shrink-0 animate-fade-in-up transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" style={{animationDelay: '200ms'}}>
                            {/* Section Header */}
                            <button 
                                onClick={() => {
                                    setExpandedSection(expandedSection === 'optimization' ? null : 'optimization');
                                    setExpandedItem(null); // Reset expanded item when toggling section
                                }}
                                className={`flex items-center justify-between p-4 w-full text-left transition-all duration-500 magnetic-target group
                                    ${expandedSection === 'optimization' ? 'bg-white/5' : 'hover:bg-white/5'}
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-xl border transition-all duration-500 ${expandedSection === 'optimization' ? 'bg-green-500 text-white border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-green-500/10 border-green-500/30 text-green-400'}`}>
                                        <Icons.TrendingUp size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`text-sm font-bold tracking-wider uppercase transition-colors duration-300 ${expandedSection === 'optimization' ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>Optimization Trajectory</h3>
                                        <p className="text-[10px] text-green-300/70 font-mono mt-0.5">ACCURACY EVOLUTION LOG</p>
                                    </div>
                                </div>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-white/10 transition-all duration-500 ${expandedSection === 'optimization' ? 'bg-white text-black rotate-180' : 'bg-black/20 text-gray-400'}`}>
                                    <Icons.ChevronDown size={14} />
                                </div>
                            </button>

                            {/* Section Content */}
                            <div className={`transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden ${expandedSection === 'optimization' ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="p-4 pt-2 pl-8 relative space-y-3 border-t border-white/5">
                                    {/* Continuous Line */}
                                    <div className="absolute left-[43px] top-4 bottom-8 w-0.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full bg-gradient-to-b from-green-500/20 via-green-400 to-green-500 animate-[flow-dash_3s_linear_infinite] h-[200%]"></div>
                                    </div>

                                    {trainingGains.map((step, idx) => {
                                        const isLast = idx === trainingGains.length - 1;
                                        const isExpanded = expandedItem?.type === 'optimization' && expandedItem?.index === idx;
                                        const isDimmed = expandedItem && !isExpanded;

                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => setExpandedItem(isExpanded ? null : {type: 'optimization', index: idx})}
                                                className={`relative flex items-start gap-4 group cursor-pointer magnetic-target transition-all duration-500
                                                    ${isDimmed ? 'opacity-40 grayscale blur-[0.5px]' : 'opacity-100'}
                                                `}
                                            >
                                                {/* Node */}
                                                <div className={`relative z-10 w-6 h-6 shrink-0 rounded-full flex items-center justify-center border-2 transition-all duration-500 mt-3
                                                    ${isLast ? 'bg-green-500 border-white shadow-[0_0_15px_#22c55e]' : 'bg-gray-900 border-green-500/30 group-hover:border-green-400'}
                                                    ${isExpanded ? 'scale-125 border-white shadow-[0_0_20px_rgba(34,197,94,0.6)]' : ''}
                                                `}>
                                                    <div className={`w-2 h-2 rounded-full ${isLast ? 'bg-white animate-pulse' : 'bg-green-500'}`}></div>
                                                </div>

                                                {/* Card */}
                                                <div className={`flex-1 rounded-xl border backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden
                                                    ${isExpanded ? 'h-28 bg-green-900/30 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]' : 'h-12 bg-black/20 border-white/5 hover:bg-white/5 hover:border-white/10'}
                                                    ${isLast && !isExpanded ? 'bg-green-500/5 border-green-500/20' : ''}
                                                `}>
                                                    <div className="px-4 py-3 h-full flex flex-col justify-between">
                                                        <div className="flex justify-between items-center">
                                                            <div className={`font-bold transition-all duration-500 ${isExpanded ? 'text-base text-white' : 'text-xs text-gray-300'}`}>
                                                                {step.name}
                                                            </div>
                                                            <div className={`font-mono font-black transition-all duration-500 ${isExpanded ? 'text-xl text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-sm text-gray-400'}`}>
                                                                {step.val}%
                                                            </div>
                                                        </div>

                                                        {/* Expanded Content */}
                                                        <div className={`transition-all duration-500 delay-75 flex flex-col gap-2 ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute bottom-0'}`}>
                                                            <div className="w-full h-px bg-gradient-to-r from-green-500/50 to-transparent"></div>
                                                            <div className="flex justify-between items-center text-xs">
                                                                <span className="text-gray-400">Contribution:</span>
                                                                <span className="text-green-400 font-bold">+{step.delta}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-gradient-to-r from-green-600 to-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                                                                    style={{ width: `${((step.val - 60) / 20) * 100}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
