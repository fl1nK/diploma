import { useRef, useEffect, useState } from 'react';
import '../App.css';
import * as faceapi from '@vladmandic/face-api';
import { getLabeledFaceDescriptions } from '../actions/face';
import axios from 'axios';
import { useSelector } from 'react-redux';

const Video = () => {
  const token = useSelector((state) => state.auth.token);

  const inputRef = useRef(null);
  const videoRef = useRef();
  const canvasRef = useRef();

  const [videoWidth, setVideoWidth] = useState(null);
  const [videoHeight, setVideoHeight] = useState(null);
  const [videoSource, setVideoSource] = useState(null);

  const [videoLoaded, setVideoLoaded] = useState(false);
  const [intervalId, setIntervalId] = useState(null);

  useEffect(() => {
    loadModels();
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

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
    ]).then(() => true);
  };

  const fetchUser = async (id) => {
    try {
      await axios.post(
        `http://localhost:5000/set-detected-user`,
        {
          id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  const faceMyDetect = async (width, height) => {
    let currentUser = '';

    const faces = await getLabeledFaceDescriptions();

    for (let i = 0; i < faces.length; i++) {
      // Change the face data descriptors from Objects to Float32Array type
      for (let j = 0; j < faces[i].descriptions.length; j++) {
        faces[i].descriptions[j] = new Float32Array(Object.values(faces[i].descriptions[j]));
      }
      faces[i] = new faceapi.LabeledFaceDescriptors(faces[i]._id, faces[i].descriptions);
    }

    const faceMatcher = new faceapi.FaceMatcher(faces);

    const id = setInterval(async () => {
      const videoEl = videoRef.current;

      const detections = await faceapi
        .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);
          // решта вашого коду, що використовує контекст

          const resizedDetections = faceapi.resizeResults(detections, {
            width: width,
            height: height,
          });
          const results = resizedDetections.map((d) => faceMatcher.findBestMatch(d.descriptor));
          // console.log(results);

          // const results = resizedDetections;
          results.forEach((result, i) => {
            // console.log(result.label);

            if (currentUser !== result.label && result.label !== 'unknown') {
              fetchUser(result.label);
              console.log(result.label);
              currentUser = result.label;
            }

            const box = resizedDetections[i].detection.box;
            const drawBox = new faceapi.draw.DrawBox(box, { label: result.label });
            drawBox.draw(canvasRef.current);
          });
        } else {
          console.error('Failed to get 2D context from canvas element');
        }
      } else {
        console.error('Canvas element is not yet available');
      }
    }, 1000 / 30);

    setIntervalId(id);
  };

  return (
    <div className="myapp">
      <br />
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

export default Video;
