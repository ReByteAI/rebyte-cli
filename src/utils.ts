import moment from "https://deno.land/x/momentjs/mod.ts";

export const VersionRegex = new RegExp("^[0-9]+.[0-9]+.[0-9]+$")

// return true if newVersion is greater than latestVersion
export const compareVersion = (latestVersion: string, newVersion: string) => {
  if (!VersionRegex.test(latestVersion)) {
    throw new Error(
        "version is not valid, please use x.x.x format: " + latestVersion
    )
  }
  if (!VersionRegex.test(newVersion)) {
    throw new Error(
        "version is not valid, please use x.x.x format: " + newVersion
    )
  }

  const latestVersionArray = latestVersion.split(".")
  const newVersionArray = newVersion.split(".")
  if (newVersionArray[0] < latestVersionArray[0]) {
    return false
  }
  if (newVersionArray[0] == latestVersionArray[0]) {
    if (newVersionArray[1] < latestVersionArray[1]) {
      return false
    }
    if (newVersionArray[1] == latestVersionArray[1]) {
      if (newVersionArray[2] <= latestVersionArray[2]) {
        return false
      }
    }
  }
  return true
}

export function formatUnix(seconds?: number) {
  return seconds ? moment.unix(seconds).format("YYYY-MM-DD HH:mm:ss") : "";
}
