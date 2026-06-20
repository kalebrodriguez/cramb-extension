import { db } from '../db';

export const metaRepo = {
  async get(key: string): Promise<string | undefined> {
    const row = await db.meta.get(key);
    return row?.value;
  },

  async set(key: string, value: string): Promise<void> {
    await db.meta.put({ key, value });
  },

  async isOnboardingComplete(): Promise<boolean> {
    const val = await metaRepo.get('onboardingComplete');
    return val === 'true';
  },

  async completeOnboarding(): Promise<void> {
    await metaRepo.set('onboardingComplete', 'true');
  },
};
