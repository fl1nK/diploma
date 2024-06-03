import React, { useEffect, useRef, useState } from 'react';

const WebCamera = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detections, setDetections] = useState(null);
  const [ws, setWs] = useState(null);

  useEffect(() => {
    // Start video stream
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
    });

    // Setup WebSocket connection
    const websocket = new WebSocket('ws://localhost:5001');
    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // console.log(data);
      setDetections(data);
    };
    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, []);

  const sendFrame = () => {
    if (videoRef.current && ws) {
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (ws.readyState === WebSocket.OPEN) {
          blob.arrayBuffer().then((buffer) => {
            ws.send(buffer);
          });
        }
      }, 'image/jpeg'); // Send the frame as a JPEG image
    }
  };

  useEffect(() => {
    const interval = setInterval(sendFrame, 1000); // Send a frame every 100ms
    return () => clearInterval(interval);
  }, [ws]);

  return (
    <div className="video__container">
      <video className="video" ref={videoRef} autoPlay width="640" height="480" />
      <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
      <div>{detections && detections.user && <h1>Виявлений робітник: {detections.user}</h1>}</div>
    </div>
  );
};

export default WebCamera;
