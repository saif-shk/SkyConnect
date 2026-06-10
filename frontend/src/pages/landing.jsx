import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Video, Monitor, Shield, Zap, Sparkles, Mic } from 'lucide-react';
import { toast } from 'sonner';

const styles = {
  fontSans: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  fontSerif: {
    fontFamily: "'Playfair Display', serif",
  }
};

const Landing = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showJoinDrawer, setShowJoinDrawer] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  useEffect(() => {
    // Dynamic Google Font Injection
    const link1 = document.createElement('link');
    link1.rel = 'preconnect';
    link1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(link1);

    const link2 = document.createElement('link');
    link2.rel = 'preconnect';
    link2.href = 'https://fonts.gstatic.com';
    link2.crossOrigin = 'anonymous';
    document.head.appendChild(link2);

    const link3 = document.createElement('link');
    link3.rel = 'stylesheet';
    link3.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link3);

    // Canvas 3D Fibonacci Sphere Animation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // Generate 150 points evenly distributed on a unit sphere using the Fibonacci sphere algorithm
    const count = 150;
    const points = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Golden angle

    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      points.push({ x, y, z });
    }

    // Pre-calculate line connections between particles that are close on the unit sphere
    const lines = [];
    const maxUnitDistance = 0.28;
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dz = points[i].z - points[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < maxUnitDistance) {
          lines.push({ p1: i, p2: j });
        }
      }
    }

    let rotX = 0;
    let rotY = 0;
    let speedX = 0.0015;
    let speedY = 0.0015;
    let targetSpeedX = 0.0015;
    let targetSpeedY = 0.0015;

    const handleMouseMove = (e) => {
      const x = e.clientX - width / 2;
      const y = e.clientY - height / 2;
      // Map mouse offset to target speeds (subtle interactive rotation speed)
      targetSpeedY = (x / width) * 0.015;
      targetSpeedX = -(y / height) * 0.015;
    };

    const handleMouseLeave = () => {
      targetSpeedX = 0.0015;
      targetSpeedY = 0.0015;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      // Sphere radius based on viewport size
      let radius = Math.min(width, height) * 0.22;
      if (radius < 100) radius = 100;
      if (radius > 170) radius = 170;

      const centerX = width / 2;
      const centerY = height / 2;

      // Update rotation angles with easing
      speedX += (targetSpeedX - speedX) * 0.05;
      speedY += (targetSpeedY - speedY) * 0.05;
      rotX += speedX;
      rotY += speedY;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      // Rotate points in 3D space and project to 2D
      const projectedPoints = points.map(p => {
        // Rotate around X axis
        const y1 = p.y * cosX - p.z * sinX;
        const z1 = p.z * cosX + p.y * sinX;
        // Rotate around Y axis
        const x2 = p.x * cosY - z1 * sinY;
        const z2 = z1 * cosY + p.x * sinY;

        // Apply radius
        const px = x2 * radius;
        const py = y1 * radius;
        const pz = z2 * radius;

        // Perspective projection
        const perspective = 300;
        const scale = perspective / (perspective + pz);
        const screenX = centerX + px * scale;
        const screenY = centerY + py * scale;

        return { screenX, screenY, scale, pz };
      });

      // Draw connection lines first (rendered behind particles)
      lines.forEach(({ p1, p2 }) => {
        const pt1 = projectedPoints[p1];
        const pt2 = projectedPoints[p2];

        // Average depth of endpoints
        const avgZ = (pt1.pz + pt2.pz) / 2;
        // Calculate opacity based on depth (closer connections are more visible)
        const alpha = 0.12 * (1 - (avgZ + radius) / (2 * radius));
        
        if (alpha > 0.01) {
          ctx.beginPath();
          ctx.moveTo(pt1.screenX, pt1.screenY);
          ctx.lineTo(pt2.screenX, pt2.screenY);
          // Subtle indigo lines
          ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
          ctx.lineWidth = 0.45 * ((pt1.scale + pt2.scale) / 2);
          ctx.stroke();
        }
      });

      // Draw particles
      projectedPoints.forEach(p => {
        const alpha = 0.25 + 0.75 * (1 - (p.pz + radius) / (2 * radius));
        
        // Color interpolation: front is bright cyan, back is faint purple
        const r = Math.floor(6 + (168 - 6) * (1 - alpha));
        const g = Math.floor(182 + (85 - 182) * (1 - alpha));
        const b = Math.floor(212 + (247 - 212) * (1 - alpha));

        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, p.scale * 2.2, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.75})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      document.head.removeChild(link1);
      document.head.removeChild(link2);
      document.head.removeChild(link3);
    };
  }, []);

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-amber-400" />,
      title: 'AI Meeting Summaries',
      description: 'Generates structured outcomes, decisions, and action items using Google Gemini AI.'
    },
    {
      icon: <Mic className="w-6 h-6 text-cyan-400" />,
      title: 'Voice-to-Text Transcription',
      description: 'Translates speech to text, allowing absent invitees to catch up on the discussion.'
    },
    {
      icon: <Video className="w-6 h-6 text-blue-400" />,
      title: 'HD Video Quality',
      description: 'Crystal-clear video streams powered by advanced WebRTC configurations.'
    },
    {
      icon: <Monitor className="w-6 h-6 text-indigo-400" />,
      title: 'Screen Sharing',
      description: 'Share presentations or windows with attendees in one click.'
    },
    {
      icon: <Shield className="w-6 h-6 text-emerald-400" />,
      title: 'Secure Rooms',
      description: 'Strict token controls and connection checks protect privacy.'
    },
    {
      icon: <Zap className="w-6 h-6 text-purple-400" />,
      title: 'Instant Lobby Start',
      description: 'No software downloads or registrations needed. Join instantly via web browser.'
    }
  ];

  const handleCreateRoom = () => {
    setIsLoading(true);
    const newRoomId = Math.random().toString(36).substring(2, 15);
    setTimeout(() => {
      navigate(`/${newRoomId}`);
      setIsLoading(false);
    }, 500);
  };

  const handleJoinRoom = () => {
    if (roomId.trim()) {
      setIsLoading(true);
      setTimeout(() => {
        navigate(`/${roomId}`);
        setIsLoading(false);
      }, 500);
    } else {
      toast.error('Please enter a meeting ID');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden text-gray-200" style={{
      ...styles.fontSans,
      background: 'radial-gradient(circle at 50% 50%, #0d1222 0%, #020617 100%)',
    }}>
      {/* Mesh grid background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.15]" style={{
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px)',
        backgroundSize: '45px 45px',
        backgroundPosition: 'center center',
      }}></div>

      {/* Decorative ambient glowing background circles */}
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] rounded-full filter blur-[130px] opacity-10 pointer-events-none z-0" style={{
        background: 'radial-gradient(circle, #00f5ff 0%, transparent 70%)'
      }}></div>
      <div className="absolute bottom-[30%] right-[15%] w-[400px] h-[400px] rounded-full filter blur-[150px] opacity-10 pointer-events-none z-0" style={{
        background: 'radial-gradient(circle, #8338ec 0%, transparent 70%)'
      }}></div>

      {/* Rotating 3D Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
        style={{ mixBlendMode: 'screen' }}
      />

      {/* Header */}
      <header className="w-full px-6 py-4 sticky top-0 z-50 border-b border-white/5 backdrop-blur-md bg-slate-950/40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
              SkyConnect
            </span>
          </div>

          <Button
            data-testid="signin-btn"
            onClick={() => navigate(isLoggedIn ? '/home' : '/auth')}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '500',
              padding: '0 20px',
              height: '38px',
            }}
            className="hover:bg-white/10 hover:border-white/15 transition-all"
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Sign In'}
          </Button>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col justify-center items-center relative z-10 px-6 pt-24 pb-20 max-w-7xl mx-auto w-full text-center">
        {/* Glow Pill Announcement */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 backdrop-blur-md mb-8 shadow-[0_0_15px_rgba(6,182,212,0.05)]">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>Now Powered by Google Gemini AI</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.12]">
          Connect with <span style={styles.fontSerif} className="italic font-normal text-cyan-400 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-indigo-300 to-purple-400">real-time clarity</span>
          <br className="hidden sm:inline" />
          {' '}that drives teams forward.
        </h1>

        {/* Hero Description */}
        <p className="text-base sm:text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mt-6">
          Experience ultra-low latency video conferencing, screen sharing, and automatic AI meeting summaries—completely in your browser with zero installs.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full max-w-md">
          <Button
            data-testid="create-meeting-btn"
            onClick={handleCreateRoom}
            disabled={isLoading}
            style={{
              backgroundColor: '#ffffff',
              color: '#020617',
              borderRadius: '9999px',
              fontWeight: '600',
              fontSize: '15px',
              height: '48px',
              width: '100%',
              boxShadow: '0 4px 20px rgba(255, 255, 255, 0.15)',
            }}
            className="hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
          >
            {isLoading ? 'Creating Room...' : 'Start a Free Meeting'}
          </Button>

          <Button
            onClick={() => setShowJoinDrawer(!showJoinDrawer)}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              borderRadius: '9999px',
              fontWeight: '600',
              fontSize: '15px',
              height: '48px',
              width: '100%',
            }}
            className="hover:bg-white/10 hover:border-white/20 transition-all duration-200"
          >
            Join Meeting
          </Button>
        </div>

        {/* Collapsible Join Drawer */}
        <div 
          className="w-full max-w-md transition-all duration-300 ease-out overflow-hidden"
          style={{
            maxHeight: showJoinDrawer ? '250px' : '0',
            opacity: showJoinDrawer ? 1 : 0,
            transform: showJoinDrawer ? 'translateY(0)' : 'translateY(-10px)',
            marginTop: showJoinDrawer ? '1.5rem' : '0'
          }}
        >
          <div className="p-5 rounded-2xl border border-white/10 bg-slate-950/40 backdrop-blur-xl space-y-4">
            <div className="flex gap-2">
              <Input
                data-testid="room-id-input"
                type="text"
                placeholder="Enter Meeting ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  height: '44px',
                  paddingLeft: '20px',
                  fontSize: '14px',
                }}
                className="focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/20"
              />
              <Button
                data-testid="join-meeting-btn"
                onClick={handleJoinRoom}
                disabled={!roomId.trim() || isLoading}
                style={{
                  backgroundColor: '#06b6d4',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  fontWeight: '600',
                  height: '44px',
                  padding: '0 24px',
                  fontSize: '14px',
                }}
                className="hover:bg-cyan-500 transition-colors"
              >
                {isLoading ? 'Joining...' : 'Join'}
              </Button>
            </div>
            <p className="text-[11px] text-slate-500">
              Input any valid meeting room ID to join instantly.
            </p>
          </div>
        </div>

        {/* Inline No Software Badge */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 opacity-80">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-white/5 border border-white/5 rounded-full px-4 py-1.5 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span>No Software Install Required</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 bg-white/5 border border-white/5 rounded-full px-4 py-1.5 backdrop-blur-md">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <span>100% Secure WebRTC Protocols</span>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-24 border-t border-white/5" style={{
        background: 'linear-gradient(180deg, rgba(2, 6, 23, 0) 0%, rgba(2, 6, 23, 0.8) 100%)'
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Everything you need for collaboration.
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Powerful tools designed to keep teams aligned and conversations secure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="transition-all duration-300 border border-white/5 hover:border-cyan-500/20 hover:shadow-[0_4px_30px_rgba(6,182,212,0.05)] hover:-translate-y-1"
                style={{
                  background: 'rgba(255, 255, 255, 0.015)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '16px',
                }}
              >
                <CardContent className="p-8 space-y-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-cyan-400 shadow-[0_0_15px_rgba(255,255,255,0.02)]">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack / Trust Section */}
      <section className="relative z-10 px-6 py-16 border-t border-white/5 bg-slate-950/20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Engineered on a state-of-the-art tech stack
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 mt-8 opacity-40 hover:opacity-60 transition-opacity duration-300">
            <span className="text-sm font-bold tracking-widest text-slate-300">WEBRTC</span>
            <span className="text-sm font-bold tracking-widest text-slate-300">GOOGLE GEMINI AI</span>
            <span className="text-sm font-bold tracking-widest text-slate-300">REACT</span>
            <span className="text-sm font-bold tracking-widest text-slate-300">NODE.JS</span>
            <span className="text-sm font-bold tracking-widest text-slate-300">MONGODB</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-white/5 bg-slate-950/50 text-center text-xs text-slate-600">
        <p>© 2026 SkyConnect. Engineered for modern high-performance collaboration.</p>
      </footer>
    </div>
  );
};

export default Landing;