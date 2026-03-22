import { NextRequest, NextResponse } from 'next/server'

/**
 * OAuth 2.0 Callback Handler for Deriv
 * This endpoint receives the authorization code from Deriv's OAuth provider
 * and exchanges it for an access token using the PKCE code verifier
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    console.log('[v0] OAuth Callback received:', { code, state, error, hasError: !!error })

    // Handle OAuth errors from Deriv
    if (error) {
      console.error('[v0] OAuth Error from Deriv:', error, errorDescription)
      return NextResponse.redirect(
        new URL(
          `/auth-error?error=${encodeURIComponent(error)}&description=${encodeURIComponent(errorDescription || 'No description provided')}`,
          request.nextUrl.origin
        )
      )
    }

    // Validate required parameters
    if (!code) {
      console.error('[v0] OAuth callback missing authorization code')
      return NextResponse.redirect(
        new URL(
          '/auth-error?error=missing_code&description=Authorization%20code%20not%20received%20from%20Deriv',
          request.nextUrl.origin
        )
      )
    }

    // Validate state parameter for CSRF protection using cookies (since we're on server)
    const sessionState = request.cookies.get('oauth_state')?.value
    console.log('[v0] State validation - received:', state, 'stored:', sessionState)
    
    if (!state || !sessionState || state !== sessionState) {
      console.error('[v0] OAuth state mismatch - possible CSRF attack', { received: state, stored: sessionState })
      return NextResponse.redirect(
        new URL(
          '/auth-error?error=state_mismatch&description=OAuth%20state%20validation%20failed%20-%20please%20try%20logging%20in%20again',
          request.nextUrl.origin
        )
      )
    }

    // Get PKCE code verifier from cookie
    const codeVerifier = request.cookies.get('pkce_code_verifier')?.value
    if (!codeVerifier) {
      console.error('[v0] Missing PKCE code verifier')
      return NextResponse.redirect(
        new URL(
          '/auth-error?error=missing_verifier&description=PKCE%20code%20verifier%20not%20found%20-%20please%20try%20logging%20in%20again',
          request.nextUrl.origin
        )
      )
    }

    // Exchange authorization code for access token via our backend endpoint
    console.log('[v0] Exchanging OAuth code for token...')
    const tokenExchangeResponse = await fetch(
      new URL('/api/auth/deriv-token', request.nextUrl.origin).toString(),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          code_verifier: codeVerifier,
          redirect_uri: `${request.nextUrl.origin}/api/auth/oauth-callback`,
        }),
      }
    )

    if (!tokenExchangeResponse.ok) {
      const errorData = await tokenExchangeResponse.json().catch(() => ({ error: 'Unknown error' }))
      console.error('[v0] Token exchange failed:', tokenExchangeResponse.status, errorData)
      return NextResponse.redirect(
        new URL(
          `/auth-error?error=token_exchange_failed&description=${encodeURIComponent(errorData.error || 'Token exchange failed - please try again')}`,
          request.nextUrl.origin
        )
      )
    }

    const tokenData = await tokenExchangeResponse.json()

    if (!tokenData.access_token) {
      console.error('[v0] No access token in response', tokenData)
      return NextResponse.redirect(
        new URL(
          '/auth-error?error=no_token&description=No%20access%20token%20received%20from%20server',
          request.nextUrl.origin
        )
      )
    }

    console.log('[v0] ✅ OAuth token exchange successful')

    // Redirect to dashboard with token stored in localStorage on client side
    const response_with_cookie = NextResponse.redirect(
      new URL('/dashboard', request.nextUrl.origin)
    )

    // Clear OAuth state and PKCE verifier cookies
    response_with_cookie.cookies.delete('oauth_state')
    response_with_cookie.cookies.delete('pkce_code_verifier')

    // Set a temporary flag cookie so the client knows to store the token
    response_with_cookie.cookies.set({
      name: 'deriv_token_ready',
      value: tokenData.access_token,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60, // 1 minute - just enough for client to read and store
      path: '/',
    })

    return response_with_cookie
  } catch (error) {
    console.error('[v0] OAuth callback error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.redirect(
      new URL(
        `/auth-error?error=server_error&description=${encodeURIComponent('Server error: ' + errorMsg)}`,
        request.nextUrl.origin
      )
    )
  }
}
