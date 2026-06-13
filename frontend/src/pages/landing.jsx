import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Video, Monitor, Shield, Zap, Sparkles, Mic, Heart } from 'lucide-react';
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

    // Canvas Sky & Clouds Animation
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // Clouds array
    let clouds = [];
    // Stars array
    let stars = [];
    // Wind streaks
    let windStreaks = [];

    const initSky = () => {
      clouds = [];
      stars = [];
      windStreaks = [];

      // Create drifting clouds
      const cloudCount = Math.max(4, Math.floor(width / 300));
      for (let i = 0; i < cloudCount; i++) {
        const baseRadius = 120 + Math.random() * 100;
        const circles = [];
        const numCircles = 5 + Math.floor(Math.random() * 4);
        
        // Form a fluffy cloud shape using overlapping circles
        for (let j = 0; j < numCircles; j++) {
          circles.push({
            dx: (Math.random() - 0.5) * baseRadius * 1.6,
            dy: (Math.random() - 0.4) * baseRadius * 0.5,
            r: baseRadius * (0.5 + Math.random() * 0.6),
          });
        }

        // Colors matching the brand: pinkish-red, yellow-gold, or pure soft cream
        let colorType;
        if (i % 3 === 0) {
          colorType = 'rgba(251, 207, 232, '; // soft pink
        } else if (i % 3 === 1) {
          colorType = 'rgba(254, 243, 199, '; // soft warm gold/cream
        } else {
          colorType = 'rgba(255, 255, 255, '; // soft white
        }

        clouds.push({
          x: Math.random() * width,
          y: 80 + Math.random() * (height * 0.45),
          vx: 0.05 + Math.random() * 0.08,
          circles,
          colorType,
          baseAlpha: 0.15 + Math.random() * 0.15,
        });
      }

      // Create twinkling stars (subtle, elegant dots)
      const starCount = Math.max(30, Math.floor(width / 40));
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.8),
          r: 0.6 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
          speed: 0.005 + Math.random() * 0.012,
          color: Math.random() > 0.4 ? 'rgba(219, 39, 119, ' : 'rgba(234, 179, 8, ', // twinkling pink or gold
        });
      }

      // Create elegant wind current streaks
      for (let i = 0; i < 3; i++) {
        windStreaks.push({
          x: Math.random() * width,
          y: 100 + Math.random() * (height * 0.4),
          length: 200 + Math.random() * 250,
          speed: 0.15 + Math.random() * 0.2,
          opacity: 0.03 + Math.random() * 0.05,
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initSky();
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const render = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Twinkling Stars
      stars.forEach(star => {
        star.phase += star.speed;
        const alpha = (Math.sin(star.phase) + 1) / 2 * 0.5 + 0.1; // pulse

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `${star.color}${alpha})`;
        ctx.fill();
      });

      // 2. Draw Wind Streaks
      ctx.strokeStyle = '#db2777'; 
      ctx.lineWidth = 0.8;
      windStreaks.forEach(streak => {
        streak.x += streak.speed;
        if (streak.x > width) {
          streak.x = -streak.length;
          streak.y = 80 + Math.random() * (height * 0.4);
        }

        ctx.beginPath();
        ctx.globalAlpha = streak.opacity;
        ctx.moveTo(streak.x, streak.y);
        ctx.bezierCurveTo(
          streak.x + streak.length * 0.25, streak.y - 12,
          streak.x + streak.length * 0.75, streak.y + 12,
          streak.x + streak.length, streak.y
        );
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0; 

      // 3. Draw Soft Clouds
      clouds.forEach(cloud => {
        cloud.x += cloud.vx;
        
        const maxOffset = Math.max(...cloud.circles.map(c => Math.abs(c.dx) + c.r), 200);
        if (cloud.x - maxOffset > width) {
          cloud.x = -maxOffset;
          cloud.y = 80 + Math.random() * (height * 0.45);
        }

        cloud.circles.forEach(c => {
          const cx = cloud.x + c.dx;
          const cy = cloud.y + c.dy;

          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, c.r);
          grad.addColorStop(0, `${cloud.colorType}${cloud.baseAlpha})`);
          grad.addColorStop(0.4, `${cloud.colorType}${cloud.baseAlpha * 0.4})`);
          grad.addColorStop(1, `${cloud.colorType}0)`);

          ctx.beginPath();
          ctx.arc(cx, cy, c.r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        });
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      document.head.removeChild(link1);
      document.head.removeChild(link2);
      document.head.removeChild(link3);
    };
  }, []);

  const features = [
    {
      icon: <Sparkles className="w-6 h-6 text-[#db2777]" />,
      title: 'AI Meeting Summaries',
      description: 'Generates structured outcomes, decisions, and action items using our advanced built-in summary engine.'
    },
    {
      icon: <Mic className="w-6 h-6 text-[#f43f5e]" />,
      title: 'Voice-to-Text Transcription',
      description: 'Translates speech to text, allowing absent invitees to catch up on the discussion.'
    },
    {
      icon: <Video className="w-6 h-6 text-[#eab308]" />,
      title: 'HD Video Quality',
      description: 'Crystal-clear video streams powered by advanced WebRTC configurations.'
    },
    {
      icon: <Monitor className="w-6 h-6 text-[#db2777]" />,
      title: 'Screen Sharing',
      description: 'Share presentations or windows with attendees in one click.'
    },
    {
      icon: <Shield className="w-6 h-6 text-[#f43f5e]" />,
      title: 'Secure Rooms',
      description: 'Strict token controls and connection checks protect privacy.'
    },
    {
      icon: <Zap className="w-6 h-6 text-[#eab308]" />,
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
    <div className="min-h-screen relative flex flex-col justify-between overflow-x-hidden text-[#2e0714]" style={{
      ...styles.fontSans,
      backgroundColor: '#fefdf0', // Pale Ivory / Warm Yellow Cream
    }}>
      {/* Mesh grid background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-[0.07]" style={{
        backgroundImage: 'linear-gradient(rgba(219, 39, 119, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(219, 39, 119, 0.1) 1px, transparent 1px)',
        backgroundSize: '45px 45px',
        backgroundPosition: 'center center',
      }}></div>

      {/* Decorative ambient glowing background circles */}
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] rounded-full filter blur-[130px] opacity-[0.08] pointer-events-none z-0" style={{
        background: 'radial-gradient(circle, #fde047 0%, transparent 70%)'
      }}></div>
      <div className="absolute bottom-[30%] right-[15%] w-[400px] h-[400px] rounded-full filter blur-[150px] opacity-[0.08] pointer-events-none z-0" style={{
        background: 'radial-gradient(circle, #f43f5e 0%, transparent 70%)'
      }}></div>

      {/* Drifting Sky & Cloud Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
      />

      {/* Header */}
      <header className="w-full px-6 py-4 sticky top-0 z-50 border-b border-rose-100/80 backdrop-blur-md bg-white/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#db2777] to-[#f43f5e] shadow-[0_4px_12px_rgba(219,39,119,0.15)]">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#2e0714] bg-clip-text text-transparent bg-gradient-to-r from-[#2e0714] via-[#5c0d29] to-[#db2777]">
              SkyConnect
            </span>
          </div>

          <Button
            data-testid="signin-btn"
            onClick={() => navigate(isLoggedIn ? '/home' : '/auth')}
            style={{
              backgroundColor: 'rgba(219, 39, 119, 0.05)',
              border: '1px solid rgba(219, 39, 119, 0.15)',
              color: '#db2777',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: '600',
              padding: '0 20px',
              height: '38px',
            }}
            className="hover:bg-rose-50 hover:border-rose-300 transition-all animate-fade-in"
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Sign In'}
          </Button>
        </div>
      </header>

      {/* Hero Content */}
      <main className="flex-1 flex flex-col justify-center items-center relative z-10 px-6 pt-24 pb-20 max-w-7xl mx-auto w-full text-center">
        {/* Glow Pill Announcement */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-50/60 text-[#db2777] border border-rose-100/80 backdrop-blur-md mb-8 shadow-sm">
          <Heart className="w-3.5 h-3.5 fill-[#f43f5e] text-[#f43f5e] animate-pulse" />
          <span>Made with love by Saif shaikh</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-[#2e0714] max-w-4xl mx-auto leading-[1.12]">
          Connect with <span style={styles.fontSerif} className="italic font-normal bg-clip-text text-transparent bg-gradient-to-r from-[#db2777] via-[#f43f5e] to-[#eab308]">real-time clarity</span>
          <br className="hidden sm:inline" />
          {' '}that drives teams forward.
        </h1>

        {/* Hero Description */}
        <p className="text-base sm:text-lg md:text-xl text-stone-600 leading-relaxed max-w-2xl mx-auto mt-6">
          Experience ultra-low latency video conferencing, screen sharing, and automatic AI meeting summaries—completely in your browser with zero installs.
        </p>

        {/* Hero Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 w-full max-w-md">
          <Button
            data-testid="create-meeting-btn"
            onClick={handleCreateRoom}
            disabled={isLoading}
            style={{
              backgroundColor: '#f43f5e', // Vibrant Coral Red
              color: '#ffffff',
              borderRadius: '9999px',
              fontWeight: '700',
              fontSize: '15px',
              height: '48px',
              width: '100%',
              boxShadow: '0 4px 18px rgba(244, 63, 94, 0.25)',
            }}
            className="hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
          >
            {isLoading ? 'Creating Room...' : 'Start a Free Meeting'}
          </Button>

          <Button
            onClick={() => setShowJoinDrawer(!showJoinDrawer)}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #db2777',
              color: '#db2777',
              borderRadius: '9999px',
              fontWeight: '700',
              fontSize: '15px',
              height: '48px',
              width: '100%',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)',
            }}
            className="hover:bg-rose-50/50 hover:border-pink-600 transition-all duration-200"
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
          <div className="p-5 rounded-2xl border border-rose-100 bg-white shadow-xl shadow-rose-100/40 space-y-4 text-left">
            <div className="flex gap-2">
              <Input
                data-testid="room-id-input"
                type="text"
                placeholder="Enter Meeting ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                style={{
                  backgroundColor: '#fafaf9',
                  borderColor: '#d6d3d1',
                  color: '#1c1917',
                  borderRadius: '9999px',
                  height: '44px',
                  paddingLeft: '20px',
                  fontSize: '14px',
                }}
                className="focus:border-[#db2777] focus:ring-1 focus:ring-rose-500/20"
              />
              <Button
                data-testid="join-meeting-btn"
                onClick={handleJoinRoom}
                disabled={!roomId.trim() || isLoading}
                style={{
                  backgroundColor: '#db2777', // Berry Pink
                  color: '#ffffff',
                  borderRadius: '9999px',
                  fontWeight: '600',
                  height: '44px',
                  padding: '0 24px',
                  fontSize: '14px',
                }}
                className="hover:bg-pink-700 transition-colors"
              >
                {isLoading ? 'Joining...' : 'Join'}
              </Button>
            </div>
            <p className="text-[11px] text-stone-500 pl-2">
              Input any valid meeting room ID to join instantly.
            </p>
          </div>
        </div>

        {/* Inline No Software Badge */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 opacity-95">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 bg-white border border-rose-100/80 rounded-full px-4.5 py-1.5 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
            <span>No Software Install Required</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 bg-white border border-rose-100/80 rounded-full px-4.5 py-1.5 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-[#eab308] shadow-[0_0_8px_rgba(234,179,8,0.4)]"></div>
            <span>100% Secure WebRTC Protocols</span>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="relative z-10 px-6 py-24 border-t border-rose-100/60 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#2e0714]">
              Everything you need for collaboration.
            </h2>
            <p className="text-stone-600 text-base sm:text-lg">
              Powerful tools designed to keep teams aligned and conversations secure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="transition-all duration-300 border border-rose-100 bg-white hover:border-[#db2777]/30 hover:shadow-xl hover:shadow-rose-100/30 hover:-translate-y-1"
                style={{
                  borderRadius: '16px',
                }}
              >
                <CardContent className="p-8 space-y-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-[#fefdf0] border border-rose-100/60 shadow-sm animate-pulse-slow">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2e0714] tracking-tight mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-stone-600 leading-relaxed">
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
      <section className="relative z-10 px-6 py-16 border-t border-rose-100/40 bg-[#fffbeb]/20">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#db2777]">
            Engineered on a state-of-the-art tech stack
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6 mt-8 opacity-70 hover:opacity-95 transition-opacity duration-300">
            <span className="text-sm font-bold tracking-widest text-[#2e0714]">WEBRTC</span>
            <span className="text-sm font-bold tracking-widest text-[#db2777]">BUILT-IN AI SUMMARY</span>
            <span className="text-sm font-bold tracking-widest text-[#f43f5e]">REACT</span>
            <span className="text-sm font-bold tracking-widest text-[#eab308]">NODE.JS</span>
            <span className="text-sm font-bold tracking-widest text-[#2e0714]">MONGODB</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-rose-100/40 bg-[#fffdf5] text-center text-xs text-rose-800/60">
        <p>© 2026 SkyConnect. Engineered for modern high-performance collaboration.</p>
      </footer>
    </div>
  );
};

export default Landing;