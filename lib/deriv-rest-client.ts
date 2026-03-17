import { DERIV_API, DERIV_CONFIG } from "./deriv-config"

export class DerivRESTClient {
    private appId: string
    private token: string | null = null

    constructor(appId: string = DERIV_CONFIG.APP_ID) {
        this.appId = appId
        this.resolveToken()
    }

    private resolveToken() {
        if (typeof window !== "undefined") {
            this.token = 
                localStorage.getItem("deriv_auth_token") || 
                localStorage.getItem("authToken") || 
                localStorage.getItem("clientToken") || 
                localStorage.getItem("deriv_api_token")
        }
    }

    setToken(token: string) {
        this.token = token
    }

    private async request(path: string, options: RequestInit = {}): Promise<any> {
        const url = `${DERIV_API.REST_BASE}${path}`
        const headers = new Headers(options.headers || {})

        headers.set("Deriv-App-ID", this.appId)
        headers.set("Content-Type", "application/json")

        if (this.token) {
            headers.set("Authorization", `Bearer ${this.token}`)
        }

        const response = await fetch(url, {
            ...options,
            headers
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.message || `REST Request failed with status ${response.status}`)
        }

        return response.json()
    }

    /**
     * Fetch a one-time password (OTP) for WebSocket authentication
     * @param accountId The login ID of the account (e.g., CR12345, VRTC12345)
     */
    async getOTP(accountId: string): Promise<string> {
        try {
            const data = await this.request(`/trading/v1/options/accounts/${accountId}/otp`, {
                method: "POST"
            })
            return data.otp
        } catch (error) {
            console.error("[v0] Failed to fetch OTP:", error)
            throw error
        }
    }

    /**
     * Get all registered Options accounts for the authenticated user
     */
    async getAccounts(): Promise<any[]> {
        return this.request("/trading/v1/options/accounts", {
            method: "GET"
        })
    }

    /**
     * Reset demo account balance
     */
    async resetDemoBalance(accountId: string): Promise<any> {
        return this.request(`/trading/v1/options/accounts/${accountId}/reset-demo-balance`, {
            method: "POST"
        })
    }
}

export const derivREST = new DerivRESTClient()
