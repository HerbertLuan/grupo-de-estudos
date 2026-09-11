import { httpsCallable } from 'firebase/functions';
import { getBlob, ref, uploadBytes } from 'firebase/storage';
import { functions, storage } from '../firebase/config';
import type { Timestamp } from 'firebase/firestore';
export const STORY_EMOJIS = ['🔥', '💪', '📚', '⚡', '🎯', '👏'] as const;
export interface Story {
  id: string; userId: string; groupId: string; storagePath: string;
  published: boolean; createdAt: Timestamp; expiresAt: Timestamp;
}
export async function uploadStory(file: Blob) {
  const result = await httpsCallable<unknown, { storyId: string; storagePath: string }>(functions, 'prepare_study_story')({});
  await uploadBytes(ref(storage, result.data.storagePath), file, { contentType: 'image/jpeg', customMetadata: { storyId: result.data.storyId } });
  await httpsCallable(functions, 'publish_study_story')({ storyId: result.data.storyId });
}
export const removeStory = (storyId: string) => httpsCallable(functions, 'remove_study_story')({ storyId });
export const reactToStory = (storyId: string, emoji: string | null) => httpsCallable(functions, 'react_to_study_story')({ storyId, emoji });
// Authenticated reads avoid permanent public download tokens for private group photos.
export const loadStoryPhoto = (story: Story) => getBlob(ref(storage, story.storagePath), 5 * 1024 * 1024);

export async function preparePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size > 5 * 1024 * 1024) throw new Error('Selecione uma imagem estática de até 5 MB (sem GIF).');
  // Flatten to a static JPEG, honoring orientation and stripping metadata.
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível preparar esta foto.');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => canvas.toBlob(blob => blob && blob.size <= 5 * 1024 * 1024 ? resolve(blob) : reject(new Error('Não foi possível preparar esta foto.')), 'image/jpeg', 0.88));
  } finally { bitmap.close(); }
}
