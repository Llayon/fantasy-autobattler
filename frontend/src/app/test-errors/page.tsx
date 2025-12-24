/**
 * Test page for Error States verification.
 * Allows testing all error handling components.
 */

'use client';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { 
  ErrorMessage, 
  ErrorPage, 
  NetworkError, 
  useToast 
} from '@/components/ErrorStates';
import { ButtonLoader } from '@/components/LoadingStates';

/**
 * Test page for error states verification.
 */
export default function TestErrorsPage() {
  const [showErrorPage, setShowErrorPage] = useState(false);
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  /**
   * Test retry functionality.
   */
  const handleRetry = () => {
    const newCount = retryCount + 1;
    setRetryCount(newCount);
    showSuccess(`Retry выполнен! Попытка #${newCount}`);
  };

  /**
   * Test JavaScript error boundary.
   */
  const triggerJSError = () => {
    // This will trigger the Error Boundary
    throw new Error('Тестовая ошибка JavaScript для проверки Error Boundary');
  };

  /**
   * Test network error simulation.
   */
  const testNetworkError = async () => {
    try {
      // Try to fetch from non-existent endpoint
      await fetch('http://localhost:3001/non-existent-endpoint');
    } catch (error) {
      showError('Ошибка сети: ' + (error as Error).message);
    }
  };

  if (showErrorPage) {
    return (
      <ErrorPage
        title="Тестовая ошибка страницы"
        message="Это тестовая полноэкранная ошибка для проверки функциональности"
        details="Детали ошибки: тестовый стек трейс для разработчиков"
        showRetry
        onRetry={() => {
          handleRetry();
          setShowErrorPage(false);
        }}
        showHome
        onHome={() => setShowErrorPage(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-400 mb-8">
          🧪 Тестирование Error States
        </h1>

        {/* Toast Tests */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">1. Toast Notifications</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <ButtonLoader
              loading={false}
              onClick={() => showSuccess('Успешная операция!')}
              variant="primary"
              size="sm"
            >
              ✅ Success Toast
            </ButtonLoader>
            
            <ButtonLoader
              loading={false}
              onClick={() => showError('Произошла ошибка!')}
              variant="primary"
              size="sm"
            >
              ❌ Error Toast
            </ButtonLoader>
            
            <ButtonLoader
              loading={false}
              onClick={() => showWarning('Предупреждение!')}
              variant="primary"
              size="sm"
            >
              ⚠️ Warning Toast
            </ButtonLoader>
            
            <ButtonLoader
              loading={false}
              onClick={() => showInfo('Информация')}
              variant="primary"
              size="sm"
            >
              ℹ️ Info Toast
            </ButtonLoader>
          </div>
          
          <div className="text-sm text-gray-400">
            ✅ Toast должны автоматически исчезать через 5 секунд
          </div>
        </section>

        {/* Inline Error Messages */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">2. Inline Error Messages</h2>
          
          <div className="space-y-4">
            <ErrorMessage
              message="Не удалось загрузить данные команды"
              severity="error"
              details="Сервер вернул ошибку 500. Попробуйте позже."
              showRetry
              onRetry={handleRetry}
              onDismiss={() => showInfo('Ошибка закрыта')}
            />
            
            <ErrorMessage
              message="Превышен бюджет команды"
              severity="warning"
              details="Стоимость команды 35 очков превышает лимит 30 очков"
            />
            
            <ErrorMessage
              message="Команда сохранена успешно"
              severity="info"
              details="Команда 'Моя команда' добавлена в список"
            />
          </div>
        </section>

        {/* Network Error */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">3. Network Error</h2>
          
          {showNetworkError ? (
            <NetworkError
              message="Не удалось подключиться к серверу игры"
              showRetry
              onRetry={() => {
                handleRetry();
                setShowNetworkError(false);
              }}
              showOffline
            />
          ) : (
            <div className="space-y-4">
              <ButtonLoader
                loading={false}
                onClick={() => setShowNetworkError(true)}
                variant="primary"
                size="sm"
              >
                🌐 Показать Network Error
              </ButtonLoader>
              
              <ButtonLoader
                loading={false}
                onClick={testNetworkError}
                variant="secondary"
                size="sm"
              >
                🔗 Тест реальной сетевой ошибки
              </ButtonLoader>
            </div>
          )}
        </section>

        {/* Error Page Test */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">4. Full Page Error</h2>
          
          <ButtonLoader
            loading={false}
            onClick={() => setShowErrorPage(true)}
            variant="primary"
            size="sm"
          >
            💥 Показать Error Page
          </ButtonLoader>
        </section>

        {/* Error Boundary Test */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">5. Error Boundary Test</h2>
          
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-red-300 mb-4">
              ⚠️ Внимание: Эта кнопка вызовет JavaScript ошибку для тестирования Error Boundary
            </p>
            
            <ButtonLoader
              loading={false}
              onClick={triggerJSError}
              variant="primary"
              size="sm"
            >
              🐛 Вызвать JS Error
            </ButtonLoader>
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold mb-4">6. Статистика тестов</h2>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-300">
              Количество retry операций: <span className="text-yellow-400 font-bold">{retryCount}</span>
            </p>
          </div>
        </section>

        {/* Navigation */}
        <section>
          <ButtonLoader
            loading={false}
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/';
              }
            }}
            variant="secondary"
            size="lg"
          >
            🏠 Вернуться на главную
          </ButtonLoader>
        </section>
      </div>
    </div>
  );
}