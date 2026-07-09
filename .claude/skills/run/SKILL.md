---
name: run
description: Запуск и визуальная проверка driving-trainer — dev-сервер Vite и скриншоты сцен через scripts/shot.mjs (playwright уже в devDependencies)
---

# Запуск и визуальная проверка driving-trainer

## Скриншоты сцен (основной путь)

Не пиши одноразовые playwright-скрипты — есть готовый:

```bash
npm run shot -- 0700 0664        # скриншоты задач по id (?task=)
npm run shot -- 0700 --drive 3   # + подержать газ 3 с, второй кадр *-after
npm run shot -- 0184 --finish    # ехать вперёд до оверлея результата (*-result)
npm run shot -- 0184 --mobile    # мобильный вьюпорт (кнопки управления)
npm run shot -- 0700 --wait 5    # подождать N с перед кадром (default 1)
```

Кадры пишутся в `./shots/` (в .gitignore). Скрипт сам поднимает Vite на
:5173 (strictPort) если не запущен и гасит его после. В конце печатает
console/page errors — проверяй, что `none`.

Id задач: `src/tasks/*.ts` или `data/selection.json`. URL-параметр
`?task=<id>` открывает конкретную задачу вместо случайной.

## Dev-сервер вручную

```bash
npm run dev          # http://localhost:5173
pkill -f vite        # остановить
```

На macOS нет `timeout` — поллить порт циклом:
`for i in $(seq 1 30); do curl -sf http://localhost:5173 >/dev/null && break; sleep 1; done`

## Управление при скриптовании клавиш

- `w` газ, `s` тормоз; **тормоз в покое включает задний ход** — чтобы
  «стоять», не жми ничего (машину останавливает трение).
- `n`/`Enter` — следующая задача, `r` — повторить, `i` — подсказка.

## Playwright

`playwright` — в devDependencies; Chromium закэширован в
`~/Library/Caches/ms-playwright` (если нет — `npx playwright install chromium`).
`chromium-cli` на этой машине отсутствует.
