import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  Video, VideoOff, Mic, MicOff, Monitor, MonitorOff, MessageCircle, 
  PhoneOff, Users, Copy, Check, Maximize2, Minimize2, Send, X
} from 'lucide-react';
import { toast } from 'sonner';
import io from 'socket.io-client';

const VideoMeet = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [video, setVideo] = useState(true);
  const [audio, setAudio] = useState(true);
  const [screen, setScreen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [copied, setCopied] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [isScreenMaximized, setIsScreenMaximized] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  
  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peersRef = useRef({});
  const remoteVideosRef = useRef({});
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const roomId = window.location.pathname.substring(1) || 'demo-room';

  // Initialize camera
  useEffect(() => {
    const initCamera = async () => {
      try {
        console.log('Requesting camera access...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        console.log('Camera stream obtained:', stream.getTracks().map(t => t.kind));
        setCameraStream(stream);
        cameraStreamRef.current = stream;
        
        // Immediately set to video element
        if (localVideoRef.current) {
          console.log('Setting stream to video element immediately');
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          
          try {
            await localVideoRef.current.play();
            console.log('Video playing immediately after camera init');
          } catch (playError) {
            console.error('Play error:', playError);
          }
        }
      } catch (error) {
        console.error('Camera error:', error);
        toast.error('Camera access denied');
      }
    };
    
    initCamera();
  }, []);

  // Initialize socket
  useEffect(() => {
    console.log('Initializing socket connection...');
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.REACT_APP_BACKEND_URL || 'https://skyconnect-backend2.onrender.com'
      : 'http://localhost:8000';
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL);
    console.log('Connecting to:', backendUrl);
    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000
    });
    
    socketRef.current.on('connect', () => {
      console.log('Socket connected');
      setSocketConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
      setSocketConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
    });

    socketRef.current.on('reconnect', () => {
      console.log('Socket reconnected');
      setSocketConnected(true);
    });
    
    socketRef.current.on('user-joined', (userData) => {
      console.log('👤 User joined:', userData);
      setParticipants(prev => {
        const exists = prev.find(p => p.id === userData.userId);
        if (!exists) {
          // Only create offer if our socket ID is smaller (prevents duplicate offers)
          if (socketRef.current.id < userData.userId) {
            console.log('🤝 Creating offer for new user:', userData.username);
            setTimeout(() => createOffer(userData.userId), 1000);
          } else {
            console.log('⏳ Waiting for offer from:', userData.username);
          }
          return [...prev, { id: userData.userId, name: userData.username, isSelf: false }];
        }
        return prev;
      });
    });

    socketRef.current.on('existing-users', (existingUsers) => {
      console.log('🔍 Existing users received:', existingUsers);
      const users = existingUsers.map(user => ({
        id: user.userId,
        name: user.username,
        isSelf: false
      }));
      
      setParticipants(prev => {
        const selfUser = prev.find(p => p.isSelf);
        
        // Create offers only for users with higher socket IDs
        users.forEach(user => {
          if (socketRef.current.id < user.id) {
            console.log('🤝 Creating offer for existing user:', user.name);
            setTimeout(() => createOffer(user.id), 1000);
          } else {
            console.log('⏳ Waiting for offer from existing user:', user.name);
          }
        });
        
        return selfUser ? [selfUser, ...users] : users;
      });
    });

    socketRef.current.on('user-left', (userId) => {
      console.log('User left:', userId);
      if (peersRef.current[userId]) {
        peersRef.current[userId].close();
        delete peersRef.current[userId];
      }
      setParticipants(prev => prev.filter(p => p.id !== userId));
    });

    socketRef.current.on('signal', (fromUserId, signal) => {
      handleSignal(fromUserId, signal);
    });

    socketRef.current.on('chat-message', (data, sender) => {
      setMessages(prev => [...prev, { sender, text: data }]);
    });

    socketRef.current.on('screen-share-started', (userId) => {
      console.log('Screen sharing started by:', userId);
      // You can add UI indicators here if needed
    });

    socketRef.current.on('screen-share-ended', (userId) => {
      console.log('Screen sharing ended by:', userId);
      // You can add UI indicators here if needed
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      Object.values(peersRef.current).forEach(peer => peer.close());
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Update local video when camera stream changes
  useEffect(() => {
    if (cameraStream && localVideoRef.current) {
      console.log('Setting camera stream to local video element');
      localVideoRef.current.srcObject = cameraStream;
      localVideoRef.current.muted = true;
      cameraStreamRef.current = cameraStream;
      
      // Force play the video immediately
      const playVideo = async () => {
        try {
          await localVideoRef.current.play();
          console.log('Local video is now playing');
        } catch (error) {
          console.error('Error playing local video:', error);
        }
      };
      playVideo();
      
      // Update existing peer connections with new camera stream (if not screen sharing)
      if (!screenStream) {
        Object.values(peersRef.current).forEach(peerConnection => {
          cameraStream.getTracks().forEach(track => {
            const sender = peerConnection.getSenders().find(s => 
              s.track && s.track.kind === track.kind
            );
            if (sender) {
              sender.replaceTrack(track).catch(console.error);
            } else {
              peerConnection.addTrack(track, cameraStream);
            }
          });
        });
      }
    }
  }, [cameraStream, screenStream]);

  // Ensure video plays when connected state changes
  useEffect(() => {
    if (isConnected && cameraStream && localVideoRef.current) {
      console.log('Connected state changed - ensuring video plays');
      localVideoRef.current.srcObject = cameraStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(console.error);
    }
  }, [isConnected, cameraStream]);

  // Update screen video when screen stream changes
  useEffect(() => {
    if (screenStream && screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStream;
      screenVideoRef.current.play().catch(console.error);
      screenStreamRef.current = screenStream;
    }
  }, [screenStream]);

  const createPeerConnection = (userId) => {
    console.log('Creating peer connection for:', userId);
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add current stream tracks
    const currentStream = screenStreamRef.current || cameraStreamRef.current;
    if (currentStream) {
      console.log('Adding stream tracks for:', userId, currentStream.getTracks().map(t => t.kind));
      currentStream.getTracks().forEach(track => {
        const sender = peerConnection.addTrack(track, currentStream);
        console.log('Added track:', track.kind, 'enabled:', track.enabled);
      });
    } else {
      console.warn('No stream available for peer connection:', userId);
    }

    peerConnection.ontrack = (event) => {
      console.log('ontrack event from:', userId);
      const [remoteStream] = event.streams;
      console.log('Remote stream tracks:', remoteStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
      
      // Set remote video immediately or wait for element
      const setRemoteVideo = () => {
        if (remoteVideosRef.current[userId]) {
          console.log('Setting remote video for:', userId);
          remoteVideosRef.current[userId].srcObject = remoteStream;
          remoteVideosRef.current[userId].play().then(() => {
            console.log('Remote video playing for:', userId);
          }).catch(e => console.error('Remote video play error:', e));
        } else {
          console.warn('No video element for:', userId, 'retrying in 100ms');
          setTimeout(setRemoteVideo, 100);
        }
      };
      setRemoteVideo();
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log('Sending ICE candidate to:', userId);
        socketRef.current.emit('signal', userId, {
          type: 'ice-candidate',
          candidate: event.candidate
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state ${userId}:`, peerConnection.connectionState);
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state ${userId}:`, peerConnection.iceConnectionState);
    };

    return peerConnection;
  };

  const createOffer = async (userId) => {
    if (peersRef.current[userId]) {
      console.log('⚠️ Peer connection already exists for:', userId);
      return;
    }
    
    // Use refs to get current stream
    const currentStream = screenStreamRef.current || cameraStreamRef.current;
    if (!currentStream) {
      console.error('❌ No stream available for:', userId);
      return;
    }
    
    console.log('🔄 Creating offer for:', userId, 'with tracks:', currentStream.getTracks().map(t => `${t.kind}:${t.enabled}`));
    const peerConnection = createPeerConnection(userId);
    peersRef.current[userId] = peerConnection;

    try {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await peerConnection.setLocalDescription(offer);
      console.log('📤 Sending offer to:', userId);
      
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('signal', userId, { type: 'offer', offer });
      } else {
        console.error('❌ Socket not connected');
        delete peersRef.current[userId];
      }
    } catch (error) {
      console.error('❌ Create offer error:', error);
      delete peersRef.current[userId];
    }
  };

  const handleSignal = async (fromUserId, signal) => {
    console.log('📨 Received signal from:', fromUserId, 'type:', signal.type);
    
    try {
      if (signal.type === 'offer') {
        // Handle offer collision - only lower socket ID creates offer
        if (peersRef.current[fromUserId]) {
          console.log('🔄 Offer collision detected, closing existing connection');
          peersRef.current[fromUserId].close();
          delete peersRef.current[fromUserId];
        }
        
        console.log('📝 Handling offer from:', fromUserId);
        const peerConnection = createPeerConnection(fromUserId);
        peersRef.current[fromUserId] = peerConnection;

        await peerConnection.setRemoteDescription(signal.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        console.log('📤 Sending answer to:', fromUserId);
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('signal', fromUserId, { type: 'answer', answer });
        }
      } else if (signal.type === 'answer') {
        console.log('📝 Handling answer from:', fromUserId);
        const peerConnection = peersRef.current[fromUserId];
        if (peerConnection) {
          await peerConnection.setRemoteDescription(signal.answer);
          console.log('✅ Answer set for:', fromUserId);
        }
      } else if (signal.type === 'ice-candidate') {
        console.log('🧊 Handling ICE candidate from:', fromUserId);
        const peerConnection = peersRef.current[fromUserId];
        if (peerConnection && peerConnection.remoteDescription) {
          await peerConnection.addIceCandidate(signal.candidate);
          console.log('✅ ICE candidate added for:', fromUserId);
        } else {
          console.warn('⚠️ Queuing ICE candidate for later');
        }
      }
    } catch (error) {
      console.error('❌ Signal handling error for', fromUserId, ':', error);
    }
  };

  const handleConnect = async () => {
    if (!username.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!socketConnected) {
      toast.error('Connection not ready. Please wait...');
      return;
    }
    
    // Ensure camera stream is ready
    let stream = cameraStreamRef.current;
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setCameraStream(stream);
        cameraStreamRef.current = stream;
      } catch (error) {
        toast.error('Camera access required');
        return;
      }
    }
    
    // Immediately set video stream when connecting
    if (localVideoRef.current && stream) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.muted = true;
      try {
        await localVideoRef.current.play();
      } catch (playError) {
        console.error('Play error on connect:', playError);
      }
    }
    
    setParticipants([{ id: 'self', name: username, isSelf: true }]);
    socketRef.current.emit('join-call', roomId, username);
    setIsConnected(true);
    toast.success('Connected to meeting');
  };

  const toggleVideo = () => {
    if (cameraStream) {
      const newVideoState = !video;
      cameraStream.getVideoTracks().forEach(track => {
        track.enabled = newVideoState;
      });
      setVideo(newVideoState);
      toast.info(newVideoState ? 'Camera on' : 'Camera off');
    }
  };

  const toggleAudio = () => {
    if (cameraStream) {
      const newAudioState = !audio;
      cameraStream.getAudioTracks().forEach(track => {
        track.enabled = newAudioState;
      });
      setAudio(newAudioState);
      toast.info(newAudioState ? 'Unmuted' : 'Muted');
    }
  };

  const toggleScreen = async () => {
    try {
      if (!screen) {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(displayStream);
        
        // Notify other users about screen sharing
        if (socketRef.current) {
          socketRef.current.emit('screen-share-started', 'self');
        }
        
        // Replace video track in all peer connections with screen share
        Object.values(peersRef.current).forEach(peerConnection => {
          const videoSender = peerConnection.getSenders().find(sender => 
            sender.track && sender.track.kind === 'video'
          );
          if (videoSender) {
            videoSender.replaceTrack(displayStream.getVideoTracks()[0]);
          }
        });
        
        displayStream.getVideoTracks()[0].onended = () => {
          setScreen(false);
          setScreenStream(null);
          
          // Notify other users screen sharing ended
          if (socketRef.current) {
            socketRef.current.emit('screen-share-ended', 'self');
          }
          
          // Switch back to camera
          if (cameraStream) {
            Object.values(peersRef.current).forEach(peerConnection => {
              const videoSender = peerConnection.getSenders().find(sender => 
                sender.track && sender.track.kind === 'video'
              );
              if (videoSender) {
                videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
              }
            });
          }
        };
        
        setScreen(true);
        toast.info('Screen sharing started');
      } else {
        if (screenStream) {
          screenStream.getTracks().forEach(track => track.stop());
        }
        
        // Notify other users screen sharing ended
        if (socketRef.current) {
          socketRef.current.emit('screen-share-ended', 'self');
        }
        
        // Switch back to camera
        if (cameraStream) {
          Object.values(peersRef.current).forEach(peerConnection => {
            const videoSender = peerConnection.getSenders().find(sender => 
              sender.track && sender.track.kind === 'video'
            );
            if (videoSender) {
              videoSender.replaceTrack(cameraStream.getVideoTracks()[0]);
            }
          });
        }
        
        setScreenStream(null);
        setScreen(false);
        toast.info('Screen sharing stopped');
      }
    } catch (error) {
      console.error('Screen share error:', error);
      toast.error('Screen sharing failed');
    }
  };

  const sendMessage = () => {
    if (message.trim() && socketRef.current) {
      socketRef.current.emit('chat-message', message, username);
      setMessage('');
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast.success('Room ID copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy room ID');
    }
  };

  const handleEndCall = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
    }
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
    }
    Object.values(peersRef.current).forEach(peer => peer.close());
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    navigate('/');
  };

  const getGridLayout = () => {
    const total = participants.length + (screen ? 1 : 0);
    if (total <= 1) return 'flex items-center justify-center';
    if (total === 2) return 'grid grid-cols-2 gap-4';
    if (total <= 4) return 'grid grid-cols-2 gap-4';
    return 'grid grid-cols-3 gap-4';
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{
        background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)'
      }}>
        <Card className="w-full max-w-md" style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent className="pt-8 pb-8 px-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{
                background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                boxShadow: '0 10px 30px rgba(0, 151, 167, 0.3)'
              }}>
                <Video className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold mb-2" style={{
                fontFamily: 'Space Grotesk, sans-serif',
                background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>Join Meeting</h1>
              <p className="text-gray-600">Enter your name to continue</p>
            </div>

            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleConnect()}
                className="h-12 text-base"
              />
              <Button
                onClick={handleConnect}
                disabled={!username.trim() || !socketConnected}
                className="w-full h-12 text-base font-medium"
                style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}
              >
                {!socketConnected ? 'Connecting...' : 'Join Meeting'}
              </Button>
            </div>

            <div className="mt-6 p-4 rounded-lg" style={{ background: 'rgba(0, 151, 167, 0.05)' }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full rounded-lg"
                style={{ background: '#1a1a1a', aspectRatio: '16/9' }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: '#1a1a1a' }}>
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between" style={{
        background: 'rgba(26, 26, 26, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white">SkyConnect Meeting</h2>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Users className="w-4 h-4" />
            <span>{participants.length}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <span className="text-sm text-gray-300">Room: {roomId}</span>
          </div>
          <Button onClick={copyRoomId} variant="ghost" className="h-8 px-3 text-xs bg-cyan-500/20 text-cyan-300">
            {copied ? <><Check className="w-3 h-3 mr-1" /> Copied!</> : <><Copy className="w-3 h-3 mr-1" /> Copy ID</>}
          </Button>
          <Button onClick={() => setShowParticipants(!showParticipants)} variant="ghost" className={showParticipants ? 'bg-cyan-500/20' : ''}>
            <Users className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className={`h-full ${getGridLayout()}`}>
            {/* Screen Share */}
            {screen && (
              <Card className="relative overflow-hidden" style={{
                background: 'rgba(40, 40, 40, 0.8)',
                border: '2px solid #00acc1'
              }}>
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ background: '#2a2a2a' }}
                />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg" style={{
                  background: 'rgba(0, 172, 193, 0.8)'
                }}>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-3 h-3 text-white" />
                    <span className="text-sm text-white font-medium">{username} - Screen</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Local Video */}
            <Card className="relative overflow-hidden" style={{
              background: 'rgba(40, 40, 40, 0.8)',
              border: '2px solid #00acc1'
            }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ 
                  background: '#2a2a2a',
                  transform: 'scaleX(-1)',
                  display: video && cameraStream ? 'block' : 'none'
                }}
                onLoadedData={() => console.log('Local video data loaded')}
                onCanPlay={() => console.log('Local video can play')}
                onPlay={() => console.log('Local video started playing')}
                onError={(e) => console.error('Local video error:', e)}
              />
              {(!video || !cameraStream) && (
                <div className="w-full h-full flex items-center justify-center" style={{ background: '#2a2a2a' }}>
                  <div className="text-center">
                    <Avatar className="w-16 h-16 mx-auto mb-2" style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}>
                      <AvatarFallback className="text-white font-semibold text-xl">
                        {username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-gray-400 text-sm">Camera is off</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg" style={{
                background: 'rgba(0, 172, 193, 0.8)'
              }}>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{username} (You)</span>
                  {audio ? <Mic className="w-3 h-3 text-white" /> : <MicOff className="w-3 h-3 text-red-400" />}
                </div>
              </div>
            </Card>

            {/* Remote Videos */}
            {participants.filter(p => !p.isSelf).map((participant) => (
              <Card key={participant.id} className="relative overflow-hidden" style={{
                background: 'rgba(40, 40, 40, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <video
                  ref={el => {
                    if (el) remoteVideosRef.current[participant.id] = el;
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  style={{ background: '#2a2a2a' }}
                />
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg" style={{
                  background: 'rgba(0, 0, 0, 0.6)'
                }}>
                  <span className="text-sm text-white font-medium">{participant.name}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-80 border-l" style={{
            background: 'rgba(26, 26, 26, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <h3 className="text-lg font-semibold text-white">Participants ({participants.length})</h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3 p-3 rounded-lg" style={{
                      background: participant.isSelf ? 'rgba(0, 172, 193, 0.1)' : 'rgba(255, 255, 255, 0.03)'
                    }}>
                      <Avatar style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}>
                        <AvatarFallback className="text-white font-semibold">
                          {participant.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {participant.name} {participant.isSelf && '(You)'}
                        </p>
                        <p className="text-xs text-gray-400">{participant.isSelf ? 'Host' : 'Participant'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div className="w-96 border-l" style={{
            background: 'rgba(26, 26, 26, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)'
          }}>
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <h3 className="text-lg font-semibold text-white">Chat</h3>
                <Button onClick={() => setShowChat(false)} variant="ghost" size="sm">
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-400 text-sm mt-8">No messages yet</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, index) => (
                      <div key={index} className="p-3 rounded-lg" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                        <p className="text-xs font-medium mb-1" style={{ color: '#00acc1' }}>{msg.sender}</p>
                        <p className="text-sm text-white">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="p-4 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    style={{ background: 'linear-gradient(135deg, #0097a7, #00acc1)' }}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-24 px-6 flex items-center justify-center" style={{
        background: 'rgba(26, 26, 26, 0.95)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleVideo}
            variant="ghost"
            className={`h-12 w-12 rounded-full ${video ? '' : 'bg-red-500/20'}`}
            style={{
              background: video ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)'
            }}
          >
            {video ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-red-400" />}
          </Button>

          <Button
            onClick={toggleAudio}
            variant="ghost"
            className={`h-12 w-12 rounded-full ${audio ? '' : 'bg-red-500/20'}`}
            style={{
              background: audio ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)'
            }}
          >
            {audio ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-400" />}
          </Button>

          <Button
            onClick={toggleScreen}
            variant="ghost"
            className={`h-12 w-12 rounded-full ${screen ? 'bg-cyan-500/20' : ''}`}
            style={{
              background: screen ? 'rgba(0, 172, 193, 0.2)' : 'rgba(255, 255, 255, 0.1)'
            }}
          >
            {screen ? <MonitorOff className="w-5 h-5 text-cyan-400" /> : <Monitor className="w-5 h-5" />}
          </Button>

          <Button
            onClick={() => setShowChat(!showChat)}
            variant="ghost"
            className={`h-12 w-12 rounded-full ${showChat ? 'bg-cyan-500/20' : ''}`}
            style={{
              background: showChat ? 'rgba(0, 172, 193, 0.2)' : 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <MessageCircle className="w-5 h-5" />
          </Button>

          {/* Debug: Camera refresh button */}
          {!cameraStream && (
            <Button
              onClick={async () => {
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                  setCameraStream(stream);
                  toast.success('Camera refreshed');
                } catch (error) {
                  toast.error('Camera refresh failed');
                }
              }}
              variant="ghost"
              className="h-12 w-12 rounded-full bg-yellow-500/20"
            >
              <Video className="w-5 h-5 text-yellow-400" />
            </Button>
          )}

          <Separator orientation="vertical" className="h-8 mx-2" style={{ background: 'rgba(255, 255, 255, 0.1)' }} />

          <Button
            onClick={handleEndCall}
            className="h-12 px-6 rounded-full font-medium"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
          >
            <PhoneOff className="w-5 h-5 mr-2" />
            End Call
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoMeet;