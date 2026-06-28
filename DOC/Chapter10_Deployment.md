# Chapter 10: Deployment, Operations, and Maintenance



## 10.1 System Requirements (Production)



| Component | Minimum Specification |

| --- | --- |

| Application Server | 2 vCPU, 4 GB RAM, Ubuntu 22.04 LTS |

| Database | MongoDB 6.0+ (Atlas M10 or self-hosted replica set) |

| Storage | 50 GB SSD for uploads + contract PDFs |

| Chromium | Required for Puppeteer PDF generation |

| Node.js | v20 LTS |



## 10.2 Environment Variables



| Variable | Purpose |

| --- | --- |

| MONGODB_URI | MongoDB connection string |

| JWT_SECRET | Access token signing key |

| JWT_REFRESH_SECRET | Refresh token signing key |

| UPLOADS_DIR | File storage path |

| SMTP_HOST / SMTP_USER | Email OTP delivery |

| ANTHROPIC_API_KEY | AI fallback provider |

| PAYMOB_API_KEY | Payment gateway (production) |

| NODE_ENV | production / development |



## 10.3 Installation Steps



```bash

git clone https://github.com/org/el-moquwal.git

cd el-moquwal/backend && npm ci

cp .env.example .env   # configure secrets

node scripts/seed.js   # optional demo data

cd .. && node start.js # serves API :4000 + static frontend

```



## 10.4 Process Management



Recommended: **PM2** cluster mode for Node.js, **Nginx** reverse proxy with TLS (Let's Encrypt), rate limiting at edge.



## 10.5 Backup Strategy



- MongoDB: automated snapshots every 6 hours, 30-day retention

- Uploads volume: nightly rsync to object storage (S3-compatible)

- Contract PDFs: immutable after both signatures



## 10.6 Monitoring and Logging



Winston structured logs to file + stdout. Health endpoint: `GET /api/health`. Recommended: UptimeRobot external ping, Sentry for error tracking.



## 10.7 Maintenance Schedule



| Task | Frequency |

| --- | --- |

| Security patches (npm audit fix) | Weekly |

| SSL certificate renewal | Auto (Certbot) |

| Database index review | Monthly |

| Admin audit log review | Weekly |

| Financial reconciliation | Per escrow release |



## 10.8 Chapter Summary



Operational readiness requires hardened hosting, secret management, and backup procedures beyond the academic prototype deployment on localhost:4000.

