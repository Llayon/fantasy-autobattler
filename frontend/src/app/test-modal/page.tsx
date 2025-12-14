/**
 * Test page for UnitDetailModal component.
 * Tests all modal functionality and edge cases.
 */

'use client';

import { useState } from 'react';
import UnitDetailModal from '@/components/UnitDetailModal';
import { UnitTemplate } from '@/types/game';

// Mock unit data for testing
const mockUnit: UnitTemplate = {
  id: 'knight',
  name: 'Рыцарь',
  role: 'tank',
  cost: 5,
  stats: {
    hp: 120,
    atk: 25,
    atkCount: 1,
    armor: 8,
    speed: 2,
    initiative: 3,
    dodge: 5,
  },
  range: 1,
  abilities: ['Защитная стойка', 'Провокация', 'Щитовой удар'],
};

export default function TestModalPage() {
  const [modalState, setModalState] = useState({
    isOpen: false,
    canAdd: true,
    cannotAddReason: undefined as string | undefined,
  });

  const openModal = (canAdd: boolean, reason?: string) => {
    setModalState({
      isOpen: true,
      canAdd,
      cannotAddReason: reason,
    });
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
  };

  const handleAddToTeam = (unit: UnitTemplate) => {
    console.log('Adding unit to team:', unit.name);
    alert(`Юнит ${unit.name} добавлен в команду!`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Тест UnitDetailModal</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Test Cases */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Тестовые сценарии:</h2>
            
            <button
              onClick={() => openModal(true)}
              className="w-full p-4 bg-green-600 hover:bg-green-500 rounded-lg text-left"
            >
              ✅ Модалка с возможностью добавления
            </button>
            
            <button
              onClick={() => openModal(false, 'Юнит уже в команде')}
              className="w-full p-4 bg-red-600 hover:bg-red-500 rounded-lg text-left"
            >
              ❌ Юнит уже в команде
            </button>
            
            <button
              onClick={() => openModal(false, 'Превышен бюджет на 3 очка')}
              className="w-full p-4 bg-orange-600 hover:bg-orange-500 rounded-lg text-left"
            >
              💰 Превышен бюджет
            </button>
            
            <button
              onClick={() => openModal(false, 'Нет свободных позиций на поле')}
              className="w-full p-4 bg-purple-600 hover:bg-purple-500 rounded-lg text-left"
            >
              🚫 Нет свободных позиций
            </button>
          </div>
          
          {/* Checklist */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Чек-лист проверки:</h2>
            
            <div className="bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
              <div className="font-medium text-yellow-400">📊 Отображение данных:</div>
              <div>• Все статы юнита (HP, ATK, #ATK, BR, СК, ИН, УК, Range)</div>
              <div>• Эмодзи и название юнита</div>
              <div>• Роль с цветовой кодировкой</div>
              <div>• Стоимость в очках</div>
              <div>• Описание юнита</div>
              <div>• Список способностей</div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
              <div className="font-medium text-blue-400">🎛️ Функциональность:</div>
              <div>• canAdd=false показывает причину</div>
              <div>• Кнопка "Добавить" disabled когда canAdd=false</div>
              <div>• Закрытие по клику вне модалки</div>
              <div>• Закрытие по Escape</div>
              <div>• Закрытие по кнопке ✕</div>
              <div>• Блокировка скролла body</div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
              <div className="font-medium text-green-400">♿ Доступность:</div>
              <div>• aria-modal="true"</div>
              <div>• aria-labelledby для заголовка</div>
              <div>• aria-describedby для описания</div>
              <div>• aria-label для кнопок</div>
              <div>• Фокус-ловушка (focus trap)</div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg space-y-2 text-sm">
              <div className="font-medium text-purple-400">📱 Адаптивность:</div>
              <div>• Responsive на мобильных</div>
              <div>• Плавные анимации входа/выхода</div>
              <div>• Правильный z-index (9999)</div>
              <div>• Backdrop blur эффект</div>
            </div>
          </div>
        </div>
        
        {/* Modal */}
        <UnitDetailModal
          unit={mockUnit}
          isOpen={modalState.isOpen}
          onClose={closeModal}
          onAddToTeam={handleAddToTeam}
          canAdd={modalState.canAdd}
          cannotAddReason={modalState.cannotAddReason}
        />
      </div>
    </div>
  );
}