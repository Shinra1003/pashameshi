"use client";

import React, { useState } from 'react';
import { LayoutGrid, Camera, Utensils, Settings, ShoppingCart } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import IngredientList from '@/components/IngredientList';
import RecipeSuggestion from '@/components/RecipeSuggestion';
import ShoppingList from '@/components/ShoppingList';

export default function Home() {
  const [activeTab, setActiveTab] = useState('inventory');

  // タブに応じたコンテンツを表示
  const renderContent = () => {
    switch (activeTab) {
      case 'inventory':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                📦 在庫管理
              </h2>
              <span className="text-[10px] font-black text-gray-300 bg-gray-100 px-2 py-1 rounded">ALL ITEMS</span>
            </div>
            <IngredientList />
          </div>
        );
      case 'camera':
        return (
          <div className="animate-in zoom-in-95 duration-300">
            <h2 className="text-lg font-bold text-gray-700 mb-4 px-2 flex items-center gap-2">
              📸 食材を登録
            </h2>
            <CameraCapture />
          </div>
        );
      case 'recipe':
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 pb-10">
            <h2 className="text-lg font-black text-gray-800 mb-4 px-2 flex items-center gap-2">
              🍳 レシピ提案
            </h2>
            <RecipeSuggestion />
          </div>
        );
      case 'shopping': // タブ名を shopping に変更した場合
        return (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-lg font-black text-gray-800 mb-4 px-4 flex items-center gap-2">
              🛒 買い物リスト
            </h2>
            <ShoppingList />
          </div>
        );
      case 'settings':
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Settings size={48} className="mb-4 opacity-20" />
            <p className="font-bold">設定</p>
            <p className="text-xs">アカウント管理など</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="p-4 bg-white shadow-sm sticky top-0 z-10 flex justify-center items-center">
        <h1 className="text-xl font-black text-orange-500 flex items-center gap-2">
          パシャ飯 <span className="text-[10px] font-normal text-gray-300 tracking-widest uppercase">Inventory</span>
        </h1>
      </header>

      <div className="max-w-md mx-auto p-4">
        {renderContent()}
      </div>

      {/* 下部ナビゲーションバー */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]">
        <TabButton 
          label="食材管理" 
          icon={<LayoutGrid size={22} />} 
          isActive={activeTab === 'inventory'} 
          onClick={() => setActiveTab('inventory')} 
        />
        <TabButton 
          label="パシャッ！" 
          icon={<Camera size={22} />} 
          isActive={activeTab === 'camera'} 
          onClick={() => setActiveTab('camera')} 
        />
        <TabButton 
          label="レシピ" 
          icon={<Utensils size={22} />} 
          isActive={activeTab === 'recipe'} 
          onClick={() => setActiveTab('recipe')} 
        />
        <TabButton 
          label="買い物リスト" 
          icon={<ShoppingCart size={22} />} 
          isActive={activeTab === 'shopping'} 
          onClick={() => setActiveTab('shopping')} 
        />
        <TabButton 
          label="設定" 
          icon={<Settings size={22} />} 
          isActive={activeTab === 'settings'} 
          onClick={() => setActiveTab('settings')} 
        />
      </nav>
    </main>
  );
}

function TabButton({ label, icon, isActive, onClick }: { label: string, icon: any, isActive: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all duration-300 ${
        isActive ? 'text-orange-500 scale-110' : 'text-gray-300'
      }`}
    >
      {icon}
      <span className="text-[9px] font-black">{label}</span>
    </button>
  );
}