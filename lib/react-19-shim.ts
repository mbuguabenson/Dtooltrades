import * as jsxRuntime from 'react/jsx-runtime';

/**
 * React 19 Compatibility Shim for legacy libraries (like @deriv-com/smartcharts-champion)
 * that rely on React internals which were renamed or moved in React 19.
 */
if (typeof window !== 'undefined') {
    const ReactAny = React as any;
    
    // Attach JSX runtime to React object for the binary patch to use
    if (!ReactAny.jsx) {
        ReactAny.jsx = (jsxRuntime as any).jsx;
        ReactAny.jsxs = (jsxRuntime as any).jsxs;
        ReactAny.Fragment = (jsxRuntime as any).Fragment;
    }

    // React 19 moved __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED to 
    // __CLIENT_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED in the browser.
    const internals = ReactAny.__CLIENT_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED || 
                      ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;

    if (internals) {
        // Ensure the old internal name exists
        if (!ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
            ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals;
        }

        // React 19 internal structure changed: ReactCurrentOwner -> owner
        if (!internals.ReactCurrentOwner && internals.owner) {
            Object.defineProperty(internals, 'ReactCurrentOwner', {
                get() {
                    return internals.owner;
                },
                configurable: true,
                enumerable: true
            });
        }
        
        // Also map Dispatcher if needed (typical for hooks errors)
        if (!internals.ReactCurrentDispatcher && internals.H) {
             Object.defineProperty(internals, 'ReactCurrentDispatcher', {
                get() {
                    return internals.H;
                },
                configurable: true,
                enumerable: true
            });
        }
    }
}
