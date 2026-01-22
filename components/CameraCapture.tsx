"use client";

import React, { useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // カメラを開始する
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // 背面カメラを優先
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("カメラの起動に失敗しました:", err);
      alert("カメラを起動できませんでした。ブラウザの許可を確認してください。");
      setIsCameraActive(false);
    }
  };

  // シャッターを切る
  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    // 画像をBase64形式（文字列）に変換して保存
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataUrl);
    
    // カメラを止める
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
    setIsCameraActive(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-xl bg-white shadow-sm">
      {/* 1. 初期状態：カメラ起動ボタン */}
      {!isCameraActive && !capturedImage && (
        <button 
          onClick={startCamera}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition"
        >
          <Camera size={24} />
          カメラを起動
        </button>
      )}

      {/* 2. カメラ起動中：映像とシャッターボタン */}
      {isCameraActive && (
        <div className="relative w-full max-w-sm overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full" />
          <button 
            onClick={takePhoto}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-16 h-16 bg-white border-4 border-gray-300 rounded-full active:scale-90 transition"
          />
        </div>
      )}

      {/* 3. 撮影後：プレビューと操作ボタン */}
      {capturedImage && (
        <div className="flex flex-col items-center gap-4">
          <img src={capturedImage} alt="Captured" className="w-full max-w-sm rounded-lg shadow-lg" />
          <div className="flex gap-2">
            <button 
              onClick={() => { setCapturedImage(null); startCamera(); }}
              className="flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg"
            >
              <RefreshCw size={20} />
              撮り直す
            </button>
            <button 
              className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold"
              onClick={() => alert('次はここからGroq APIに送ります！')}
            >
              この食材を解析
            </button>
          </div>
        </div>
      )}
    </div>
  );
}