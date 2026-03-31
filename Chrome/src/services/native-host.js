const PROJECTTRACK_NATIVE_HOST = "com.projecttrack.nativehost";

function canUseNativeMessaging() {
  return typeof chrome !== "undefined" && !!chrome.runtime?.sendNativeMessage;
}

function sendNativeMessage(message) {
  if (!canUseNativeMessaging()) {
    return Promise.reject(new Error("Native Messaging is not available in this extension."));
  }

  return new Promise((resolve, reject) => {
    chrome.runtime.sendNativeMessage(PROJECTTRACK_NATIVE_HOST, message, (response) => {
      const runtimeError = chrome.runtime.lastError;
      if (runtimeError) {
        reject(new Error(runtimeError.message || "Could not connect to the native host."));
        return;
      }
      resolve(response);
    });
  });
}

export async function pickNativeDirectoryPath() {
  const response = await sendNativeMessage({
    action: "pick_directory"
  });

  if (!response?.ok) {
    throw new Error(response?.error || "The native host did not return a valid folder.");
  }

  if (!response.path || typeof response.path !== "string") {
    throw new Error("The native host did not return the selected folder path.");
  }

  return response.path;
}
