import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from '../styles/modernGlass.module.css'
import VideocamIcon from '@mui/icons-material/Videocam'
import GroupIcon from '@mui/icons-material/Group'
import SecurityIcon from '@mui/icons-material/Security'
import DevicesIcon from '@mui/icons-material/Devices'
import SkyConnectLogo from '../components/SkyConnectLogo'

export default function LandingPage() {
    const navigate = useNavigate();
    const [roomId, setRoomId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleJoinRoom = async () => {
        if (roomId.trim()) {
            setIsLoading(true);
            await new Promise(resolve => setTimeout(resolve, 600));
            navigate(`/${roomId}`);
        }
    };

    const handleCreateRoom = async () => {
        setIsLoading(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        const newRoomId = Math.random().toString(36).substring(2, 15);
        navigate(`/${newRoomId}`);
    };

    const features = [
        {
            icon: <VideocamIcon />,
            title: "HD Video Calls",
            description: "Crystal clear video quality with real-time communication"
        },
        {
            icon: <GroupIcon />,
            title: "Multi-participant",
            description: "Connect with multiple people in one seamless meeting"
        },
        {
            icon: <SecurityIcon />,
            title: "Secure & Private",
            description: "End-to-end encrypted calls for your privacy"
        },
        {
            icon: <DevicesIcon />,
            title: "Cross Platform",
            description: "Works on all devices - desktop, tablet, and mobile"
        }
    ];

    return (
        <div className={styles.modernContainer}>
            <div className={styles.horizontalLayout}>
                {/* Top - Branding */}
                <div className={styles.brandSection}>
                    <div className={styles.logo}>
                        <SkyConnectLogo size={80} animated={true} />
                    </div>
                    <h1 className={styles.brandTitle}>SkyConnect</h1>
                    <p className={styles.brandSubtitle}>Professional video conferencing platform with crystal-clear HD calls, screen sharing, and real-time collaboration</p>
                </div>
                
                {/* Middle - Meeting Form */}
                <div className={styles.glassCard}>
                    <h2 style={{ color: 'white', marginBottom: '24px', textAlign: 'center' }}>Start Your Meeting</h2>
                    
                    <div className={styles.formSection}>
                        <button 
                            onClick={handleCreateRoom}
                            className={styles.primaryButton}
                            disabled={isLoading}
                        >
                            {isLoading && <div className={styles.loadingSpinner}></div>}
                            Create New Meeting
                        </button>
                        
                        <div className={styles.divider}>
                            <span className={styles.dividerText}>or join existing</span>
                        </div>
                        
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="Enter Meeting ID"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                                className={styles.modernInput}
                                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
                            />
                        </div>
                        
                        <button 
                            onClick={handleJoinRoom}
                            disabled={!roomId.trim() || isLoading}
                            className={styles.secondaryButton}
                        >
                            {isLoading && <div className={styles.loadingSpinner}></div>}
                            Join Meeting
                        </button>
                    </div>
                    
                    <div className={styles.linkText}>
                        <p>Want to save your meetings? <a href="/auth">Sign in</a></p>
                    </div>
                </div>
                
                {/* Bottom - Feature Cards */}
                <div className={styles.featuresGrid}>
                    {features.map((feature, index) => (
                        <div key={index} className={styles.featureCard}>
                            <div className={styles.featureIcon}>
                                {feature.icon}
                            </div>
                            <h3 className={styles.featureTitle}>{feature.title}</h3>
                            <p className={styles.featureDescription}>{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
