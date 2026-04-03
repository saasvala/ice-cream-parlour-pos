import path from 'node:path';
import { promises as fs } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ApkPipelineService } from '@/server/apkPipeline';

async function createServiceRoot(name: string) {
  const root = path.join('/tmp', 'ice-cream-parlour-pos-tests', name);
  await fs.rm(root, { recursive: true, force: true });
  await fs.mkdir(root, { recursive: true });
  return root;
}

describe('APK pipeline payment and download guard', () => {
  it('blocks download when no payment, wallet, or subscription exists', async () => {
    const root = await createServiceRoot(`blocked-${Date.now()}`);
    const service = new ApkPipelineService(root);
    const { build_id } = await service.createBuildFixture();

    const result = await service.checkDownload(build_id, 'user-a', '127.0.0.1');
    expect(result.allowed).toBe(false);
  });

  it('allows download after successful payment verify', async () => {
    const root = await createServiceRoot(`paid-${Date.now()}`);
    const service = new ApkPipelineService(root);
    const { build_id } = await service.createBuildFixture();

    const created = await service.paymentCreate({ user_id: 'user-b', build_id, method: 'upi' });
    expect(created.status).toBe('pending');
    await service.paymentVerify({ payment_id: created.payment_id, success: true });

    const download = await service.checkDownload(build_id, 'user-b', '127.0.0.1');
    expect(download.allowed).toBe(true);
    expect(download.url).toContain('/apk/file/');
  });

  it('auto-deducts wallet and allows download when wallet balance is enough', async () => {
    const root = await createServiceRoot(`wallet-${Date.now()}`);
    const service = new ApkPipelineService(root);
    const { build_id } = await service.createBuildFixture({ price: 80 });
    await service.walletTopup({ user_id: 'user-c', amount: 100 });

    const download = await service.checkDownload(build_id, 'user-c', '127.0.0.1');
    expect(download.allowed).toBe(true);

    const balance = await service.walletBalance('user-c');
    expect(balance.balance).toBe(20);
  });

  it('supports active subscription access', async () => {
    const root = await createServiceRoot(`sub-${Date.now()}`);
    const service = new ApkPipelineService(root);
    const { build_id } = await service.createBuildFixture();
    await service.grantSubscription({ user_id: 'user-d', days: 1 });

    const download = await service.checkDownload(build_id, 'user-d', '127.0.0.1');
    expect(download.allowed).toBe(true);
  });
});
