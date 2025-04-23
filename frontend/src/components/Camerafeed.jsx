import { useState, useEffect, useRef } from 'react';
import { useAuth0 } from "@auth0/auth0-react";

const CameraFeed = () => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, capturing, success, error
  const [popup, setPopup] = useState({
    show: false,
    success: false,
    message: ''
  });
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { user, isAuthenticated } = useAuth0();

  const startCamera = async () => {
    setError(null);
    setLoading(true);
    setStatus('idle');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraOn(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setError('Error accessing the camera. Please ensure camera permissions are granted.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setStatus('idle');
    setError(null);
  };

  const captureSingleImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready.');
      return;
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!video.videoWidth || !video.videoHeight) {
      setError('Video dimensions not available.');
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      setStatus('capturing');

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((blobResult) => {
          if (blobResult) resolve(blobResult);
          else reject(new Error('Failed to get image blob.'));
        }, 'image/jpeg', 0.9);
      });

      const fileName = isAuthenticated
        ? `${user.nickname}.jpg`
        : `anonymous.jpg`;

      const formData = new FormData();
      formData.append('image', blob, fileName);

      const response = await fetch('http://localhost:3000/api/uploads', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('success');
        setPopup({
          show: true,
          success: true,
          message: result.message
        });
      } else {
        setStatus('error');
        setPopup({
          show: true,
          success: false,
          message: result.message || 'Attendance failed'
        });
      }
    } catch (err) {
      console.error('Capture error:', err);
      setError(`Capture failed: ${err.message}`);
      setStatus('error');
      setPopup({
        show: true,
        success: false,
        message: `Error: ${err.message}`
      });
    }
  };

  const toggleCamera = () => (isCameraOn ? stopCamera() : startCamera());

  useEffect(() => () => stopCamera(), []);

  const getStatusColor = () => {
    switch (status) {
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      case 'capturing': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success': return 'Image Captured!';
      case 'error': return 'Capture Error';
      case 'capturing': return 'Capturing...';
      case 'idle': return 'Ready';
      default: return 'Status Unknown';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6">
          <h2 className="text-3xl font-bold mb-6 text-center">Single Image Capture</h2>

          <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-lg overflow-hidden shadow-lg bg-gray-100">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}

            {error && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-100 z-10">
                <p className="text-red-600 text-center p-4">{error}</p>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${!isCameraOn || loading ? 'opacity-0' : 'opacity-100'}`}
              aria-label="Live camera feed"
            />

            {!isCameraOn && !loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <p className="text-gray-500">Camera is off</p>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />

            <div className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-full text-white text-sm font-medium ${getStatusColor()} transition-colors duration-300 z-10`}>
              {getStatusText()}
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <button
              onClick={toggleCamera}
              disabled={loading || status === 'capturing'}
              className={`px-8 py-4 rounded-lg shadow-lg text-lg font-semibold w-full sm:w-auto transition-all duration-300 ${
                loading || status === 'capturing'
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isCameraOn
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {loading ? 'Starting...' : isCameraOn ? 'Stop Camera' : 'Start Camera'}
            </button>

            <button
              onClick={captureSingleImage}
              disabled={!isCameraOn || status === 'capturing' || loading}
              className={`px-8 py-4 rounded-lg shadow-lg text-lg font-semibold w-full sm:w-auto transition-all duration-300 ${
                (!isCameraOn || status === 'capturing' || loading)
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {status === 'capturing' ? 'Capturing...' : 'Capture Image'}
            </button>
          </div>

          <div className="mt-6 text-center text-gray-600">
            <p className="text-sm">
              {isCameraOn
                ? 'Click "Capture Image" to take a photo.'
                : 'Click "Start Camera" to begin.'}
            </p>
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {popup.show && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm text-center">
            <h3 className={`text-xl font-bold mb-4 ${popup.success ? 'text-green-600' : 'text-red-600'}`}>
              {popup.success ? 'Success' : 'Oops'}
            </h3>
            <p className="mb-6">{popup.message}</p>
            <button
              onClick={() => setPopup(p => ({ ...p, show: false }))}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraFeed;
