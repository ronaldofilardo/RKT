const fs = require('fs');
const path = require('path');

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath, { withFileTypes: true }).forEach(function(dirent) {
        const filePath = path.join(currentDirPath, dirent.name);
        if (dirent.isDirectory()) {
            if (dirent.name !== 'node_modules' && dirent.name !== '.next' && dirent.name !== 'dist' && dirent.name !== 'scratch') {
                walkSync(filePath, callback);
            }
        } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
            callback(filePath);
        }
    });
}

walkSync('c:/apps/RKT/src', function(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // auth-client.ts
    if (filePath.endsWith('auth-client.ts')) {
        content = content.replace(/accessToken: string;\n/g, '');
        content = content.replace(/sessionStorage\.setItem\(ACCESS_TOKEN_KEY, data\.accessToken\);\n/g, '');
        content = content.replace(/const accessToken = sessionStorage\.getItem\(ACCESS_TOKEN_KEY\);\n/g, '');
        content = content.replace(/if \(!accessToken \|\| !userRole\) return false;\n/g, 'if (!userRole) return false;\n');
        content = content.replace(/document\.cookie = buildCookie\('access_token', accessToken\);\n/g, '');
        content = content.replace(/document\.cookie = buildCookie\('rkt_access_token', accessToken\);\n/g, '');
        content = content.replace(/accessToken: string \| null;\n/g, '');
        content = content.replace(/accessToken: sessionStorage\.getItem\(ACCESS_TOKEN_KEY\),\n/g, '');
        content = content.replace(/sessionStorage\.removeItem\(ACCESS_TOKEN_KEY\);\n/g, '');
        content = content.replace(/const ACCESS_TOKEN_KEY = 'access_token';\n/g, '');
        content = content.replace(/accessToken: null, /g, '');
    }

    // login/route.ts
    if (filePath.replace(/\\/g, '/').endsWith('api/auth/login/route.ts')) {
        content = content.replace(/response\.cookies\.set\('access_token', accessToken, \{\s+httpOnly: false,\s+sameSite: 'lax',\s+secure: process\.env\.NODE_ENV === 'production',\s+maxAge: 60 \* 60 \* 2,\s+path: '\/',\s+\}\);\n?/g, '');
    }

    // useDashboardMatches.ts
    if (filePath.replace(/\\/g, '/').endsWith('useDashboardMatches.ts')) {
        content = content.replace(/const \{ accessToken \} = readAuthState\(\);\n/g, 'const { userRole } = readAuthState();\n');
        content = content.replace(/if \(!accessToken \|\| !cookieOk\) \{/g, 'if (!userRole || !cookieOk) {');
        content = content.replace(/if \(isTokenExpired\(accessToken\)\) \{[\s\S]*?return null;\n  \}\n/g, '');
        content = content.replace(/return accessToken;/g, 'return true;');
        content = content.replace(/const accessToken = checkAuthAndGetToken\(routerRef\.current, setLoading\);\n    if \(!accessToken\) return;/g, 'const hasAuth = checkAuthAndGetToken(routerRef.current, setLoading);\n    if (!hasAuth) return;');
        content = content.replace(/accessToken: string, /g, '');
        content = content.replace(/headers: \{ authorization: `Bearer \$\{accessToken\}` \},/g, '{}');
        content = content.replace(/const matchPromise = fetchMatchesEndpoint\("\/api\/matches", accessToken, /g, 'const matchPromise = fetchMatchesEndpoint("/api/matches", ');
        content = content.replace(/const suspendedPromise = fetchMatchesEndpoint\("\/api\/matches\/suspended-sessions", accessToken, /g, 'const suspendedPromise = fetchMatchesEndpoint("/api/matches/suspended-sessions", ');
    }

    // annotationSessionService.ts
    if (filePath.replace(/\\/g, '/').endsWith('annotationSessionService.ts')) {
        content = content.replace(/getToken: \(\) => Promise<string \| null>;\n?/g, '');
        content = content.replace(/const token = await config\.getToken\(\);\n/g, '');
        content = content.replace(/\s*\.\.\.\(token \? \{ Authorization: `Bearer \$\{token\}` \} : \{\}\),/g, '');
        content = content.replace(/getToken: \(\) => Promise\.resolve\(sessionStorage\.getItem\("access_token"\)\),\n?/g, '');
    }

    // contexts/SessionContext.tsx
    if (filePath.replace(/\\/g, '/').endsWith('contexts/SessionContext.tsx')) {
        content = content.replace(/tokenRef\.current = sessionStorage\.getItem\('access_token'\);\n/g, '');
    }

    // useSessionManager.ts
    if (filePath.replace(/\\/g, '/').endsWith('useSessionManager.ts')) {
        content = content.replace(/const token = tokenRef\.current \?\? sessionStorage\.getItem\("access_token"\);\n/g, '');
        content = content.replace(/\s*\.\.\.\(token \? \{ Authorization: `Bearer \$\{token\}` \} : \{\}\),/g, '');
        content = content.replace(/token,\s*\n/g, '');
    }
    
    if (filePath.replace(/\\/g, '/').endsWith('useSessionManager.abandon.ts') || 
        filePath.replace(/\\/g, '/').endsWith('useSessionManager.match-finish.ts') ||
        filePath.replace(/\\/g, '/').endsWith('useSessionManager.pending-abandon.ts')) {
        content = content.replace(/const token = [^;]+;\n/g, '');
        content = content.replace(/\s*Authorization: `Bearer \$\{token\}`,\n/g, '');
        content = content.replace(/\s*\.\.\.\(token \? \{ Authorization: `Bearer \$\{token\}` \} : \{\}\),/g, '');
        content = content.replace(/\s*\.\.\.\(entry\.token \? \{ Authorization: `Bearer \$\{entry\.token\}` \} : \{\}\),/g, '');
    }

    // useOfflineSync.ts
    if (filePath.replace(/\\/g, '/').endsWith('useOfflineSync.ts')) {
        content = content.replace(/const token = sessionStorage\.getItem\("access_token"\);\n/g, '');
        content = content.replace(/const currentToken = sessionStorage\.getItem\("access_token"\);\n/g, '');
        content = content.replace(/\s*\.\.\.\(currentToken \? \{ Authorization: `Bearer \$\{currentToken\}` \} : \{\}\),/g, '');
        content = content.replace(/\s*\.\.\.\(token \? \{ Authorization: `Bearer \$\{token\}` \} : \{\}\),/g, '');
    }
    
    // useOfflineSync.helpers.ts
    if (filePath.replace(/\\/g, '/').endsWith('useOfflineSync.helpers.ts')) {
        content = content.replace(/accessToken: string/g, '');
        content = content.replace(/Authorization: `Bearer \$\{accessToken\}`,/g, '');
    }

    // useOfflineMatchSync.ts
    if (filePath.replace(/\\/g, '/').endsWith('useOfflineMatchSync.ts')) {
        content = content.replace(/const token = sessionStorage\.getItem\("access_token"\);\n/g, '');
        content = content.replace(/\s*\.\.\.\(token \? \{ Authorization: `Bearer \$\{token\}` \} : \{\}\),/g, '');
    }

    // start-match.helpers.ts & new-match-submit.helpers.ts
    if (filePath.replace(/\\/g, '/').endsWith('start-match.helpers.ts') || filePath.replace(/\\/g, '/').endsWith('new-match-submit.helpers.ts')) {
        content = content.replace(/const accessToken = sessionStorage\.getItem\('access_token'\);\n/g, '');
        content = content.replace(/\s*Authorization: `Bearer \$\{accessToken\}`,/g, '');
        content = content.replace(/\s*\.\.\.\(accessToken \? \{ Authorization: `Bearer \$\{accessToken\}` \} : \{\}\),/g, '');
    }
    
    // useNewMatchState.ts
    if (filePath.replace(/\\/g, '/').endsWith('useNewMatchState.ts')) {
        content = content.replace(/const token = typeof window !== 'undefined' \? sessionStorage\.getItem\('access_token'\) : null;\n/g, '');
        content = content.replace(/\s*Authorization: `Bearer \$\{token\}`,/g, '');
        content = content.replace(/\s*\.\.\.\(token \? \{ Authorization: `Bearer \$\{token\}` \} : \{\}\),/g, '');
    }
    
    // report/page.tsx
    if (filePath.replace(/\\/g, '/').endsWith('report/page.tsx')) {
        content = content.replace(/const token = sessionStorage\.getItem\('access_token'\);\n/g, '');
        content = content.replace(/\s*Authorization: `Bearer \$\{token\}`,/g, '');
    }
    
    // useScoringLifecycleEffects.ts
    if (filePath.replace(/\\/g, '/').endsWith('useScoringLifecycleEffects.ts')) {
        content = content.replace(/const freshToken = sessionStorage\.getItem\("access_token"\);\n/g, '');
        content = content.replace(/\s*Authorization: `Bearer \$\{freshToken\}`,/g, '');
    }
    
    // dashboard/page.tsx
    if (filePath.replace(/\\/g, '/').endsWith('dashboard/page.tsx')) {
        content = content.replace(/const accessToken = sessionStorage\.getItem\("access_token"\);\n/g, '');
        content = content.replace(/\s*Authorization: `Bearer \$\{accessToken\}`,/g, '');
        content = content.replace(/\s*\.\.\.\(accessToken \? \{ Authorization: `Bearer \$\{accessToken\}` \} : \{\}\),/g, '');
    }

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + filePath);
    }
});
