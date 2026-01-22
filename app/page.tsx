import CameraCapture from '@/components/CameraCapture';
import IngredientList from '@/components/IngredientList'; // 追加

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center p-6 pb-20">
      <div className="w-full max-w-md mb-8">
        <h1 className="text-3xl font-extrabold text-orange-500 text-center">
          パシャ飯 📸
        </h1>
        <p className="text-gray-600 text-center text-sm mt-2">
          食材を撮るだけで、賢く管理。
        </p>
      </div>

      <div className="w-full max-w-md space-y-8">
        <CameraCapture />
        
        <div className="pt-4">
          <h2 className="text-lg font-bold text-gray-700 mb-4 px-2">📦 冷蔵庫の中身</h2>
          <IngredientList />
        </div>
      </div>
    </main>
  );
}