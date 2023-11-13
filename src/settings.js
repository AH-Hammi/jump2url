const DEFAULT_SHORTCUT_KEYS = [
  {
    key: "G",
    title: "Google",
    url: "https://www.google.com/",
    sync: true,
  },
  {
    key: "GM",
    title: "Gmail",
    url: "https://mail.google.com/",
    sync: true,
  },
  {
    key: "T",
    title: "Twitter",
    url: "https://twitter.com/",
    sync: true,
  },
  {
    key: "F",
    title: "Facebook",
    url: "https://www.facebook.com/",
    sync: true,
  },
  {
    key: "YT",
    title: "YouTube",
    url: "https://www.youtube.com/",
    sync: true,
  },
  {
    key: "YTM",
    title: "YouTube Music",
    url: "https://music.youtube.com/",
    sync: true,
  },
];

const DEFAULT_LIST_COLUMN_COUNT = 3;

class Settings {
  static async newAsync() {
    const settings = new Settings();
    await settings._load();

    return settings;
  }

  // return the data
  data() {
    return {
      shortcut_keys: this._shortcut_keys,
    };
  }

  // validate new key
  unique_key(key) {
    console.log("Checking if key is unique");
    console.log("key: ", key);
    // check if the key is valid
    if (
      this._shortcut_keys.find((item) => {
        return item.key == key;
      })
    ) {
      console.log("Key already exists");
      return false;
    }
    return true;
  }

  // validate the key
  validate_key(key, old_key) {
    console.log("Validating key");
    console.log("key: ", key);
    console.log("old_key: ", old_key);
    // check if the key is empty
    if (key == "") {
      console.log("Key is empty");
      return false;
    }
    // check if the key is unique if it is different from the old key
    if (key != old_key && !this.unique_key(key)) {
      console.log("Key is not unique");
      return false;
    }
    return true;
  }

  // validate the title
  validate_title(title) {
    // check if the title is empty
    if (title == "") {
      console.log("Title is empty");
      return false;
    }
    return true;
  }

  // validate the url
  validate_url(url) {
    // check if the url is empty
    if (url == "") {
      console.log("URL is empty");
      return false;
    }
    return true;
  }

  validate_data(settings) {
    if (!this.validate_key(settings.key, settings.old_key)) {
      return false;
    }
    if (!this.validate_title(settings.title)) {
      return false;
    }
    if (!this.validate_url(settings.url)) {
      return false;
    }
    return true;
  }

  // Update one key
  async update(settings) {
    console.log("Updating shortcut key");
    console.log("settings: ", settings);

    // check if the data is valid
    if (!this.validate_data(settings)) {
      return;
    }

    // check if old_key is empty and a new key needs to be added
    if (settings.old_key == "") {
      console.log("Adding new key");
      // add new data
      this._shortcut_keys.push({
        key: settings.key,
        title: settings.title,
        url: settings.url,
        sync: settings.sync,
      });
      this._shortcut_keys.sort(Settings.shortcutKeyCompare);
      await this._save();
      return;
    }

    // find the data to update
    const shortcut_key = this._shortcut_keys.find((item) => {
      return item.key == settings.old_key;
    });
    // check if the key is not found
    if (!shortcut_key) {
      console.log("Key not found, cannot update");
      return;
    }
    // update the data
    shortcut_key.key = settings.key;
    shortcut_key.title = settings.title;
    shortcut_key.url = settings.url;
    shortcut_key.sync = settings.sync;

    console.log("shortcut_keys: ", this._shortcut_keys);

    await this._save();
  }

  // Delete one key
  async delete(key) {
    // find the data to delete
    const shortcut_key = this._shortcut_keys.find((item) => {
      return item.key == key;
    });

    // if not found, return
    if (!shortcut_key) {
      return;
    }

    console.log("shortcut_key: ", shortcut_key);
    // delete the data
    this._shortcut_keys.splice(this._shortcut_keys.indexOf(shortcut_key), 1);
    await this._save();
  }

  async reload() {
    await this._load();
  }

