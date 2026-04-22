import * as Crypto from 'expo-crypto';

export async function sha256(input: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    input,
  );
}

export function buildFridgeCacheKey(
  fridgeItemNames: string[],
  foodCulture: string,
): string {
  return [...fridgeItemNames].sort().join('|') + ':' + foodCulture;
}
