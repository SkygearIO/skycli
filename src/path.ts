import { join, basename } from "path";
import { homedir, tmpdir } from "os";

const home = homedir();
const tmp = tmpdir();
const paths = {
  config: join(process.env.XDG_CONFIG_HOME || join(home, ".config"), "skycli"),
  data: join(
    process.env.XDG_DATA_HOME || join(home, ".local", "share"),
    "skycli"
  ),
  temp: join(tmp, basename(home), "skycli"),
};

if (process.platform === "win32") {
  const appData = process.env.APPDATA || join(home, "AppData", "Roaming");
  const localAppData =
    process.env.LOCALAPPDATA || join(home, "AppData", "Local");
  paths.config = join(appData, "skycli", "Config");
  paths.data = join(localAppData, "skycli", "Data");
  paths.temp = join(tmp, "skycli");
}

export function configPath(...relPaths: string[]): string {
  return join(paths.config, ...relPaths);
}

export function dataPath(...relPaths: string[]): string {
  return join(paths.data, ...relPaths);
}

export function tempPath(...relPaths: string[]): string {
  return join(paths.temp, ...relPaths);
}
