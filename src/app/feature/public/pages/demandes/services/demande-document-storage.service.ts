import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DemandeDocumentStorageService {
  private readonly databaseName = 'taxawu-demandes-documents';
  private readonly storeName = 'blobs';
  private databasePromise: Promise<IDBDatabase> | null = null;

  async save(key: string, blob: Blob): Promise<void> {
    const database = await this.openDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(this.storeName, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Impossible d’enregistrer le fichier.'));
      transaction.objectStore(this.storeName).put(blob, key);
    });
  }

  async read(key: string): Promise<Blob | null> {
    const database = await this.openDatabase();

    return new Promise<Blob | null>((resolve, reject) => {
      const transaction = database.transaction(this.storeName, 'readonly');
      const request = transaction.objectStore(this.storeName).get(key);
      request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error('Impossible de lire le fichier.'));
    });
  }

  async delete(key: string): Promise<void> {
    const database = await this.openDatabase();

    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(this.storeName, 'readwrite');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Impossible de supprimer le fichier.'));
      transaction.objectStore(this.storeName).delete(key);
    });
  }

  async has(key: string): Promise<boolean> {
    return (await this.read(key)) !== null;
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) {
      return this.databasePromise;
    }

    if (typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB n’est pas disponible.'));
    }

    this.databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, 1);

      request.onupgradeneeded = () => {
        request.result.createObjectStore(this.storeName);
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Impossible d’ouvrir IndexedDB.'));
    });

    return this.databasePromise;
  }
}
