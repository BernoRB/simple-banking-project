export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  nextResetDate?: Date;
}

// Interface para poder implementar redis u otra solucion a futuro
export interface ILimitsStorage {
  checkAndUpdateLimits(
    userId: number,
    operationType: string,
    amount: number,
    userLevel: number
  ): Promise<LimitCheckResult>;
  
  resetLimits(userId: number, operationType: string): Promise<void>;
  
  getLimitsState(userId: number, operationType: string): Promise<{
    dailyAccumulated: number;
    monthlyAccumulated: number;
    isBlocked: boolean;
    blockExpirationDate?: Date;
  } | null>;
}