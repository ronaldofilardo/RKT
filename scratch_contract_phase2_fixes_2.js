const fs = require('fs');
const path = require('path');

function fix(filePath, replacements) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const [from, to] of replacements) {
        content = content.replace(from, to);
    }
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + filePath);
    }
}

// src/app/dashboard/page.tsx
fix('c:/apps/RKT/src/app/dashboard/page.tsx', [
    [`if (!accessToken) {\n      setLoading(false);\n      redirectToLogin(router);\n      return;\n    }`, ''],
    [`if (!accessToken) return;`, '']
]);

// src/app/login/page.tsx
fix('c:/apps/RKT/src/app/login/page.tsx', [
    [`          accessToken: result.accessToken,\n`, '']
]);

// src/app/match/[id]/scoring/useScoringLifecycleEffects.ts
fix('c:/apps/RKT/src/app/match/[id]/scoring/useScoringLifecycleEffects.ts', [
    [`if (!freshToken) return;`, '']
]);

// src/app/match/new/new-match-submit.helpers.ts
fix('c:/apps/RKT/src/app/match/new/new-match-submit.helpers.ts', [
    [`if (!accessToken) throw new Error('Não autenticado');`, '']
]);

// src/app/match/new/start-match.helpers.ts
fix('c:/apps/RKT/src/app/match/new/start-match.helpers.ts', [
    [`if (!accessToken) throw new Error("Não autenticado");`, '']
]);

// src/app/match/new/useNewMatchState.ts
fix('c:/apps/RKT/src/app/match/new/useNewMatchState.ts', [
    [`if (!token) {`, `if (false) {`]
]);

// src/hooks/useSessionManager.match-finish.ts
fix('c:/apps/RKT/src/hooks/useSessionManager.match-finish.ts', [
    [`const token = entry.token;`, ``]
]);

// src/hooks/useOfflineMatchSync.ts
fix('c:/apps/RKT/src/hooks/useOfflineMatchSync.ts', [
    [`const token = sessionStorage.getItem("access_token");`, ''] // already removed probably
]);
