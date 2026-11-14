// Настройки навигации (этап 13). Меняются здесь, без правки Pathfinder и актёров.

export const PATH_CONFIG = {
  requestsPerFrame: 2, // сколько запросов EasyStar запускаем за кадр
  iterationsPerCalculation: 400, // шагов A* за один calculate()
  maxQueue: 64, // больше запросов одновременно не держим
  maxStandRadius: 5, // насколько далеко ищем тайл рядом с мебелью
  doorWaitMs: 1500, // сколько ждём чужую бронь двери
  doorReserveMs: 2500, // срок жизни брони, если актёр застрял
  repathDelayMs: 250, // не чаще одной перепрокладки на актёра
};
