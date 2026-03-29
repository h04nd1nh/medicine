import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    const serviceAccountPath = path.join(process.cwd(), 'config', 'kinhlacgiaminh-firebase-adminsdk-fbsvc-d433ad535b.json');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath),
      });
      console.log('Firebase Admin SDK initialized');
    }
  }

  async sendNotification(token: string, title: string, body: string, data?: any) {
    if (!token) return;

    const message = {
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}
