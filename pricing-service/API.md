# Pricing Service — API Reference

Base URL: `http://localhost:4000`

---

## GET /offers

Список офферов с пагинацией и фильтрами.

**Query params**

| Param      | Type    | Default | Description               |
|------------|---------|---------|---------------------------|
| gameId     | uuid    | —       | Фильтр по игре            |
| supplierId | uuid    | —       | Фильтр по поставщику      |
| currency   | string  | —       | USD / UZS / EUR / RUB     |
| isActive   | boolean | —       | true / false              |
| page       | number  | 1       |                           |
| limit      | number  | 20      | max 100                   |

**Request**
```http
GET /offers?currency=USD&isActive=true&page=1&limit=5
```

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id":            "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "gameId":        "...",
      "supplierId":    "...",
      "supplierPrice": "29.9900",
      "markupType":    "percent",
      "markupValue":   "10.0000",
      "finalPrice":    "32.9890",
      "currency":      "USD",
      "isActive":      true,
      "createdAt":     "2025-01-01T00:00:00.000Z",
      "updatedAt":     "2025-01-01T00:00:00.000Z",
      "game":     { "id": "...", "title": "Cyberpunk 2077", "slug": "cyberpunk-2077" },
      "supplier": { "id": "...", "name": "G2A",            "slug": "g2a" }
    }
  ],
  "total": 42,
  "page":  1,
  "limit": 5
}
```

---

## GET /offers/:id

**Request**
```http
GET /offers/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

**Response 200** — объект оффера (структура та же)

**Response 404**
```json
{ "success": false, "error": "Offer 3fa85f64-... not found" }
```

---

## POST /offers

Создать оффер. `finalPrice` **рассчитывается автоматически**, передавать его нельзя.

**Body**
```json
{
  "gameId":       "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "supplierId":   "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "supplierPrice": 29.99,
  "markupType":   "percent",
  "markupValue":  10,
  "currency":     "USD"
}
```

**Формулы**
- `percent`: `finalPrice = supplierPrice × (1 + markupValue / 100)`
  → `29.99 × 1.10 = 32.989`
- `fixed`: `finalPrice = supplierPrice + markupValue`
  → `29.99 + 5 = 34.99`

**Response 201**
```json
{
  "success": true,
  "data": {
    "id":            "...",
    "supplierPrice": "29.9900",
    "markupType":    "percent",
    "markupValue":   "10.0000",
    "finalPrice":    "32.9890",
    "currency":      "USD"
  }
}
```

**Validation errors 400**
```json
{
  "success": false,
  "errors": [
    { "field": "supplierPrice", "message": "supplierPrice must be > 0" }
  ]
}
```

---

## PATCH /offers/:id

Частичное обновление. `finalPrice` пересчитывается автоматически при изменении
`supplierPrice`, `markupType` или `markupValue`.

**Body (все поля опциональны)**
```json
{
  "supplierPrice": 24.99,
  "markupValue":   15
}
```

**Response 200** — обновлённый оффер с новым `finalPrice`
```json
{
  "success": true,
  "data": {
    "supplierPrice": "24.9900",
    "markupValue":   "15.0000",
    "finalPrice":    "28.7385"
  }
}
```

---

## DELETE /offers/:id

**Response 200**
```json
{ "success": true, "data": { "id": "3fa85f64-..." } }
```

---

## POST /offers/config/global-markup

Установить глобальную наценку (применяется поверх индивидуальных наценок).

**Body**
```json
{ "percent": 5 }
```

Итоговая цена с глобальной наценкой 5%:
`finalPrice = basePrice × 1.05`

**Response 200**
```json
{ "success": true, "data": { "globalMarkupPercent": 5 } }
```

---

## POST /offers/recalculate

Пересчитать `finalPrice` для всех активных офферов вручную.
(Также выполняется автоматически cron-задачей каждый час.)

**Response 200**
```json
{ "success": true, "data": { "updated": 38 } }
```

---

## POST /pricing-rules

Создать правило автоматической наценки по диапазону цен.

**Body — дешёвые игры (< $20, фиксированная)**
```json
{
  "name":        "Cheap games — fixed $2",
  "minPrice":    0,
  "maxPrice":    19.99,
  "markupType":  "fixed",
  "markupValue": 2,
  "priority":    10
}
```

**Body — дорогие игры ($60+, процент)**
```json
{
  "name":        "AAA games — 8%",
  "minPrice":    60,
  "markupType":  "percent",
  "markupValue": 8,
  "priority":    1
}
```

Правила сортируются по `priority DESC` — первое совпадение побеждает.

**Response 201**
```json
{
  "success": true,
  "data": {
    "id":          "...",
    "name":        "Cheap games — fixed $2",
    "markupType":  "fixed",
    "markupValue": "2.0000",
    "priority":    10,
    "isActive":    true
  }
}
```

---

## GET /health

```json
{ "status": "ok", "ts": "2025-05-24T10:00:00.000Z" }
```

---

## Логика ценообразования (приоритеты)

```
1. Найти PricingRule с наивысшим priority, совпадающую по диапазону цены
2. Если найдена → использовать её markupType + markupValue
   Иначе        → использовать markupType + markupValue из самого оффера
3. Применить globalMarkupPercent (если > 0) поверх результата
```

Пример (supplierPrice = $15, globalMarkupPercent = 5%):
```
Rule matched: "Cheap games — fixed $2"
  base = 15 + 2 = 17.00
  global 5% = 17 × 1.05 = 17.85
  finalPrice = $17.85
```
