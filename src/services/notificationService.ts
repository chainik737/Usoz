import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type NotificationType = 'booking' | 'chat' | 'system';

export async function sendNotification(userId: string, title: string, body: string, type: NotificationType, relatedId?: string) {
  try {
    await addDoc(collection(db, "notifications"), {
      userId,
      title,
      body,
      type,
      relatedId,
      isRead: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
