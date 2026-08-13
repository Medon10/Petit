import { orm } from '../shared/bdd/orm.js';
import { SiteSetting } from './site-setting.entity.js';

const HOME_HERO_IMAGE_KEY = 'home.hero_image_url';
const HOME_HERO_IMAGE_LEFT_KEY = 'home.hero_image_left_url';
const HOME_HERO_IMAGE_RIGHT_KEY = 'home.hero_image_right_url';

export type HomeSettingsDto = {
  heroImageUrl: string | null;
  heroImageLeftUrl: string | null;
  heroImageRightUrl: string | null;
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

async function getSetting(key: string): Promise<string | null> {
  const em = orm.em.fork();
  const item = await em.findOne(SiteSetting as any, { key } as any);
  return (item as any)?.value ?? null;
}

export async function getHomeSettings(): Promise<HomeSettingsDto> {
  const [heroImageUrl, heroImageLeftUrl, heroImageRightUrl] = await Promise.all([
    getSetting(HOME_HERO_IMAGE_KEY),
    getSetting(HOME_HERO_IMAGE_LEFT_KEY),
    getSetting(HOME_HERO_IMAGE_RIGHT_KEY),
  ]);
  return { heroImageUrl, heroImageLeftUrl, heroImageRightUrl };
}

export async function updateHomeSettings(input: {
  hero_image_url?: string;
  hero_image_left_url?: string;
  hero_image_right_url?: string;
}) {
  function clean(val?: string) {
    return typeof val === 'string' && val.trim() ? val.trim() : null;
  }

  await Promise.all([
    upsertSetting(HOME_HERO_IMAGE_KEY, clean(input.hero_image_url)),
    upsertSetting(HOME_HERO_IMAGE_LEFT_KEY, clean(input.hero_image_left_url)),
    upsertSetting(HOME_HERO_IMAGE_RIGHT_KEY, clean(input.hero_image_right_url)),
  ]);

  return getHomeSettings();
}