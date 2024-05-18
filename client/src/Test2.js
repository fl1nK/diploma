import { useRef, useEffect, useState } from 'react';
import './App.css';
import * as faceapi from '@vladmandic/face-api';
import { detectFace } from './actions/face';
import axios from 'axios';

const VideoUploader = () => {
  const inputRef = useRef(null);
  const videoRef = useRef();
  const canvasRef = useRef();

  const [videoWidth, setVideoWidth] = useState(null);
  const [videoHeight, setVideoHeight] = useState(null);
  const [videoSource, setVideoSource] = useState(null);

  const [videoLoaded, setVideoLoaded] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      const aspectRatio = video.videoWidth / video.videoHeight;
      const limitedHeight = 500;
      const calculatedWidth = aspectRatio * limitedHeight;
      setVideoWidth(calculatedWidth);
      setVideoHeight(limitedHeight);
      faceMyDetect(calculatedWidth, limitedHeight);
    };
    video.src = URL.createObjectURL(file);

    setVideoSource(URL.createObjectURL(file));
    setVideoLoaded(true);
  };

  const loadModels = () => {
    Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    ]);
  };
  loadModels();

  const faceMyDetect = async (width, height) => {
    setInterval(async () => {
      const videoEl = videoRef.current;
      console.log(videoEl);

      const detections = await detectFace(videoEl);

      canvasRef.current.getContext('2d').clearRect(0, 0, width, height);

      const resizedDetections = faceapi.resizeResults(detections, { width: width, height: height });
      const results = resizedDetections;
      results.forEach((result, i) => {
        const box = resizedDetections[i].detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
        drawBox.draw(canvasRef.current);
      });
    }, 1000 / 30);
  };

  const handleTest = async () => {
    const detections = await detectFace('hello');
    console.log(detections);
  };

  const sendMessageToServer = async (message) => {
    try {
      console.log('Sending message to server:', message);

      const response = await axios.post('http://localhost:5000/send-message', { message });

      return response.data;
    } catch (error) {
      console.error('Error sending message to server:', error);
    }
  };

  // Коли користувач клікає на кнопку "Відправити повідомлення"
  const handleSendMessage = async () => {
    const message = 'Це тестове повідомлення до сервера';
    const result = await sendMessageToServer(message);
    console.log(result);
  };

  return (
    <div className="myapp">
      <p>
        Video dimensions: {videoWidth}x{videoHeight}
      </p>
      <button onClick={handleTest}>Тест</button>
      <div className="appvide">
        {!videoLoaded && (
          <div>
            <input
              type="file"
              accept="video/*"
              ref={inputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button onClick={() => inputRef.current.click()}>Вибрати файл</button>
          </div>
        )}
        {videoSource && (
          <>
            <video className="video" ref={videoRef} muted autoPlay>
              <source src={videoSource} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <canvas className="appcanvas" ref={canvasRef} width={videoWidth} height={videoHeight} />
          </>
        )}
      </div>
    </div>
  );
};

export default VideoUploader;
