import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@amplify/data/resource';
import { configureAmplify } from '@/lib/amplify-config';

configureAmplify();

export const client = generateClient<Schema>();