  async _load() {
    // load from local storage
    let localKeys = await get_local_storage("shortcut_keys");
    // check if localKeys is empty

    // add the sync property
    if (localKeys) {
      localKeys.forEach((item) => {
        item.sync = false;
      });
    } else {
      localKeys = [];
    }
    // load from sync storage
    let syncKeys = [];
    // get the number of shards
    const number_of_shards = await get_sync_storage("number_of_shards");
    // check if the number of shards is empty
    if (number_of_shards) {
      // go through each shard
      for (let i = 0; i < number_of_shards; i++) {
        // get the shard
        let shard = await get_sync_storage("shortcut_keys_shard" + i);
        // check if the shard is empty
        if (shard) {
          // add the sync property
          shard.forEach((item) => {
            item.sync = true;
          });
        } else {
          shard = [];
        }
        // add the shard to the list of shards
        syncKeys = syncKeys.concat(shard);
      }
    } else {
      syncKeys = [];
    }
    // combine the local and sync keys
    this._shortcut_keys = localKeys.concat(syncKeys);
    // if there are no keys, use the default keys
    if (this._shortcut_keys.length == 0) {
      this._shortcut_keys = DEFAULT_SHORTCUT_KEYS;
    }
    // sort the keys
    this._shortcut_keys.sort(Settings.shortcutKeyCompare);
  }

  async _save() {
    // shortcutKeys should contain one array of objects with the following properties:
    // key: string    unique
    // title: string
    // url: string
    // sync: boolean  true if the key is stored in sync storage, false if it is stored in local storage

    console.log("Saving shortcut keys: ", this._shortcut_keys);

    // split the shortcutKeys into sync and local and deep copy them
    let sync_keys = JSON.parse(JSON.stringify(this._shortcut_keys.filter((item) => item.sync)));
    let local_keys = JSON.parse(JSON.stringify(this._shortcut_keys.filter((item) => !item.sync)));
    // remove the sync property
    sync_keys.forEach((item) => {
      delete item.sync;
    });
    local_keys.forEach((item) => {
      delete item.sync;
    });
    console.log("local_keys: ", local_keys);
    console.log("sync_keys: ", sync_keys);

    // split syncKeys into individual items each being at most 8KB
    // list of shards
    let sync_shard_list = [];

    // shard of shortcut_keys
    let sync_key_shard = [];
    // size of current list
    let shard_size = 0;

    // go through each item in syncKeys
    for (let i = 0; i < sync_keys.length; i++) {
      const item = sync_keys[i];
      // check if the shard size would be too big with the new item
      if (shard_size + JSON.stringify(item).length > 8000) {
        // add the current list to the list of lists
        sync_shard_list.push(sync_key_shard);
        // empty the current list
        sync_key_shard = [];
        // reset the size
        shard_size = 0;
      }
      // if enough space is available, add the item to the current list
      sync_key_shard.push(item);
      // update the size
      shard_size += JSON.stringify(item).length;
    }

    // add the last list to the list of lists
    sync_shard_list.push(sync_key_shard);

    // try to save the list of lists to sync storage
    // if the sync storage isn't available, save to local storage
    try {
      // go through each list of lists
      for (let i = 0; i < sync_shard_list.length; i++) {
        const item = sync_shard_list[i];
        // save the list to sync storage
        await set_sync_storage({ ["shortcut_keys_shard" + i]: item });
      }
      // save the number of lists to sync storage
      await set_sync_storage({ number_of_shards: sync_shard_list.length });
    } catch (e) {
      // on error log the error
      console.log(e);
      // and add the list to local storage
      local_keys = local_keys.concat(sync_keys);
    }
    // save localKeys to local storage
    await set_local_storage({ shortcut_keys: local_keys });
  }

  static shortcutKeyCompare(o1, o2) {
    if (o1.key < o2.key) return -1;
    if (o1.key > o2.key) return 1;
    return 0;
  }
}

// Save to local storage
function set_local_storage(obj) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(obj, () => {
      if (!chrome.runtime.lastError) {
        resolve();
      } else {
        reject(chrome.runtime.lastError);
      }
    });
  });
}

// Get from local storage
function get_local_storage(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (item) => {
      key ? resolve(item[key]) : resolve(item);
    });
  });
}

// Save to sync storage
function set_sync_storage(obj) {
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

// Get from sync storage
function get_sync_storage(key) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(key, (item) => {
      key ? resolve(item[key]) : resolve(item);
    });
  });
}
