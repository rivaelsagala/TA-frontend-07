export interface AvatarData {
    id: string;
    idleImage: string | null;
    talkingImage: string | null;
    voice: string | null;
}

export const openDatabase = (): Promise<IDBDatabase | null> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('AvatarDatabase', 2);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('avatars')) {
                db.createObjectStore('avatars', {keyPath: 'id'});
            }
        };

        request.onsuccess = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            resolve(db);
        };

        request.onerror = (event) => {
            console.error('Database error:', (event.target as IDBOpenDBRequest).error);
            reject(new Error('Failed to open IndexedDB'));
        };
    });
};

export const saveAvatar = async (avatarData: AvatarData): Promise<void> => {
    const db = await openDatabase();
    if (!db) return;

    const transaction = db.transaction('avatars', 'readwrite');
    const store = transaction.objectStore('avatars');
    const request = store.add(avatarData);

    request.onerror = (event) => {
        console.error('Error saving avatar:', (event.target as IDBRequest).error);
    };
};

export const getAllAvatars = async (callback: (avatars: AvatarData[]) => void): Promise<void> => {
    const db = await openDatabase();
    if (!db) return;

    const transaction = db.transaction('avatars', 'readonly');
    const store = transaction.objectStore('avatars');
    const request = store.getAll();

    request.onsuccess = () => {
        callback(request.result as AvatarData[]);
    };

    request.onerror = (event) => {
        console.error('Error retrieving avatars:', (event.target as IDBRequest).error);
    };
};

export const uploadImageBase64 = (file: File, callback: (base64Image: string) => void): void => {
    if (!file) {
        console.error('No file provided.');
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const base64Image = event.target?.result as string;
        callback(base64Image);
    };

    reader.onerror = (error) => {
        console.error('Error reading file:', error);
    };

    reader.readAsDataURL(file);
};