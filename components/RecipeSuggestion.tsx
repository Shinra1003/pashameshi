"use client";

import React, { useState } from 'react';
import { Utensils, Loader2, Sparkles, CheckCircle2, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function RecipeSuggestion() {
  const [recipe, setRecipe] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const getGroupContext = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { user: null, groupId: null };

    const { data: profile } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', user.id)
      .single();

    return { user, groupId: profile?.group_id || null };
  };

  const generateRecipe = async () => {
    setIsLoading(true);
    try {
      const { user, groupId } = await getGroupContext();
      if (!user) return;

      let query = supabase.from('ingredients').select('name, quantity, unit');
      if (groupId) {
        query = query.eq('group_id', groupId);
      } else {
        query = query.eq('user_id', user.id).is('group_id', null);
      }
      
      const { data: ingredients } = await query;
      
      if (!ingredients || ingredients.length === 0) {
        alert("在庫が空っぽです。食材を登録してください！");
        return;
      }

      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });

      const data = await response.json();
      setRecipe(data);
    } catch (error) {
      alert("レシピの作成に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // --- 分数や小数を解析して計算する関数 ---
  const parseAmount = (text: string): number => {
    // 1. 分数 (1/2, 1/4など) を探して小数に変換
    const fractionMatch = text.match(/(\d+)\/(\d+)/);
    if (fractionMatch) {
      return parseFloat(fractionMatch[1]) / parseFloat(fractionMatch[2]);
    }
    // 2. 小数または整数 (0.5, 1など) を抽出
    const numberMatch = text.match(/\d+(\.\d+)?/);
    return numberMatch ? parseFloat(numberMatch[0]) : 0;
  };

  const handleFinishCooking = async () => {
    if (!recipe) return;
    
    const confirmDone = confirm(`「${recipe.title}」を完成させましたか？\n使用した分量を在庫から差し引きます。`);
    if (!confirmDone) return;

    setIsFinishing(true);
    try {
      const { user, groupId } = await getGroupContext();
      if (!user) return;

      let query = supabase.from('ingredients').select('*');
      if (groupId) {
        query = query.eq('group_id', groupId);
      } else {
        query = query.eq('user_id', user.id).is('group_id', null);
      }

      const { data: currentInventory } = await query;
      
      if (currentInventory) {
        for (const item of currentInventory) {
          const usedMaterial = recipe.ingredients.find((ing: string) => ing.includes(item.name));
          
          if (usedMaterial) {
            const usedAmount = parseAmount(usedMaterial);

            if (usedAmount > 0) {
              // 浮動小数点の計算誤差を防ぐため、小数点第2位程度で丸める
              const newQuantity = Math.max(0, Math.round((item.quantity - usedAmount) * 100) / 100);

              if (newQuantity <= 0) {
                await supabase.from('ingredients').delete().eq('id', item.id);
              } else {
                await supabase.from('ingredients').update({ quantity: newQuantity }).eq('id', item.id);
              }
            } else {
              // 数量が特定できない場合はそのまま削除（あるいは警告）
              await supabase.from('ingredients').delete().eq('id', item.id);
            }
          }
        }
        alert("在庫の数量を更新しました！");
      }
      setRecipe(null);
    } catch (error) {
      console.error(error);
      alert("在庫の整理に失敗しました。");
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 pb-10">
      {!recipe && !isLoading && (
        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
          <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="text-orange-500" size={32} />
          </div>
          <h3 className="font-black text-gray-800 mb-2">今日の献立は？</h3>
          <p className="text-[10px] text-gray-400 mb-6 px-10 font-bold uppercase tracking-widest">
            AI analysis of your fridge
          </p>
          <button 
            onClick={generateRecipe}
            className="bg-orange-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-orange-100 active:scale-95 transition-all flex items-center gap-2 mx-auto"
          >
            <Sparkles size={18} /> 献立を提案してもらう
          </button>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Loader2 className="animate-spin text-orange-500 mx-auto mb-4" size={40} />
          <p className="font-black text-gray-400 text-sm animate-pulse tracking-tighter">冷蔵庫の中身を相談中...</p>
        </div>
      )}

      {recipe && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-orange-100 animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative">
          <div className="flex justify-between items-start mb-4">
            <span className="text-[10px] font-black bg-orange-100 text-orange-600 px-3 py-1 rounded-full uppercase tracking-widest">AI Special Recipe</span>
            <button onClick={() => setRecipe(null)} className="text-gray-300 hover:text-gray-500 text-xs font-bold">閉じる</button>
          </div>
          
          <h2 className="text-xl font-black text-gray-800 mb-1 leading-tight">{recipe.title}</h2>
          <p className="text-[11px] font-bold text-gray-400 mb-6 leading-relaxed">{recipe.description}</p>
          
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-2xl">
              <h4 className="text-[10px] font-black text-gray-400 mb-3 flex items-center gap-1 uppercase tracking-widest">
                <CheckCircle2 size={12} /> Ingredients
              </h4>
              <div className="grid grid-cols-1 gap-1.5">
                {recipe.ingredients.map((ing: string, i: number) => (
                  <div key={i} className="text-xs font-bold text-gray-600 flex items-center gap-2">
                    <span className="w-1 h-1 bg-orange-300 rounded-full" /> {ing}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black text-orange-500 mb-3 flex items-center gap-1 uppercase tracking-widest">
                <Flame size={12} /> How to Cook
              </h4>
              <div className="space-y-4">
                {recipe.steps.map((step: string, i: number) => (
                  <div key={i} className="flex gap-3">
                    <span className="font-black text-orange-100 text-xl leading-none">0{i + 1}</span>
                    <p className="text-xs font-bold text-gray-600 leading-normal">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50">
              <button 
                onClick={handleFinishCooking}
                disabled={isFinishing}
                className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                {isFinishing ? <Loader2 className="animate-spin" /> : <><Utensils size={20} /> 作った！(在庫を減らす)</>}
              </button>
              <p className="text-[9px] text-gray-300 text-center mt-3 font-bold">※分量（分数・小数対応）を自動計算して差し引きます</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}