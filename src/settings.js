const DEFAULT_SHORTCUTKEYS = [
  { key: 'G', title: 'Google', url: 'https://www.google.com/' },
  { key: 'GM', title: 'Gmail', url: 'https://mail.google.com/' },
  { key: 'T', title: 'Twitter', url: 'https://twitter.com/' },
  { key: 'F', title: 'Facebook', url: 'https://www.facebook.com/' },
  { key: 'YT', title: 'YouTube', url: 'https://www.youtube.com/' },
  { key: 'YTM', title: 'YouTube Music', url: 'https://music.youtube.com/' },
];

const DEFAULT_LIST_COLUMN_COUNT = 3;

class Settings {

  static async newAsync() {

    const settings = new Settings();
    await settings._load();

    return settings;
  }

  data() {
    return {
      shortcutKeys: this._shortcutKeys
    };
  }

  validate_key(key) {
    // check if the key is valid
    if (this._shortcutKeys.find((item) => {
      return item.key == key;
    })) {
      console.log("Key already exists");
      return false;
    }
    
    // check if the key is empty
    if (key == "") {
      console.log("Key is empty");
      return false;
    }

    return true;
  }

  // validate the data
  validate_title(title) {
    // check if the title is empty
    if (title == "") {
      console.log("Title is empty");
      return false;
    }

    return true;
  }

  validate_url(url) {
    // check if the url is empty
    if (url == "") {
      console.log("URL is empty");
      return false;
    }

    return true;
  }

  // Update one key
  async update(settings) {
    // check if old_key is empty and a new key needs to be added
    if (settings.old_key == "") {
      // check if the key is valid
      if (!this.validate_key(settings.key)) {
        return;
      }

      if(settings.url == "") {
        console.log("URL is empty");
        return;
      }

      if (settings.title == "") {
        settings.title = settings.url;
      }

      // add new data
      this._shortcutKeys.push({
        key: settings.key,
        title: settings.title,
        url: settings.url
      });
      this._shortcutKeys.sort(Settings.shortcutKeyCompare);
      await this._save();
      return;
    }

    // find the data to update
    const shortcutKey = this._shortcutKeys.find((item) => {
      return item.key == settings.old_key;
    });
    if(!this.validate_key(settings.key)) {
      return;
    }
    if(settings.url == "") {
      console.log("URL is empty");
      return;
    }
    if (settings.title == "") {
      settings.title = settings.url;
    }
    // update the data
    shortcutKey.key = settings.key;
    shortcutKey.title = settings.title;
    shortcutKey.url = settings.url;

    await this._save();
  }

  // Delete one key
  async delete(key) {
    // find the data to delete
    const shortcutKey = this._shortcutKeys.find((item) => {
      return item.key == key;
    });

    // if not found, return
    if (!shortcutKey) {
      return;
    }

    console.log("shortcutKey: ", shortcutKey);
    // delete the data
    this._shortcutKeys.splice(this._shortcutKeys.indexOf(shortcutKey), 1);
    await this._save();
  }

  async reload() {
    await this._load();
  }

  async _load() {
    var loaded = await getSyncStorage("settings");
    console.log("loaded: ", loaded);
    loaded = loaded || {};
    this._shortcutKeys = (loaded.shortcutKeys || DEFAULT_SHORTCUTKEYS).sort(Settings.shortcutKeyCompare);
    this._save();
  }

  async _save() {
    const saveData = {
      settings: {
        shortcutKeys: this._shortcutKeys,
      }
    };
    console.log("saveData: ", saveData);

    // Save to Storage
    await setSyncStorage(saveData);
  }

  static shortcutKeyCompare(o1, o2) {
    if (o1.key < o2.key) return -1;
    if (o1.key > o2.key) return 1;
    return 0;
  }
}

function setSyncStorage(obj) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(obj, () => {
      if (!chrome.runtime.lastError) {
        resolve();
      } else {
        reject(chrome.runtime.lastError);
      }
    });
  });
}

function getSyncStorage(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(key, (item) => {
      key ? resolve(item[key]) : resolve(item);
    });
  });
}