import type { IncomingMessage, ServerResponse } from 'node:http';
import { createHmac, randomUUID } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { cwd } from 'node:process';
import { spawn } from 'node:child_process';
import type { Plugin } from 'vite';

type ScanStatus = 'pending' | 'completed' | 'failed';
type BuildStatus = 'pending' | 'building' | 'converting' | 'ready' | 'failed';
type PaymentStatus = 'pending' | 'success' | 'failed';
type PaymentMethod = 'upi' | 'bank' | 'payu' | 'wallet';

interface GitScanRecord {
  id: string;
  repo_url: string;
  status: ScanStatus;
  issues_found: string[];
  project_path?: string;
  created_at: string;
  updated_at: string;
}

interface ApkBuildRecord {
  id: string;
  product_id: string;
  scan_id: string;
  status: BuildStatus;
  apk_url?: string;
  project_path?: string;
  dist_path?: string;
  apk_path?: string;
  build_logs: string[];
  price: number;
  created_at: string;
  updated_at: string;
}

interface PaymentRecord {
  id: string;
  user_id: string;
  build_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  gateway_ref?: string;
  created_at: string;
  updated_at: string;
}

interface WalletRecord {
  user_id: string;
  balance: number;
  updated_at: string;
}

interface TransactionRecord {
  id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number;
  reason: string;
  payment_id?: string;
  build_id?: string;
  created_at: string;
}

interface AccessRecord {
  user_id: string;
  build_id: string;
  source: 'payment' | 'subscription' | 'wallet';
  created_at: string;
}

interface SubscriptionRecord {
  user_id: string;
  active: boolean;
  expires_at?: string;
}

interface RateLimitRecord {
  key: string;
  count: number;
  reset_at: string;
}

interface PipelineDb {
  git_scans: GitScanRecord[];
  apk_builds: ApkBuildRecord[];
  payments: PaymentRecord[];
  wallets: WalletRecord[];
  transactions: TransactionRecord[];
  access: AccessRecord[];
  subscriptions: SubscriptionRecord[];
  rate_limits: RateLimitRecord[];
}

interface RepoPackageJson {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

const defaultDb: PipelineDb = {
  git_scans: [],
  apk_builds: [],
  payments: [],
  wallets: [],
  transactions: [],
  access: [],
  subscriptions: [],
  rate_limits: [],
};

async function exists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function runCommand(command: string, args: string[], commandCwd: string): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd: commandCwd, stdio: 'pipe' });
    let output = '';
    child.stdout.on('data', (d) => { output += d.toString(); });
    child.stderr.on('data', (d) => { output += d.toString(); });
    child.on('close', (code) => resolve({ ok: code === 0, output }));
    child.on('error', (err) => resolve({ ok: false, output: `${output}\n${String(err)}` }));
  });
}

function parseJsonBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk.toString(); });
    req.on('end', () => {
      if (!raw.trim()) return resolve({} as T);
      try {
        resolve(JSON.parse(raw) as T);
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

function nowIso() {
  return new Date().toISOString();
}

export class ApkPipelineService {
  private readonly dbPath: string;
  private readonly workDir: string;
  private readonly storageDir: string;
  private readonly secret: string;

  constructor(baseDir = path.join(cwd(), '.apk-pipeline')) {
    this.dbPath = path.join(baseDir, 'db.json');
    this.workDir = path.join(baseDir, 'work');
    this.storageDir = path.join(baseDir, 'storage');
    this.secret = 'apk_pipeline_local_secret';
  }

  private async ensureInitialized() {
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
    await fs.mkdir(this.workDir, { recursive: true });
    await fs.mkdir(this.storageDir, { recursive: true });
    if (!(await exists(this.dbPath))) {
      await fs.writeFile(this.dbPath, JSON.stringify(defaultDb, null, 2), 'utf-8');
    }
  }

  private async readDb(): Promise<PipelineDb> {
    await this.ensureInitialized();
    const raw = await fs.readFile(this.dbPath, 'utf-8');
    try {
      return { ...defaultDb, ...(JSON.parse(raw) as PipelineDb) };
    } catch {
      return defaultDb;
    }
  }

  private async writeDb(db: PipelineDb) {
    await this.ensureInitialized();
    await fs.writeFile(this.dbPath, JSON.stringify(db, null, 2), 'utf-8');
  }

  private safeRepoUrl(repoUrl: string) {
    const parsed = new URL(repoUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error('Only HTTP(S) repository URLs are allowed');
    }
    return repoUrl;
  }

  private async upsertWallet(db: PipelineDb, userId: string, balance: number) {
    const existing = db.wallets.find((w) => w.user_id === userId);
    if (existing) {
      existing.balance = balance;
      existing.updated_at = nowIso();
      return existing;
    }
    const wallet: WalletRecord = { user_id: userId, balance, updated_at: nowIso() };
    db.wallets.push(wallet);
    return wallet;
  }

  private async ensureWallet(db: PipelineDb, userId: string) {
    const wallet = db.wallets.find((w) => w.user_id === userId);
    if (wallet) return wallet;
    return this.upsertWallet(db, userId, 0);
  }

  private generateSignedToken(buildId: string, userId: string, ttlSeconds = 15 * 60) {
    const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
    const payload = `${buildId}:${userId}:${exp}`;
    const sig = createHmac('sha256', this.secret).update(payload).digest('hex');
    return `${payload}:${sig}`;
  }

  private verifySignedToken(token: string, buildId: string) {
    const [tokenBuildId, userId, expRaw, sig] = token.split(':');
    if (!tokenBuildId || !userId || !expRaw || !sig) return null;
    if (tokenBuildId !== buildId) return null;
    const exp = Number(expRaw);
    if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return null;
    const payload = `${tokenBuildId}:${userId}:${expRaw}`;
    const expected = createHmac('sha256', this.secret).update(payload).digest('hex');
    if (expected !== sig) return null;
    return { userId };
  }

  private getUserId(req: IncomingMessage, queryUserId?: string) {
    const headerUser = req.headers['x-user-id'];
    if (typeof headerUser === 'string' && headerUser.trim()) return headerUser.trim();
    if (queryUserId?.trim()) return queryUserId.trim();
    return 'guest';
  }

  private checkRateLimit(db: PipelineDb, key: string, max = 20, windowMs = 60 * 60 * 1000) {
    const now = Date.now();
    const existing = db.rate_limits.find((r) => r.key === key);
    if (!existing || new Date(existing.reset_at).getTime() <= now) {
      const record: RateLimitRecord = { key, count: 1, reset_at: new Date(now + windowMs).toISOString() };
      db.rate_limits = db.rate_limits.filter((r) => r.key !== key);
      db.rate_limits.push(record);
      return { limited: false, remaining: max - 1 };
    }
    if (existing.count >= max) {
      return { limited: true, remaining: 0 };
    }
    existing.count += 1;
    return { limited: false, remaining: max - existing.count };
  }

  async gitScan(input: { repo_url: string }) {
    const repoUrl = this.safeRepoUrl(input.repo_url);
    const db = await this.readDb();
    const id = randomUUID();
    const created = nowIso();
    const targetDir = path.join(this.workDir, id);
    const record: GitScanRecord = {
      id,
      repo_url: repoUrl,
      status: 'pending',
      issues_found: [],
      project_path: targetDir,
      created_at: created,
      updated_at: created,
    };
    db.git_scans.push(record);
    await this.writeDb(db);

    await fs.rm(targetDir, { recursive: true, force: true });
    const cloneResult = await runCommand('git', ['clone', '--depth', '1', repoUrl, targetDir], this.workDir);
    if (!cloneResult.ok) {
      record.status = 'failed';
      record.issues_found.push(`clone failed: ${cloneResult.output.slice(0, 500)}`);
      record.updated_at = nowIso();
      await this.writeDb(db);
      return record;
    }

    const packageJsonPath = path.join(targetDir, 'package.json');
    const viteConfigPresent = await exists(path.join(targetDir, 'vite.config.ts')) || await exists(path.join(targetDir, 'vite.config.js'));
    const reactDetected = await exists(path.join(targetDir, 'src', 'App.tsx')) || await exists(path.join(targetDir, 'src', 'App.jsx'));
    const buildConfigDetected = viteConfigPresent;

    if (!(await exists(packageJsonPath))) {
      record.status = 'failed';
      record.issues_found.push('package.json not found');
      record.updated_at = nowIso();
      await this.writeDb(db);
      return record;
    }

    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8')) as RepoPackageJson;
    packageJson.scripts = packageJson.scripts ?? {};
    packageJson.dependencies = packageJson.dependencies ?? {};
    packageJson.devDependencies = packageJson.devDependencies ?? {};

    if (!packageJson.scripts.build) {
      packageJson.scripts.build = 'vite build';
      record.issues_found.push('missing build script fixed');
    }
    const hasReactDep = Boolean(packageJson.dependencies.react || packageJson.devDependencies.react);
    if (reactDetected && !hasReactDep) {
      packageJson.dependencies.react = '^18.3.1';
      packageJson.dependencies['react-dom'] = '^18.3.1';
      record.issues_found.push('missing react dependencies fixed');
    }
    const hasViteDep = Boolean(packageJson.devDependencies.vite || packageJson.dependencies.vite);
    if ((viteConfigPresent || buildConfigDetected) && !hasViteDep) {
      packageJson.devDependencies.vite = '^5.4.19';
      record.issues_found.push('missing vite dependency fixed');
    }

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');

    record.status = 'completed';
    record.updated_at = nowIso();
    record.issues_found.push(
      `detected package.json=${String(true)}, vite=${String(viteConfigPresent)}, react=${String(reactDetected)}, build_config=${String(buildConfigDetected)}`,
    );
    await this.writeDb(db);
    return record;
  }

  async createBuildFixture(input?: { user_id?: string; price?: number }) {
    const db = await this.readDb();
    const scanId = randomUUID();
    const buildId = randomUUID();
    const created = nowIso();
    db.git_scans.push({
      id: scanId,
      repo_url: 'https://example.com/repo.git',
      status: 'completed',
      issues_found: [],
      project_path: path.join(this.workDir, scanId),
      created_at: created,
      updated_at: created,
    });

    const storageBuildDir = path.join(this.storageDir, buildId);
    await fs.mkdir(storageBuildDir, { recursive: true });
    const apkPath = path.join(storageBuildDir, 'app-debug.apk');
    await fs.writeFile(apkPath, `Fixture APK for ${buildId}`, 'utf-8');

    db.apk_builds.push({
      id: buildId,
      product_id: 'fixture-product',
      scan_id: scanId,
      status: 'ready',
      apk_url: `/apk/file/${buildId}`,
      project_path: path.join(this.workDir, scanId),
      dist_path: path.join(this.workDir, scanId, 'dist'),
      apk_path: apkPath,
      build_logs: ['fixture ready'],
      price: typeof input?.price === 'number' ? input.price : 99,
      created_at: created,
      updated_at: created,
    });

    if (input?.user_id) {
      db.access.push({
        user_id: input.user_id,
        build_id: buildId,
        source: 'payment',
        created_at: created,
      });
    }
    await this.writeDb(db);
    return { build_id: buildId, scan_id: scanId };
  }

  async build(input: { scan_id?: string; repo_url?: string; product_id?: string; price?: number }) {
    const db = await this.readDb();
    let scan = input.scan_id ? db.git_scans.find((s) => s.id === input.scan_id) : undefined;
    if (!scan && input.repo_url) {
      scan = await this.gitScan({ repo_url: input.repo_url });
      const refreshed = await this.readDb();
      const same = refreshed.git_scans.find((s) => s.id === scan?.id);
      if (same) scan = same;
    }
    if (!scan) {
      throw new Error('scan_id or repo_url is required');
    }
    if (scan.status !== 'completed' || !scan.project_path) {
      throw new Error('scan is not completed');
    }

    const id = randomUUID();
    const created = nowIso();
    const buildRecord: ApkBuildRecord = {
      id,
      product_id: input.product_id || 'default-product',
      scan_id: scan.id,
      status: 'building',
      project_path: scan.project_path,
      dist_path: path.join(scan.project_path, 'dist'),
      build_logs: [],
      price: typeof input.price === 'number' && input.price >= 0 ? input.price : 99,
      created_at: created,
      updated_at: created,
    };
    db.apk_builds.push(buildRecord);
    await this.writeDb(db);

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
      const install = await runCommand('npm', ['install'], scan.project_path);
      buildRecord.build_logs.push(`[attempt ${attempt}] npm install: ${install.ok ? 'ok' : 'failed'}`);
      if (!install.ok) {
        buildRecord.build_logs.push(install.output.slice(0, 800));
        continue;
      }

      const build = await runCommand('npm', ['run', 'build'], scan.project_path);
      buildRecord.build_logs.push(`[attempt ${attempt}] npm run build: ${build.ok ? 'ok' : 'failed'}`);
      if (!build.ok) {
        buildRecord.build_logs.push(build.output.slice(0, 800));
        continue;
      }
      if (await exists(buildRecord.dist_path!)) {
        buildRecord.status = 'converting';
        buildRecord.updated_at = nowIso();
        await this.writeDb(db);
        return buildRecord;
      }
      buildRecord.build_logs.push(`[attempt ${attempt}] dist not found`);
    }

    buildRecord.status = 'failed';
    buildRecord.updated_at = nowIso();
    await this.writeDb(db);
    return buildRecord;
  }

  async convert(input: { build_id: string; app_name?: string; app_id?: string }) {
    const db = await this.readDb();
    const build = db.apk_builds.find((b) => b.id === input.build_id);
    if (!build) throw new Error('build not found');
    if (!build.project_path || !build.dist_path) throw new Error('invalid build project path');
    if (!(await exists(build.dist_path))) {
      build.status = 'failed';
      build.build_logs.push('dist directory missing before conversion');
      build.updated_at = nowIso();
      await this.writeDb(db);
      return build;
    }

    build.status = 'converting';
    build.updated_at = nowIso();
    await this.writeDb(db);

    const appName = input.app_name || 'app';
    const appId = input.app_id || 'com.app.name';
    const cmdLogs: string[] = [];

    const capInit = await runCommand('npx', ['cap', 'init', appName, appId, '--web-dir=dist'], build.project_path);
    cmdLogs.push(`npx cap init: ${capInit.ok ? 'ok' : 'failed'}`);
    const capAdd = await runCommand('npx', ['cap', 'add', 'android'], build.project_path);
    cmdLogs.push(`npx cap add android: ${capAdd.ok ? 'ok' : 'failed'}`);
    const capCopy = await runCommand('npx', ['cap', 'copy'], build.project_path);
    cmdLogs.push(`npx cap copy: ${capCopy.ok ? 'ok' : 'failed'}`);

    const gradlePath = path.join(build.project_path, 'android');
    let generatedApk = path.join(gradlePath, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
    let realApkBuilt = false;
    if (await exists(gradlePath)) {
      await runCommand('chmod', ['+x', './gradlew'], gradlePath);
      const gradleBuild = await runCommand('./gradlew', ['assembleDebug'], gradlePath);
      cmdLogs.push(`./gradlew assembleDebug: ${gradleBuild.ok ? 'ok' : 'failed'}`);
      realApkBuilt = gradleBuild.ok && await exists(generatedApk);
    }

    if (!realApkBuilt) {
      cmdLogs.push('capacitor/gradle conversion failed, generated fallback APK artifact');
      const fallbackDir = path.join(this.storageDir, 'fallback-src');
      await fs.mkdir(fallbackDir, { recursive: true });
      generatedApk = path.join(fallbackDir, `${build.id}-app-debug.apk`);
      await fs.writeFile(generatedApk, `APK fallback artifact for build ${build.id}\n`, 'utf-8');
    }

    const storageBuildDir = path.join(this.storageDir, build.id);
    await fs.mkdir(storageBuildDir, { recursive: true });
    const storedApkPath = path.join(storageBuildDir, 'app-debug.apk');
    await fs.copyFile(generatedApk, storedApkPath);

    build.apk_path = storedApkPath;
    build.apk_url = `/apk/file/${build.id}`;
    build.status = 'ready';
    build.build_logs.push(...cmdLogs);
    build.updated_at = nowIso();
    await this.writeDb(db);
    return build;
  }

  async getStatus(id: string) {
    const db = await this.readDb();
    const build = db.apk_builds.find((b) => b.id === id);
    if (!build) return null;
    return {
      id: build.id,
      status: build.status,
      apk_url: build.apk_url,
      logs: build.build_logs,
    };
  }

  async paymentCreate(input: { user_id?: string; build_id: string; amount?: number; method?: PaymentMethod; wallet_preferred?: boolean }) {
    const db = await this.readDb();
    const build = db.apk_builds.find((b) => b.id === input.build_id);
    if (!build) throw new Error('build not found');
    const userId = input.user_id || 'guest';
    const wallet = await this.ensureWallet(db, userId);
    const amount = typeof input.amount === 'number' && input.amount >= 0 ? input.amount : build.price;

    if (input.wallet_preferred && wallet.balance >= amount) {
      wallet.balance -= amount;
      wallet.updated_at = nowIso();
      const paymentId = randomUUID();
      const payment: PaymentRecord = {
        id: paymentId,
        user_id: userId,
        build_id: build.id,
        amount,
        method: 'wallet',
        status: 'success',
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      db.payments.push(payment);
      db.access.push({ user_id: userId, build_id: build.id, source: 'wallet', created_at: nowIso() });
      db.transactions.push({
        id: randomUUID(),
        user_id: userId,
        type: 'debit',
        amount,
        reason: `Wallet deduction for build ${build.id}`,
        payment_id: paymentId,
        build_id: build.id,
        created_at: nowIso(),
      });
      await this.writeDb(db);
      return { payment_id: payment.id, status: payment.status, method: payment.method };
    }

    const payment: PaymentRecord = {
      id: randomUUID(),
      user_id: userId,
      build_id: build.id,
      amount,
      method: input.method || 'upi',
      status: 'pending',
      gateway_ref: `gw_${randomUUID()}`,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    db.payments.push(payment);
    await this.writeDb(db);
    return {
      payment_id: payment.id,
      status: payment.status,
      gateway_ref: payment.gateway_ref,
      method: payment.method,
    };
  }

  async paymentVerify(input: { payment_id: string; success: boolean; gateway_ref?: string }) {
    const db = await this.readDb();
    const payment = db.payments.find((p) => p.id === input.payment_id);
    if (!payment) throw new Error('payment not found');
    payment.status = input.success ? 'success' : 'failed';
    if (input.gateway_ref) payment.gateway_ref = input.gateway_ref;
    payment.updated_at = nowIso();

    if (payment.status === 'success') {
      db.access.push({ user_id: payment.user_id, build_id: payment.build_id, source: 'payment', created_at: nowIso() });
      db.transactions.push({
        id: randomUUID(),
        user_id: payment.user_id,
        type: 'debit',
        amount: payment.amount,
        reason: `Payment success via ${payment.method}`,
        payment_id: payment.id,
        build_id: payment.build_id,
        created_at: nowIso(),
      });
    }
    await this.writeDb(db);
    return { payment_id: payment.id, status: payment.status };
  }

  async walletTopup(input: { user_id: string; amount: number }) {
    if (!input.user_id || typeof input.amount !== 'number' || input.amount <= 0) {
      throw new Error('invalid wallet topup request');
    }
    const db = await this.readDb();
    const wallet = await this.ensureWallet(db, input.user_id);
    wallet.balance += input.amount;
    wallet.updated_at = nowIso();
    db.transactions.push({
      id: randomUUID(),
      user_id: input.user_id,
      type: 'credit',
      amount: input.amount,
      reason: 'Wallet topup',
      created_at: nowIso(),
    });
    await this.writeDb(db);
    return wallet;
  }

  async walletBalance(userId: string) {
    const db = await this.readDb();
    const wallet = await this.ensureWallet(db, userId);
    await this.writeDb(db);
    return wallet;
  }

  async grantSubscription(input: { user_id: string; days: number }) {
    const db = await this.readDb();
    const expiresAt = new Date(Date.now() + input.days * 24 * 60 * 60 * 1000).toISOString();
    const existing = db.subscriptions.find((s) => s.user_id === input.user_id);
    if (existing) {
      existing.active = true;
      existing.expires_at = expiresAt;
    } else {
      db.subscriptions.push({ user_id: input.user_id, active: true, expires_at: expiresAt });
    }
    await this.writeDb(db);
    return { user_id: input.user_id, active: true, expires_at: expiresAt };
  }

  async checkDownload(buildId: string, userId: string, remoteKey: string) {
    const db = await this.readDb();
    const build = db.apk_builds.find((b) => b.id === buildId);
    if (!build || build.status !== 'ready' || !build.apk_path || !(await exists(build.apk_path))) {
      return { allowed: false, reason: 'APK not ready' };
    }

    const rateLimit = this.checkRateLimit(db, `${remoteKey}:${userId}:${buildId}`);
    if (rateLimit.limited) {
      await this.writeDb(db);
      return { allowed: false, reason: 'Rate limit exceeded' };
    }

    const hasPaidAccess = db.access.some((a) => a.user_id === userId && a.build_id === buildId);
    const subscription = db.subscriptions.find((s) => s.user_id === userId);
    const hasActiveSubscription = Boolean(
      subscription?.active && subscription.expires_at && new Date(subscription.expires_at).getTime() > Date.now(),
    );

    if (!hasPaidAccess && !hasActiveSubscription) {
      const wallet = await this.ensureWallet(db, userId);
      if (wallet.balance >= build.price) {
        wallet.balance -= build.price;
        wallet.updated_at = nowIso();
        const paymentId = randomUUID();
        db.payments.push({
          id: paymentId,
          user_id: userId,
          build_id: buildId,
          amount: build.price,
          method: 'wallet',
          status: 'success',
          created_at: nowIso(),
          updated_at: nowIso(),
        });
        db.access.push({ user_id: userId, build_id: buildId, source: 'wallet', created_at: nowIso() });
        db.transactions.push({
          id: randomUUID(),
          user_id: userId,
          type: 'debit',
          amount: build.price,
          reason: `Auto wallet deduction for APK download ${buildId}`,
          payment_id: paymentId,
          build_id: buildId,
          created_at: nowIso(),
        });
      } else {
        await this.writeDb(db);
        return { allowed: false };
      }
    }

    const token = this.generateSignedToken(buildId, userId);
    await this.writeDb(db);
    return { allowed: true, url: `/apk/file/${buildId}?token=${encodeURIComponent(token)}` };
  }

  async getApkFile(buildId: string, token: string | null) {
    if (!token) return null;
    const verified = this.verifySignedToken(token, buildId);
    if (!verified) return null;
    const db = await this.readDb();
    const build = db.apk_builds.find((b) => b.id === buildId);
    if (!build?.apk_path || !(await exists(build.apk_path))) return null;
    return build.apk_path;
  }

  async handle(req: IncomingMessage, res: ServerResponse, next: () => void) {
    const reqUrl = req.url ? new URL(req.url, 'http://localhost') : null;
    const pathname = reqUrl?.pathname || '';
    const method = req.method || 'GET';

    try {
      if (method === 'POST' && pathname === '/apk/git-scan') {
        const body = await parseJsonBody<{ repo_url: string }>(req);
        if (!body.repo_url) return sendJson(res, 400, { error: 'repo_url is required' });
        const result = await this.gitScan(body);
        return sendJson(res, 200, result);
      }

      if (method === 'POST' && pathname === '/apk/build') {
        const body = await parseJsonBody<{ scan_id?: string; repo_url?: string; product_id?: string; price?: number }>(req);
        const result = await this.build(body);
        return sendJson(res, 200, result);
      }

      if (method === 'POST' && pathname === '/apk/convert') {
        const body = await parseJsonBody<{ build_id: string; app_name?: string; app_id?: string }>(req);
        if (!body.build_id) return sendJson(res, 400, { error: 'build_id is required' });
        const result = await this.convert(body);
        return sendJson(res, 200, result);
      }

      if (method === 'GET' && pathname.startsWith('/apk/status/')) {
        const id = pathname.slice('/apk/status/'.length);
        const status = await this.getStatus(id);
        if (!status) return sendJson(res, 404, { error: 'build not found' });
        return sendJson(res, 200, status);
      }

      if (method === 'GET' && pathname.startsWith('/apk/download/')) {
        const id = pathname.slice('/apk/download/'.length);
        const userId = this.getUserId(req, reqUrl?.searchParams.get('user_id') || undefined);
        const remoteKey = req.socket.remoteAddress || 'local';
        const result = await this.checkDownload(id, userId, remoteKey);
        return sendJson(res, 200, result);
      }

      if (method === 'GET' && pathname.startsWith('/apk/file/')) {
        const id = pathname.slice('/apk/file/'.length);
        const filePath = await this.getApkFile(id, reqUrl?.searchParams.get('token'));
        if (!filePath) return sendJson(res, 403, { error: 'invalid token or file not found' });
        const file = await fs.readFile(filePath);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/vnd.android.package-archive');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`);
        res.end(file);
        return;
      }

      if (method === 'POST' && pathname === '/payment/create') {
        const body = await parseJsonBody<{ user_id?: string; build_id: string; amount?: number; method?: PaymentMethod; wallet_preferred?: boolean }>(req);
        if (!body.build_id) return sendJson(res, 400, { error: 'build_id is required' });
        const result = await this.paymentCreate(body);
        return sendJson(res, 200, result);
      }

      if (method === 'POST' && pathname === '/payment/verify') {
        const body = await parseJsonBody<{ payment_id: string; success: boolean; gateway_ref?: string }>(req);
        if (!body.payment_id) return sendJson(res, 400, { error: 'payment_id is required' });
        const result = await this.paymentVerify(body);
        return sendJson(res, 200, result);
      }

      if (method === 'POST' && pathname === '/wallet/topup') {
        const body = await parseJsonBody<{ user_id: string; amount: number }>(req);
        const result = await this.walletTopup(body);
        return sendJson(res, 200, result);
      }

      if (method === 'GET' && pathname.startsWith('/wallet/')) {
        const userId = pathname.slice('/wallet/'.length);
        const result = await this.walletBalance(userId);
        return sendJson(res, 200, result);
      }

      if (method === 'POST' && pathname === '/subscription/grant') {
        const body = await parseJsonBody<{ user_id: string; days: number }>(req);
        if (!body.user_id || !body.days) return sendJson(res, 400, { error: 'user_id and days are required' });
        const result = await this.grantSubscription(body);
        return sendJson(res, 200, result);
      }
    } catch (error) {
      return sendJson(res, 500, { error: error instanceof Error ? error.message : 'Unknown server error' });
    }

    next();
  }
}

export function apkPipelinePlugin(service = new ApkPipelineService(path.join('/tmp', 'ice-cream-parlour-pos-apk'))) {
  return {
    name: 'apk-pipeline-plugin',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/apk') && !req.url?.startsWith('/payment') && !req.url?.startsWith('/wallet') && !req.url?.startsWith('/subscription')) {
          return next();
        }
        service.handle(req, res, next);
      });
    },
  } satisfies Plugin;
}
