import { useRef, useEffect, useState } from 'react';
import './App.css';
import * as faceapi from '@vladmandic/face-api';

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const inputRef = useRef(null);

  const [videoWidth, setVideoWidth] = useState(null);
  const [videoHeight, setVideoHeight] = useState(null);

  const [people, setPeople] = useState();
  const [time, setTime] = useState(new Date());
  const [videoURL, setVideoURL] = useState(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // LOAD FROM USEEFFECT
  useEffect(() => {
    if (videoLoaded) {
      loadModels();
    }
  }, [videoLoaded]);

  // LOAD MODELS FROM FACE API

  // HANDLE VIDEO UPLOAD
  const handleUpload = (event) => {
    const file = event.target.files[0];
    const video = document.createElement('video');
    video.onloadedmetadata = () => {
      setVideoWidth(video.videoWidth);
      setVideoHeight(video.videoHeight);
    };
    const videoURL = URL.createObjectURL(file);
    setVideoURL(videoURL);
    setVideoLoaded(true);
  };

  const startVideo = () => {
    videoRef.current.play();
  };

  const loadModels = () => {
    Promise.all([
      // THIS FOR FACE DETECT AND LOAD FROM YOU PUBLIC/MODELS DIRECTORY

      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      // faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]).then(() => {
      console.log('MODEL LOADED');
      startVideo();

      faceMyDetect();
    });
  };

  const getLabeledFaceDescriptions = async () => {
    const labels = ['goslyng'];
    const descriptions = [];
    for (const label of labels) {
      const descriptionsForLabel = [];
      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(`/labels/${label}/${i}.png`);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptionsForLabel.push(detections.descriptor);
      }
      descriptions.push(new faceapi.LabeledFaceDescriptors(label, descriptionsForLabel));
    }
    startVideo();

    return descriptions;
  };

  const faceMyDetect = async () => {
    console.log('faceMyDetect start');

    // const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    // console.log('getLabeledFaceDescriptions start');

    // const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
    // console.log('FaceMatcher start');
    setInterval(async () => {
      // console.log('faceMyDetect Interval');

      // console.log(videoRef.current);
      console.log(videoURL);

      const videoEl = videoRef.current;

      const detections = await faceapi
        .detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      canvasRef.current.getContext('2d').clearRect(0, 0, 480, 640);

      const resizedDetections = faceapi.resizeResults(detections, {
        width: 480,
        height: 640,
      });
      // const results = resizedDetections.map((d) => faceMatcher.findBestMatch(d.descriptor));
      const results = resizedDetections;
      results.forEach((result, i) => {
        setPeople(result.label);
        const box = resizedDetections[i].detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, { label: result.toString() });
        drawBox.draw(canvasRef.current);
      });
    }, 1000 / 30); // Change the interval to whatever value suits your needs
  };

  return (
    <div className="myapp">
      <div>
        <p>
          Width: {videoWidth}, Height: {videoHeight}
        </p>

        <h2>{people + ' ' + time.toLocaleTimeString()}</h2>
      </div>
      <div className="appvide">
        {!videoLoaded && (
          <div>
            <input
              type="file"
              accept="video/*"
              ref={inputRef}
              style={{ display: 'none' }}
              onChange={handleUpload}
            />
            <button onClick={() => inputRef.current.click()}>Вибрати файл</button>
          </div>
        )}
        {videoLoaded && (
          <>
            <video
              crossOrigin="anonymous"
              width="480"
              height="640"
              ref={videoRef}
              src={videoURL}
            ></video>
            <canvas ref={canvasRef} width="480" height="640" className="appcanvas" />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
