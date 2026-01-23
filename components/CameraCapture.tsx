"use client";

import React, { useRef, useState } from 'react';
import { Camera, RefreshCw, Image as ImageIcon, Loader2, Check, Edit3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 数量と単位を含むように拡張
  const [analysisResult, setAnalysisResult] = useState<{
    name: string, 
    genre: string, 
    expiryDate: string,
    quantity: number,
    unit: string
  } | null>(null);
  
  const [storageType, setStorageType] = useState('冷蔵');

  const resizeImage = (base64Str: string, maxWidth: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("カメラを起動できませんでした。");
      setIsCameraActive(false);
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.8));
    const stream = video.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
    setIsCameraActive(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setCapturedImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    try {
      const resizedImage = await resizeImage(capturedImage, 800);
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: resizedImage }),
      });
      if (!response.ok) throw new Error("解析に失敗しました");
      const data = await response.json();
      setAnalysisResult(data); 
    } catch (error) {
      alert("解析エラーが発生しました。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- 【重要】数量加算・合流ロジック ---
  const saveToSupabase = async () => {
    if (!analysisResult) return;
    setIsAnalyzing(true);

    try {
      // 1. ユーザー情報を取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("ユーザーが見つかりません");

      // 2. プロフィールから現在の所属グループを取得
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      const currentGroupId = profile?.group_id || null;

      // 3. 重複チェック（既存食材を探す）
      // 決定表ルール：共有中ならグループ内で、個人なら自分のデータ内で探す
      let fetchQuery = supabase.from('ingredients').select('id, quantity')
        .eq('name', analysisResult.name)
        .eq('storage_type', storageType)
        .eq('expiry_date', analysisResult.expiryDate);

      if (currentGroupId) {
        fetchQuery = fetchQuery.eq('group_id', currentGroupId);
      } else {
        fetchQuery = fetchQuery.eq('user_id', user.id).is('group_id', null);
      }

      const { data: existingItem, error: fetchError } = await fetchQuery.maybeSingle();
      if (fetchError) throw fetchError;

      if (existingItem) {
        // --- 更新処理 ---
        const { error: updateError } = await supabase
          .from('ingredients')
          .update({ quantity: existingItem.quantity + analysisResult.quantity })
          .eq('id', existingItem.id);
        if (updateError) throw updateError;
        alert(`「${analysisResult.name}」の数量を追加しました！`);
      } else {
        // --- 新規登録処理 ---
        // 【重要】ここで決定表ルール通りのラベルを貼る
        const { error: insertError } = await supabase
          .from('ingredients')
          .insert([{ 
            name: analysisResult.name, 
            genre: analysisResult.genre, 
            quantity: analysisResult.quantity,
            unit: analysisResult.unit,
            expiry_date: analysisResult.expiryDate,
            storage_type: storageType,
            user_id: user.id,        // 誰が登録したか（不変）
            group_id: currentGroupId  // どこに所属するか（個人ならnull）
          }]);
        if (insertError) throw insertError;
        alert(`「${analysisResult.name}」を保存しました！`);
      }
      
      // 成功後のリセット
      setCapturedImage(null);
      setAnalysisResult(null);
      window.location.reload(); 

    } catch (error: any) {
      console.error("Save error:", error);
      alert(`保存に失敗しました: ${error.message || "不明なエラー"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-2xl bg-white shadow-sm w-full max-w-md mx-auto">
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
      
      {!isCameraActive && !capturedImage && (
        <div className="flex flex-col gap-3 w-full py-10">
          <button onClick={startCamera} className="flex items-center justify-center gap-3 bg-orange-500 text-white px-6 py-5 rounded-2xl font-black shadow-lg active:scale-95 transition">
            <Camera size={28} />カメラを起動
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2 text-gray-400 px-6 py-4 rounded-2xl font-bold border-2 border-dashed border-gray-200 active:scale-95 transition text-sm">
            <ImageIcon size={20} />ライブラリから選択
          </button>
        </div>
      )}

      {isCameraActive && (
        <div className="relative w-full aspect-square overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <button onClick={takePhoto} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-white border-4 border-gray-300 rounded-full active:scale-90 shadow-2xl" />
        </div>
      )}

      {capturedImage && (
        <div className="flex flex-col items-center gap-4 w-full">
          {!analysisResult && (
            <div className="relative w-full aspect-square overflow-hidden rounded-2xl shadow-inner border border-gray-100">
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            </div>
          )}
          
          {!analysisResult && (
            <div className="flex gap-2 w-full">
              <button onClick={() => setCapturedImage(null)} disabled={isAnalyzing} className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-500 px-4 py-4 rounded-2xl font-bold text-sm">
                <RefreshCw size={18} /> やり直し
              </button>
              <button onClick={analyzeImage} disabled={isAnalyzing} className="flex-[2] flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-4 rounded-2xl font-black shadow-md active:scale-95 transition">
                {isAnalyzing ? <><Loader2 size={20} className="animate-spin" /> 解析中...</> : "食材を解析する"}
              </button>
            </div>
          )}

          {analysisResult && (
            <div className="w-full p-5 bg-orange-50 rounded-3xl border border-orange-100 space-y-5 animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-orange-800 text-sm flex items-center gap-2">
                  <Edit3 size={16} /> 登録内容の確認
                </h3>
                <input 
                  className="w-20 p-1 text-[10px] bg-orange-200 rounded text-orange-700 font-bold border-none text-center outline-none" 
                  value={analysisResult.genre}
                  onChange={(e) => setAnalysisResult({...analysisResult, genre: e.target.value})}
                />
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-orange-400 font-black ml-1 uppercase">Name</label>
                  <input 
                    className="w-full p-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold shadow-sm" 
                    value={analysisResult.name}
                    onChange={(e) => setAnalysisResult({...analysisResult, name: e.target.value})}
                  />
                </div>

                {/* --- 数量と単位の入力欄を追加 --- */}
                <div className="flex gap-2">
                    <div className="flex-[2]">
                        <label className="text-[10px] text-orange-400 font-black ml-1 uppercase">Quantity</label>
                        <input 
                        type="number"
                        step="0.1" // 小数点（0.5個など）も入力可能に
                        className="w-full p-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold shadow-sm" 
                        value={analysisResult.quantity}
                        onChange={(e) => setAnalysisResult({...analysisResult, quantity: parseFloat(e.target.value) || 0})}
                        />
                    </div>
                    <div className="flex-[2]">
                        <label className="text-[10px] text-orange-400 font-black ml-1 uppercase">Unit</label>
                        <input 
                            list="unit-choices" // datalistと紐付け
                            className="w-full p-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold shadow-sm text-center" 
                            value={analysisResult.unit}
                            onChange={(e) => setAnalysisResult({...analysisResult, unit: e.target.value})}
                            onFocus={(e) => e.target.value = ''} // フォーカス時に一旦空にして候補を出す
                            onBlur={(e) => { if(!e.target.value) e.target.value = analysisResult.unit }} // 何も選ばず離れたら戻す
                            placeholder="単位"
                        />
                        {/* よく使う単位のドロップダウン候補 */}
                        <datalist id="unit-choices">
                        <option value="個" />
                        <option value="本" />
                        <option value="g" />
                        <option value="パック" />
                        <option value="枚" />
                        <option value="袋" />
                        <option value="玉" />
                        <option value="ml" />
                        </datalist>
                    </div>
                    </div>

                <div>
                  <label className="text-[10px] text-orange-400 font-black ml-1 uppercase">Expiry Date</label>
                  <input 
                    type="date"
                    className="w-full p-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm font-bold shadow-sm" 
                    value={analysisResult.expiryDate}
                    onChange={(e) => setAnalysisResult({...analysisResult, expiryDate: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] text-orange-400 font-black ml-1 uppercase">Storage</label>
                  <div className="flex gap-2 mt-1">
                    {['冷蔵', '冷凍', '常温'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setStorageType(type)}
                        className={`flex-1 py-3 rounded-xl font-black text-xs transition-all ${
                          storageType === type 
                            ? 'bg-orange-500 text-white shadow-md' 
                            : 'bg-white text-gray-300 border border-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={saveToSupabase}
                disabled={isAnalyzing}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all mt-2"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" /> : <><Check size={20} /> 冷蔵庫に保存する</>}
              </button>
              
              <button onClick={() => setAnalysisResult(null)} className="w-full text-[10px] text-gray-400 font-bold tracking-widest uppercase">
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}