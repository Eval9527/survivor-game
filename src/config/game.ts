// 全局常量：画布、时长、性能上限
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// 一局时长 10 分钟（秒）
export const RUN_DURATION = 600;

// 空间哈希网格边长（px）
export const CELL_SIZE = 64;

// 同屏怪上限，超了在屏幕边缘外排队
export const MAX_ENEMIES_ON_SCREEN = 250;

// 刷怪间隔：从 1.2s 逐步压到 0.25s
export const SPAWN_INTERVAL_START = 1.2;
export const SPAWN_INTERVAL_MIN = 0.25;
