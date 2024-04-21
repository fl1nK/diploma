import { useRef, useEffect, useState } from "react";
import "./App.css";
import * as faceapi from "face-api.js";

function App() {
  const videoRef = useRef();
  const canvasRef = useRef();

  const [people, setPeople] = useState();

  // LOAD FROM USEEFFECT
  useEffect(() => {
    startVideo();
    videoRef && loadModels();
  }, []);

  // OPEN YOU FACE WEBCAM
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((currentStream) => {
        videoRef.current.srcObject = currentStream;
      })
      .catch((err) => {
        console.log(err);
      });
  };
  // LOAD MODELS FROM FACE API

  const loadModels = () => {
    Promise.all([
      // THIS FOR FACE DETECT AND LOAD FROM YOU PUBLIC/MODELS DIRECTORY

      faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      // faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]).then(() => {
      faceMyDetect();
    });
  };

  function getLabeledFaceDescriptions() {
    const labels = ["vlad"];
    return Promise.all(
      labels.map(async (label) => {
        const descriptions = [];
        for (let i = 1; i <= 2; i++) {
          const img = await faceapi.fetchImage(`/labels/${label}/${i}.png`);
          // const img = await faceapi.fetchImage(`D:/Диплом/diploma/server/labels/${label}/${i}.png`);
          const detections = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();
          descriptions.push(detections.descriptor);
        }
        return new faceapi.LabeledFaceDescriptors(label, descriptions);
      })
    );
  }

  const faceMyDetect = async () => {
    const labeledFaceDescriptors = await getLabeledFaceDescriptions();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);

    // const canvas = faceapi.createCanvasFromMedia(videoRef.current);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();
      // .withFaceExpressions();

      // DRAW YOU FACE IN WEBCAM
      canvasRef.current.innerHtml = faceapi.createCanvasFromMedia(
        videoRef.current
      );
      faceapi.matchDimensions(canvasRef.current, {
        width: 640,
        height: 480,
      });

      const resized = faceapi.resizeResults(detections, {
        width: 640,
        height: 480,
      });

      canvasRef.current
        .getContext("2d", { willReadFrequently: true })
        .clearRect(0, 0, 640, 480);

      const results = resized.map((d) => {
        return faceMatcher.findBestMatch(d.descriptor);
      });

      // faceapi.draw.drawDetections(canvasRef.current, results);
      // faceapi.draw.drawFaceLandmarks(canvasRef.current, results);
      // faceapi.draw.drawFaceExpressions(canvasRef.current, results);

      results.forEach((result, i) => {
        // console.log(result.label);
        setPeople(result.label);
        const box = resized[i].detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: result,
        });
        drawBox.draw(canvasRef.current);
      });
    }, 1000);
  };

  return (
    <div className="myapp">
      <div>
        <h2>{people}</h2>
      </div>
      <div className="appvide">
        <video crossOrigin="anonymous" ref={videoRef} autoPlay></video>
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          className="appcanvas"
        />
      </div>
    </div>
  );
}

export default App;
