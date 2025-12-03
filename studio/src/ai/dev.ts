import { config } from 'dotenv';
config();

// This file is a passthrough to the actual dev setup.
// We keep it in the studio directory to avoid Next.js build issues.
import '@/ai/dev';
