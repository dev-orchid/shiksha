(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/lib/supabase/client.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createClient",
    ()=>createClient,
    "getSupabaseClient",
    ()=>getSupabaseClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@supabase/ssr/dist/module/createBrowserClient.js [app-client] (ecmascript)");
;
function createClient() {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$ssr$2f$dist$2f$module$2f$createBrowserClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createBrowserClient"])(("TURBOPACK compile-time value", "https://szvlbkowmhpubjjkijnp.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6dmxia293bWhwdWJqamtpam5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNTI5NTYsImV4cCI6MjA4MjcyODk1Nn0.mTVCJRZW_BS1KxrJzeFuS2bo6YCK2zGXousCjw9sztc"));
}
// Singleton instance for client-side usage
let browserClient = null;
function getSupabaseClient() {
    if (!browserClient) {
        browserClient = createClient();
    }
    return browserClient;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/providers/SessionProvider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SessionProvider",
    ()=>SessionProvider,
    "useSession",
    ()=>useSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase/client.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const SessionContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({
    user: null,
    profile: null,
    loading: true,
    signOut: async ()=>{}
});
function useSession() {
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(SessionContext);
}
_s(useSession, "gDsCjeeItUuvgOWf1v4qoK9RF6k=");
function SessionProvider({ children }) {
    _s1();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [profile, setProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SessionProvider.useEffect": ()=>{
            const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
            const fetchProfile = {
                "SessionProvider.useEffect.fetchProfile": async (authUser)=>{
                    // Fetch user profile
                    const { data } = await supabase.from('users').select('id, email, role, school_id').eq('id', authUser.id).single();
                    const userData = data;
                    // Get school_id from user record or fallback to auth metadata
                    const schoolId = userData?.school_id || authUser.user_metadata?.school_id || null;
                    // Fetch school name separately if we have a school_id
                    let schoolName = null;
                    if (schoolId) {
                        const { data: schoolData } = await supabase.from('schools').select('name').eq('id', schoolId).single();
                        schoolName = schoolData?.name ?? null;
                    }
                    // Get display name from user metadata, fall back to email prefix
                    const displayName = authUser.user_metadata?.display_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User';
                    if (userData) {
                        setProfile({
                            id: userData.id,
                            email: userData.email,
                            displayName: displayName,
                            role: userData.role,
                            schoolId: schoolId,
                            schoolName: schoolName
                        });
                    } else {
                        // Fallback to user_metadata if user record doesn't exist yet
                        setProfile({
                            id: authUser.id,
                            email: authUser.email || '',
                            displayName: displayName,
                            role: authUser.user_metadata?.role || 'user',
                            schoolId: schoolId,
                            schoolName: schoolName
                        });
                    }
                }
            }["SessionProvider.useEffect.fetchProfile"];
            // Get initial session
            supabase.auth.getSession().then({
                "SessionProvider.useEffect": ({ data: { session } })=>{
                    const authUser = session?.user ?? null;
                    setUser(authUser);
                    if (authUser) {
                        fetchProfile(authUser);
                    }
                    setLoading(false);
                }
            }["SessionProvider.useEffect"]);
            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange({
                "SessionProvider.useEffect": (_event, session)=>{
                    const authUser = session?.user ?? null;
                    setUser(authUser);
                    if (authUser) {
                        fetchProfile(authUser);
                    } else {
                        setProfile(null);
                    }
                    setLoading(false);
                }
            }["SessionProvider.useEffect"]);
            return ({
                "SessionProvider.useEffect": ()=>subscription.unsubscribe()
            })["SessionProvider.useEffect"];
        }
    }["SessionProvider.useEffect"], []);
    const signOut = async ()=>{
        const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$client$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getSupabaseClient"])();
        await supabase.auth.signOut();
        window.location.href = '/login';
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SessionContext.Provider, {
        value: {
            user,
            profile,
            loading,
            signOut
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/providers/SessionProvider.tsx",
        lineNumber: 133,
        columnNumber: 5
    }, this);
}
_s1(SessionProvider, "DYSpA4ZauWKW8e4CNkO4ayA+RbM=");
_c = SessionProvider;
var _c;
__turbopack_context__.k.register(_c, "SessionProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_81b6b2cd._.js.map