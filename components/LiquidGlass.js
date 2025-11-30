const LiquidGlass = ({ 
    children, 
    className = "", 
    filterId, 
    filterConfig = { scale: 70, freq: "0.008 0.008" },
    as: Component = "div",
    overlayStyle,
    distortContent = false,
    contentClassName = "",
    contentStyle = {},
    ...props 
}) => {
    // Generate a unique ID if one isn't provided
    const uniqueId = React.useRef(filterId || `lg-dist-${Math.random().toString(36).substr(2, 9)}`).current;
    
    return (
        <Component className={`liquid-glass ${className}`} {...props}>
            {/* Distortion Layer */}
            <div 
                className="liquid-glass-layer liquid-glass-distortion" 
                style={{ filter: `url(#${uniqueId})` }}
            ></div>
            
            {/* Overlay Layer (Optional tint) */}
            <div className="liquid-glass-layer liquid-glass-overlay" style={overlayStyle}></div>
            
            {/* Specular Highlight Layer */}
            <div className="liquid-glass-layer liquid-glass-specular"></div>
            
            {/* Content */}
            <div 
                className={`liquid-glass-content ${contentClassName}`}
                style={{
                    ...(distortContent ? { filter: `url(#${uniqueId})` } : {}),
                    ...contentStyle
                }}
            >
                {children}
            </div>

            {/* SVG Filter Definition (Only if we generated the ID) */}
            {!filterId && (
                <svg style={{ display: 'none', position: 'absolute', width: 0, height: 0 }}>
                    <filter id={uniqueId} x="-50%" y="-50%" width="200%" height="200%" style={{ colorInterpolationFilters: 'sRGB' }}>
                        <feTurbulence type="fractalNoise" baseFrequency={filterConfig.freq} numOctaves="3" seed="92" result="noise">
                            <animate 
                                attributeName="baseFrequency" 
                                values={`${(filterConfig.freq || "0.008 0.008").split(' ').map(v => parseFloat(v)).join(' ')}; ${(filterConfig.freq || "0.008 0.008").split(' ').map(v => parseFloat(v) * 1.02).join(' ')}; ${(filterConfig.freq || "0.008 0.008").split(' ').map(v => parseFloat(v)).join(' ')}`} 
                                dur="20s" 
                                repeatCount="indefinite" 
                            />
                        </feTurbulence>
                        <feGaussianBlur in="noise" stdDeviation="4" result="blurred" />
                        <feDisplacementMap in="SourceGraphic" in2="blurred" scale={filterConfig.scale} xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </svg>
            )}
        </Component>
    );
};
