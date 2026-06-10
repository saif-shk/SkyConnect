import React, { useState, useEffect, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Home, Video, Calendar, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { AuthContext } from '../contexts/AuthContext';

const styles = {
  fontSans: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  fontSerif: {
    fontFamily: "'Playfair Display', serif",
  }
};

const History = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getHistoryOfUser } = useContext(AuthContext);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const data = await getHistoryOfUser();
        setMeetings(data || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load meeting history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [getHistoryOfUser]);

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRejoinMeeting = (meetingCode) => {
    navigate(`/${meetingCode}`);
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
            <span className="text-xl font-bold tracking-tight text-[#2e0714] bg-clip-text text-transparent bg-gradient-to-r from-[#2e0714] via-[#5c0d29] to-[#db2777]">
              SkyConnect
            </span>
          </div>

          <Button
            data-testid="back-home-btn"
            onClick={() => navigate('/home')}
            variant="ghost"
            style={{
              color: '#db2777',
              fontWeight: '600',
              borderRadius: '9999px',
              fontSize: '14px',
            }}
            className="gap-2 hover:bg-rose-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 relative z-10 w-full text-left">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight text-[#2e0714]">
            Meeting History
          </h1>
          <p className="text-lg text-stone-600 leading-relaxed">
            Review your past meetings and rejoin with a single click.
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-stone-500 text-lg font-semibold animate-pulse">
              Loading meeting history...
            </p>
          </div>
        ) : meetings.length === 0 ? (
          <Card className="text-center py-16 border border-rose-100/80 bg-white/90 backdrop-blur-md shadow-xl shadow-rose-100/30" style={{ borderRadius: '24px' }}>
            <CardContent>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-rose-50 text-[#f43f5e]">
                <Video className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-extrabold mb-2 text-[#2e0714]">No meetings yet</h3>
              <p className="text-sm text-stone-500 mb-6 max-w-sm mx-auto">
                Your meeting history will appear here once you join or create a meeting.
              </p>
              <Button
                onClick={() => navigate('/home')}
                style={{
                  backgroundColor: '#f43f5e', // Coral Red
                  color: '#ffffff',
                  borderRadius: '9999px',
                  fontWeight: '700',
                  padding: '0 24px',
                  height: '44px',
                }}
                className="hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-md shadow-rose-200/50"
              >
                Start a Meeting
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <Card
                key={meeting._id || meeting.id}
                className="transition-all duration-300 hover:shadow-xl hover:shadow-rose-100/30 hover:-translate-y-0.5 border border-rose-100/80 bg-white/90 backdrop-blur-md"
                style={{
                  borderRadius: '16px'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#db2777] to-[#f43f5e] shadow-[0_4px_10px_rgba(219,39,119,0.12)]">
                          <Video className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-extrabold text-[#2e0714]">
                            Meeting #{meeting.meetingCode}
                          </h3>
                          <p className="text-xs font-semibold text-stone-500">
                            {meeting.participants || 'N/A'} participants
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-x-6 gap-y-2 sm:pl-14">
                        <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
                          <Calendar className="w-4 h-4 text-[#db2777]" />
                          <span>{formatDate(meeting.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
                          <Clock className="w-4 h-4 text-[#f43f5e]" />
                          <span>{formatTime(meeting.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
                          <Clock className="w-4 h-4 text-[#eab308]" />
                          <span>{meeting.duration || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      data-testid={`rejoin-meeting-${meeting._id || meeting.id}-btn`}
                      onClick={() => handleRejoinMeeting(meeting.meetingCode)}
                      style={{
                        backgroundColor: '#db2777', // Berry Pink
                        color: '#ffffff',
                        borderRadius: '9999px',
                        fontWeight: '750',
                        fontSize: '14px',
                        height: '42px',
                        padding: '0 20px',
                      }}
                      className="gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform self-start sm:self-center"
                    >
                      Rejoin
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {meetings.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest">
              Showing {meetings.length} recent {meetings.length === 1 ? 'meeting' : 'meetings'}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 border-t border-rose-100/40 bg-[#fffdf5] text-center text-xs text-rose-800/60">
        <p>© 2026 SkyConnect. Engineered for modern high-performance collaboration.</p>
      </footer>
    </div>
  );
};

export default History;
