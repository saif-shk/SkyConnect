import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Home, Video, Calendar, Clock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { AuthContext } from '../contexts/AuthContext';

const History = () => {
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getHistoryOfUser } = useContext(AuthContext);

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
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #e0f7fa 0%, #b2ebf2 50%, #80deea 100%)'
    }}>
      {/* Navigation Bar */}
      <nav className="px-6 py-4" style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 151, 167, 0.1)'
      }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, #0097a7, #00acc1)',
              boxShadow: '0 4px 12px rgba(0, 151, 167, 0.3)'
            }}>
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold" style={{
              fontFamily: 'Space Grotesk, sans-serif',
              color: '#0097a7'
            }}>SkyConnect</span>
          </div>

          <Button
            data-testid="back-home-btn"
            onClick={() => navigate('/home')}
            variant="ghost"
            className="gap-2"
            style={{ fontFamily: 'Inter, sans-serif', color: '#0097a7' }}
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3" style={{
            fontFamily: 'Space Grotesk, sans-serif',
            color: '#006064'
          }}>Meeting History</h1>
          <p className="text-lg text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
            Review your past meetings and rejoin with a single click
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg font-medium animate-pulse" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Loading meeting history...
            </p>
          </div>
        ) : meetings.length === 0 ? (
          <Card className="text-center py-16" style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.5)'
          }}>
            <CardContent>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{
                background: 'rgba(0, 151, 167, 0.1)'
              }}>
                <Video className="w-10 h-10" style={{ color: '#0097a7' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{
                fontFamily: 'Space Grotesk, sans-serif',
                color: '#006064'
              }}>No meetings yet</h3>
              <p className="text-gray-600 mb-6" style={{ fontFamily: 'Inter, sans-serif' }}>
                Your meeting history will appear here once you join or create a meeting
              </p>
              <Button
                onClick={() => navigate('/home')}
                style={{
                  background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                  fontFamily: 'Inter, sans-serif'
                }}
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
                className="transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.5)'
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{
                          background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                          boxShadow: '0 4px 12px rgba(0, 151, 167, 0.2)'
                        }}>
                          <Video className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold" style={{
                            fontFamily: 'Space Grotesk, sans-serif',
                            color: '#006064'
                          }}>Meeting #{meeting.meetingCode}</h3>
                          <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
                            {meeting.participants || 'N/A'} participants
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4" style={{ marginLeft: '60px' }}>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" style={{ color: '#0097a7' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif' }}>{formatDate(meeting.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" style={{ color: '#0097a7' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif' }}>{formatTime(meeting.date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" style={{ color: '#0097a7' }} />
                          <span style={{ fontFamily: 'Inter, sans-serif' }}>{meeting.duration || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      data-testid={`rejoin-meeting-${meeting._id || meeting.id}-btn`}
                      onClick={() => handleRejoinMeeting(meeting.meetingCode)}
                      className="gap-2 font-medium"
                      style={{
                        background: 'linear-gradient(135deg, #0097a7, #00acc1)',
                        fontFamily: 'Inter, sans-serif',
                        transition: 'all 0.3s ease'
                      }}
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
            <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
              Showing {meetings.length} recent {meetings.length === 1 ? 'meeting' : 'meetings'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
