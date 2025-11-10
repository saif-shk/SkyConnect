import * as React from 'react';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/modernGlass.module.css';
import SkyConnectLogo from '../components/SkyConnectLogo';

export default function Authentication() {
    const navigate = useNavigate();
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [error, setError] = React.useState('');
    const [message, setMessage] = React.useState('');
    const [formState, setFormState] = React.useState(0);
    const [isLoading, setIsLoading] = React.useState(false);

    const { handleRegister, handleLogin } = React.useContext(AuthContext);

    let handleAuth = async () => {
        try {
            setIsLoading(true);
            setError('');
            
            if (formState === 0) {
                let result = await handleLogin(username, password);
                setMessage('Login successful!');
            }
            if (formState === 1) {
                let result = await handleRegister(name, username, password);
                setUsername("");
                setMessage(result);
                setError("")
                setFormState(0)
                setPassword("")
                setName("");
            }
        } catch (err) {
            let message = err.response?.data?.message || 'An error occurred';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={styles.modernContainer}>
            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: 'white',
                    cursor: 'pointer',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
                onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
            >
                <ArrowBackIcon />
            </button>

            <div className={styles.glassCard}>
                <div className={styles.brandSection}>
                    <div className={styles.logo}>
                        <SkyConnectLogo size={64} animated={true} />
                    </div>
                    <h1 className={styles.brandTitle}>SkyConnect</h1>
                    <p className={styles.brandSubtitle}>
                        {formState === 0 ? 'Sign in to your account' : 'Create your account'}
                    </p>
                </div>

                {/* Form Toggle */}
                <div style={{
                    display: 'flex',
                    marginBottom: '24px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <button
                        onClick={() => setFormState(0)}
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            background: formState === 0 ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                            border: 'none',
                            color: 'white',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => setFormState(1)}
                        style={{
                            flex: 1,
                            padding: '12px 24px',
                            background: formState === 1 ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
                            border: 'none',
                            color: 'white',
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: '500',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Sign Up
                    </button>
                </div>

                <div className={styles.formSection}>
                    {formState === 1 && (
                        <div className={styles.inputGroup}>
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={styles.modernInput}
                            />
                        </div>
                    )}

                    <div className={styles.inputGroup}>
                        <input
                            type="text"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.modernInput}
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.modernInput}
                            onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                        />
                    </div>

                    {error && (
                        <div className={styles.errorMessage}>
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className={styles.successMessage}>
                            {message}
                        </div>
                    )}

                    <button
                        onClick={handleAuth}
                        disabled={isLoading}
                        className={styles.primaryButton}
                    >
                        {isLoading && <div className={styles.loadingSpinner}></div>}
                        {formState === 0 ? 'Sign In' : 'Create Account'}
                    </button>
                </div>

                <div className={styles.linkText}>
                    <p>
                        {formState === 0 ? (
                            <>New to SkyConnect? <a href="#" onClick={() => setFormState(1)}>Get started</a></>
                        ) : (
                            <>Already have an account? <a href="#" onClick={() => setFormState(0)}>Sign in</a></>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}