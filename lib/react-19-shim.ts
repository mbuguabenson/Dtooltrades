import React from 'react';
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
        // Ensure the old internal name exists so legacy libraries can find it
        if (!ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
            ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = internals;
        }

        // React 19 internal structure changed: ReactCurrentOwner -> owner
        // ALWAYS define this property. Even if internals.owner is null at module-init
        // time, the live getter will return the correct value when the library reads it.
        if (!internals.ReactCurrentOwner) {
            Object.defineProperty(internals, 'ReactCurrentOwner', {
                get() {
                    // internals.owner is the React 19 equivalent; fall back to a safe stub
                    return (internals.owner !== undefined ? internals.owner : { current: null });
                },
                set(val: any) {
                    internals.owner = val;
                },
                configurable: true,
                enumerable: true,
            });
        }

        // Also map Dispatcher if needed (typical for hooks errors)
        if (!internals.ReactCurrentDispatcher) {
            Object.defineProperty(internals, 'ReactCurrentDispatcher', {
                get() {
                    return internals.H || { current: null };
                },
                configurable: true,
                enumerable: true,
            });
        }

        // Map ReactCurrentBatchConfig if needed
        if (!internals.ReactCurrentBatchConfig) {
            Object.defineProperty(internals, 'ReactCurrentBatchConfig', {
                get() {
                    return internals.T !== undefined
                        ? { transition: internals.T }
                        : { transition: null };
                },
                configurable: true,
                enumerable: true,
            });
        }
    } else {
        // Last-resort: if React internals are completely absent, create a stub
        // so legacy libraries don't throw "Cannot read properties of undefined"
        ReactAny.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
            ReactCurrentOwner: { current: null },
            ReactCurrentDispatcher: { current: null },
            ReactCurrentBatchConfig: { transition: null },
        };
    }
}
