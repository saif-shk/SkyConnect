import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Video, History, LogOut, Calendar, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { handleError } from '../utils/errorHandler';

const styles = {
  fontSans: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  fontSerif: {
    fontFamily: "'Playfair Display', serif",
  }
};

const Home = () => {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const canvasRef = useRef(null);

  const handleJoinVideoCall = () => {
    if (meetingCode.trim()) {
      navigate(`/${meetingCode}`);
    } else {
      toast.error('Please enter a meeting code');
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
      setTimeout(() => navigate('/auth'), 500);
    } catch (error) {
      handleError(error, 'Logout failed');
      navigate('/auth');
    }
  };

  const quickStats = [
    { label: 'Total Meetings', value: '24', icon: <Video className="w-5 h-5 text-[#db2777]" /> },
    { label: 'Hours Spent', value: '48h', icon: <Clock className="w-5 h-5 text-[#f43f5e]" /> },
    { label: 'This Week', value: '8', icon: <Calendar className="w-5 h-5 text-[#eab308]" /> }
  ];

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

    let targetX = width / 2;
    let targetY = height / 2;
    let currentX = width / 2;
    let currentY = height / 2;

    const handleResize = () => {
      if (!canvas) return;
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      targetX = width / 2;
      targetY = height / 2;
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
    let speedX = 0.0012;
    let speedY = 0.0012;
    let targetSpeedX = 0.0012;
    let targetSpeedY = 0.0012;

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
      const x = e.clientX - width / 2;
      const y = e.clientY - height / 2;
      // Map mouse offset to target speeds (subtle interactive rotation speed)
      targetSpeedY = (x / width) * 0.015;
      targetSpeedX = -(y / height) * 0.015;
    };

    const handleMouseLeave = () => {
      targetX = width / 2;
      targetY = height / 2;
      targetSpeedX = 0.0012;
      targetSpeedY = 0.0012;
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

      // Smoothly lerp center position to the target (mouse) coordinates
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

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
        const screenX = currentX + px * scale;
        const screenY = currentY + py * scale;

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
          // Faint berry pink connection lines
          ctx.strokeStyle = `rgba(219, 39, 119, ${alpha * 0.4})`;
          ctx.lineWidth = 0.45 * ((pt1.scale + pt2.scale) / 2);
          ctx.stroke();
        }
      });

      // Draw particles (colored according to the user palette mapping to depth)
      projectedPoints.forEach(p => {
        const alpha = 0.25 + 0.75 * (1 - (p.pz + radius) / (2 * radius));
        
        let r, g, b;
        if (alpha > 0.6) {
          // Front-half: Interpolate between Berry Pink (219, 39, 119) and Coral Red (244, 63, 94)
          const t = (alpha - 0.6) / 0.4;
          r = Math.floor(219 + (244 - 219) * t);
          g = Math.floor(39 + (63 - 39) * t);
          b = Math.floor(119 + (94 - 119) * t);
        } else {
          // Back-half: Interpolate between Yellow Gold (253, 224, 71) and Berry Pink (219, 39, 119)
          const t = (alpha - 0.25) / 0.35;
          const cappedT = Math.max(0, Math.min(1, t));
          r = Math.floor(253 + (219 - 253) * cappedT);
          g = Math.floor(224 + (39 - 224) * cappedT);
          b = Math.floor(71 + (119 - 71) * cappedT);
        }

        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, p.scale * 2.2, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.8})`;
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

      {/* Rotating 3D Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0"
        style={{ mixBlendMode: 'multiply' }}
      />

      {/* Navigation Bar */}
      <nav className="w-full px-6 py-4 sticky top-0 z-50 border-b border-rose-100/80 backdrop-blur-md bg-white/70">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#db2777] to-[#f43f5e] shadow-[0_4px_12px_rgba(219,39,119,0.15)]">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#2e0714] bg-clip-text text-transparent bg-gradient-to-r from-[#2e0714] via-[#5c0d29] to-[#db2777]" style={styles.fontSans}>
              SkyConnect
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              data-testid="history-btn"
              onClick={() => navigate('/history')}
              variant="ghost"
              style={{
                color: '#db2777',
                fontWeight: '600',
                borderRadius: '9999px',
                fontSize: '14px',
              }}
              className="gap-2 hover:bg-rose-50 transition-colors"
            >
              <History className="w-4 h-4" />
              History
            </Button>
            <Button
              data-testid="logout-btn"
              onClick={handleLogout}
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
              className="gap-2 hover:bg-rose-50 hover:border-rose-300 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 relative z-10 w-full flex flex-col justify-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Welcome & Stats */}
          <div className="space-y-8 text-left">
            <div>
              <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-[#2e0714]">
                Welcome Back!
              </h1>
              <p className="text-lg text-stone-600 leading-relaxed max-w-lg">
                Ready to connect? Join an existing meeting with a code or start a new high-definition call.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              {quickStats.map((stat, index) => (
                <Card key={index} className="border border-rose-100/60 bg-white/80 backdrop-blur-md shadow-sm" style={{ borderRadius: '16px' }}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50/50">
                        {stat.icon}
                      </div>
                    </div>
                    <p className="text-2xl font-extrabold text-[#2e0714] mb-0.5">{stat.value}</p>
                    <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                      {stat.label}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Feature Highlights */}
            <div className="p-6 rounded-2xl border border-rose-100 bg-white/70 backdrop-blur-md shadow-sm">
              <h3 className="text-lg font-bold mb-4 text-[#2e0714]">Why Choose SkyConnect?</h3>
              <ul className="space-y-3 text-stone-600 font-medium text-sm">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold">
                    ✓
                  </div>
                  <span>Crystal-clear HD video quality</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold">
                    ✓
                  </div>
                  <span>Secure end-to-end encryption</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-50 text-emerald-600 border border-emerald-100 text-xs font-bold">
                    ✓
                  </div>
                  <span>Real-time screen sharing</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right: Join Meeting Card */}
          <Card className="shadow-2xl border border-rose-100/80 bg-white/90 backdrop-blur-xl" style={{ borderRadius: '24px' }}>
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-gradient-to-tr from-[#db2777] to-[#f43f5e] shadow-[0_6px_20px_rgba(219,39,119,0.2)]">
                  <Video className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold mb-1 text-[#2e0714]">Join a Meeting</h2>
                <p className="text-sm text-stone-500">Enter the meeting code to continue</p>
              </div>

              <div className="space-y-4">
                <Input
                  data-testid="meeting-code-input"
                  type="text"
                  placeholder="Enter Meeting Code"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoinVideoCall()}
                  style={{
                    backgroundColor: '#fafaf9',
                    borderColor: '#d6d3d1',
                    color: '#1c1917',
                    borderRadius: '9999px',
                    height: '48px',
                    paddingLeft: '20px',
                    fontSize: '15px',
                  }}
                  className="focus:border-[#db2777] focus:ring-1 focus:ring-rose-500/20 text-center font-bold tracking-wider placeholder-stone-400"
                />

                <Button
                  data-testid="join-call-btn"
                  onClick={handleJoinVideoCall}
                  disabled={!meetingCode.trim()}
                  style={{
                    backgroundColor: '#db2777', // Berry Pink
                    color: '#ffffff',
                    borderRadius: '9999px',
                    fontWeight: '700',
                    fontSize: '15px',
                    height: '48px',
                    width: '100%',
                    boxShadow: '0 4px 14px rgba(219, 39, 119, 0.2)',
                  }}
                  className="hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200"
                >
                  Join Video Call
                </Button>
              </div>

              <div className="relative py-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-rose-100"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-xs font-semibold text-stone-400 bg-white rounded-full">
                    or
                  </span>
                </div>
              </div>

              <Button
                data-testid="create-new-meeting-btn"
                onClick={() => {
                  try {
                    const newCode = Math.random().toString(36).substring(2, 15);
                    navigate(`/${newCode}`);
                  } catch (error) {
                    handleError(error, 'Failed to create meeting');
                  }
                }}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #f43f5e', // Coral Red
                  color: '#f43f5e',
                  borderRadius: '9999px',
                  fontWeight: '700',
                  fontSize: '15px',
                  height: '48px',
                  width: '100%',
                }}
                className="hover:bg-rose-50/50 transition-all duration-200"
              >
                Create New Meeting
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-rose-100/40 bg-[#fffdf5] text-center text-xs text-rose-800/60">
        <p>© 2026 SkyConnect. Engineered for modern high-performance collaboration.</p>
      </footer>
    </div>
  );
};

export default Home;