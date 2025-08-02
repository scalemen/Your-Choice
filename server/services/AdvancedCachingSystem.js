import Redis from 'ioredis';
import NodeCache from 'node-cache';
import LRU from 'lru-cache';
import { performance } from 'perf_hooks';
import crypto from 'crypto';
import zlib from 'zlib';
import { promisify } from 'util';
import EventEmitter from 'events';
import cluster from 'cluster';
import { v4 as uuidv4 } from 'uuid';

// Compression utilities
const compress = promisify(zlib.gzip);
const decompress = promisify(zlib.gunzip);

/**
 * Advanced Multi-Layer Caching System
 * Provides L1 (in-memory), L2 (Redis), and L3 (persistent) caching
 */
export class AdvancedCachingSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // L1 Cache (In-Memory) Configuration
      l1: {
        maxSize: config.l1?.maxSize || 100 * 1024 * 1024, // 100MB
        maxAge: config.l1?.maxAge || 5 * 60 * 1000, // 5 minutes
        maxItems: config.l1?.maxItems || 10000,
        updateAgeOnGet: true,
        algorithm: 'lru'
      },
      
      // L2 Cache (Redis) Configuration
      l2: {
        host: config.l2?.host || process.env.REDIS_HOST || 'localhost',
        port: config.l2?.port || process.env.REDIS_PORT || 6379,
        password: config.l2?.password || process.env.REDIS_PASSWORD,
        db: config.l2?.db || 0,
        keyPrefix: config.l2?.keyPrefix || 'studygenius:cache:',
        maxAge: config.l2?.maxAge || 30 * 60 * 1000, // 30 minutes
        cluster: config.l2?.cluster || false,
        retryDelayOnFailover: 100,
        enableOfflineQueue: false
      },
      
      // L3 Cache (Persistent) Configuration
      l3: {
        enabled: config.l3?.enabled || false,
        path: config.l3?.path || './cache',
        maxAge: config.l3?.maxAge || 24 * 60 * 60 * 1000, // 24 hours
        compression: true
      },
      
      // Performance Configuration
      performance: {
        enableMetrics: config.performance?.enableMetrics !== false,
        enableProfiling: config.performance?.enableProfiling || false,
        slowQueryThreshold: config.performance?.slowQueryThreshold || 100, // ms
        warningThreshold: config.performance?.warningThreshold || 500, // ms
      },
      
      // Strategy Configuration
      strategies: {
        writeThrough: config.strategies?.writeThrough || false,
        writeBack: config.strategies?.writeBack || true,
        readThrough: config.strategies?.readThrough || true,
        refreshAhead: config.strategies?.refreshAhead || false,
        circuitBreaker: config.strategies?.circuitBreaker || true
      },
      
      // Serialization Configuration
      serialization: {
        method: config.serialization?.method || 'json', // json, msgpack, protobuf
        compression: config.serialization?.compression || true,
        compressionLevel: config.serialization?.compressionLevel || 6,
        compressionThreshold: config.serialization?.compressionThreshold || 1024 // bytes
      }
    };

    // Initialize cache layers
    this.l1Cache = null;
    this.l2Cache = null;
    this.l3Cache = null;
    
    // Performance metrics
    this.metrics = {
      hits: { l1: 0, l2: 0, l3: 0, total: 0 },
      misses: { l1: 0, l2: 0, l3: 0, total: 0 },
      sets: { l1: 0, l2: 0, l3: 0, total: 0 },
      deletes: { l1: 0, l2: 0, l3: 0, total: 0 },
      errors: { l1: 0, l2: 0, l3: 0, total: 0 },
      latency: { l1: [], l2: [], l3: [] },
      size: { l1: 0, l2: 0, l3: 0 },
      operations: 0,
      circuitBreaker: {
        state: 'closed', // closed, open, half-open
        failures: 0,
        lastFailure: null,
        nextAttempt: null
      }
    };

    // Cache strategies
    this.strategies = new Map();
    this.refreshJobs = new Map();
    
    // Circuit breaker
    this.circuitBreaker = {
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      monitoringPeriod: 10000 // 10 seconds
    };

    this.initialize();
  }

  async initialize() {
    try {
      await this.initializeL1Cache();
      await this.initializeL2Cache();
      await this.initializeL3Cache();
      await this.startPerformanceMonitoring();
      
      console.log('🚀 Advanced Caching System initialized successfully');
      this.emit('initialized');
    } catch (error) {
      console.error('❌ Failed to initialize caching system:', error);
      this.emit('error', error);
    }
  }

  // L1 Cache (In-Memory) Implementation
  async initializeL1Cache() {
    this.l1Cache = new LRU({
      max: this.config.l1.maxItems,
      maxSize: this.config.l1.maxSize,
      ttl: this.config.l1.maxAge,
      updateAgeOnGet: this.config.l1.updateAgeOnGet,
      sizeCalculation: (value) => {
        return Buffer.byteLength(JSON.stringify(value), 'utf8');
      },
      dispose: (value, key, reason) => {
        this.emit('l1:evict', { key, reason, size: Buffer.byteLength(JSON.stringify(value)) });
      }
    });

    // Set up L1 cache event handlers
    this.l1Cache.on('set', (key, value) => {
      this.metrics.sets.l1++;
      this.metrics.sets.total++;
      this.updateCacheSize('l1');
    });

    this.l1Cache.on('delete', (key) => {
      this.metrics.deletes.l1++;
      this.metrics.deletes.total++;
      this.updateCacheSize('l1');
    });

    console.log('✅ L1 Cache (In-Memory) initialized');
  }

  // L2 Cache (Redis) Implementation
  async initializeL2Cache() {
    const redisConfig = {
      ...this.config.l2,
      retryDelayOnFailover: this.config.l2.retryDelayOnFailover,
      enableOfflineQueue: this.config.l2.enableOfflineQueue,
      lazyConnect: true,
      keepAlive: 30000,
      connectTimeout: 10000,
      commandTimeout: 5000
    };

    if (this.config.l2.cluster) {
      this.l2Cache = new Redis.Cluster(this.config.l2.nodes, {
        redisOptions: redisConfig,
        enableOfflineQueue: false
      });
    } else {
      this.l2Cache = new Redis(redisConfig);
    }

    // Set up Redis event handlers
    this.l2Cache.on('connect', () => {
      console.log('✅ L2 Cache (Redis) connected');
      this.resetCircuitBreaker();
    });

    this.l2Cache.on('error', (error) => {
      console.error('❌ L2 Cache (Redis) error:', error);
      this.metrics.errors.l2++;
      this.metrics.errors.total++;
      this.handleCircuitBreaker();
      this.emit('l2:error', error);
    });

    this.l2Cache.on('close', () => {
      console.warn('⚠️ L2 Cache (Redis) connection closed');
      this.emit('l2:close');
    });

    // Connect to Redis
    try {
      await this.l2Cache.connect();
    } catch (error) {
      console.warn('⚠️ L2 Cache (Redis) connection failed, continuing without L2:', error);
    }
  }

  // L3 Cache (Persistent) Implementation
  async initializeL3Cache() {
    if (!this.config.l3.enabled) {
      console.log('⏭️ L3 Cache (Persistent) disabled');
      return;
    }

    // Initialize file-based persistent cache
    const fs = await import('fs/promises');
    const path = await import('path');
    
    try {
      await fs.mkdir(this.config.l3.path, { recursive: true });
      console.log('✅ L3 Cache (Persistent) initialized');
    } catch (error) {
      console.warn('⚠️ L3 Cache (Persistent) initialization failed:', error);
    }
  }

  // Core Cache Operations
  async get(key, options = {}) {
    const startTime = performance.now();
    const operation = this.createOperation('get', key, options);
    
    try {
      // Check circuit breaker
      if (this.isCircuitBreakerOpen()) {
        throw new Error('Circuit breaker is open');
      }

      let result = null;
      let hitLayer = null;

      // Try L1 Cache first
      result = await this.getFromL1(key);
      if (result !== null) {
        hitLayer = 'l1';
        this.metrics.hits.l1++;
        this.metrics.hits.total++;
      } else {
        this.metrics.misses.l1++;
        this.metrics.misses.total++;

        // Try L2 Cache
        result = await this.getFromL2(key);
        if (result !== null) {
          hitLayer = 'l2';
          this.metrics.hits.l2++;
          this.metrics.hits.total++;
          
          // Promote to L1
          if (options.promoteToL1 !== false) {
            await this.setToL1(key, result, options);
          }
        } else {
          this.metrics.misses.l2++;
          this.metrics.misses.total++;

          // Try L3 Cache
          if (this.config.l3.enabled) {
            result = await this.getFromL3(key);
            if (result !== null) {
              hitLayer = 'l3';
              this.metrics.hits.l3++;
              this.metrics.hits.total++;
              
              // Promote to L2 and L1
              if (options.promoteToL2 !== false) {
                await this.setToL2(key, result, options);
              }
              if (options.promoteToL1 !== false) {
                await this.setToL1(key, result, options);
              }
            } else {
              this.metrics.misses.l3++;
              this.metrics.misses.total++;
            }
          }
        }
      }

      const endTime = performance.now();
      const latency = endTime - startTime;
      
      this.recordLatency(hitLayer || 'miss', latency);
      this.recordOperation(operation, result !== null, latency);

      // Handle read-through strategy
      if (result === null && this.config.strategies.readThrough && options.loader) {
        result = await this.handleReadThrough(key, options);
      }

      // Handle refresh-ahead strategy
      if (result !== null && this.config.strategies.refreshAhead && options.refreshLoader) {
        this.scheduleRefreshAhead(key, options);
      }

      return result;
      
    } catch (error) {
      this.handleError('get', key, error);
      throw error;
    }
  }

  async set(key, value, options = {}) {
    const startTime = performance.now();
    const operation = this.createOperation('set', key, options);
    
    try {
      const ttl = options.ttl || this.config.l1.maxAge;
      const layers = options.layers || ['l1', 'l2', 'l3'];
      
      // Serialize and compress value
      const serializedValue = await this.serialize(value);
      
      const promises = [];
      
      // Set to specified layers
      if (layers.includes('l1')) {
        promises.push(this.setToL1(key, serializedValue, { ...options, ttl }));
      }
      
      if (layers.includes('l2') && this.l2Cache) {
        promises.push(this.setToL2(key, serializedValue, { ...options, ttl }));
      }
      
      if (layers.includes('l3') && this.config.l3.enabled) {
        promises.push(this.setToL3(key, serializedValue, { ...options, ttl }));
      }

      // Execute based on strategy
      if (this.config.strategies.writeThrough) {
        await Promise.all(promises);
      } else if (this.config.strategies.writeBack) {
        // Execute L1 immediately, others in background
        if (layers.includes('l1')) {
          await this.setToL1(key, serializedValue, { ...options, ttl });
        }
        // Schedule background writes
        setImmediate(() => {
          Promise.all(promises.slice(1)).catch(error => {
            this.emit('background:error', { operation: 'set', key, error });
          });
        });
      } else {
        await Promise.all(promises);
      }

      const endTime = performance.now();
      const latency = endTime - startTime;
      
      this.recordOperation(operation, true, latency);
      
      return true;
      
    } catch (error) {
      this.handleError('set', key, error);
      throw error;
    }
  }

  async delete(key, options = {}) {
    const startTime = performance.now();
    const operation = this.createOperation('delete', key, options);
    
    try {
      const layers = options.layers || ['l1', 'l2', 'l3'];
      const promises = [];
      
      if (layers.includes('l1')) {
        promises.push(this.deleteFromL1(key));
      }
      
      if (layers.includes('l2') && this.l2Cache) {
        promises.push(this.deleteFromL2(key));
      }
      
      if (layers.includes('l3') && this.config.l3.enabled) {
        promises.push(this.deleteFromL3(key));
      }

      await Promise.all(promises);

      const endTime = performance.now();
      const latency = endTime - startTime;
      
      this.recordOperation(operation, true, latency);
      
      return true;
      
    } catch (error) {
      this.handleError('delete', key, error);
      throw error;
    }
  }

  async clear(layers = ['l1', 'l2', 'l3']) {
    const promises = [];
    
    if (layers.includes('l1')) {
      promises.push(this.clearL1());
    }
    
    if (layers.includes('l2') && this.l2Cache) {
      promises.push(this.clearL2());
    }
    
    if (layers.includes('l3') && this.config.l3.enabled) {
      promises.push(this.clearL3());
    }

    await Promise.all(promises);
    
    this.emit('cleared', { layers });
  }

  // L1 Cache Operations
  async getFromL1(key) {
    try {
      const value = this.l1Cache.get(key);
      return value !== undefined ? await this.deserialize(value) : null;
    } catch (error) {
      this.metrics.errors.l1++;
      this.emit('l1:error', { operation: 'get', key, error });
      return null;
    }
  }

  async setToL1(key, value, options = {}) {
    try {
      const ttl = options.ttl || this.config.l1.maxAge;
      this.l1Cache.set(key, value, { ttl });
      return true;
    } catch (error) {
      this.metrics.errors.l1++;
      this.emit('l1:error', { operation: 'set', key, error });
      return false;
    }
  }

  async deleteFromL1(key) {
    try {
      return this.l1Cache.delete(key);
    } catch (error) {
      this.metrics.errors.l1++;
      this.emit('l1:error', { operation: 'delete', key, error });
      return false;
    }
  }

  async clearL1() {
    try {
      this.l1Cache.clear();
      return true;
    } catch (error) {
      this.metrics.errors.l1++;
      this.emit('l1:error', { operation: 'clear', error });
      return false;
    }
  }

  // L2 Cache Operations (Redis)
  async getFromL2(key) {
    if (!this.l2Cache || this.isCircuitBreakerOpen()) {
      return null;
    }

    try {
      const fullKey = this.config.l2.keyPrefix + key;
      const value = await this.l2Cache.get(fullKey);
      return value ? await this.deserialize(value) : null;
    } catch (error) {
      this.metrics.errors.l2++;
      this.handleCircuitBreaker();
      this.emit('l2:error', { operation: 'get', key, error });
      return null;
    }
  }

  async setToL2(key, value, options = {}) {
    if (!this.l2Cache || this.isCircuitBreakerOpen()) {
      return false;
    }

    try {
      const fullKey = this.config.l2.keyPrefix + key;
      const ttl = Math.floor((options.ttl || this.config.l2.maxAge) / 1000);
      
      if (ttl > 0) {
        await this.l2Cache.setex(fullKey, ttl, value);
      } else {
        await this.l2Cache.set(fullKey, value);
      }
      
      return true;
    } catch (error) {
      this.metrics.errors.l2++;
      this.handleCircuitBreaker();
      this.emit('l2:error', { operation: 'set', key, error });
      return false;
    }
  }

  async deleteFromL2(key) {
    if (!this.l2Cache || this.isCircuitBreakerOpen()) {
      return false;
    }

    try {
      const fullKey = this.config.l2.keyPrefix + key;
      const result = await this.l2Cache.del(fullKey);
      return result > 0;
    } catch (error) {
      this.metrics.errors.l2++;
      this.handleCircuitBreaker();
      this.emit('l2:error', { operation: 'delete', key, error });
      return false;
    }
  }

  async clearL2() {
    if (!this.l2Cache || this.isCircuitBreakerOpen()) {
      return false;
    }

    try {
      const pattern = this.config.l2.keyPrefix + '*';
      const keys = await this.l2Cache.keys(pattern);
      
      if (keys.length > 0) {
        await this.l2Cache.del(...keys);
      }
      
      return true;
    } catch (error) {
      this.metrics.errors.l2++;
      this.handleCircuitBreaker();
      this.emit('l2:error', { operation: 'clear', error });
      return false;
    }
  }

  // L3 Cache Operations (Persistent)
  async getFromL3(key) {
    if (!this.config.l3.enabled) {
      return null;
    }

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.join(this.config.l3.path, `${key}.cache`);
      const metaPath = path.join(this.config.l3.path, `${key}.meta`);
      
      // Check if files exist
      try {
        await fs.access(filePath);
        await fs.access(metaPath);
      } catch {
        return null;
      }

      // Check expiration
      const metaData = JSON.parse(await fs.readFile(metaPath, 'utf8'));
      if (Date.now() > metaData.expiry) {
        // Clean up expired files
        await fs.unlink(filePath).catch(() => {});
        await fs.unlink(metaPath).catch(() => {});
        return null;
      }

      // Read and decompress data
      let data = await fs.readFile(filePath);
      
      if (metaData.compressed) {
        data = await decompress(data);
      }

      return await this.deserialize(data.toString());
      
    } catch (error) {
      this.metrics.errors.l3++;
      this.emit('l3:error', { operation: 'get', key, error });
      return null;
    }
  }

  async setToL3(key, value, options = {}) {
    if (!this.config.l3.enabled) {
      return false;
    }

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.join(this.config.l3.path, `${key}.cache`);
      const metaPath = path.join(this.config.l3.path, `${key}.meta`);
      
      const ttl = options.ttl || this.config.l3.maxAge;
      const expiry = Date.now() + ttl;
      
      // Prepare data
      let data = Buffer.from(value);
      let compressed = false;
      
      if (this.config.l3.compression && data.length > this.config.serialization.compressionThreshold) {
        data = await compress(data, {
          level: this.config.serialization.compressionLevel
        });
        compressed = true;
      }

      // Write data and metadata
      await Promise.all([
        fs.writeFile(filePath, data),
        fs.writeFile(metaPath, JSON.stringify({
          key,
          expiry,
          compressed,
          size: data.length,
          created: Date.now()
        }))
      ]);
      
      return true;
      
    } catch (error) {
      this.metrics.errors.l3++;
      this.emit('l3:error', { operation: 'set', key, error });
      return false;
    }
  }

  async deleteFromL3(key) {
    if (!this.config.l3.enabled) {
      return false;
    }

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const filePath = path.join(this.config.l3.path, `${key}.cache`);
      const metaPath = path.join(this.config.l3.path, `${key}.meta`);
      
      await Promise.all([
        fs.unlink(filePath).catch(() => {}),
        fs.unlink(metaPath).catch(() => {})
      ]);
      
      return true;
      
    } catch (error) {
      this.metrics.errors.l3++;
      this.emit('l3:error', { operation: 'delete', key, error });
      return false;
    }
  }

  async clearL3() {
    if (!this.config.l3.enabled) {
      return false;
    }

    try {
      const fs = await import('fs/promises');
      const files = await fs.readdir(this.config.l3.path);
      
      const deletePromises = files
        .filter(file => file.endsWith('.cache') || file.endsWith('.meta'))
        .map(file => fs.unlink(path.join(this.config.l3.path, file)).catch(() => {}));
      
      await Promise.all(deletePromises);
      return true;
      
    } catch (error) {
      this.metrics.errors.l3++;
      this.emit('l3:error', { operation: 'clear', error });
      return false;
    }
  }

  // Serialization and Compression
  async serialize(value) {
    try {
      let serialized;
      
      switch (this.config.serialization.method) {
        case 'json':
          serialized = JSON.stringify(value);
          break;
        case 'msgpack':
          const msgpack = await import('msgpackr');
          serialized = msgpack.pack(value);
          break;
        default:
          serialized = JSON.stringify(value);
      }

      // Compress if enabled and size threshold met
      if (this.config.serialization.compression) {
        const data = Buffer.from(serialized);
        if (data.length > this.config.serialization.compressionThreshold) {
          const compressed = await compress(data, {
            level: this.config.serialization.compressionLevel
          });
          return JSON.stringify({
            compressed: true,
            data: compressed.toString('base64')
          });
        }
      }

      return serialized;
      
    } catch (error) {
      console.error('Serialization error:', error);
      throw new Error('Failed to serialize value');
    }
  }

  async deserialize(value) {
    try {
      // Check if value is compressed
      if (typeof value === 'string' && value.startsWith('{"compressed":true')) {
        const wrapper = JSON.parse(value);
        if (wrapper.compressed) {
          const compressed = Buffer.from(wrapper.data, 'base64');
          const decompressed = await decompress(compressed);
          value = decompressed.toString();
        }
      }

      switch (this.config.serialization.method) {
        case 'json':
          return JSON.parse(value);
        case 'msgpack':
          const msgpack = await import('msgpackr');
          return msgpack.unpack(Buffer.from(value));
        default:
          return JSON.parse(value);
      }
      
    } catch (error) {
      console.error('Deserialization error:', error);
      throw new Error('Failed to deserialize value');
    }
  }

  // Advanced Caching Strategies
  async handleReadThrough(key, options) {
    try {
      const value = await options.loader(key);
      
      if (value !== null && value !== undefined) {
        // Store in cache with specified TTL
        await this.set(key, value, {
          ttl: options.ttl,
          layers: options.layers
        });
      }
      
      return value;
      
    } catch (error) {
      this.emit('readthrough:error', { key, error });
      throw error;
    }
  }

  scheduleRefreshAhead(key, options) {
    if (this.refreshJobs.has(key)) {
      return; // Already scheduled
    }

    const refreshTime = Date.now() + (options.refreshDelay || 30000); // 30 seconds default
    
    const job = setTimeout(async () => {
      try {
        const value = await options.refreshLoader(key);
        
        if (value !== null && value !== undefined) {
          await this.set(key, value, {
            ttl: options.ttl,
            layers: options.layers
          });
        }
        
        this.refreshJobs.delete(key);
        this.emit('refreshahead:success', { key, value });
        
      } catch (error) {
        this.refreshJobs.delete(key);
        this.emit('refreshahead:error', { key, error });
      }
    }, refreshTime - Date.now());

    this.refreshJobs.set(key, job);
  }

  // Circuit Breaker Implementation
  isCircuitBreakerOpen() {
    if (!this.config.strategies.circuitBreaker) {
      return false;
    }

    const { state, nextAttempt } = this.metrics.circuitBreaker;
    
    if (state === 'open') {
      if (Date.now() >= nextAttempt) {
        this.metrics.circuitBreaker.state = 'half-open';
        return false;
      }
      return true;
    }
    
    return false;
  }

  handleCircuitBreaker() {
    if (!this.config.strategies.circuitBreaker) {
      return;
    }

    this.metrics.circuitBreaker.failures++;
    this.metrics.circuitBreaker.lastFailure = Date.now();

    if (this.metrics.circuitBreaker.failures >= this.circuitBreaker.failureThreshold) {
      this.metrics.circuitBreaker.state = 'open';
      this.metrics.circuitBreaker.nextAttempt = Date.now() + this.circuitBreaker.timeout;
      
      this.emit('circuitbreaker:open', {
        failures: this.metrics.circuitBreaker.failures,
        timeout: this.circuitBreaker.timeout
      });
    }
  }

  resetCircuitBreaker() {
    this.metrics.circuitBreaker.state = 'closed';
    this.metrics.circuitBreaker.failures = 0;
    this.metrics.circuitBreaker.lastFailure = null;
    this.metrics.circuitBreaker.nextAttempt = null;
    
    this.emit('circuitbreaker:closed');
  }

  // Performance Monitoring
  async startPerformanceMonitoring() {
    if (!this.config.performance.enableMetrics) {
      return;
    }

    // Update cache sizes periodically
    setInterval(() => {
      this.updateCacheSize('l1');
      this.updateCacheSize('l2');
      this.updateCacheSize('l3');
    }, 5000);

    // Clean up old latency data
    setInterval(() => {
      const cutoff = Date.now() - 300000; // 5 minutes
      
      ['l1', 'l2', 'l3'].forEach(layer => {
        this.metrics.latency[layer] = this.metrics.latency[layer]
          .filter(entry => entry.timestamp > cutoff);
      });
    }, 60000);

    // Emit performance metrics
    setInterval(() => {
      this.emit('metrics', this.getMetrics());
    }, 10000);

    console.log('📊 Performance monitoring started');
  }

  recordLatency(layer, latency) {
    if (layer && layer !== 'miss') {
      this.metrics.latency[layer].push({
        value: latency,
        timestamp: Date.now()
      });

      // Emit warnings for slow operations
      if (latency > this.config.performance.warningThreshold) {
        this.emit('performance:warning', {
          layer,
          latency,
          threshold: this.config.performance.warningThreshold
        });
      }
    }
  }

  recordOperation(operation, success, latency) {
    this.metrics.operations++;
    
    if (this.config.performance.enableProfiling) {
      this.emit('operation', {
        ...operation,
        success,
        latency,
        timestamp: Date.now()
      });
    }
  }

  createOperation(type, key, options) {
    return {
      id: uuidv4(),
      type,
      key,
      options: { ...options },
      timestamp: Date.now(),
      pid: process.pid,
      worker: cluster.worker?.id || 'master'
    };
  }

  updateCacheSize(layer) {
    try {
      switch (layer) {
        case 'l1':
          this.metrics.size.l1 = this.l1Cache?.calculatedSize || 0;
          break;
        case 'l2':
          // Redis size would require MEMORY USAGE commands
          // For now, we'll estimate based on operations
          break;
        case 'l3':
          // File system size would require fs.stat operations
          // For now, we'll estimate based on operations
          break;
      }
    } catch (error) {
      // Ignore size calculation errors
    }
  }

  handleError(operation, key, error) {
    this.emit('error', { operation, key, error, timestamp: Date.now() });
    
    if (this.config.performance.enableProfiling) {
      console.error(`Cache ${operation} error for key ${key}:`, error);
    }
  }

  // Utility Methods
  generateKey(prefix, ...parts) {
    return `${prefix}:${parts.filter(Boolean).join(':')}`;
  }

  async mget(keys, options = {}) {
    const results = {};
    const promises = keys.map(async (key) => {
      try {
        const value = await this.get(key, options);
        results[key] = value;
      } catch (error) {
        results[key] = null;
      }
    });

    await Promise.all(promises);
    return results;
  }

  async mset(entries, options = {}) {
    const promises = Object.entries(entries).map(([key, value]) => 
      this.set(key, value, options)
    );

    const results = await Promise.allSettled(promises);
    return results.map(result => result.status === 'fulfilled');
  }

  async getPattern(pattern, layer = 'l2') {
    if (layer === 'l2' && this.l2Cache && !this.isCircuitBreakerOpen()) {
      try {
        const fullPattern = this.config.l2.keyPrefix + pattern;
        const keys = await this.l2Cache.keys(fullPattern);
        const results = {};
        
        if (keys.length > 0) {
          const values = await this.l2Cache.mget(...keys);
          keys.forEach((key, index) => {
            const originalKey = key.replace(this.config.l2.keyPrefix, '');
            results[originalKey] = values[index] ? JSON.parse(values[index]) : null;
          });
        }
        
        return results;
      } catch (error) {
        this.handleError('getPattern', pattern, error);
        return {};
      }
    }

    return {};
  }

  // Statistics and Metrics
  getMetrics() {
    const now = Date.now();
    
    return {
      hits: { ...this.metrics.hits },
      misses: { ...this.metrics.misses },
      sets: { ...this.metrics.sets },
      deletes: { ...this.metrics.deletes },
      errors: { ...this.metrics.errors },
      size: { ...this.metrics.size },
      operations: this.metrics.operations,
      hitRatio: {
        l1: this.metrics.hits.l1 / Math.max(1, this.metrics.hits.l1 + this.metrics.misses.l1),
        l2: this.metrics.hits.l2 / Math.max(1, this.metrics.hits.l2 + this.metrics.misses.l2),
        l3: this.metrics.hits.l3 / Math.max(1, this.metrics.hits.l3 + this.metrics.misses.l3),
        total: this.metrics.hits.total / Math.max(1, this.metrics.hits.total + this.metrics.misses.total)
      },
      averageLatency: {
        l1: this.calculateAverageLatency('l1'),
        l2: this.calculateAverageLatency('l2'),
        l3: this.calculateAverageLatency('l3')
      },
      circuitBreaker: { ...this.metrics.circuitBreaker },
      timestamp: now
    };
  }

  calculateAverageLatency(layer) {
    const latencies = this.metrics.latency[layer];
    if (latencies.length === 0) return 0;
    
    const sum = latencies.reduce((acc, entry) => acc + entry.value, 0);
    return sum / latencies.length;
  }

  getHealthStatus() {
    const metrics = this.getMetrics();
    const issues = [];
    
    // Check hit ratios
    if (metrics.hitRatio.total < 0.3) {
      issues.push('Low overall hit ratio');
    }
    
    // Check error rates
    const totalOps = metrics.hits.total + metrics.misses.total;
    const errorRate = metrics.errors.total / Math.max(1, totalOps);
    if (errorRate > 0.05) {
      issues.push('High error rate');
    }
    
    // Check latencies
    if (metrics.averageLatency.l1 > 10) {
      issues.push('High L1 latency');
    }
    if (metrics.averageLatency.l2 > 100) {
      issues.push('High L2 latency');
    }
    
    // Check circuit breaker
    if (metrics.circuitBreaker.state === 'open') {
      issues.push('Circuit breaker is open');
    }

    return {
      status: issues.length === 0 ? 'healthy' : 'warning',
      issues,
      metrics
    };
  }

  // Cache Warming
  async warmCache(entries, options = {}) {
    const batchSize = options.batchSize || 100;
    const delay = options.delay || 10; // ms between batches
    
    const batches = [];
    const entryArray = Array.isArray(entries) ? entries : Object.entries(entries);
    
    for (let i = 0; i < entryArray.length; i += batchSize) {
      batches.push(entryArray.slice(i, i + batchSize));
    }

    let warmed = 0;
    let errors = 0;

    for (const batch of batches) {
      const promises = batch.map(async ([key, value]) => {
        try {
          await this.set(key, value, options);
          warmed++;
        } catch (error) {
          errors++;
          this.emit('warming:error', { key, error });
        }
      });

      await Promise.all(promises);
      
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    this.emit('warming:complete', { total: entryArray.length, warmed, errors });
    
    return { total: entryArray.length, warmed, errors };
  }

  // Cleanup and Disposal
  async dispose() {
    // Clear all refresh jobs
    for (const [key, job] of this.refreshJobs) {
      clearTimeout(job);
    }
    this.refreshJobs.clear();

    // Close Redis connection
    if (this.l2Cache) {
      await this.l2Cache.disconnect();
    }

    // Clear L1 cache
    if (this.l1Cache) {
      this.l1Cache.clear();
    }

    this.emit('disposed');
    console.log('🧹 Advanced Caching System disposed');
  }
}

