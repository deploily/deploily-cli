import fs from "fs"
import path from "path"
import os from "os"
import { STORAGE_CONFIG } from "../config/constants.js"
import { StoredCredentials } from "../types/index.js"

// Lazy load keytar - it's optional and may not be available
let keytar: any = null
let keytarLoaded = false

async function getKeytar() {
  if (keytarLoaded) {
    return keytar
  }
  keytarLoaded = true
  try {
    keytar = await import("keytar")
  } catch (error) {
    // keytar not available, will use fallback
    keytar = null
  }
  return keytar
}

class CredentialStorage {
  private serviceName = STORAGE_CONFIG.SERVICE_NAME
  private accountName = "deploily-auth"
  private configDir: string
  private configFilePath: string

  constructor() {
    this.configDir = this.expandPath(STORAGE_CONFIG.CONFIG_DIR)
    this.configFilePath = path.join(this.configDir, STORAGE_CONFIG.CONFIG_FILE)
  }

  /**
   * Expand ~ to home directory
   */
  private expandPath(filepath: string): string {
    if (filepath.startsWith("~")) {
      return path.join(os.homedir(), filepath.slice(1))
    }
    return filepath
  }

  /**
   * Save credentials using keytar (primary) or fallback to config file
   */
  async save(credentials: StoredCredentials): Promise<void> {
    const kt = await getKeytar()
    try {
      // Try keytar first
      if (kt) {
        await kt.setPassword(
          this.serviceName,
          this.accountName,
          JSON.stringify(credentials),
        )
        return
      }
    } catch (error) {
      // Fallback to config file
    }

    // Fallback to config file
    console.warn("Keytar unavailable, using config file for token storage")
    await this.saveToConfigFile(credentials)
  }

  /**
   * Load credentials using keytar (primary) or fallback to config file
   */
  async load(): Promise<StoredCredentials | null> {
    const kt = await getKeytar()
    try {
      // Try keytar first
      if (kt) {
        const password = await kt.getPassword(
          this.serviceName,
          this.accountName,
        )
        if (password) {
          return JSON.parse(password)
        }
      }
    } catch (error) {
      // Fallback to config file
      console.warn("Keytar unavailable, checking config file")
    }

    // Try loading from config file
    return await this.loadFromConfigFile()
  }

  /**
   * Clear credentials from keytar (primary) and config file
   */
  async clear(): Promise<void> {
    const kt = await getKeytar()
    try {
      // Clear from keytar
      if (kt) {
        await kt.deletePassword(this.serviceName, this.accountName)
      }
    } catch (error) {
      // Fallback to config file
      console.warn("Could not clear keytar credentials")
    }

    // Clear from config file
    await this.clearConfigFile()
  }

  /**
   * Save to config file (fallback method)
   */
  private async saveToConfigFile(
    credentials: StoredCredentials,
  ): Promise<void> {
    try {
      // Ensure config directory exists
      if (!fs.existsSync(this.configDir)) {
        fs.mkdirSync(this.configDir, { recursive: true })
      }

      fs.writeFileSync(
        this.configFilePath,
        JSON.stringify(credentials, null, 2),
        { mode: 0o600 }, // Restrict permissions to owner only
      )
    } catch (error) {
      throw new Error(`Failed to save credentials: ${error}`)
    }
  }

  /**
   * Load from config file (fallback method)
   */
  private async loadFromConfigFile(): Promise<StoredCredentials | null> {
    try {
      if (!fs.existsSync(this.configFilePath)) {
        return null
      }

      const content = fs.readFileSync(this.configFilePath, "utf-8")
      return JSON.parse(content)
    } catch (error) {
      return null
    }
  }

  /**
   * Clear config file
   */
  private async clearConfigFile(): Promise<void> {
    try {
      if (fs.existsSync(this.configFilePath)) {
        fs.unlinkSync(this.configFilePath)
      }
    } catch (error) {
      // Silently fail if file doesn't exist
    }
  }

  /**
   * Check if credentials exist
   */
  async exists(): Promise<boolean> {
    const credentials = await this.load()
    return credentials !== null
  }

  /**
   * Check if credentials are expired
   */
  async isExpired(): Promise<boolean> {
    const credentials = await this.load()
    if (!credentials) {
      return true
    }

    // Check if token expires in less than 5 minutes
    const bufferSeconds = 300
    return credentials.expires_at < Date.now() / 1000 + bufferSeconds
  }
}

export const credentialStorage = new CredentialStorage()
