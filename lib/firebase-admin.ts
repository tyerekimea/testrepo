
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

export function initFirestore() {
  if (getApps().length === 0) {
    app = initializeApp();
    getFirestore(app).settings({ ignoreUndefinedProperties: true });
  } else {
    app = getApps()[0];
  }
  return app;
}
