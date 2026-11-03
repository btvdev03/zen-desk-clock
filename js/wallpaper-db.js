/**
 * ZenDesk Clock - High-Performance IndexedDB Custom Wallpaper Storage
 * Stores high-res 4K/HD user photos as Blobs with zero quota-exceeded risk.
 */

class WallpaperDB {
  constructor() {
    this.dbName = 'ZenClockWallpapersDB';
    this.storeName = 'wallpapers';
    this.version = 1;
    this.dbPromise = null;
  }

  _getDB() {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(this.dbName, this.version);
        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
      });
    }
    return this.dbPromise;
  }

  async saveCustomWallpaper(file) {
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('File không hợp lệ hoặc không phải định dạng ảnh.');
    }
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(file, 'user_custom_wallpaper');
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async getCustomWallpaperBlob() {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get('user_custom_wallpaper');
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (e) => reject(e.target.error);
    });
  }

  async clearCustomWallpaper() {
    const db = await this._getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.delete('user_custom_wallpaper');
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  }
}

export const wallpaperDB = new WallpaperDB();
