import { db } from "../lib/firebase";
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, runTransaction } from "firebase/firestore";

export async function submitReview(tutorId: string, studentId: string, studentName: string, studentImage: string | null, rating: number, comment: string) {
  try {
    const tutorRef = doc(db, "users", tutorId);
    
    await runTransaction(db, async (transaction) => {
      const tutorDoc = await transaction.get(tutorRef);
      if (!tutorDoc.exists()) throw new Error("Tutor not found");

      const data = tutorDoc.data();
      const currentRating = data.rating || 0;
      const currentCount = data.reviewsCount || 0;

      const newCount = currentCount + 1;
      const newRating = ((currentRating * currentCount) + rating) / newCount;

      transaction.update(tutorRef, {
        rating: newRating,
        reviewsCount: newCount,
        updatedAt: serverTimestamp()
      });

      const reviewRef = doc(collection(db, "reviews"));
      transaction.set(reviewRef, {
        tutorId,
        studentId,
        studentName,
        studentImage,
        rating,
        comment,
        createdAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    throw error;
  }
}
