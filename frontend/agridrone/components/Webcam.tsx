"use client";

import { useRef, useState } from "react";
import Webcam from "react-webcam";

export default function Camera() {
  const webcamRef = useRef<Webcam>(null);
  const [result, setResult] = useState<any>(null);

  async function detectCabbage() {
    if (!webcamRef.current) return;

    const image = webcamRef.current.getScreenshot();

    if (!image) return;

    const blob = await fetch(image).then((res) => res.blob());

    const formData = new FormData();
    formData.append("file", blob, "frame.jpg");


    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/detect`,
      {
        method: "POST",
        body: formData,
      }
    );


    const data = await response.json();

    setResult(data);
  }


  return (
    <div className="flex flex-col gap-4">

      <Webcam
        ref={webcamRef}
        audio={false}
        screenshotFormat="image/jpeg"
        videoConstraints={{
          facingMode: "environment",
        }}
        className="rounded-xl"
      />


      <button
        onClick={detectCabbage}
        className="bg-green-600 text-white px-5 py-3 rounded-lg"
      >
        Detect Cabbage
      </button>


      {result && (
        <div className="text-white bg-black p-4 rounded">
          <p>
            Cabbages detected: {result.count}
          </p>

          <pre>
            {JSON.stringify(result.detections, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
}