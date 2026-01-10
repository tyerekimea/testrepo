
'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { generateHint } from '@/ai/flows/generate-hints';
import type { GenerateHintInput } from '@/ai/schemas/hint';

// Helper function to initialize the admin app if it hasn't been already.
function initAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Check if FIREBASE_CONFIG is available and parse it.
  let firebaseConfig: any = {};
  
  if (process.env.FIREBASE_CONFIG) {
    try {
      firebaseConfig = JSON.parse(process.env.FIREBASE_CONFIG);
    } catch (e) {
      console.error('Failed to parse FIREBASE_CONFIG:', e);
    }
  }
  
  // Fallback to individual environment variables
  const projectId = firebaseConfig.projectId || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    throw new Error('Firebase project ID not found. Set FIREBASE_CONFIG or NEXT_PUBLIC_FIREBASE_PROJECT_ID');
  }
  
  // Use the parsed config to initialize the app.
  // This is the standard way to initialize in App Hosting.
  return initializeApp({
    projectId: projectId,
  });
}

export async function useHintAction(data: GenerateHintInput & { userId?: string | null, isFree?: boolean }): Promise<{ success: boolean; message?: string; hint?: string; }> {
  try {
    // Only check Firebase for paid hints (not free hints)
    if (!data.isFree && data.userId) {
      try {
        initAdminApp();
        const firestore = getFirestore();
        const userProfileRef = firestore.collection('userProfiles').doc(data.userId);

        const transactionResult = await firestore.runTransaction(async (transaction) => {
          const userDoc = await transaction.get(userProfileRef);

          if (!userDoc.exists) {
            throw new Error('User profile not found.');
          }

          const currentHints = userDoc.data()?.hints ?? 0;

          if (currentHints <= 0) {
            return { success: false, message: "You don't have any hints left." };
          }

          transaction.update(userProfileRef, { hints: currentHints - 1 });
          
          return { success: true };
        });

        if (!transactionResult.success) {
          return { success: false, message: transactionResult.message };
        }
      } catch (firebaseError: any) {
        console.error('Firebase error in useHintAction:', firebaseError);
        // If Firebase fails, we can still generate the hint but log the error
        // This prevents Firebase issues from blocking hint generation
        console.warn('Continuing with hint generation despite Firebase error');
      }
    }

    // Generate the hint (works for both free and paid hints)
    const hintResult = await generateHint({
      ...data,
      wordLength: data.word.length,
    });
    
    if (hintResult && hintResult.hint) {
      return { success: true, ...hintResult };
    }
    
    throw new Error('AI did not return a valid hint format.');

  } catch (error: any) {
    console.error('Error in useHintAction:', error);
    return { success: false, message: error.message || 'An unexpected error occurred while getting a hint.' };
  }
}
