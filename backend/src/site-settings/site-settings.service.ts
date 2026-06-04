import { orm } from '../shared/bdd/orm.js';
import { SiteSetting } from './site-setting.entity.js';

const HOME_HERO_IMAGE_KEY = 'home.hero_image_url';

export type HomeSettingsDto = {
  heroImageUrl: string | null;
};

async function upsertSetting(key: string, value: string | null) {
  const em = orm.em.fork();
  let item = await em.findOne(SiteSetting as any, { key } as any);

  if (!item) {
    item = em.create(SiteSetting as any, { key, value } as any);
  } else {
    (item as any).value = value ?? undefined;
  }

  await em.persistAndFlush(item);
}

export async function getHomeSettings(): Promise<HomeSettingsDto> {
  const em = orm.em.fork();
  const item = await em.findOne(SiteSetting as any, { key: HOME_HERO_IMAGE_KEY } as any);
  return { heroImageUrl: (item as any)?.value ?? null };
}

export async function updateHomeSettings(input: { hero_image_url?: string }) {
  const heroImageUrl = typeof input.hero_image_url === 'string' && input.hero_image_url.trim()
    ? input.hero_image_url.trim()
    : null;

  await upsertSetting(HOME_HERO_IMAGE_KEY, heroImageUrl);
  return getHomeSettings();
}