"use client";

import React, { useRef, useState } from 'react';
import { Camera, RefreshCw, Image as ImageIcon, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // インポートパスを統一

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("カメラの起動に失敗しました:", err);
      alert("カメラを起動できませんでした。ブラウザの設定で許可されているか確認してください。");
      setIsCameraActive(false);
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(dataUrl);
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
    setIsCameraActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage }),
      });

      if (!response.ok) throw new Error("解析に失敗しました");
      const data = await response.json();
      
      // Supabaseへの保存
      const { error: supabaseError } = await supabase
        .from('ingredients')
        .insert([
          { 
            name: data.name, 
            genre: data.genre, 
            expiry_date: data.expiryDate // API側で作成した日付キーを使用
          }
        ]);

      if (supabaseError) throw supabaseError;

      alert(`保存完了！\n食材: ${data.name}`);
      setCapturedImage(null);
      window.location.reload(); // 保存後に一覧を更新
      
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-xl bg-white shadow-sm w-full max-w-md mx-auto">
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      {!isCameraActive && !capturedImage && (
        <div className="flex flex-col gap-3 w-full">
          <button onClick={startCamera} className="flex items-center justify-center gap-2 bg-orange-500 text-white px-6 py-4 rounded-xl font-bold active:scale-95 transition shadow-md">
            <Camera size={24} />カメラで撮る
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-4 rounded-xl font-bold border-2 border-dashed border-gray-300 active:scale-95 transition">
            <ImageIcon size={24} />ライブラリから選ぶ
          </button>
        </div>
      )}
      {isCameraActive && (
        <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <button onClick={takePhoto} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-white border-4 border-gray-300 rounded-full active:scale-90 shadow-2xl" />
        </div>
      )}
      {capturedImage && (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="relative w-full aspect-square overflow-hidden rounded-lg shadow-inner">
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2 w-full">
            <button onClick={() => setCapturedImage(null)} disabled={isAnalyzing} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-bold disabled:opacity-50">
              <RefreshCw size={20} />やり直す
            </button>
            <button onClick={analyzeImage} disabled={isAnalyzing} className="flex-[2] flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-xl font-bold shadow-md active:scale-95 transition disabled:opacity-50">
              {isAnalyzing ? <><Loader2 size={20} className="animate-spin" />解析中...</> : "この食材を解析"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}