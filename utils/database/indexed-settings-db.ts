const dbName = "BackgroundDB";
const storeName = "BackgroundImages";

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBRequest).result;
            if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName, {keyPath: "id"});
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const saveToIndexedDB = async (key: string, file: Blob) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();

        reader.onloadend = () => {
            const transaction = db.transaction(storeName, "readwrite");
            const store = transaction.objectStore(storeName);

            store.put({id: key, data: reader.result});

            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
};

export const getFromIndexedDB = async (key: string): Promise<string | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result?.data || null);
        request.onerror = () => reject(request.error);
    });
};

export const getAllFromIndexedDB = async (): Promise<string[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {

            const results = request.result.map((item: any) => item.data || null);
            resolve(results);
        };
        request.onerror = () => reject(request.error);
    });
};

export const deleteFromIndexedDB = async (fileData: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        // Open a cursor to find the entry matching the fileData
        const request = store.openCursor();
        request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
            if (cursor) {
                const entry = cursor.value;
                if (entry.data === fileData) {
                    cursor.delete(); // Delete the matching entry
                } else {
                    cursor.continue(); // Continue searching
                }
            }
        };

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
};

