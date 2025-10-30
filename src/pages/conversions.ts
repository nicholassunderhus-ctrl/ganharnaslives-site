/**
 * Taxa de conversão para saque: quantos pontos valem R$ 1,00.
 */
export const WITHDRAW_POINTS_PER_REAL = 700; // 700 pontos = R$1

/**
 * Mínimo de pontos para saque.
 */
export const MIN_WITHDRAW_POINTS = 7000; // Ex: 7000 pontos = R$10

/**
 * Converte uma quantidade de pontos para o valor correspondente em BRL para saques.
 * @param points A quantidade de pontos.
 * @returns O valor formatado em Reais (ex: "10.00").
 */
export const convertPointsToReal = (points: number): string => {
  return (points / WITHDRAW_POINTS_PER_REAL).toFixed(2);
};