// Cache Strategy Implementations
export class CacheStrategy {
  constructor(name, implementation) {
    this.name = name;
    this.implementation = implementation;
  }

  async execute(cache, key, options) {
    return await this.implementation(cache, key, options);
  }
}

// Built-in strategies
export const strategies = {
  // Write-through strategy
  writeThrough: new CacheStrategy('write-through', async (cache, key, value, options) => {
    await cache.set(key, value, { ...options, layers: ['l1', 'l2', 'l3'] });
  }),

  // Write-behind strategy
  writeBehind: new CacheStrategy('write-behind', async (cache, key, value, options) => {
    await cache.set(key, value, { ...options, layers: ['l1'] });
    
    // Schedule background write
    setImmediate(async () => {
      try {
        await cache.set(key, value, { ...options, layers: ['l2', 'l3'] });
      } catch (error) {
        cache.emit('strategy:error', { strategy: 'write-behind', key, error });
      }
    });
  }),

  // Cache-aside strategy
  cacheAside: new CacheStrategy('cache-aside', async (cache, key, loader, options) => {
    let value = await cache.get(key, options);
    
    if (value === null) {
      value = await loader(key);
      if (value !== null) {
        await cache.set(key, value, options);
      }
    }
    
    return value;
  })
};

// Export singleton instance
export const advancedCache = new AdvancedCachingSystem();
export default advancedCache;