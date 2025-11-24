
'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { generateHint } from '@/ai/flows/generate-hints';
import type { GenerateHintInput } from '@/ai/flows/generate-hints';

// Helper function to initialize the admin app if it hasn't been already.
function initAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  // Check if FIREBASE_CONFIG is available and parse it.
  const firebaseConfig = process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG) : {};
  
  // Use the parsed config to initialize the app.
  // This is the standard way to initialize in App Hosting.
  return initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

export async function useHintAction(data: GenerateHintInput & { userId?: string, isFree?: boolean }): Promise<{ success: boolean; message?: string; hint?: string; }> {
  try {
    if (!data.isFree) {
      if (!data.userId) {
        throw new Error("User ID is required for a paid hint.");
      }
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
    }

    const hintResult = await generateHint(data);
    
    if (hintResult && hintResult.hint) {
      return { success: true, hint: hintResult.hint };
    }
    
    throw new Error('AI did not return a valid hint format.');

  } catch (error: any) {
    console.error('Error in useHintAction:', error);
    return { success: false, message: error.message || 'An unexpected error occurred while getting a hint.' };
  }
}
