import { sequelize } from '../config/database';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: DatabaseHealthCheck;
    memory: MemoryHealthCheck;
    disk: DiskHealthCheck;
    dependencies: DependencyHealthCheck;
  };
}

interface DatabaseHealthCheck {
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  error?: string;
}

interface MemoryHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  used: number;
  total: number;
  percentage: number;
  heapUsed: number;
  heapTotal: number;
}

interface DiskHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  // Note: In production, you'd want to check disk space
  // For now, we'll just return healthy
}

interface DependencyHealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
  };
}

export class HealthService {
  private startTime = Date.now();

  async getHealthStatus(): Promise<HealthStatus> {
    const checks = await this.performHealthChecks();
    
    // Determine overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    const checkStatuses = Object.values(checks).map(check => check.status);
    
    if (checkStatuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (checkStatuses.includes('degraded')) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks
    };
  }

  private async performHealthChecks() {
    const [database, memory, disk, dependencies] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDisk(),
      this.checkDependencies()
    ]);

    return {
      database: database.status === 'fulfilled' ? database.value : {
        status: 'unhealthy' as const,
        responseTime: 0,
        error: database.reason?.message || 'Database check failed'
      },
      memory: memory.status === 'fulfilled' ? memory.value : {
        status: 'unhealthy' as const,
        used: 0,
        total: 0,
        percentage: 0,
        heapUsed: 0,
        heapTotal: 0
      },
      disk: disk.status === 'fulfilled' ? disk.value : {
        status: 'unhealthy' as const
      },
      dependencies: dependencies.status === 'fulfilled' ? dependencies.value : {
        status: 'unhealthy' as const,
        services: {}
      }
    };
  }

  private async checkDatabase(): Promise<DatabaseHealthCheck> {
    const startTime = Date.now();
    
    try {
      await sequelize.authenticate();
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'unhealthy',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  private checkMemory(): MemoryHealthCheck {
    const memoryUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const freeMemory = require('os').freemem();
    const usedMemory = totalMemory - freeMemory;
    
    const memoryPercentage = (usedMemory / totalMemory) * 100;
    const heapPercentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    // Mark as degraded if memory usage is over 80%
    if (memoryPercentage > 80 || heapPercentage > 80) {
      status = 'degraded';
    }
    
    // Mark as unhealthy if memory usage is over 95%
    if (memoryPercentage > 95 || heapPercentage > 95) {
      status = 'unhealthy';
    }

    return {
      status,
      used: usedMemory,
      total: totalMemory,
      percentage: memoryPercentage,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal
    };
  }

  private checkDisk(): DiskHealthCheck {
    // In a real application, you'd check disk space here
    // For now, we'll just return healthy
    return {
      status: 'healthy'
    };
  }

  private async checkDependencies(): Promise<DependencyHealthCheck> {
    const services: DependencyHealthCheck['services'] = {};
    
    // Check external dependencies
    // In a real application, you might check:
    // - External APIs
    // - Message queues (Redis, RabbitMQ)
    // - Other microservices
    
    // For now, we'll simulate checking some services
    const dependenciesToCheck = [
      { name: 'openai-api', url: 'https://api.openai.com', enabled: !!process.env.OPENAI_API_KEY },
      { name: 'anthropic-api', url: 'https://api.anthropic.com', enabled: !!process.env.ANTHROPIC_API_KEY }
    ];
    
    for (const dep of dependenciesToCheck) {
      if (!dep.enabled) {
        services[dep.name] = {
          status: 'unhealthy',
          error: 'API key not configured'
        };
        continue;
      }
      
      try {
        const startTime = Date.now();
        // In a real app, you'd make a lightweight API call here
        // For now, we'll just simulate a healthy response
        const responseTime = Date.now() - startTime;
        
        services[dep.name] = {
          status: 'healthy',
          responseTime
        };
      } catch (error) {
        services[dep.name] = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    // Determine overall dependency status
    const serviceStatuses = Object.values(services).map(s => s.status);
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    if (serviceStatuses.includes('unhealthy')) {
      status = serviceStatuses.every(s => s === 'unhealthy') ? 'unhealthy' : 'degraded';
    }

    return {
      status,
      services
    };
  }

  // Readiness check - whether the app is ready to serve traffic
  async isReady(): Promise<boolean> {
    try {
      await sequelize.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  // Liveness check - whether the app is alive (basic check)
  isAlive(): boolean {
    return true; // If we can execute this method, the app is alive
  }
}