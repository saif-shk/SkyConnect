import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/googleMeet.module.css";
import modernStyles from "../styles/modernGlass.module.css";
import SkyConnectLogo from '../components/SkyConnectLogo';
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import PeopleIcon from '@mui/icons-material/People'
import InfoIcon from '@mui/icons-material/Info'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import MinimizeIcon from '@mui/icons-material/Minimize'
import CloseIcon from '@mui/icons-material/Close'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import server from '../environment';
import ScreenSharePanel from '../components/ScreenSharePanel';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();
    let screenShareVideoRef = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);

    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(false);

    let [audio, setAudio] = useState(false);

    let [screen, setScreen] = useState(false);

    let [showModal, setModal] = useState(false);

    let [screenAvailable, setScreenAvailable] = useState(false);

    let [messages, setMessages] = useState([])

    let [message, setMessage] = useState("");

    let [newMessages, setNewMessages] = useState(0);

    let [askForUsername, setAskForUsername] = useState(true);

    let [username, setUsername] = useState("");

    const videoRef = useRef([])

    let [videos, setVideos] = useState([])
    let [participantCount, setParticipantCount] = useState(1)
    let [meetingId, setMeetingId] = useState("")
    let [isFullScreen, setIsFullScreen] = useState(false)
    let [isScreenSharing, setIsScreenSharing] = useState(false)
    let [screenShareStream, setScreenShareStream] = useState(null)
    let [screenShareUser, setScreenShareUser] = useState(null)
    let [isScreenShareMaximized, setIsScreenShareMaximized] = useState(false)
    let [cameraStream, setCameraStream] = useState(null)
    let [participants, setParticipants] = useState([])
    let [showParticipants, setShowParticipants] = useState(false)
    let [copySuccess, setCopySuccess] = useState(false)

    // TODO
    // if(isChrome() === false) {


    // }

    useEffect(() => {
        console.log("HELLO")
        getPermissions();
    }, []) // Added dependency array to prevent infinite loop

    let getDislayMedia = () => {
        if (screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                    .then(getDislayMediaSuccess)
                    .then((stream) => { })
                    .catch((e) => console.log(e))
            }
        }
    }

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        if (video !== undefined && audio !== undefined && !screen) {
            getUserMedia();
            console.log("SET STATE HAS ", video, audio);
        }
    }, [video, audio])
    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();

    }




    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop())
        } catch (e) { console.log(e) }

        window.localStream = stream
        localVideoref.current.srcObject = stream

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                console.log(description)
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {
                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch (e) { console.log(e) }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()])
            window.localStream = blackSilence()
            localVideoref.current.srcObject = window.localStream

            for (let id in connections) {
                connections[id].addStream(window.localStream)

                connections[id].createOffer().then((description) => {
                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                        })
                        .catch(e => console.log(e))
                })
            }
        })
    }

    let getUserMedia = () => {
        if (screen) {
            return;
        }
        
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ 
                video: video && videoAvailable, 
                audio: audio && audioAvailable 
            })
                .then(getUserMediaSuccess)
                .catch((e) => console.log(e))
        } else {
            try {
                if (localVideoref.current && localVideoref.current.srcObject) {
                    let tracks = localVideoref.current.srcObject.getTracks()
                    tracks.forEach(track => track.stop())
                }
                let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                window.localStream = blackSilence()
                if (localVideoref.current) {
                    localVideoref.current.srcObject = window.localStream
                }
            } catch (e) { 
                console.log('Error stopping tracks:', e)
            }
        }
    }





    let getDislayMediaSuccess = (stream) => {
        console.log("Screen sharing started")
        setIsScreenSharing(true)
        setScreenShareStream(stream)
        setScreenShareUser('You')
        
        // Save current camera stream
        setCameraStream(window.localStream)
        
        // Set screen share to screen share video ref
        if (screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = stream
        }
        
        // Update main stream for WebRTC
        window.localStream = stream

        // Notify other users about screen sharing
        socketRef.current.emit('screen-share-started', socketIdRef.current)

        for (let id in connections) {
            if (id === socketIdRef.current) continue

            connections[id].addStream(window.localStream)

            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description)
                    .then(() => {
                        socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }))
                    })
                    .catch(e => console.log(e))
            })
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setScreen(false)
            setIsScreenSharing(false)
            setScreenShareStream(null)
            setScreenShareUser(null)
            
            // Notify other users screen sharing ended
            socketRef.current.emit('screen-share-ended', socketIdRef.current)

            // Restore camera stream
            if (cameraStream) {
                window.localStream = cameraStream
                if (localVideoref.current) {
                    localVideoref.current.srcObject = cameraStream
                }
                setCameraStream(null)
            } else {
                getUserMedia()
            }
        })
    }

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message)

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if (signal.sdp.type === 'offer') {
                        connections[fromId].createAnswer().then((description) => {
                            connections[fromId].setLocalDescription(description).then(() => {
                                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }))
                            }).catch(e => console.log(e))
                        }).catch(e => console.log(e))
                    }
                }).catch(e => console.log(e))
            }

            if (signal.ice) {
                connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e => console.log(e))
            }
        }
    }




    let connectToSocketServer = () => {
        socketRef.current = io.connect(server_url, { secure: false })

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on('connect', () => {
            socketRef.current.emit('join-call', window.location.href)
            socketIdRef.current = socketRef.current.id

            socketRef.current.on('chat-message', addMessage)

            socketRef.current.on('user-left', (id) => {
                setVideos((videos) => videos.filter((video) => video.socketId !== id))
                setParticipantCount(prev => prev - 1)
                setParticipants(prev => prev.filter(p => p.id !== id))
                // If the user who left was screen sharing, stop screen share
                if (screenShareUser && screenShareUser !== 'You') {
                    setIsScreenSharing(false)
                    setScreenShareStream(null)
                    setScreenShareUser(null)
                }
            })
            
            // Screen share events
            socketRef.current.on('screen-share-started', (userId) => {
                if (userId !== socketIdRef.current) {
                    setScreenShareUser(`Participant ${userId.substring(0, 6)}`)
                }
            })
            
            socketRef.current.on('screen-share-ended', (userId) => {
                if (userId !== socketIdRef.current) {
                    setIsScreenSharing(false)
                    setScreenShareStream(null)
                    setScreenShareUser(null)
                }
            })

            socketRef.current.on('user-joined', (id, clients) => {
                setParticipantCount(clients.length);
                
                // Update participants list
                const participantsList = clients.map(clientId => ({
                    id: clientId,
                    name: clientId === socketIdRef.current ? username : `Participant ${clientId.substring(0, 6)}`
                }));
                setParticipants(participantsList);
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)
                    // Wait for their ice candidate       
                    connections[socketListId].onicecandidate = function (event) {
                        if (event.candidate != null) {
                            socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }))
                        }
                    }

                    // Wait for their video stream
                    connections[socketListId].onaddstream = (event) => {
                        console.log("BEFORE:", videoRef.current);
                        console.log("FINDING ID: ", socketListId);

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            console.log("FOUND EXISTING");

                            // Update the stream of the existing video
                            setVideos(videos => {
                                const updatedVideos = videos.map(video =>
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        } else {
                            // Create a new video
                            console.log("CREATING NEW");
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoplay: true,
                                playsinline: true
                            };

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };


                    // Add the local video stream
                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream)
                    } else {
                        let blackSilence = (...args) => new MediaStream([black(...args), silence()])
                        window.localStream = blackSilence()
                        connections[socketListId].addStream(window.localStream)
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {
                        if (id2 === socketIdRef.current) continue

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) { }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit('signal', id2, JSON.stringify({ 'sdp': connections[id2].localDescription }))
                                })
                                .catch(e => console.log(e))
                        })
                    }
                }
            })
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator()
        let dst = oscillator.connect(ctx.createMediaStreamDestination())
        oscillator.start()
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }
    let black = ({ width = 640, height = 480 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height })
        canvas.getContext('2d').fillRect(0, 0, width, height)
        let stream = canvas.captureStream()
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let handleVideo = () => {
        setVideo(!video);
        if (!screen) {
            getUserMedia();
        } else {
            // When screen sharing, toggle camera for self video only
            if (!video) {
                // Turn on camera - get camera stream for self video
                navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                    .then(stream => {
                        if (localVideoref.current) {
                            localVideoref.current.srcObject = stream;
                        }
                    })
                    .catch(e => console.log(e));
            } else {
                // Turn off camera - stop self video
                if (localVideoref.current && localVideoref.current.srcObject) {
                    localVideoref.current.srcObject.getTracks().forEach(track => track.stop());
                    localVideoref.current.srcObject = null;
                }
            }
        }
    }
    let handleAudio = () => {
        setAudio(!audio);
        if (!screen) {
            getUserMedia();
        }
    }

    useEffect(() => {
        if (screen !== undefined) {
            getDislayMedia();
        }
    }, [screen])
    
    useEffect(() => {
        if (screenShareStream && screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = screenShareStream;
        }
    }, [screenShareStream])
    let handleScreen = () => {
        if (screen) {
            // Stop screen sharing
            try {
                if (screenShareVideoRef.current && screenShareVideoRef.current.srcObject) {
                    screenShareVideoRef.current.srcObject.getTracks().forEach(track => track.stop())
                }
                setIsScreenSharing(false)
                setScreenShareStream(null)
                setScreenShareUser(null)
                setIsScreenShareMaximized(false)
                socketRef.current.emit('screen-share-ended', socketIdRef.current)
                
                // Restore camera stream
                if (cameraStream) {
                    window.localStream = cameraStream
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = cameraStream
                    }
                    setCameraStream(null)
                }
            } catch (e) { console.log(e) }
        }
        setScreen(!screen);
    }
    
    let toggleScreenShareSize = () => {
        setIsScreenShareMaximized(!isScreenShareMaximized);
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoref.current.srcObject.getTracks()
            tracks.forEach(track => track.stop())
        } catch (e) { }
        window.location.href = "/"
    }

    let openChat = () => {
        setModal(true);
        setNewMessages(0);
    }
    let closeChat = () => {
        setModal(false);
    }
    let handleMessage = (e) => {
        setMessage(e.target.value);
    }

    const addMessage = (data, sender, socketIdSender) => {
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data }
        ]);
        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    };



    let sendMessage = () => {
        console.log(socketRef.current);
        socketRef.current.emit('chat-message', message, username)
        setMessage("");

        // this.setState({ message: "", sender: username })
    }

    
    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    const copyRoomId = async () => {
        const roomId = window.location.pathname.substring(1);
        try {
            await navigator.clipboard.writeText(roomId);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy room ID:', err);
        }
    }


    return (
        <div>

            {askForUsername === true ?

                <div className={modernStyles.modernContainer}>
                    <div className={modernStyles.glassCard}>
                        <div className={modernStyles.brandSection}>
                            <div className={modernStyles.logo}>
                                <SkyConnectLogo size={64} animated={true} />
                            </div>
                            <h1 className={modernStyles.brandTitle}>Join Meeting</h1>
                            <p className={modernStyles.brandSubtitle}>Enter your name to join the video call</p>
                        </div>
                        
                        <div className={modernStyles.formSection}>
                            <div className={modernStyles.inputGroup}>
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    className={modernStyles.modernInput}
                                    onKeyPress={(e) => e.key === 'Enter' && username.trim() && connect()}
                                />
                            </div>
                            
                            <button 
                                onClick={connect}
                                disabled={!username.trim()}
                                className={modernStyles.primaryButton}
                            >
                                Join Meeting
                            </button>
                        </div>
                        
                        <div style={{ marginTop: '24px', textAlign: 'center' }}>
                            <video 
                                ref={localVideoref} 
                                autoPlay 
                                muted
                                style={{
                                    width: '320px',
                                    height: '180px',
                                    borderRadius: '12px',
                                    background: '#3c4043',
                                    border: '2px solid rgba(255, 255, 255, 0.2)'
                                }}
                            ></video>
                        </div>
                    </div>
                </div> :


                <div className={styles.meetVideoContainer}>
                    
                    {/* Screen Share Panel */}
                    {(isScreenSharing || screenShareUser) && (
                        <ScreenSharePanel
                            isMaximized={isScreenShareMaximized}
                            onToggleSize={toggleScreenShareSize}
                            onClose={handleScreen}
                            screenShareUser={screenShareUser}
                        >
                            {screenShareUser === 'You' ? (
                                <video 
                                    ref={ref => {
                                        if (ref && screenShareStream) {
                                            ref.srcObject = screenShareStream;
                                        }
                                        screenShareVideoRef.current = ref;
                                    }}
                                    autoPlay 
                                    muted 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                videos.map((video) => (
                                    video.socketId === screenShareUser?.replace('Participant ', '') && (
                                        <video
                                            key={video.socketId}
                                            ref={ref => {
                                                if (ref && video.stream) {
                                                    ref.srcObject = video.stream;
                                                }
                                            }}
                                            autoPlay
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )
                                ))
                            )}
                        </ScreenSharePanel>
                    )}
                    
                    {/* Google Meet Header */}
                    <div className={styles.meetHeader}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px' }}>SkyConnect Meeting</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <PeopleIcon fontSize="small" />
                                <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '14px', opacity: 0.8 }}>Room: {window.location.pathname.substring(1)}</span>
                                <IconButton 
                                    onClick={copyRoomId}
                                    style={{ 
                                        color: copySuccess ? '#4caf50' : 'white',
                                        padding: '4px'
                                    }}
                                    title={copySuccess ? 'Copied!' : 'Copy Room ID'}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </div>
                            <IconButton 
                                onClick={() => setShowParticipants(!showParticipants)} 
                                style={{ 
                                    color: 'white',
                                    backgroundColor: showParticipants ? 'rgba(76, 175, 80, 0.3)' : 'transparent'
                                }}
                            >
                                <PeopleIcon />
                            </IconButton>
                            <IconButton onClick={() => setIsFullScreen(!isFullScreen)} style={{ color: 'white' }}>
                                {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                            </IconButton>
                        </div>
                    </div>

                    {/* Participants Panel */}
                    <div className={`${styles.participantsPanel} ${showParticipants ? styles.open : ''}`}>
                        <div className={styles.participantsHeader}>
                            <h3>Participants ({participantCount})</h3>
                        </div>
                        <div className={styles.participantsList}>
                            {participants.map((participant) => (
                                <div 
                                    key={participant.id} 
                                    className={`${styles.participantItem} ${participant.id === socketIdRef.current ? styles.self : ''}`}
                                >
                                    <div className={styles.participantAvatar}>
                                        {participant.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.participantInfo}>
                                        <p className={styles.participantName}>
                                            {participant.name}
                                            {participant.id === socketIdRef.current && ' (You)'}
                                        </p>
                                        <p className={styles.participantStatus}>
                                            {participant.id === socketIdRef.current ? 'Host' : 'Participant'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                                    {showModal && (
                        <div className={`${styles.chatRoom} ${showModal ? styles.open : ''}`}>
                            <div className={styles.chatHeader}>
                                <h3>Chat</h3>
                                <IconButton onClick={closeChat} size="small">
                                    <CloseIcon />
                                </IconButton>
                            </div>
                            
                            <div className={styles.chatMessages}>
                                {messages.length !== 0 ? messages.map((item, index) => (
                                    <div className={styles.chatMessage} key={index}>
                                        <div className={styles.chatSender}>{item.sender}</div>
                                        <p className={styles.chatText}>{item.data}</p>
                                    </div>
                                )) : (
                                    <div className={styles.chatMessage}>
                                        <p className={styles.chatText}>No messages yet</p>
                                    </div>
                                )}
                            </div>
                            
                            <div className={styles.chatInput}>
                                <TextField 
                                    value={message} 
                                    onChange={handleMessage}
                                    placeholder="Type a message..."
                                    variant="outlined"
                                    size="small"
                                    fullWidth
                                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                />
                                <Button 
                                    variant="contained" 
                                    onClick={sendMessage}
                                    disabled={!message.trim()}
                                    size="small"
                                >
                                    Send
                                </Button>
                            </div>
                        </div>
                    )}


                    <div className={styles.buttonContainers}>
                        <button 
                            className={`${styles.controlButton} ${video ? styles.active : ''}`}
                            onClick={handleVideo}
                            title={video ? 'Turn off camera' : 'Turn on camera'}
                        >
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </button>
                        
                        <button 
                            className={`${styles.controlButton} ${audio ? styles.active : ''}`}
                            onClick={handleAudio}
                            title={audio ? 'Mute microphone' : 'Unmute microphone'}
                        >
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </button>

                        {screenAvailable && (
                            <button 
                                className={`${styles.controlButton} ${screen ? styles.active : ''}`}
                                onClick={handleScreen}
                                title={screen ? 'Stop sharing' : 'Share screen'}
                            >
                                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                            </button>
                        )}

                        <button 
                            className={`${styles.controlButton} ${showModal ? styles.active : ''}`}
                            onClick={() => setModal(!showModal)}
                            title="Toggle chat"
                            style={{ position: 'relative' }}
                        >
                            <ChatIcon />
                            {newMessages > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    background: '#ea4335',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '16px',
                                    height: '16px',
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {newMessages}
                                </span>
                            )}
                        </button>

                        <button 
                            className={`${styles.controlButton} ${styles.endCall}`}
                            onClick={handleEndCall}
                            title="End call"
                        >
                            <CallEndIcon />
                        </button>
                    </div>


                    <div className={styles.selfVideoContainer}>
                        <video 
                            className={styles.meetUserVideo} 
                            ref={localVideoref}
                            autoPlay 
                            muted
                        ></video>
                        <div className={styles.selfVideoLabel}>
                            {username || 'You'}
                        </div>
                    </div>

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div key={video.socketId} className={styles.videoTile}>
                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                    playsInline
                                >
                                </video>
                                <div className={styles.participantLabel}>
                                    Participant {video.socketId.substring(0, 6)}
                                </div>
                            </div>
                        ))}
                    </div>

                </div>

            }

        </div>
    )
}
