
"use client";

import { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

interface Detection {
  class: string;
  confidence: number;
  box: [number, number, number, number];
}

interface DiseaseDetection {
  disease: string;
  confidence: number;
  box: [number, number, number, number];
  mask_pixels?: number;
  affected_area_percent?: number;
}

interface DetectionResult {
  image_width: number;
  image_height: number;

  cabbage_count: number;
  cabbage_detections: Detection[];

  disease_count: number;
  diseases: DiseaseDetection[];
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

      // Get AI results
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


        {/* CABBAGE BOUNDING BOXES */}
        {result?.cabbage_detections.map(
          (detection, index) => {

            const [
              x1,
              y1,
              x2,
              y2
            ] = detection.box;

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
                key={`cabbage-${index}`}
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
                  {detection.class}{" "}
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


        {/* DISEASE BOUNDING BOXES */}
        {result?.diseases.map(
          (disease, index) => {

            const [
              x1,
              y1,
              x2,
              y2
            ] = disease.box;

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
                key={`disease-${index}`}
                className="
                  absolute
                  border-2
                  border-red-500
                  pointer-events-none
                "
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  width: `${width}%`,
                  height: `${height}%`,
                }}
              >

                <div
                  className="
                    absolute
                    -top-7
                    left-0
                    whitespace-nowrap
                    rounded
                    bg-red-500
                    px-2
                    py-1
                    text-xs
                    font-bold
                    text-white
                  "
                >
                  {disease.disease}{" "}
                  {(
                    disease.confidence *
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
            : "Live AI"}
        </div>


        {/* CABBAGE COUNT */}
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
            Cabbage detected:{" "}
            <span className="font-bold">
              {result.cabbage_count}
            </span>
          </div>
        )}

      </div>


      {/* RESULTS */}
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
              mb-4
              text-lg
              font-bold
            "
          >
            AI Analysis
          </h2>


          {/* CABBAGE SUMMARY */}
          <div
            className="
              mb-4
              rounded-lg
              bg-gray-800
              p-3
            "
          >

            <p>
              Cabbage detected:{" "}
              <strong>
                {result.cabbage_count}
              </strong>
            </p>

          </div>


          {/* CABBAGE DETECTIONS */}
          {result.cabbage_detections.length >
            0 && (
            <div className="mb-4">

              <h3
                className="
                  mb-2
                  font-semibold
                "
              >
                Cabbage
              </h3>

              <div
                className="
                  flex
                  flex-col
                  gap-2
                "
              >

                {result.cabbage_detections.map(
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

                        <span>
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


          {/* DISEASE RESULTS */}
          <div>

            <h3
              className="
                mb-2
                font-semibold
              "
            >
              Disease Analysis
            </h3>


            {result.disease_count === 0 ? (

              <div
                className="
                  rounded
                  bg-gray-800
                  p-3
                  text-gray-300
                "
              >
                No detected disease.
              </div>

            ) : (

              <div
                className="
                  flex
                  flex-col
                  gap-2
                "
              >

                {result.diseases.map(
                  (disease, index) => (

                    <div
                      key={index}
                      className="
                        rounded
                        bg-gray-800
                        p-3
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
                          "
                        >
                          {disease.disease}
                        </span>

                        <span>
                          {(
                            disease.confidence *
                            100
                          ).toFixed(1)}
                          %
                        </span>

                      </div>


                      {disease.affected_area_percent !==
                        undefined && (

                        <p
                          className="
                            mt-1
                            text-sm
                            text-gray-400
                          "
                        >
                          Detected mask area:{" "}
                          {disease.affected_area_percent.toFixed(
                            2
                          )}
                          %
                        </p>

                      )}

                    </div>
                  )
                )}

              </div>

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

