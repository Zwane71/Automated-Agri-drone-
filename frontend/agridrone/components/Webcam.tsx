"use client";

import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

interface Detection {
  class: string;
  confidence: number;
  box: [number, number, number, number];
}

interface DetectionResult {
  count: number;
  image_width: number;
  image_height: number;
  detections: Detection[];
}

export default function Camera() {
  const webcamRef = useRef<Webcam>(null);

  const [result, setResult] =
    useState<DetectionResult | null>(null);

  const [detecting, setDetecting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  async function detectObjects() {

    // Prevent overlapping AI requests
    if (detecting) return;

    if (!webcamRef.current) return;

    try {

      setDetecting(true);
      setError(null);


      // Capture current camera frame
      const image =
        webcamRef.current.getScreenshot();

      if (!image) return;


      // Convert screenshot to Blob
      const blob =
        await fetch(image).then(
          (res) => res.blob()
        );


      // Prepare request
      const formData =
        new FormData();

      formData.append(
        "file",
        blob,
        "frame.jpg"
      );


      // Send frame to FastAPI
      const response =
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/detect`,
          {
            method: "POST",
            body: formData,
          }
        );


      if (!response.ok) {
        throw new Error(
          `AI server returned ${response.status}`
        );
      }


      // Get detection results
      const data: DetectionResult =
        await response.json();


      setResult(data);

    } catch (err) {

      console.error(
        "Detection error:",
        err
      );

      setError(
        "Unable to connect to AI backend"
      );

    } finally {

      setDetecting(false);

    }
  }


  // Run detection every 1.5 seconds
  useEffect(() => {

    const interval =
      setInterval(() => {

        detectObjects();

      }, 1500);


    return () => {
      clearInterval(interval);
    };

  }, [detecting]);


  return (

    <div className="flex flex-col gap-4">


      {/* CAMERA */}
      <div
        className="
          relative
          w-full
          max-w-2xl
          overflow-hidden
          rounded-xl
        "
      >

        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"

          videoConstraints={{
            facingMode: "environment",
            width: 640,
            height: 640,
          }}

          className="
            w-full
            rounded-xl
          "
        />


        {/* BOUNDING BOXES */}

        {result?.detections.map(
          (detection, index) => {

            const [
              x1,
              y1,
              x2,
              y2
            ] = detection.box;


            /*
             * Convert actual YOLO coordinates
             * into percentages.
             */

            const left =
              (x1 /
                result.image_width) *
              100;

            const top =
              (y1 /
                result.image_height) *
              100;

            const width =
              ((x2 - x1) /
                result.image_width) *
              100;

            const height =
              ((y2 - y1) /
                result.image_height) *
              100;


            return (

              <div
                key={index}

                className="
                  absolute
                  border-2
                  border-green-500
                  pointer-events-none
                "

                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                }}
              >

                {/* DETECTION LABEL */}

                <div
                  className="
                    absolute
                    -top-7
                    left-0
                    whitespace-nowrap
                    rounded
                    bg-green-500
                    px-2
                    py-1
                    text-xs
                    font-bold
                    text-black
                  "
                >

                  {detection.class}

                  {" "}

                  {(
                    detection.confidence *
                    100
                  ).toFixed(1)}

                  %

                </div>

              </div>

            );

          }
        )}


        {/* AI STATUS */}

        <div
          className="
            absolute
            top-3
            left-3
            rounded
            bg-black/70
            px-3
            py-1
            text-sm
            text-white
          "
        >

          {detecting
            ? "AI scanning..."
            : "Live AI"
          }

        </div>


        {/* OBJECT COUNT */}

        {result && (

          <div
            className="
              absolute
              bottom-3
              left-3
              rounded-lg
              bg-black/70
              px-3
              py-2
              text-white
            "
          >

            Objects detected:

            {" "}

            <span className="font-bold">
              {result.count}
            </span>

          </div>

        )}

      </div>


      {/* DETECTION RESULTS */}

      {result && (

        <div
          className="
            rounded-xl
            bg-black
            p-4
            text-white
          "
        >

          <h2
            className="
              mb-3
              text-lg
              font-bold
            "
          >
            Detection Results
          </h2>


          <p className="mb-3">

            Objects detected:

            {" "}

            <strong>
              {result.count}
            </strong>

          </p>


          {/* ALL DETECTED OBJECTS */}

          <div className="flex flex-col gap-2">

            {result.detections.map(
              (item, index) => (

                <div
                  key={index}

                  className="
                    rounded
                    bg-gray-800
                    p-2
                  "
                >

                  <div
                    className="
                      flex
                      justify-between
                    "
                  >

                    <span
                      className="
                        font-medium
                        capitalize
                      "
                    >
                      {item.class}
                    </span>


                    <span>
                      {(
                        item.confidence *
                        100
                      ).toFixed(1)}
                      %
                    </span>

                  </div>

                </div>

              )
            )}

          </div>

        </div>

      )}


      {/* ERROR */}

      {error && (

        <div
          className="
            rounded
            bg-red-600
            p-3
            text-white
          "
        >
          {error}
        </div>

      )}

    </div>
  );
}
