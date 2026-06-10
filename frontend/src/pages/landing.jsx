import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Video, Users, Monitor, Shield, Zap, Globe, Sparkles, Mic } from 'lucide-react';
import { toast } from 'sonner';

const Landing = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="min-h-screen relative overflow-hidden text-gray-200" style={{
      background: 'linear-gradient(135deg, #090d16 0%, #0b1329 50%, #030712 100%)',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full filter blur-[120px] opacity-15 pointer-events-none" style={{
        background: 'radial-gradient(circle, #00b4d8 0%, transparent 70%)'
      }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full filter blur-[120px] opacity-15 pointer-events-none" style={{
        background: 'radial-gradient(circle, #8338ec 0%, transparent 70%)'
      }}></div>

      {/* Header */}
      <header className="px-6 py-5 relative z-10 border-b border-gray-800/40" style={{
        background: 'rgba(9, 13, 22, 0.4)',
        backdropFilter: 'blur(8px)'
      }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
              boxShadow: '0 4px 15px rgba(0, 180, 216, 0.3)'
            }}>
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white" style={{
              fontFamily: 'Space Grotesk, sans-serif'
            }}>SkyConnect</span>
          </div>
          <Button
            data-testid="signin-btn"
            onClick={() => navigate('/auth')}
            variant="ghost"
            className="hover:bg-white/5 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 pt-16 pb-24 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Now Powered by Google Gemini AI</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight text-white tracking-tight" style={{
                  fontFamily: 'Space Grotesk, sans-serif'
                }}>
                  Next-Gen Video 
                  <br />
                  <span style={{
                    background: 'linear-gradient(to right, #00f5ff, #8338ec)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>Conferencing</span>
                </h1>
              </div>
              <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                Connect and collaborate seamlessly with crystal-clear calls, real-time screen sharing, 
                and automatic AI meeting minutes delivered straight to your dashboard.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/40 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                  <span className="text-sm font-medium text-gray-300">No software required</span>
                </div>
                <div className="flex items-center gap-2.5 px-4 py-2 rounded-full border border-gray-800 bg-gray-900/40 backdrop-blur-md">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                  <span className="text-sm font-medium text-gray-300">100% browser-based</span>
                </div>
              </div>
            </div>

            {/* Right: Meeting Card */}
            <Card className="shadow-2xl overflow-hidden border border-white/5" style={{
              background: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
              <CardContent className="p-8 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight" style={{
                    fontFamily: 'Space Grotesk, sans-serif'
                  }}>Start Collaborating</h2>
                  <p className="text-sm text-gray-400 mt-1">Create a secure room or enter a meeting ID to join.</p>
                </div>

                <div className="space-y-4">
                  <Button
                    data-testid="create-meeting-btn"
                    onClick={handleCreateRoom}
                    disabled={isLoading}
                    className="w-full h-12 text-base font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 active:translate-y-0"
                    style={{
                      background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
                      boxShadow: '0 4px 15px rgba(0, 180, 216, 0.25)'
                    }}
                  >
                    {isLoading ? 'Creating Room...' : 'Create New Meeting'}
                  </Button>

                  <div className="relative flex items-center justify-center py-2">
                    <div className="absolute w-full border-t border-gray-800"></div>
                    <span className="relative px-3 text-xs uppercase tracking-wider text-gray-500 bg-[#0f172a] rounded">
                      or join existing
                    </span>
                  </div>

                  <div className="space-y-3">
                    <Input
                      data-testid="room-id-input"
                      type="text"
                      placeholder="Enter Meeting ID"
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                      className="h-12 text-base bg-gray-950/50 border-gray-800 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:ring-cyan-500/20"
                    />

                    <Button
                      data-testid="join-meeting-btn"
                      onClick={handleJoinRoom}
                      disabled={!roomId.trim() || isLoading}
                      variant="outline"
                      className="w-full h-12 text-base font-semibold border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition-colors"
                    >
                      {isLoading ? 'Joining...' : 'Join Meeting'}
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-center text-gray-400">
                  Want to save your meeting archives?{' '}
                  <a
                    href="/auth"
                    className="font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
                    style={{ textDecoration: 'none' }}
                  >
                    Sign in here
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-24 relative z-10 border-t border-gray-900" style={{
        background: 'rgba(9, 13, 22, 0.6)',
        backdropFilter: 'blur(20px)'
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-4xl font-bold tracking-tight text-white" style={{
              fontFamily: 'Space Grotesk, sans-serif'
            }}>Everything You Need</h2>
            <p className="text-lg text-gray-400">
              Powerful, AI-enhanced features to make remote collaboration smooth and secure.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="transition-all duration-300 border border-white/5 hover:border-cyan-500/30 hover:shadow-[0_4px_25px_rgba(0,180,216,0.08)] hover:-translate-y-1"
                style={{
                  background: 'rgba(15, 23, 42, 0.35)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <CardContent className="p-7 space-y-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight mb-2" style={{
                      fontFamily: 'Space Grotesk, sans-serif'
                    }}>{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 relative z-10 border-t border-gray-900/60" style={{
        background: 'rgba(9, 13, 22, 0.4)'
      }}>
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          <p>© 2026 SkyConnect. Built with care for seamless collaboration.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;