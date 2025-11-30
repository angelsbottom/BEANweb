const NeuralBackground = () => {
    const canvasRef = React.useRef(null);
    const mouseRef = React.useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width, height;
        let blobs = []; // Declare blobs here
        let dustParticles = []; // Declare dustParticles here

        // --- Configuration ---
        // 1. Blob Colors (Dark Red/Purple/Navy)
        const BLOB_COLORS = [
            { r: 76, g: 29, b: 149 },   // Deep Purple
            { r: 131, g: 24, b: 67 },   // Dark Pink/Red
            { r: 30, g: 27, b: 75 },    // Dark Navy
            { r: 88, g: 28, b: 135 },   // Purple
            { r: 127, g: 29, b: 29 },   // Dark Red
            { r: 15, g: 23, b: 42 }     // Slate 900 (Dark Blue-Grey)
        ];
        const DUST_COLORS = [
            'rgba(255, 255, 255, 0.8)', // White
            'rgba(200, 200, 255, 0.8)', // Light Blue
            'rgba(255, 200, 200, 0.8)'  // Light Pink
        ];
        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            if (blobs.length === 0) initElements();
        };

        // --- Classes ---

        class Blob {
            constructor() {
                this.init();
            }

            init() {
                this.radius = Math.random() * 300 + 250; // Larger blobs
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.color = BLOB_COLORS[Math.floor(Math.random() * BLOB_COLORS.length)];
                this.alpha = Math.random() * 0.2 + 0.15; // Slightly more opaque

                this.baseX = this.x;
                this.baseY = this.y;
                this.wanderRadius = 200;
                this.wanderTheta = Math.random() * Math.PI * 2;
                this.wanderSpeed = Math.random() * 0.001 + 0.0005;
            }

            update(mouse) {
                // Slow, heavy wandering
                this.wanderTheta += this.wanderSpeed;
                const wanderX = this.baseX + Math.cos(this.wanderTheta) * this.wanderRadius;
                const wanderY = this.baseY + Math.sin(this.wanderTheta * 1.3) * this.wanderRadius;

                // Very subtle mouse repulsion for background blobs
                let dx = mouse.x - this.x;
                let dy = mouse.y - this.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                const interactDist = 800;

                let interactX = 0;
                let interactY = 0;

                if (dist < interactDist) {
                    const force = (interactDist - dist) / interactDist;
                    interactX = -dx * force * 0.2;
                    interactY = -dy * force * 0.2;
                }

                const targetX = wanderX + interactX;
                const targetY = wanderY + interactY;

                this.x += (targetX - this.x) * 0.01;
                this.y += (targetY - this.y) * 0.01;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
                const { r, g: gr, b } = this.color;
                g.addColorStop(0, `rgba(${r}, ${gr}, ${b}, ${this.alpha})`);
                g.addColorStop(0.6, `rgba(${r}, ${gr}, ${b}, ${this.alpha * 0.4})`);
                g.addColorStop(1, `rgba(${r}, ${gr}, ${b}, 0)`);
                ctx.fillStyle = g;
                ctx.fill();
            }
        }

        class Dust {
            constructor() {
                this.init();
            }

            init() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.05; // Much slower initial
                this.vy = (Math.random() - 0.5) * 0.05;
                this.size = Math.random() * 4.0 + 0.5; // Random size 0.5 - 4.5 (Increased range)
                this.color = DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)];
                this.baseAlpha = Math.random() * 0.4 + 0.2;
                this.alpha = this.baseAlpha;
                this.pulseSpeed = Math.random() * 0.03 + 0.02; // Faster pulse for twinkle
                this.pulseTheta = Math.random() * Math.PI * 2;
                this.attractTimer = 0; // Track attraction duration
            }

            update(mouse) {
                // 1. Float
                this.x += this.vx;
                this.y += this.vy;

                // Wrap around screen
                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;

                // 2. Pulse Glow (Twinkle)
                this.pulseTheta += this.pulseSpeed;
                this.alpha = this.baseAlpha + Math.sin(this.pulseTheta) * 0.15;

                // 3. Section Attraction (Border + Timeout)
                const capsule = document.querySelector('.liquid-glass-capsule');
                if (capsule) {
                    const rect = capsule.getBoundingClientRect();
                    
                    // Find nearest point on the rectangle (border/surface)
                    const nearestX = Math.max(rect.left, Math.min(this.x, rect.right));
                    const nearestY = Math.max(rect.top, Math.min(this.y, rect.bottom));
                    
                    let dx = nearestX - this.x;
                    let dy = nearestY - this.y;
                    let dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // Attraction range
                    const attractRange = 120; // Reduced from 200
                    
                    if (dist < attractRange) {
                        // Increment timer (assuming ~60fps, 1/60 per frame)
                        this.attractTimer += 0.016;

                        // Only attract if under 5 seconds limit
                        if (this.attractTimer < 5.0) {
                            // Don't trap completely: if very close (inside or touching), stop pulling
                            if (dist > 5) { 
                                const force = (attractRange - dist) / attractRange;
                                // Gentle pull towards nearest border point
                                this.vx += (dx / dist) * force * 0.01; // Reduced from 0.03
                                this.vy += (dy / dist) * force * 0.01;
                            }
                        }
                    } else {
                        // Reset timer if particle leaves the area
                        this.attractTimer = 0;
                    }
                }

                // 4. Random Wandering (Brownian-like)
                this.vx += (Math.random() - 0.5) * 0.01;
                this.vy += (Math.random() - 0.5) * 0.01;

                // Dampen speed
                const maxSpeed = 0.8; 
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > maxSpeed) {
                    this.vx = (this.vx / speed) * maxSpeed;
                    this.vy = (this.vy / speed) * maxSpeed;
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = this.color;

                const currentAlpha = Math.max(0, Math.min(1, this.alpha));
                ctx.globalAlpha = currentAlpha;

                // Dynamic Glow effect based on alpha (Twinkle)
                ctx.shadowBlur = 8 + (currentAlpha * 10);
                ctx.shadowColor = this.color;

                ctx.fill();
                ctx.shadowBlur = 0;
                ctx.globalAlpha = 1;
            }
        }

        const initElements = () => {
            blobs = [];
            dustParticles = [];

            // 8 Large Background Blobs
            for (let i = 0; i < 8; i++) {
                blobs.push(new Blob());
            }

            // Increased Dust Particles
            const dustCount = Math.floor((width * height) / 4000); // Higher density (was 6000)
            for (let i = 0; i < dustCount; i++) {
                dustParticles.push(new Dust());
            }
        };

        const handleMouseMove = (e) => {
            mouseRef.current.x = e.clientX;
            mouseRef.current.y = e.clientY;
        };

        const animate = () => {
            // Dark Background
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#020205'; // Almost black
            ctx.fillRect(0, 0, width, height);

            // Draw Blobs (Soft, blended)
            ctx.globalCompositeOperation = 'screen';
            blobs.forEach(blob => {
                blob.update(mouseRef.current);
                blob.draw();
            });

            // Draw Dust (Sharp, glowing, on top)
            ctx.globalCompositeOperation = 'source-over'; // Or 'lighter' for more intense glow
            dustParticles.forEach(p => {
                p.update(mouseRef.current);
                p.draw();
            });

            requestAnimationFrame(animate);
        };

        resize();
        animate();

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ opacity: 1 }}
        />
    );
};
