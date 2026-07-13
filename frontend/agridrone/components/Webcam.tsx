"use client";

import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

interface Detection {
  class: string;
  confidence: number;
  box: number[];
}

interface DetectionResult {
  count: number;
  detections: Detection[];
}

export default function Camera() {

  const webcamRef = useRef<Webcam>(null);

  const [result, setResult] = useState<DetectionResult | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);


  async function detectCabbage() {

    // prevent multiple requests at the same time
    if (detecting) return;

    if (!webcamRef.current) return;


    try {

      setDetecting(true);
      setError(null);


      const image = webcamRef.current.getScreenshot();

      if (!image) return;


      const blob = await fetch(image)
        .then(res => res.blob());


      const formData = new FormData();

      formData.append(
        "file",
        blob,
        "frame.jpg"
      );


      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/detect`,
        {
          method: "POST",
          body: formData,
        }
      );


      if (!response.ok) {
        throw new Error("AI server error");
      }


      const data: DetectionResult =
        await response.json();


      setResult(data);


    } catch (err) {

      console.error(err);

      setError(
        "Unable to connect to AI backend"
      );

    } finally {

      setDetecting(false);

    }
  }



  useEffect(() => {

    const interval = setInterval(() => {

      detectCabbage();

    }, 1500); // every 1.5 seconds


    return () => {
      clearInterval(interval);
    };


  }, [detecting]);



  return (

    <div className="flex flex-col gap-4">


      <div className="relative">

        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            facingMode: "environment",
            width: 640,
            height: 640,
          }}
          className="rounded-xl"
        />


        <div className="absolute top-3 left-3 bg-black/70 text-white px-3 py-1 rounded">

          {detecting
            ? "AI scanning..."
            : "Live AI"
          }

        </div>


      </div>



      {result && (

        <div className="bg-black text-white p-4 rounded-xl">


          <h2 className="font-bold">
            Detection Results
          </h2>


          <p>
            Cabbages detected:
            {" "}
            {result.count}
          </p>


          {result.detections.map(
            (item,index)=>(

              <div key={index}>

                {item.class}
                {" - "}
                {(item.confidence * 100)
                .toFixed(1)}
                %

              </div>

            )
          )}


        </div>

      )}



      {error && (

        <div className="bg-red-600 text-white p-3 rounded">

          {error}

        </div>

      )}


    </div>

  );
}