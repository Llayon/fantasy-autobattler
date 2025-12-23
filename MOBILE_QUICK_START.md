# Быстрый старт - Доступ с телефона

## Ваши IP адреса:
- **Ethernet (проводной)**: 192.168.68.101
- **Wi-Fi (беспроводной)**: 192.168.68.107 ✅ (используется)

## Шаг 1: Настройка Firewall (ОБЯЗАТЕЛЬНО!)

Откройте **PowerShell от имени администратора** (правой кнопкой → "Запуск от имени администратора") и выполните:

```powershell
# Разрешить порт 3000 (Frontend)
New-NetFirewallRule -DisplayName "Next.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow

# Разрешить порт 3004 (Backend)
New-NetFirewallRule -DisplayName "NestJS Backend" -Direction Inbound -LocalPort 3004 -Protocol TCP -Action Allow
```

## Шаг 2: Запустить серверы

**Backend:**
```bash
cd backend
npm run start:dev
```

**Frontend (в новом терминале):**
```bash
cd frontend
npm run dev
```

## Шаг 3: Подключиться с телефона

1. Подключите телефон к **той же Wi-Fi сети** (та же сеть, что и компьютер)
2. Откройте браузер на телефоне
3. Перейдите по адресу: **http://192.168.68.107:3000**

## Проверка

### На компьютере:
```bash
# Проверить, что серверы запущены
netstat -an | findstr "3000 3004"
```

Должны быть строки с `0.0.0.0:3000` и `0.0.0.0:3004` в состоянии `LISTENING`

### На телефоне:
- Swagger API: http://192.168.68.107:3004/api/docs
- Игра: http://192.168.68.107:3000

## Что было изменено:

✅ `frontend/package.json` - добавлен флаг `-H 0.0.0.0` для доступа из сети
✅ `backend/src/main.ts` - backend слушает на `0.0.0.0:3004`
✅ `backend/src/main.ts` - CORS настроен на `origin: true`
✅ `frontend/src/lib/api.ts` - использует `NEXT_PUBLIC_API_URL` из .env
✅ `frontend/.env.local` - создан с вашим Wi-Fi IP адресом

## Возможные проблемы:

**"Не удается подключиться"**
- Проверьте, что оба устройства в одной Wi-Fi сети
- Выполните команды Firewall (Шаг 1)
- Убедитесь, что серверы запущены

**"API недоступен"**
- Проверьте `frontend/.env.local` - должен быть IP: 192.168.68.107
- Перезапустите frontend после изменения .env

**Антивирус блокирует**
- Временно отключите антивирус или добавьте исключения для портов 3000 и 3004

## Возврат к localhost:

Если хотите работать только на компьютере:
```bash
# Измените frontend/.env.local на:
NEXT_PUBLIC_API_URL=http://localhost:3004
```
