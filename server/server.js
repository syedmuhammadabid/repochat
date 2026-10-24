import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import api from './routes/api.js';

const app = express();
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../client/dist');
const port = process.env.PORT || 3001;
app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '2mb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true }), api);
app.use(express.static(dist));
app.get('*', (_q, s) => s.sendFile(path.join(dist, 'index.html')));
app.listen(port, () => console.log(`RepoChat listening on ${port}`));
