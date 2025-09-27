import { Router, Request, Response } from 'express';
import { HealthService } from '../services/HealthService';

const router = Router();
const healthService = new HealthService();

// Comprehensive health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthService.getHealthStatus();
    
    // Set appropriate HTTP status code based on health
    let statusCode = 200;
    if (healthStatus.status === 'degraded') {
      statusCode = 200; // Still operational, but with issues
    } else if (healthStatus.status === 'unhealthy') {
      statusCode = 503; // Service unavailable
    }
    
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
});

// Kubernetes/Docker liveness probe - simple check
router.get('/health/live', (req: Request, res: Response) => {
  const isAlive = healthService.isAlive();
  
  if (isAlive) {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'dead',
      timestamp: new Date().toISOString()
    });
  }
});

// Kubernetes/Docker readiness probe - checks dependencies
router.get('/health/ready', async (req: Request, res: Response) => {
  try {
    const isReady = await healthService.isReady();
    
    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not-ready',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not-ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Readiness check failed'
    });
  }
});

// Metrics endpoint for monitoring systems (Prometheus format)
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const healthStatus = await healthService.getHealthStatus();
    
    // Convert health status to Prometheus metrics format
    const metrics = [
      `# HELP app_health_status Application health status (0=unhealthy, 1=degraded, 2=healthy)`,
      `# TYPE app_health_status gauge`,
      `app_health_status{environment="${healthStatus.environment}"} ${
        healthStatus.status === 'healthy' ? 2 : 
        healthStatus.status === 'degraded' ? 1 : 0
      }`,
      ``,
      `# HELP app_uptime_seconds Application uptime in seconds`,
      `# TYPE app_uptime_seconds counter`, 
      `app_uptime_seconds{environment="${healthStatus.environment}"} ${Math.floor(healthStatus.uptime / 1000)}`,
      ``,
      `# HELP app_memory_usage_bytes Memory usage in bytes`,
      `# TYPE app_memory_usage_bytes gauge`,
      `app_memory_usage_bytes{type="heap_used",environment="${healthStatus.environment}"} ${healthStatus.checks.memory.heapUsed}`,
      `app_memory_usage_bytes{type="heap_total",environment="${healthStatus.environment}"} ${healthStatus.checks.memory.heapTotal}`,
      `app_memory_usage_bytes{type="system_used",environment="${healthStatus.environment}"} ${healthStatus.checks.memory.used}`,
      `app_memory_usage_bytes{type="system_total",environment="${healthStatus.environment}"} ${healthStatus.checks.memory.total}`,
      ``,
      `# HELP app_database_response_time_milliseconds Database response time in milliseconds`,
      `# TYPE app_database_response_time_milliseconds gauge`,
      `app_database_response_time_milliseconds{environment="${healthStatus.environment}"} ${healthStatus.checks.database.responseTime}`,
      ``,
      `# HELP app_database_status Database status (0=unhealthy, 1=healthy)`,
      `# TYPE app_database_status gauge`,
      `app_database_status{environment="${healthStatus.environment}"} ${
        healthStatus.checks.database.status === 'healthy' ? 1 : 0
      }`
    ];
    
    // Add dependency metrics
    Object.entries(healthStatus.checks.dependencies.services).forEach(([name, service]) => {
      metrics.push(`app_dependency_status{service="${name}",environment="${healthStatus.environment}"} ${
        service.status === 'healthy' ? 1 : 0
      }`);
      
      if (service.responseTime) {
        metrics.push(`app_dependency_response_time_milliseconds{service="${name}",environment="${healthStatus.environment}"} ${service.responseTime}`);
      }
    });
    
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(metrics.join('\n'));
  } catch (error) {
    res.status(500).send(`# Error generating metrics: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }
});

// Info endpoint - static application information
router.get('/info', (req: Request, res: Response) => {
  res.json({
    application: {
      name: 'AI Content Workflow Backend',
      version: process.env.APP_VERSION || '1.0.0',
      description: 'Backend service for AI-powered content creation and translation workflow',
      environment: process.env.NODE_ENV || 'development'
    },
    build: {
      timestamp: process.env.BUILD_TIMESTAMP || 'unknown',
      commit: process.env.GIT_COMMIT || 'unknown',
      branch: process.env.GIT_BRANCH || 'unknown'
    },
    runtime: {
      node: process.version,
      platform: process.platform,
      architecture: process.arch,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    features: {
      apis: ['REST', 'GraphQL'],
      aiProviders: ['OpenAI', 'Anthropic'],
      languages: ['TypeScript', 'JavaScript'],
      databases: ['PostgreSQL']
    }
  });
});

export default router;