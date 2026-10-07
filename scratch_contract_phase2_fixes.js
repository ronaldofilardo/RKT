const fs = require('fs');

function replaceFileContent(filePath, rules) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const [pattern, replacement] of rules) {
        content = content.replace(pattern, replacement);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + filePath);
    }
}

// 1. useDashboardMatches.ts
replaceFileContent('c:/apps/RKT/src/app/dashboard/hooks/useDashboardMatches.ts', [
    [/import \{ isTokenExpired \} from "@\/lib\/jwt-client";\n/, '']
]);

// 2. dashboard/page.tsx
replaceFileContent('c:/apps/RKT/src/app/dashboard/page.tsx', [
    [/if \(\!accessToken\) \{\s*setLoading\(false\);\n\s*redirectToLogin\(router\);\n\s*return;\n\s*\}/g, ''],
    [/if \(\!accessToken\) return;/g, '']
]);

// 3. login/page.tsx
replaceFileContent('c:/apps/RKT/src/app/login/page.tsx', [
    [/accessToken: result\.accessToken,\n/g, '']
]);

// 4. report/page.tsx
replaceFileContent('c:/apps/RKT/src/app/match/[id]/report/page.tsx', [
    [/if \(\!token\) \{/g, 'if (false) {'] // Wait, if we can't check token, we just let it fetch and fail with 401
]);

// 5. useScoringLifecycleEffects.ts
replaceFileContent('c:/apps/RKT/src/app/match/[id]/scoring/useScoringLifecycleEffects.ts', [
    [/if \(\!freshToken\) return;\n/g, '']
]);

// 6. new-match-submit.helpers.ts
replaceFileContent('c:/apps/RKT/src/app/match/new/new-match-submit.helpers.ts', [
    [/if \(\!accessToken\) throw new Error\('Não autenticado'\);\n/g, '']
]);

// 7. start-match.helpers.ts
replaceFileContent('c:/apps/RKT/src/app/match/new/start-match.helpers.ts', [
    [/if \(\!accessToken\) throw new Error\("Não autenticado"\);\n/g, '']
]);

// 8. useNewMatchState.ts
replaceFileContent('c:/apps/RKT/src/app/match/new/useNewMatchState.ts', [
    [/if \(\!token\) \{/g, 'if (false) {'] // Same, just remove the check
]);

// 9. useOfflineMatchSync.ts
replaceFileContent('c:/apps/RKT/src/hooks/useOfflineMatchSync.ts', [
    [/const token = sessionStorage\.getItem\("access_token"\);\n/g, '']
]);

// 10. useSessionManager.match-finish.ts
replaceFileContent('c:/apps/RKT/src/hooks/useSessionManager.match-finish.ts', [
    [/const token = [^;]+;\n/g, '']
]);

