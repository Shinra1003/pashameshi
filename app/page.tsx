import CameraCapture from '@/components/CameraCapture';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      {/* 画面のヘッダー（タイトル部分） */}
      <div className="w-full max-w-md mb-8">
        <h1 className="text-3xl font-extrabold text-orange-500 text-center">
          パシャ飯 📸
        </h1>
        <p className="text-gray-600 text-center text-sm mt-2">
          食材を撮るだけで、賢く管理。
        </p>
      </div>

      {/* 先ほど作った「カメラ部品」をここに置く */}
      <div className="w-full max-w-md">
        <CameraCapture />
      </div>

      {/* 将来的にここに在庫一覧（STEP 4）を追加していきます */}
    </main>
  );
}